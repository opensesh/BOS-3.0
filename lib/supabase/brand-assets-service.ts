/**
 * Supabase service for brand asset management
 * 
 * Handles CRUD operations for brand assets with Supabase Storage integration.
 * Supports semantic search when embeddings are available.
 */

import { createClient } from './client';
import type {
  DbBrandAsset,
  BrandAsset,
  BrandAssetInsert,
  BrandAssetUpdate,
  BrandAssetCategory,
} from './types';
import { dbBrandAssetToApp } from './types';

const supabase = createClient();

const BUCKET_NAME = 'brand-assets';

// ============================================
// BRAND HELPERS
// ============================================

/**
 * Get the default brand ID (Open Session)
 */
export async function getDefaultBrandId(): Promise<string> {
  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', 'open-session')
    .single();

  if (error || !data) {
    throw new Error('Default brand (open-session) not found');
  }

  return data.id;
}

/**
 * Get brand by slug
 */
export async function getBrandBySlug(slug: string): Promise<{ id: string; name: string; settings: Record<string, unknown> } | null> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, settings')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

// ============================================
// ASSET CRUD OPERATIONS
// ============================================

/**
 * Get all assets for a brand
 */
export async function getAssetsByBrand(
  brandId: string,
  category?: BrandAssetCategory
): Promise<BrandAsset[]> {
  let query = supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .order('category')
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }

  // Get public URLs for all assets
  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl);
  });
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(id: string): Promise<BrandAsset | null> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching asset:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl);
}

/**
 * Get asset by storage path
 */
export async function getAssetByPath(
  brandId: string,
  storagePath: string
): Promise<BrandAsset | null> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('storage_path', storagePath)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching asset by path:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl);
}

/**
 * Get assets by category
 */
export async function getAssetsByCategory(
  brandId: string,
  category: BrandAssetCategory
): Promise<BrandAsset[]> {
  return getAssetsByBrand(brandId, category);
}

/**
 * Get assets by variant (e.g., all "vanilla" logos)
 */
export async function getAssetsByVariant(
  brandId: string,
  variant: string,
  category?: BrandAssetCategory
): Promise<BrandAsset[]> {
  let query = supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('variant', variant);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching assets by variant:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl);
  });
}

/**
 * Search assets by name/description (text search, not semantic)
 */
export async function searchAssetsByText(
  brandId: string,
  searchTerm: string,
  category?: BrandAssetCategory
): Promise<BrandAsset[]> {
  let query = supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,filename.ilike.%${searchTerm}%`);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error searching assets:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl);
  });
}

/**
 * Create a new asset
 */
export async function createAsset(asset: BrandAssetInsert): Promise<BrandAsset> {
  const { data, error } = await supabase
    .from('brand_assets')
    .insert(asset)
    .select()
    .single();

  if (error) {
    console.error('Error creating asset:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl);
}

/**
 * Update an asset
 */
export async function updateAsset(
  id: string,
  updates: BrandAssetUpdate
): Promise<BrandAsset> {
  const { data, error } = await supabase
    .from('brand_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating asset:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl);
}

/**
 * Delete an asset (and its storage file)
 */
export async function deleteAsset(id: string): Promise<void> {
  // First get the asset to find storage path
  const asset = await getAssetById(id);
  if (!asset) {
    throw new Error('Asset not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([asset.storagePath]);

  if (storageError) {
    console.error('Error deleting from storage:', storageError);
    // Continue to delete metadata even if storage delete fails
  }

  // Delete metadata
  const { error } = await supabase
    .from('brand_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Get public URL for an asset
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Get signed URL for an asset (with expiration)
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600 // 1 hour default
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
 * Upload a file to storage and create asset metadata
 */
export async function uploadAsset(
  brandId: string,
  brandSlug: string,
  file: File | Blob,
  metadata: {
    name: string;
    filename: string;
    description: string;
    category: BrandAssetCategory;
    variant?: string;
  }
): Promise<BrandAsset> {
  const storagePath = `${brandSlug}/${metadata.category}/${metadata.filename}`;
  
  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  // Create metadata record
  const asset = await createAsset({
    brand_id: brandId,
    name: metadata.name,
    filename: metadata.filename,
    description: metadata.description,
    category: metadata.category,
    variant: metadata.variant,
    storage_path: storagePath,
    mime_type: file.type || undefined,
    file_size: file.size || undefined,
  });

  return asset;
}

/**
 * Download asset file content
 */
export async function downloadAsset(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error) {
    console.error('Error downloading asset:', error);
    throw error;
  }

  return data;
}

// ============================================
// SEMANTIC SEARCH (requires embeddings)
// ============================================

/**
 * Semantic search for assets using vector similarity
 * Note: Requires embeddings to be generated for assets
 */
export async function semanticSearchAssets(
  brandId: string,
  queryEmbedding: number[],
  options: {
    category?: BrandAssetCategory;
    matchThreshold?: number;
    matchCount?: number;
  } = {}
): Promise<(BrandAsset & { similarity: number })[]> {
  const { category, matchThreshold = 0.7, matchCount = 10 } = options;

  const { data, error } = await supabase.rpc('match_assets', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    p_category: category || null,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }

  // Add public URLs to results
  return (data || []).map((item: DbBrandAsset & { similarity: number }) => {
    const publicUrl = getPublicUrl(item.storage_path);
    return {
      ...dbBrandAssetToApp(item, publicUrl),
      similarity: item.similarity,
    };
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get asset counts by category for a brand
 */
export async function getAssetCounts(brandId: string): Promise<Record<BrandAssetCategory, number>> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('category')
    .eq('brand_id', brandId);

  if (error) {
    console.error('Error getting asset counts:', error);
    throw error;
  }

  const counts: Record<string, number> = {
    logos: 0,
    fonts: 0,
    illustrations: 0,
    images: 0,
    textures: 0,
    icons: 0,
  };

  data.forEach(item => {
    if (item.category in counts) {
      counts[item.category]++;
    }
  });

  return counts as Record<BrandAssetCategory, number>;
}

/**
 * Check if storage bucket exists
 */
export async function checkBucketExists(): Promise<boolean> {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error);
    return false;
  }

  return data.some(bucket => bucket.name === BUCKET_NAME);
}

