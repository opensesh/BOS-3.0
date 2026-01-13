'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandFont, BrandFontMetadata } from '@/lib/supabase/types';
import {
  getFontsByBrand,
  getFontById,
  createFont,
  updateFont,
  deleteFont,
  uploadFont,
  getFontsGroupedByUsage,
  getFontFamilies,
} from '@/lib/supabase/brand-fonts-service';

// Default brand ID for Open Session
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '16aa5681-c792-45cf-bf65-9f9cbc3197af';

interface UseBrandFontsOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseBrandFontsReturn {
  fonts: BrandFont[];
  displayFonts: BrandFont[];
  bodyFonts: BrandFont[];
  accentFonts: BrandFont[];
  fontFamilies: Map<string, BrandFont[]>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getFont: (id: string) => Promise<BrandFont | null>;
  addFont: (
    name: string,
    filename: string,
    storagePath: string,
    metadata: BrandFontMetadata,
    options?: { description?: string; mimeType?: string; fileSize?: number }
  ) => Promise<BrandFont>;
  editFont: (id: string, updates: Partial<BrandFont> & { metadata?: BrandFontMetadata }) => Promise<BrandFont>;
  removeFont: (id: string) => Promise<void>;
  uploadFontFile: (file: File | Blob, name: string, metadata: BrandFontMetadata) => Promise<BrandFont>;
}

/**
 * React hook for managing brand fonts/typography
 */
export function useBrandFonts(options: UseBrandFontsOptions = {}): UseBrandFontsReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [fonts, setFonts] = useState<BrandFont[]>([]);
  const [displayFonts, setDisplayFonts] = useState<BrandFont[]>([]);
  const [bodyFonts, setBodyFonts] = useState<BrandFont[]>([]);
  const [accentFonts, setAccentFonts] = useState<BrandFont[]>([]);
  const [fontFamilies, setFontFamilies] = useState<Map<string, BrandFont[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch fonts from Supabase
  const fetchFonts = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [allFonts, grouped, families] = await Promise.all([
        getFontsByBrand(brandId),
        getFontsGroupedByUsage(brandId),
        getFontFamilies(brandId),
      ]);

      setFonts(allFonts);
      setDisplayFonts(grouped.display);
      setBodyFonts(grouped.body);
      setAccentFonts(grouped.accent);
      setFontFamilies(families);
    } catch (err) {
      console.error('Error fetching fonts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch fonts'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchFonts();
    }
  }, [autoFetch, fetchFonts]);

  // Get a single font by ID
  const getFont = useCallback(async (id: string): Promise<BrandFont | null> => {
    try {
      return await getFontById(id);
    } catch (err) {
      console.error('Error getting font:', err);
      throw err;
    }
  }, []);

  // Add a new font
  const addFont = useCallback(
    async (
      name: string,
      filename: string,
      storagePath: string,
      metadata: BrandFontMetadata,
      opts?: { description?: string; mimeType?: string; fileSize?: number }
    ): Promise<BrandFont> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const newFont = await createFont(brandId, name, filename, storagePath, metadata, opts);
        await fetchFonts(); // Refresh the list
        return newFont;
      } catch (err) {
        console.error('Error adding font:', err);
        throw err;
      }
    },
    [brandId, fetchFonts]
  );

  // Edit a font
  const editFont = useCallback(
    async (id: string, updates: Partial<BrandFont> & { metadata?: BrandFontMetadata }): Promise<BrandFont> => {
      try {
        // Transform app types to DB types
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.variant) dbUpdates.variant = updates.variant;
        if (updates.metadata) dbUpdates.metadata = updates.metadata;

        const updatedFont = await updateFont(id, dbUpdates);
        await fetchFonts(); // Refresh the list
        return updatedFont;
      } catch (err) {
        console.error('Error editing font:', err);
        throw err;
      }
    },
    [fetchFonts]
  );

  // Remove a font
  const removeFont = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteFont(id);
        await fetchFonts(); // Refresh the list
      } catch (err) {
        console.error('Error removing font:', err);
        throw err;
      }
    },
    [fetchFonts]
  );

  // Upload a font file
  const uploadFontFile = useCallback(
    async (file: File | Blob, name: string, metadata: BrandFontMetadata): Promise<BrandFont> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const brandSlug = 'open-session'; // TODO: Get from context
        const newFont = await uploadFont(brandId, brandSlug, file, name, metadata);
        await fetchFonts(); // Refresh the list
        return newFont;
      } catch (err) {
        console.error('Error uploading font:', err);
        throw err;
      }
    },
    [brandId, fetchFonts]
  );

  return {
    fonts,
    displayFonts,
    bodyFonts,
    accentFonts,
    fontFamilies,
    isLoading,
    error,
    refresh: fetchFonts,
    getFont,
    addFont,
    editFont,
    removeFont,
    uploadFontFile,
  };
}

