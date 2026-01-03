/**
 * Supabase service for brand guidelines management
 * 
 * Handles CRUD operations for brand guidelines (Figma embeds, PDFs, external links).
 * Supports file uploads to Supabase Storage.
 */

import { createClient } from './client';
import type {
  DbBrandGuideline,
  BrandGuideline,
  BrandGuidelineInsert,
  BrandGuidelineUpdate,
  BrandGuidelineType,
} from './types';
import { dbBrandGuidelineToApp } from './types';

const supabase = createClient();

const BUCKET_NAME = 'brand-assets';

// ============================================
// GUIDELINE CRUD OPERATIONS
// ============================================

/**
 * Get all guidelines for a brand
 */
export async function getGuidelinesByBrand(
  brandId: string,
  includeInactive = false
): Promise<BrandGuideline[]> {
  let query = supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .order('sort_order')
    .order('created_at');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching guidelines:', error);
    throw error;
  }

  return (data as DbBrandGuideline[]).map(g => {
    const publicUrl = g.storage_path ? getPublicUrl(g.storage_path) : undefined;
    return dbBrandGuidelineToApp(g, publicUrl);
  });
}

/**
 * Get guidelines by type
 */
export async function getGuidelinesByType(
  brandId: string,
  guidelineType: BrandGuidelineType
): Promise<BrandGuideline[]> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .eq('guideline_type', guidelineType)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching guidelines by type:', error);
    throw error;
  }

  return (data as DbBrandGuideline[]).map(g => {
    const publicUrl = g.storage_path ? getPublicUrl(g.storage_path) : undefined;
    return dbBrandGuidelineToApp(g, publicUrl);
  });
}

/**
 * Get guidelines by category
 */
export async function getGuidelinesByCategory(
  brandId: string,
  category: string
): Promise<BrandGuideline[]> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', category)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching guidelines by category:', error);
    throw error;
  }

  return (data as DbBrandGuideline[]).map(g => {
    const publicUrl = g.storage_path ? getPublicUrl(g.storage_path) : undefined;
    return dbBrandGuidelineToApp(g, publicUrl);
  });
}

/**
 * Get primary/featured guideline for a brand
 */
export async function getPrimaryGuideline(brandId: string): Promise<BrandGuideline | null> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_primary', true)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching primary guideline:', error);
    throw error;
  }

  const publicUrl = data.storage_path ? getPublicUrl(data.storage_path) : undefined;
  return dbBrandGuidelineToApp(data as DbBrandGuideline, publicUrl);
}

/**
 * Get a single guideline by ID
 */
export async function getGuidelineById(id: string): Promise<BrandGuideline | null> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching guideline:', error);
    throw error;
  }

  const publicUrl = data.storage_path ? getPublicUrl(data.storage_path) : undefined;
  return dbBrandGuidelineToApp(data as DbBrandGuideline, publicUrl);
}

/**
 * Get a guideline by slug
 */
export async function getGuidelineBySlug(
  brandId: string,
  slug: string
): Promise<BrandGuideline | null> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching guideline by slug:', error);
    throw error;
  }

  const publicUrl = data.storage_path ? getPublicUrl(data.storage_path) : undefined;
  return dbBrandGuidelineToApp(data as DbBrandGuideline, publicUrl);
}

/**
 * Create a new guideline
 */
export async function createGuideline(guideline: BrandGuidelineInsert): Promise<BrandGuideline> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .insert(guideline)
    .select()
    .single();

  if (error) {
    console.error('Error creating guideline:', error);
    throw error;
  }

  const publicUrl = data.storage_path ? getPublicUrl(data.storage_path) : undefined;
  return dbBrandGuidelineToApp(data as DbBrandGuideline, publicUrl);
}

/**
 * Update a guideline
 */
export async function updateGuideline(
  id: string,
  updates: BrandGuidelineUpdate
): Promise<BrandGuideline> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating guideline:', error);
    throw error;
  }

  const publicUrl = data.storage_path ? getPublicUrl(data.storage_path) : undefined;
  return dbBrandGuidelineToApp(data as DbBrandGuideline, publicUrl);
}

/**
 * Delete a guideline (soft delete)
 */
export async function deleteGuideline(id: string): Promise<void> {
  const { error } = await supabase
    .from('brand_guidelines')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting guideline:', error);
    throw error;
  }
}

/**
 * Permanently delete a guideline and its storage file
 */
export async function hardDeleteGuideline(id: string): Promise<void> {
  // First get the guideline to find storage path
  const guideline = await getGuidelineById(id);
  if (!guideline) {
    throw new Error('Guideline not found');
  }

  // Delete from storage if file exists
  if (guideline.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([guideline.storagePath]);

    if (storageError) {
      console.error('Error deleting guideline file from storage:', storageError);
      // Continue to delete metadata even if storage delete fails
    }
  }

  // Delete metadata
  const { error } = await supabase
    .from('brand_guidelines')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting guideline:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted guideline
 */
export async function restoreGuideline(id: string): Promise<BrandGuideline> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error restoring guideline:', error);
    throw error;
  }

  const publicUrl = data.storage_path ? getPublicUrl(data.storage_path) : undefined;
  return dbBrandGuidelineToApp(data as DbBrandGuideline, publicUrl);
}

/**
 * Set a guideline as primary (and unset others)
 */
export async function setPrimaryGuideline(
  brandId: string,
  guidelineId: string
): Promise<void> {
  // First, unset all primary flags for this brand
  const { error: unsetError } = await supabase
    .from('brand_guidelines')
    .update({ is_primary: false })
    .eq('brand_id', brandId);

  if (unsetError) {
    console.error('Error unsetting primary guidelines:', unsetError);
    throw unsetError;
  }

  // Set the new primary
  const { error: setError } = await supabase
    .from('brand_guidelines')
    .update({ is_primary: true })
    .eq('id', guidelineId);

  if (setError) {
    console.error('Error setting primary guideline:', setError);
    throw setError;
  }
}

/**
 * Reorder guidelines
 */
export async function reorderGuidelines(
  brandId: string,
  guidelineIds: string[]
): Promise<void> {
  // Update sort_order for each guideline
  for (let i = 0; i < guidelineIds.length; i++) {
    const { error } = await supabase
      .from('brand_guidelines')
      .update({ sort_order: i + 1 })
      .eq('id', guidelineIds[i])
      .eq('brand_id', brandId);

    if (error) {
      console.error('Error reordering guideline:', error);
      throw error;
    }
  }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Get public URL for a guideline file
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }

  return data.signedUrl;
}

/**
 * Upload a guideline file and create metadata
 */
export async function uploadGuideline(
  brandId: string,
  brandSlug: string,
  file: File,
  options: {
    title: string;
    description?: string;
    category?: string;
    isPrimary?: boolean;
  }
): Promise<BrandGuideline> {
  // Determine guideline type from file
  const guidelineType = getGuidelineTypeFromFile(file);
  const filename = sanitizeFilename(file.name);
  const storagePath = `${brandSlug}/guidelines/${filename}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading guideline file:', uploadError);
    throw uploadError;
  }

  // Create metadata record
  return createGuideline({
    brand_id: brandId,
    title: options.title,
    guideline_type: guidelineType,
    storage_path: storagePath,
    description: options.description,
    category: options.category,
    is_primary: options.isPrimary,
    file_size: file.size,
    mime_type: file.type,
  });
}

/**
 * Get guideline type from file
 */
function getGuidelineTypeFromFile(file: File): BrandGuidelineType {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'pptx':
      return 'pptx';
    case 'ppt':
      return 'ppt';
    default:
      return 'link';
  }
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-|-$/g, '');
}

// ============================================
// FIGMA HELPERS
// ============================================

/**
 * Create a Figma guideline with auto-generated embed URL
 */
export async function createFigmaGuideline(
  brandId: string,
  figmaUrl: string,
  options: {
    title: string;
    description?: string;
    category?: string;
    isPrimary?: boolean;
  }
): Promise<BrandGuideline> {
  const embedUrl = generateFigmaEmbedUrl(figmaUrl);

  return createGuideline({
    brand_id: brandId,
    title: options.title,
    guideline_type: 'figma',
    url: figmaUrl,
    embed_url: embedUrl,
    description: options.description,
    category: options.category,
    is_primary: options.isPrimary,
  });
}

/**
 * Generate Figma embed URL from source URL
 */
export function generateFigmaEmbedUrl(figmaUrl: string): string {
  // Encode the URL for embedding
  const encodedUrl = encodeURIComponent(figmaUrl);
  return `https://www.figma.com/embed?embed_host=share&url=${encodedUrl}`;
}

/**
 * Validate Figma URL format
 */
export function isValidFigmaUrl(url: string): boolean {
  return /^https:\/\/(www\.)?figma\.com\/(file|proto|design)\//.test(url);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get guideline counts by type
 */
export async function getGuidelineCounts(
  brandId: string
): Promise<Record<BrandGuidelineType, number>> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('guideline_type')
    .eq('brand_id', brandId)
    .eq('is_active', true);

  if (error) {
    console.error('Error getting guideline counts:', error);
    throw error;
  }

  const counts: Record<BrandGuidelineType, number> = {
    figma: 0,
    pdf: 0,
    pptx: 0,
    ppt: 0,
    link: 0,
    notion: 0,
    'google-doc': 0,
  };

  data.forEach(item => {
    const type = item.guideline_type as BrandGuidelineType;
    if (type in counts) {
      counts[type]++;
    }
  });

  return counts;
}

/**
 * Search guidelines by title or description
 */
export async function searchGuidelines(
  brandId: string,
  query: string
): Promise<BrandGuideline[]> {
  const searchTerm = query.toLowerCase();

  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('sort_order');

  if (error) {
    console.error('Error searching guidelines:', error);
    throw error;
  }

  return (data as DbBrandGuideline[]).map(g => {
    const publicUrl = g.storage_path ? getPublicUrl(g.storage_path) : undefined;
    return dbBrandGuidelineToApp(g, publicUrl);
  });
}

