'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandLogo, BrandLogoMetadata, BrandLogoVariant, BrandLogoType } from '@/lib/supabase/types';
import {
  getLogosByBrand,
  getLogoById,
  createLogo,
  updateLogo,
  deleteLogo,
  uploadLogo,
  getLogosGroupedByType,
  getLogoVariants,
} from '@/lib/supabase/brand-logos-service';

// Default brand ID for Open Session
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '';

interface UseBrandLogosOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseBrandLogosReturn {
  logos: BrandLogo[];
  mainLogos: BrandLogo[];
  accessoryLogos: BrandLogo[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getLogo: (id: string) => Promise<BrandLogo | null>;
  addLogo: (
    name: string,
    filename: string,
    storagePath: string,
    metadata: BrandLogoMetadata,
    options?: { description?: string; variant?: BrandLogoVariant; mimeType?: string; fileSize?: number }
  ) => Promise<BrandLogo>;
  editLogo: (id: string, updates: Partial<BrandLogo> & { metadata?: BrandLogoMetadata }) => Promise<BrandLogo>;
  removeLogo: (id: string) => Promise<void>;
  uploadLogoFile: (file: File | Blob, name: string, metadata: BrandLogoMetadata) => Promise<BrandLogo>;
  getVariants: (logoType: BrandLogoType) => Promise<Record<BrandLogoVariant, BrandLogo | null>>;
}

/**
 * React hook for managing brand logos
 */
export function useBrandLogos(options: UseBrandLogosOptions = {}): UseBrandLogosReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [mainLogos, setMainLogos] = useState<BrandLogo[]>([]);
  const [accessoryLogos, setAccessoryLogos] = useState<BrandLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch logos from Supabase
  const fetchLogos = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { main, accessory } = await getLogosGroupedByType(brandId);
      
      setMainLogos(main);
      setAccessoryLogos(accessory);
      setLogos([...main, ...accessory]);
    } catch (err) {
      console.error('Error fetching logos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch logos'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchLogos();
    }
  }, [autoFetch, fetchLogos]);

  // Get a single logo by ID
  const getLogo = useCallback(async (id: string): Promise<BrandLogo | null> => {
    try {
      return await getLogoById(id);
    } catch (err) {
      console.error('Error getting logo:', err);
      throw err;
    }
  }, []);

  // Add a new logo
  const addLogo = useCallback(
    async (
      name: string,
      filename: string,
      storagePath: string,
      metadata: BrandLogoMetadata,
      opts?: { description?: string; variant?: BrandLogoVariant; mimeType?: string; fileSize?: number }
    ): Promise<BrandLogo> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const newLogo = await createLogo(brandId, name, filename, storagePath, metadata, opts);
        await fetchLogos(); // Refresh the list
        return newLogo;
      } catch (err) {
        console.error('Error adding logo:', err);
        throw err;
      }
    },
    [brandId, fetchLogos]
  );

  // Edit a logo
  const editLogo = useCallback(
    async (id: string, updates: Partial<BrandLogo> & { metadata?: BrandLogoMetadata }): Promise<BrandLogo> => {
      try {
        // Transform app types to DB types
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.variant) dbUpdates.variant = updates.variant;
        if (updates.metadata) dbUpdates.metadata = updates.metadata;

        const updatedLogo = await updateLogo(id, dbUpdates);
        await fetchLogos(); // Refresh the list
        return updatedLogo;
      } catch (err) {
        console.error('Error editing logo:', err);
        throw err;
      }
    },
    [fetchLogos]
  );

  // Remove a logo
  const removeLogo = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteLogo(id);
        await fetchLogos(); // Refresh the list
      } catch (err) {
        console.error('Error removing logo:', err);
        throw err;
      }
    },
    [fetchLogos]
  );

  // Upload a logo file
  const uploadLogoFile = useCallback(
    async (file: File | Blob, name: string, metadata: BrandLogoMetadata): Promise<BrandLogo> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        // Get brand slug - for now use a default
        const brandSlug = 'open-session'; // TODO: Get from context
        const newLogo = await uploadLogo(brandId, brandSlug, file, name, metadata);
        await fetchLogos(); // Refresh the list
        return newLogo;
      } catch (err) {
        console.error('Error uploading logo:', err);
        throw err;
      }
    },
    [brandId, fetchLogos]
  );

  // Get all variants for a logo type
  const getVariants = useCallback(
    async (logoType: BrandLogoType): Promise<Record<BrandLogoVariant, BrandLogo | null>> => {
      if (!brandId) {
        return { vanilla: null, glass: null, charcoal: null };
      }

      try {
        return await getLogoVariants(brandId, logoType);
      } catch (err) {
        console.error('Error getting logo variants:', err);
        throw err;
      }
    },
    [brandId]
  );

  return {
    logos,
    mainLogos,
    accessoryLogos,
    isLoading,
    error,
    refresh: fetchLogos,
    getLogo,
    addLogo,
    editLogo,
    removeLogo,
    uploadLogoFile,
    getVariants,
  };
}

