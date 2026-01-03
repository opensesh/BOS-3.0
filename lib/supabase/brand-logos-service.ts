/**
 * Supabase service for brand logo management
 * 
 * Handles CRUD operations for brand logos using the brand_assets table.
 * Logos are stored with category='logos' and variant metadata.
 */

import { createClient } from './client';
import type {
  DbBrandAsset,
  BrandAsset,
  BrandAssetInsert,
  BrandAssetUpdate,
  BrandLogo,
  BrandLogoMetadata,
  BrandLogoVariant,
  BrandLogoType,
} from './types';
import { dbBrandAssetToApp } from './types';

const supabase = createClient();

const BUCKET_NAME = 'brand-assets';
const CATEGORY = 'logos';

// ============================================
// LOGO CRUD OPERATIONS
// ============================================

/**
 * Get all logos for a brand
 */
export async function getLogosByBrand(brandId: string): Promise<BrandLogo[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .order('name');

  if (error) {
    console.error('Error fetching logos:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandLogo;
  });
}

/**
 * Get logos by variant (vanilla, glass, charcoal)
 */
export async function getLogosByVariant(
  brandId: string,
  variant: BrandLogoVariant
): Promise<BrandLogo[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .eq('variant', variant)
    .order('name');

  if (error) {
    console.error('Error fetching logos by variant:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandLogo;
  });
}

/**
 * Get logos by type (brandmark, combo, stacked, etc.)
 */
export async function getLogosByType(
  brandId: string,
  logoType: BrandLogoType
): Promise<BrandLogo[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .contains('metadata', { logoType })
    .order('name');

  if (error) {
    console.error('Error fetching logos by type:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandLogo;
  });
}

/**
 * Get a single logo by ID
 */
export async function getLogoById(id: string): Promise<BrandLogo | null> {
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
    console.error('Error fetching logo:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandLogo;
}

/**
 * Create a new logo
 */
export async function createLogo(
  brandId: string,
  name: string,
  filename: string,
  storagePath: string,
  metadata: BrandLogoMetadata,
  options?: {
    description?: string;
    variant?: BrandLogoVariant;
    mimeType?: string;
    fileSize?: number;
  }
): Promise<BrandLogo> {
  const insertData: BrandAssetInsert = {
    brand_id: brandId,
    name,
    filename,
    description: options?.description || `${name} logo`,
    category: CATEGORY,
    variant: options?.variant || metadata.variant,
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
    console.error('Error creating logo:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandLogo;
}

/**
 * Update a logo
 */
export async function updateLogo(
  id: string,
  updates: BrandAssetUpdate & { metadata?: BrandLogoMetadata }
): Promise<BrandLogo> {
  const { data, error } = await supabase
    .from('brand_assets')
    .update(updates)
    .eq('id', id)
    .eq('category', CATEGORY)
    .select()
    .single();

  if (error) {
    console.error('Error updating logo:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandLogo;
}

/**
 * Delete a logo
 */
export async function deleteLogo(id: string): Promise<void> {
  // First get the logo to find storage path
  const logo = await getLogoById(id);
  if (!logo) {
    throw new Error('Logo not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([logo.storagePath]);

  if (storageError) {
    console.error('Error deleting logo from storage:', storageError);
    // Continue to delete metadata even if storage delete fails
  }

  // Delete metadata
  const { error } = await supabase
    .from('brand_assets')
    .delete()
    .eq('id', id)
    .eq('category', CATEGORY);

  if (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Get public URL for a logo
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Upload a logo file and create metadata
 */
export async function uploadLogo(
  brandId: string,
  brandSlug: string,
  file: File | Blob,
  name: string,
  metadata: BrandLogoMetadata
): Promise<BrandLogo> {
  const filename = `${metadata.logoType || 'logo'}-${metadata.variant || 'default'}.${getFileExtension(file)}`;
  const storagePath = `${brandSlug}/logos/${filename}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading logo file:', uploadError);
    throw uploadError;
  }

  // Create metadata record
  return createLogo(brandId, name, filename, storagePath, metadata, {
    variant: metadata.variant,
    mimeType: file.type || undefined,
    fileSize: file.size || undefined,
  });
}

/**
 * Get file extension from File/Blob
 */
function getFileExtension(file: File | Blob): string {
  if ('name' in file) {
    return file.name.split('.').pop() || 'svg';
  }
  const mimeToExt: Record<string, string> = {
    'image/svg+xml': 'svg',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return mimeToExt[file.type] || 'svg';
}

// ============================================
// GROUPED LOGO DATA FOR UI
// ============================================

/**
 * Get logos grouped by type for the Logo page UI
 */
export async function getLogosGroupedByType(brandId: string): Promise<{
  main: BrandLogo[];
  accessory: BrandLogo[];
}> {
  const logos = await getLogosByBrand(brandId);

  const main: BrandLogo[] = [];
  const accessory: BrandLogo[] = [];

  logos.forEach(logo => {
    const meta = logo.metadata as BrandLogoMetadata;
    if (meta.isAccessory) {
      accessory.push(logo);
    } else {
      main.push(logo);
    }
  });

  return { main, accessory };
}

/**
 * Get all variants for a specific logo type
 */
export async function getLogoVariants(
  brandId: string,
  logoType: BrandLogoType
): Promise<Record<BrandLogoVariant, BrandLogo | null>> {
  const logos = await getLogosByType(brandId, logoType);

  const variants: Record<BrandLogoVariant, BrandLogo | null> = {
    vanilla: null,
    glass: null,
    charcoal: null,
  };

  logos.forEach(logo => {
    const variant = logo.variant as BrandLogoVariant;
    if (variant && variant in variants) {
      variants[variant] = logo;
    }
  });

  return variants;
}

