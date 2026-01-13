'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getTexturesByBrand,
  getTextureById,
  getTexturesGroupedByVariant,
  getTextureCounts,
  TEXTURE_VARIANTS,
  type BrandTexture,
  type TextureVariant,
} from '@/lib/supabase/brand-textures-service';

// Default brand ID for Open Session
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '16aa5681-c792-45cf-bf65-9f9cbc3197af';

interface UseBrandTexturesOptions {
  brandId?: string;
  autoFetch?: boolean;
  variant?: TextureVariant | 'all';
}

interface UseBrandTexturesReturn {
  textures: BrandTexture[];
  texturesByVariant: Map<TextureVariant, BrandTexture[]>;
  counts: Record<TextureVariant | 'all', number>;
  variants: typeof TEXTURE_VARIANTS;
  selectedVariant: TextureVariant | 'all';
  setSelectedVariant: (variant: TextureVariant | 'all') => void;
  filteredTextures: BrandTexture[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getTexture: (id: string) => Promise<BrandTexture | null>;
}

/**
 * React hook for managing brand textures
 */
export function useBrandTextures(options: UseBrandTexturesOptions = {}): UseBrandTexturesReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true, variant: initialVariant = 'all' } = options;

  const [textures, setTextures] = useState<BrandTexture[]>([]);
  const [texturesByVariant, setTexturesByVariant] = useState<Map<TextureVariant, BrandTexture[]>>(new Map());
  const [counts, setCounts] = useState<Record<TextureVariant | 'all', number>>({
    all: 0,
    'sonic-line': 0,
    'ascii': 0,
    'halftone': 0,
    'recycled-card': 0,
    'unknown': 0,
  });
  const [selectedVariant, setSelectedVariant] = useState<TextureVariant | 'all'>(initialVariant);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate filtered textures based on selected variant
  const filteredTextures = useMemo(() => {
    if (selectedVariant === 'all') {
      return textures;
    }
    
    return textures.filter(texture => {
      let variant = texture.variant || 'unknown';
      // Normalize Sonic Line textures
      if (variant === 'unknown' && texture.name.toLowerCase().includes('sonic line')) {
        variant = 'sonic-line';
      }
      return variant === selectedVariant;
    });
  }, [textures, selectedVariant]);

  // Fetch textures from Supabase
  const fetchTextures = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [allTextures, grouped, textureCounts] = await Promise.all([
        getTexturesByBrand(brandId),
        getTexturesGroupedByVariant(brandId),
        getTextureCounts(brandId),
      ]);

      setTextures(allTextures);
      setTexturesByVariant(grouped);
      setCounts(textureCounts);
    } catch (err) {
      console.error('Error fetching textures:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch textures'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchTextures();
    }
  }, [autoFetch, fetchTextures]);

  // Get a single texture by ID
  const getTexture = useCallback(async (id: string): Promise<BrandTexture | null> => {
    try {
      return await getTextureById(id);
    } catch (err) {
      console.error('Error getting texture:', err);
      throw err;
    }
  }, []);

  return {
    textures,
    texturesByVariant,
    counts,
    variants: TEXTURE_VARIANTS,
    selectedVariant,
    setSelectedVariant,
    filteredTextures,
    isLoading,
    error,
    refresh: fetchTextures,
    getTexture,
  };
}
