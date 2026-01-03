'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandGuideline, BrandGuidelineInsert, BrandGuidelineUpdate, BrandGuidelineType } from '@/lib/supabase/types';
import {
  getGuidelinesByBrand,
  getGuidelineById,
  getPrimaryGuideline,
  createGuideline,
  updateGuideline,
  deleteGuideline,
  hardDeleteGuideline,
  uploadGuideline,
  createFigmaGuideline,
  setPrimaryGuideline,
  reorderGuidelines,
  searchGuidelines,
  getGuidelineCounts,
} from '@/lib/supabase/brand-guidelines-service';

// Default brand ID for Open Session
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '';

interface UseBrandGuidelinesOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseBrandGuidelinesReturn {
  guidelines: BrandGuideline[];
  primaryGuideline: BrandGuideline | null;
  counts: Record<BrandGuidelineType, number>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getGuideline: (id: string) => Promise<BrandGuideline | null>;
  addGuideline: (guideline: Omit<BrandGuidelineInsert, 'brand_id'>) => Promise<BrandGuideline>;
  addFigmaGuideline: (figmaUrl: string, options: { title: string; description?: string; category?: string; isPrimary?: boolean }) => Promise<BrandGuideline>;
  editGuideline: (id: string, updates: BrandGuidelineUpdate) => Promise<BrandGuideline>;
  removeGuideline: (id: string) => Promise<void>;
  permanentlyRemoveGuideline: (id: string) => Promise<void>;
  uploadGuidelineFile: (file: File, options: { title: string; description?: string; category?: string; isPrimary?: boolean }) => Promise<BrandGuideline>;
  setAsPrimary: (id: string) => Promise<void>;
  reorder: (guidelineIds: string[]) => Promise<void>;
  search: (query: string) => Promise<BrandGuideline[]>;
}

/**
 * React hook for managing brand guidelines
 */
export function useBrandGuidelines(options: UseBrandGuidelinesOptions = {}): UseBrandGuidelinesReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [primaryGuideline, setPrimary] = useState<BrandGuideline | null>(null);
  const [counts, setCounts] = useState<Record<BrandGuidelineType, number>>({
    figma: 0,
    pdf: 0,
    pptx: 0,
    ppt: 0,
    link: 0,
    notion: 0,
    'google-doc': 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch guidelines from Supabase
  const fetchGuidelines = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [allGuidelines, primary, guidelineCounts] = await Promise.all([
        getGuidelinesByBrand(brandId),
        getPrimaryGuideline(brandId),
        getGuidelineCounts(brandId),
      ]);

      setGuidelines(allGuidelines);
      setPrimary(primary);
      setCounts(guidelineCounts);
    } catch (err) {
      console.error('Error fetching guidelines:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch guidelines'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchGuidelines();
    }
  }, [autoFetch, fetchGuidelines]);

  // Get a single guideline by ID
  const getGuideline = useCallback(async (id: string): Promise<BrandGuideline | null> => {
    try {
      return await getGuidelineById(id);
    } catch (err) {
      console.error('Error getting guideline:', err);
      throw err;
    }
  }, []);

  // Add a new guideline
  const addGuideline = useCallback(
    async (guideline: Omit<BrandGuidelineInsert, 'brand_id'>): Promise<BrandGuideline> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const newGuideline = await createGuideline({
          ...guideline,
          brand_id: brandId,
        });
        await fetchGuidelines(); // Refresh the list
        return newGuideline;
      } catch (err) {
        console.error('Error adding guideline:', err);
        throw err;
      }
    },
    [brandId, fetchGuidelines]
  );

  // Add a Figma guideline with auto-generated embed URL
  const addFigmaGuideline = useCallback(
    async (
      figmaUrl: string,
      opts: { title: string; description?: string; category?: string; isPrimary?: boolean }
    ): Promise<BrandGuideline> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const newGuideline = await createFigmaGuideline(brandId, figmaUrl, opts);
        await fetchGuidelines(); // Refresh the list
        return newGuideline;
      } catch (err) {
        console.error('Error adding Figma guideline:', err);
        throw err;
      }
    },
    [brandId, fetchGuidelines]
  );

  // Edit a guideline
  const editGuideline = useCallback(
    async (id: string, updates: BrandGuidelineUpdate): Promise<BrandGuideline> => {
      try {
        const updatedGuideline = await updateGuideline(id, updates);
        await fetchGuidelines(); // Refresh the list
        return updatedGuideline;
      } catch (err) {
        console.error('Error editing guideline:', err);
        throw err;
      }
    },
    [fetchGuidelines]
  );

  // Soft delete a guideline
  const removeGuideline = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteGuideline(id);
        await fetchGuidelines(); // Refresh the list
      } catch (err) {
        console.error('Error removing guideline:', err);
        throw err;
      }
    },
    [fetchGuidelines]
  );

  // Permanently delete a guideline
  const permanentlyRemoveGuideline = useCallback(
    async (id: string): Promise<void> => {
      try {
        await hardDeleteGuideline(id);
        await fetchGuidelines(); // Refresh the list
      } catch (err) {
        console.error('Error permanently removing guideline:', err);
        throw err;
      }
    },
    [fetchGuidelines]
  );

  // Upload a guideline file
  const uploadGuidelineFile = useCallback(
    async (
      file: File,
      opts: { title: string; description?: string; category?: string; isPrimary?: boolean }
    ): Promise<BrandGuideline> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const brandSlug = 'open-session'; // TODO: Get from context
        const newGuideline = await uploadGuideline(brandId, brandSlug, file, opts);
        await fetchGuidelines(); // Refresh the list
        return newGuideline;
      } catch (err) {
        console.error('Error uploading guideline:', err);
        throw err;
      }
    },
    [brandId, fetchGuidelines]
  );

  // Set a guideline as primary
  const setAsPrimary = useCallback(
    async (id: string): Promise<void> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        await setPrimaryGuideline(brandId, id);
        await fetchGuidelines(); // Refresh the list
      } catch (err) {
        console.error('Error setting primary guideline:', err);
        throw err;
      }
    },
    [brandId, fetchGuidelines]
  );

  // Reorder guidelines
  const reorder = useCallback(
    async (guidelineIds: string[]): Promise<void> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        await reorderGuidelines(brandId, guidelineIds);
        await fetchGuidelines(); // Refresh the list
      } catch (err) {
        console.error('Error reordering guidelines:', err);
        throw err;
      }
    },
    [brandId, fetchGuidelines]
  );

  // Search guidelines
  const search = useCallback(
    async (query: string): Promise<BrandGuideline[]> => {
      if (!brandId) {
        return [];
      }

      try {
        return await searchGuidelines(brandId, query);
      } catch (err) {
        console.error('Error searching guidelines:', err);
        throw err;
      }
    },
    [brandId]
  );

  return {
    guidelines,
    primaryGuideline,
    counts,
    isLoading,
    error,
    refresh: fetchGuidelines,
    getGuideline,
    addGuideline,
    addFigmaGuideline,
    editGuideline,
    removeGuideline,
    permanentlyRemoveGuideline,
    uploadGuidelineFile,
    setAsPrimary,
    reorder,
    search,
  };
}

