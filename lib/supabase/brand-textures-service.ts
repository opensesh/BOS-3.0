/**
 * Supabase service for brand texture management
 * 
 * Handles CRUD operations for brand textures using the brand_assets table.
 * Textures are stored with category='textures'.
 */

import { createClient } from './client';
import type {
  DbBrandAsset,
  BrandAsset,
} from './types';
import { dbBrandAssetToApp } from './types';

const supabase = createClient();

const BUCKET_NAME = 'brand-assets';
const CATEGORY = 'textures';

// Texture variant types
export type TextureVariant = 'sonic-line' | 'ascii' | 'halftone' | 'recycled-card' | 'unknown';

// Texture asset type
export type BrandTexture = BrandAsset & {
  category: 'textures';
};

// ============================================
// TEXTURE CRUD OPERATIONS
// ============================================

/**
 * Get all textures for a brand
 */
export async function getTexturesByBrand(brandId: string): Promise<BrandTexture[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .order('name');

  if (error) {
    console.error('Error fetching textures:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandTexture;
  });
}

/**
 * Get textures by variant
 */
export async function getTexturesByVariant(
  brandId: string,
  variant: TextureVariant
): Promise<BrandTexture[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .eq('variant', variant)
    .order('name');

  if (error) {
    console.error('Error fetching textures by variant:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandTexture;
  });
}

/**
 * Get a single texture by ID
 */
export async function getTextureById(id: string): Promise<BrandTexture | null> {
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
    console.error('Error fetching texture:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandTexture;
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Get public URL for a texture
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

// ============================================
// GROUPED DATA FOR UI
// ============================================

/**
 * Texture variant definitions for UI
 */
export const TEXTURE_VARIANTS: {
  id: TextureVariant;
  label: string;
  description: string;
}[] = [
  {
    id: 'sonic-line',
    label: 'Sonic Line',
    description: 'Dynamic line patterns with movement and energy',
  },
  {
    id: 'ascii',
    label: 'ASCII',
    description: 'Text-based patterns for digital aesthetics',
  },
  {
    id: 'halftone',
    label: 'Halftone',
    description: 'Classic print-style dot patterns',
  },
  {
    id: 'recycled-card',
    label: 'Recycled Card',
    description: 'Organic paper textures with eco-friendly feel',
  },
];

/**
 * Get textures grouped by variant
 */
export async function getTexturesGroupedByVariant(brandId: string): Promise<
  Map<TextureVariant, BrandTexture[]>
> {
  const textures = await getTexturesByBrand(brandId);
  const grouped = new Map<TextureVariant, BrandTexture[]>();

  // Initialize all variants
  TEXTURE_VARIANTS.forEach(v => {
    grouped.set(v.id, []);
  });
  grouped.set('unknown', []);

  textures.forEach(texture => {
    // Normalize variant for Sonic Line textures
    let variant = texture.variant as TextureVariant;
    if (!variant || variant === 'unknown') {
      // Check if it's a Sonic Line texture by name
      if (texture.name.toLowerCase().includes('sonic line')) {
        variant = 'sonic-line';
      } else {
        variant = 'unknown';
      }
    }
    
    if (!grouped.has(variant)) {
      grouped.set(variant, []);
    }
    grouped.get(variant)!.push(texture);
  });

  return grouped;
}

/**
 * Get texture counts by variant
 */
export async function getTextureCounts(brandId: string): Promise<
  Record<TextureVariant | 'all', number>
> {
  const textures = await getTexturesByBrand(brandId);
  
  const counts: Record<string, number> = {
    all: textures.length,
    'sonic-line': 0,
    'ascii': 0,
    'halftone': 0,
    'recycled-card': 0,
    'unknown': 0,
  };

  textures.forEach(texture => {
    let variant = texture.variant || 'unknown';
    // Normalize Sonic Line textures
    if (variant === 'unknown' && texture.name.toLowerCase().includes('sonic line')) {
      variant = 'sonic-line';
    }
    if (variant in counts) {
      counts[variant]++;
    }
  });

  return counts as Record<TextureVariant | 'all', number>;
}
