'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandColor, BrandColorInsert, BrandColorUpdate, BrandColorGroup, BrandColorRole } from '@/lib/supabase/types';
import {
  getColorsByBrand,
  getColorsByGroup,
  getColorById,
  createColor,
  updateColor,
  deleteColor,
  restoreColor,
  reorderColors,
  duplicateColor,
  searchColors,
  getColorCounts,
  isSlugAvailable,
  getNextSortOrder,
} from '@/lib/supabase/brand-colors-service';

// Default brand ID for Open Session (fallback for local development)
const OPEN_SESSION_BRAND_ID = '16aa5681-c792-45cf-bf65-9f9cbc3197af';
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || OPEN_SESSION_BRAND_ID;

interface UseBrandColorsOptions {
  brandId?: string;
  autoFetch?: boolean;
  includeInactive?: boolean;
}

interface UseBrandColorsReturn {
  colors: BrandColor[];
  brandColors: BrandColor[];
  monoColors: BrandColor[];
  brandScaleColors: BrandColor[];
  customColors: BrandColor[];
  counts: Record<BrandColorGroup, number>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getColor: (id: string) => Promise<BrandColor | null>;
  getColorsByColorGroup: (group: BrandColorGroup) => Promise<BrandColor[]>;
  addColor: (color: Omit<BrandColorInsert, 'brand_id'>) => Promise<BrandColor>;
  editColor: (id: string, updates: BrandColorUpdate) => Promise<BrandColor>;
  removeColor: (id: string) => Promise<void>;
  restoreRemovedColor: (id: string) => Promise<BrandColor>;
  duplicateExistingColor: (id: string) => Promise<BrandColor>;
  reorderGroupColors: (group: BrandColorGroup, colorIds: string[]) => Promise<void>;
  searchBrandColors: (query: string) => Promise<BrandColor[]>;
  checkSlugAvailable: (slug: string, excludeId?: string) => Promise<boolean>;
  getNextSortOrderForGroup: (group: BrandColorGroup) => Promise<number>;
}

/**
 * React hook for managing brand colors
 */
export function useBrandColors(options: UseBrandColorsOptions = {}): UseBrandColorsReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true, includeInactive = false } = options;

  const [colors, setColors] = useState<BrandColor[]>([]);
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [monoColors, setMonoColors] = useState<BrandColor[]>([]);
  const [brandScaleColors, setBrandScaleColors] = useState<BrandColor[]>([]);
  const [customColors, setCustomColors] = useState<BrandColor[]>([]);
  const [counts, setCounts] = useState<Record<BrandColorGroup, number>>({
    brand: 0,
    'mono-scale': 0,
    'brand-scale': 0,
    custom: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch colors from Supabase
  const fetchColors = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [allColors, colorCounts] = await Promise.all([
        getColorsByBrand(brandId, includeInactive),
        getColorCounts(brandId),
      ]);

      setColors(allColors);
      setCounts(colorCounts);

      // Group colors by type
      setBrandColors(allColors.filter(c => c.colorGroup === 'brand'));
      setMonoColors(allColors.filter(c => c.colorGroup === 'mono-scale'));
      setBrandScaleColors(allColors.filter(c => c.colorGroup === 'brand-scale'));
      setCustomColors(allColors.filter(c => c.colorGroup === 'custom'));
    } catch (err) {
      console.error('Error fetching colors:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch colors'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId, includeInactive]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchColors();
    }
  }, [autoFetch, fetchColors]);

  // Get a single color by ID
  const getColor = useCallback(async (id: string): Promise<BrandColor | null> => {
    try {
      return await getColorById(id);
    } catch (err) {
      console.error('Error getting color:', err);
      throw err;
    }
  }, []);

  // Get colors by group
  const getColorsByColorGroup = useCallback(
    async (group: BrandColorGroup): Promise<BrandColor[]> => {
      if (!brandId) {
        return [];
      }

      try {
        return await getColorsByGroup(brandId, group);
      } catch (err) {
        console.error('Error getting colors by group:', err);
        throw err;
      }
    },
    [brandId]
  );

  // Add a new color
  const addColor = useCallback(
    async (color: Omit<BrandColorInsert, 'brand_id'>): Promise<BrandColor> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const newColor = await createColor({
          ...color,
          brand_id: brandId,
        });
        await fetchColors(); // Refresh the list
        return newColor;
      } catch (err) {
        console.error('Error adding color:', err);
        throw err;
      }
    },
    [brandId, fetchColors]
  );

  // Edit a color
  const editColor = useCallback(
    async (id: string, updates: BrandColorUpdate): Promise<BrandColor> => {
      try {
        const updatedColor = await updateColor(id, updates);
        await fetchColors(); // Refresh the list
        return updatedColor;
      } catch (err) {
        console.error('Error editing color:', err);
        throw err;
      }
    },
    [fetchColors]
  );

  // Remove a color (soft delete)
  const removeColor = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteColor(id);
        await fetchColors(); // Refresh the list
      } catch (err) {
        console.error('Error removing color:', err);
        throw err;
      }
    },
    [fetchColors]
  );

  // Restore a soft-deleted color
  const restoreRemovedColor = useCallback(
    async (id: string): Promise<BrandColor> => {
      try {
        const restoredColor = await restoreColor(id);
        await fetchColors(); // Refresh the list
        return restoredColor;
      } catch (err) {
        console.error('Error restoring color:', err);
        throw err;
      }
    },
    [fetchColors]
  );

  // Duplicate a color
  const duplicateExistingColor = useCallback(
    async (id: string): Promise<BrandColor> => {
      try {
        const duplicatedColor = await duplicateColor(id);
        await fetchColors(); // Refresh the list
        return duplicatedColor;
      } catch (err) {
        console.error('Error duplicating color:', err);
        throw err;
      }
    },
    [fetchColors]
  );

  // Reorder colors within a group
  const reorderGroupColors = useCallback(
    async (group: BrandColorGroup, colorIds: string[]): Promise<void> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        await reorderColors(brandId, group, colorIds);
        await fetchColors(); // Refresh the list
      } catch (err) {
        console.error('Error reordering colors:', err);
        throw err;
      }
    },
    [brandId, fetchColors]
  );

  // Search colors
  const searchBrandColors = useCallback(
    async (query: string): Promise<BrandColor[]> => {
      if (!brandId) {
        return [];
      }

      try {
        return await searchColors(brandId, query);
      } catch (err) {
        console.error('Error searching colors:', err);
        throw err;
      }
    },
    [brandId]
  );

  // Check if slug is available
  const checkSlugAvailable = useCallback(
    async (slug: string, excludeId?: string): Promise<boolean> => {
      if (!brandId) {
        return true;
      }

      try {
        return await isSlugAvailable(brandId, slug, excludeId);
      } catch (err) {
        console.error('Error checking slug availability:', err);
        throw err;
      }
    },
    [brandId]
  );

  // Get next sort order for a group
  const getNextSortOrderForGroup = useCallback(
    async (group: BrandColorGroup): Promise<number> => {
      if (!brandId) {
        return 1;
      }

      try {
        return await getNextSortOrder(brandId, group);
      } catch (err) {
        console.error('Error getting next sort order:', err);
        throw err;
      }
    },
    [brandId]
  );

  return {
    colors,
    brandColors,
    monoColors,
    brandScaleColors,
    customColors,
    counts,
    isLoading,
    error,
    refresh: fetchColors,
    getColor,
    getColorsByColorGroup,
    addColor,
    editColor,
    removeColor,
    restoreRemovedColor,
    duplicateExistingColor,
    reorderGroupColors,
    searchBrandColors,
    checkSlugAvailable,
    getNextSortOrderForGroup,
  };
}

