/**
 * Supabase service for brand art direction image management
 * 
 * Handles CRUD operations for art direction images using the brand_assets table.
 * Images are stored with category='images' and art direction metadata.
 */

import { createClient } from './client';
import type {
  DbBrandAsset,
  BrandAsset,
  BrandAssetInsert,
  BrandAssetUpdate,
  BrandArtImage,
  BrandArtImageMetadata,
  ArtDirectionCategory,
} from './types';
import { dbBrandAssetToApp } from './types';

const supabase = createClient();

const BUCKET_NAME = 'brand-assets';
const CATEGORY = 'images';

// ============================================
// ART DIRECTION IMAGE CRUD OPERATIONS
// ============================================

/**
 * Get all art direction images for a brand
 */
export async function getArtImagesByBrand(brandId: string): Promise<BrandArtImage[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .order('name');

  if (error) {
    console.error('Error fetching art images:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandArtImage;
  });
}

/**
 * Get art images by art direction category (Auto, Lifestyle, Move, etc.)
 */
export async function getArtImagesByCategory(
  brandId: string,
  artCategory: ArtDirectionCategory
): Promise<BrandArtImage[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .contains('metadata', { artCategory })
    .order('name');

  if (error) {
    console.error('Error fetching art images by category:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandArtImage;
  });
}

/**
 * Get art images by tag
 */
export async function getArtImagesByTag(
  brandId: string,
  tag: string
): Promise<BrandArtImage[]> {
  // Using ilike for partial match in tags array (stored as JSON)
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .filter('metadata->tags', 'cs', `["${tag}"]`)
    .order('name');

  if (error) {
    console.error('Error fetching art images by tag:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandArtImage;
  });
}

/**
 * Get a single art image by ID
 */
export async function getArtImageById(id: string): Promise<BrandArtImage | null> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('id', id)
    .eq('category', CATEGORY)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching art image:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandArtImage;
}

/**
 * Create a new art image
 */
export async function createArtImage(
  brandId: string,
  name: string,
  filename: string,
  storagePath: string,
  metadata: BrandArtImageMetadata,
  options?: {
    description?: string;
    mimeType?: string;
    fileSize?: number;
  }
): Promise<BrandArtImage> {
  const insertData: BrandAssetInsert = {
    brand_id: brandId,
    name,
    filename,
    description: options?.description || metadata.altText || name,
    category: CATEGORY,
    variant: metadata.artCategory || undefined,
    storage_path: storagePath,
    mime_type: options?.mimeType,
    file_size: options?.fileSize,
    metadata: metadata as Record<string, unknown>,
  };

  const { data, error } = await supabase
    .from('brand_assets')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating art image:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandArtImage;
}

/**
 * Update an art image
 */
export async function updateArtImage(
  id: string,
  updates: BrandAssetUpdate & { metadata?: BrandArtImageMetadata }
): Promise<BrandArtImage> {
  const { data, error } = await supabase
    .from('brand_assets')
    .update(updates)
    .eq('id', id)
    .eq('category', CATEGORY)
    .select()
    .single();

  if (error) {
    console.error('Error updating art image:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandArtImage;
}

/**
 * Delete an art image
 */
export async function deleteArtImage(id: string): Promise<void> {
  // First get the image to find storage path
  const image = await getArtImageById(id);
  if (!image) {
    throw new Error('Art image not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([image.storagePath]);

  if (storageError) {
    console.error('Error deleting art image from storage:', storageError);
    // Continue to delete metadata even if storage delete fails
  }

  // Delete metadata
  const { error } = await supabase
    .from('brand_assets')
    .delete()
    .eq('id', id)
    .eq('category', CATEGORY);

  if (error) {
    console.error('Error deleting art image:', error);
    throw error;
  }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Get public URL for an art image
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Upload an art image file and create metadata
 */
export async function uploadArtImage(
  brandId: string,
  brandSlug: string,
  file: File | Blob,
  name: string,
  metadata: BrandArtImageMetadata
): Promise<BrandArtImage> {
  const ext = getFileExtension(file);
  const sanitizedName = sanitizeName(name);
  const category = metadata.artCategory?.toLowerCase() || 'general';
  const filename = `${category}-${sanitizedName}.${ext}`;
  const storagePath = `${brandSlug}/images/${filename}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading art image file:', uploadError);
    throw uploadError;
  }

  // Create metadata record
  return createArtImage(brandId, name, filename, storagePath, metadata, {
    mimeType: file.type || undefined,
    fileSize: file.size || undefined,
  });
}

/**
 * Get file extension from File/Blob
 */
function getFileExtension(file: File | Blob): string {
  if ('name' in file) {
    return file.name.split('.').pop() || 'png';
  }
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeToExt[file.type] || 'png';
}

/**
 * Sanitize name for filename
 */
function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ============================================
// GROUPED DATA FOR UI
// ============================================

/**
 * Art direction categories with descriptions
 */
export const ART_DIRECTION_CATEGORIES: {
  id: ArtDirectionCategory;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}[] = [
  {
    id: 'Auto',
    title: 'Automotive Excellence',
    subtitle: 'PRECISION IN MOTION',
    description: 'Our automotive imagery celebrates the marriage of engineering and artistry.',
    tags: ['Speed', 'Heritage', 'Precision', 'Power', 'Elegance', 'Night'],
  },
  {
    id: 'Lifestyle',
    title: 'Contemporary Living',
    subtitle: 'STYLE AS EXPRESSION',
    description: 'Lifestyle photography captures the confident, creative spirit of modern living.',
    tags: ['Editorial', 'Fashion', 'Urban', 'Confidence', 'Expression', 'Bold'],
  },
  {
    id: 'Move',
    title: 'Dynamic Energy',
    subtitle: 'BODIES IN FLOW',
    description: 'Movement imagery explores the poetry of the human form in motion.',
    tags: ['Energy', 'Flow', 'Athletic', 'Grace', 'Momentum', 'Rhythm'],
  },
  {
    id: 'Escape',
    title: 'Boundless Horizons',
    subtitle: 'BEYOND THE EVERYDAY',
    description: 'Escapist imagery transports viewers to liminal spaces.',
    tags: ['Freedom', 'Wonder', 'Adventure', 'Dreams', 'Remote', 'Surreal'],
  },
  {
    id: 'Work',
    title: 'Professional Vision',
    subtitle: 'PURPOSE MEETS CRAFT',
    description: 'Our work imagery reframes professional environments as spaces of creative potential.',
    tags: ['Collaboration', 'Innovation', 'Leadership', 'Focus', 'Growth', 'Purpose'],
  },
  {
    id: 'Feel',
    title: 'Emotional Resonance',
    subtitle: 'TEXTURE OF SENSATION',
    description: 'Feel imagery prioritizes atmosphere over subject.',
    tags: ['Intimacy', 'Texture', 'Warmth', 'Softness', 'Abstract', 'Poetic'],
  },
];

/**
 * Get art images grouped by art direction category
 */
export async function getArtImagesGroupedByCategory(brandId: string): Promise<
  Map<ArtDirectionCategory | 'Other', BrandArtImage[]>
> {
  const images = await getArtImagesByBrand(brandId);
  const grouped = new Map<ArtDirectionCategory | 'Other', BrandArtImage[]>();

  // Initialize all categories
  ART_DIRECTION_CATEGORIES.forEach(cat => {
    grouped.set(cat.id, []);
  });
  grouped.set('Other', []);

  // Category mapping from variant to ArtDirectionCategory
  const categoryMap: Record<string, ArtDirectionCategory> = {
    'auto': 'Auto',
    'lifestyle': 'Lifestyle',
    'move': 'Move',
    'escape': 'Escape',
    'work': 'Work',
    'feel': 'Feel',
  };

  images.forEach(image => {
    // First check variant field
    let category: ArtDirectionCategory | 'Other' = 'Other';
    if (image.variant) {
      const variantLower = image.variant.toLowerCase();
      if (categoryMap[variantLower]) {
        category = categoryMap[variantLower];
      }
    }
    // Fall back to metadata artCategory
    if (category === 'Other') {
      const meta = image.metadata as BrandArtImageMetadata;
      if (meta.artCategory) {
        category = meta.artCategory;
      }
    }
    
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(image);
  });

  return grouped;
}

/**
 * Get total count of art images by category
 */
export async function getArtImageCounts(brandId: string): Promise<
  Record<ArtDirectionCategory | 'All', number>
> {
  const images = await getArtImagesByBrand(brandId);
  
  const counts: Record<string, number> = {
    All: images.length,
    Auto: 0,
    Lifestyle: 0,
    Move: 0,
    Escape: 0,
    Work: 0,
    Feel: 0,
  };

  // Category mapping from variant to ArtDirectionCategory
  const categoryMap: Record<string, ArtDirectionCategory> = {
    'auto': 'Auto',
    'lifestyle': 'Lifestyle',
    'move': 'Move',
    'escape': 'Escape',
    'work': 'Work',
    'feel': 'Feel',
  };

  images.forEach(image => {
    // First check variant field
    if (image.variant) {
      const variantLower = image.variant.toLowerCase();
      if (categoryMap[variantLower] && categoryMap[variantLower] in counts) {
        counts[categoryMap[variantLower]]++;
        return;
      }
    }
    // Fall back to metadata artCategory
    const meta = image.metadata as BrandArtImageMetadata;
    if (meta.artCategory && meta.artCategory in counts) {
      counts[meta.artCategory]++;
    }
  });

  return counts as Record<ArtDirectionCategory | 'All', number>;
}

