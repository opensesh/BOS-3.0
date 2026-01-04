'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BrandLogo, BrandLogoMetadata, BrandLogoVariant, BrandLogoType, BrandLogoCategory } from '@/lib/supabase/types';
import {
  getLogosByBrand,
  getLogoById,
  createLogo,
  updateLogo,
  deleteLogo,
  uploadLogo,
  getLogosGroupedByType,
  getLogoVariants,
  getUniqueLogoTypes,
  getUniqueVariants,
  isLogoProtected,
} from '@/lib/supabase/brand-logos-service';

// Default brand ID for Open Session
// Fallback to hardcoded ID if environment variable is not set
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '16aa5681-c792-45cf-bf65-9f9cbc3197af';

// Default logo types available for selection
export const DEFAULT_LOGO_TYPES: BrandLogoType[] = [
  'brandmark',
  'combo',
  'stacked',
  'horizontal',
  'core',
  'outline',
  'filled',
];

// Default variants available for selection
export const DEFAULT_VARIANTS: BrandLogoVariant[] = [
  'vanilla',
  'glass',
  'charcoal',
];

// Default categories
export const DEFAULT_CATEGORIES: BrandLogoCategory[] = [
  'main',
  'accessory',
];

interface UseBrandLogosOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseBrandLogosReturn {
  // Logo data
  logos: BrandLogo[];
  mainLogos: BrandLogo[];
  accessoryLogos: BrandLogo[];
  systemLogos: BrandLogo[];
  userLogos: BrandLogo[];
  
  // Available options (for dropdowns)
  availableTypes: string[];
  availableVariants: string[];
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
  
  // Actions
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
  
  // Protection helpers
  canDeleteLogo: (logo: BrandLogo) => boolean;
  isLogoSystem: (logo: BrandLogo) => boolean;
}

/**
 * React hook for managing brand logos
 * Handles CRUD operations with protection for system logos
 */
export function useBrandLogos(options: UseBrandLogosOptions = {}): UseBrandLogosReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [mainLogos, setMainLogos] = useState<BrandLogo[]>([]);
  const [accessoryLogos, setAccessoryLogos] = useState<BrandLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
  const [uniqueVariants, setUniqueVariants] = useState<string[]>([]);

  // Computed: separate system vs user logos
  const systemLogos = useMemo(() => logos.filter(l => l.isSystem), [logos]);
  const userLogos = useMemo(() => logos.filter(l => !l.isSystem), [logos]);

  // Computed: combine default types/variants with custom ones from database
  const availableTypes = useMemo(() => {
    const combined = new Set([...DEFAULT_LOGO_TYPES, ...uniqueTypes]);
    return Array.from(combined);
  }, [uniqueTypes]);

  const availableVariants = useMemo(() => {
    const combined = new Set([...DEFAULT_VARIANTS, ...uniqueVariants]);
    return Array.from(combined);
  }, [uniqueVariants]);

  // Fetch logos from Supabase
  const fetchLogos = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [{ main, accessory }, types, variants] = await Promise.all([
        getLogosGroupedByType(brandId),
        getUniqueLogoTypes(brandId),
        getUniqueVariants(brandId),
      ]);
      
      setMainLogos(main);
      setAccessoryLogos(accessory);
      setLogos([...main, ...accessory]);
      setUniqueTypes(types);
      setUniqueVariants(variants);
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

  // Remove a logo (with protection check)
  const removeLogo = useCallback(
    async (id: string): Promise<void> => {
      try {
        // The service layer will throw if logo is protected
        await deleteLogo(id);
        await fetchLogos(); // Refresh the list
      } catch (err) {
        console.error('Error removing logo:', err);
        // Re-throw with a user-friendly message
        if (err instanceof Error && err.message.includes('system logo')) {
          throw new Error('This logo is protected and cannot be deleted.');
        }
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
  const getVariantsForType = useCallback(
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

  // Helper: Check if a logo can be deleted
  const canDeleteLogo = useCallback((logo: BrandLogo): boolean => {
    return !logo.isSystem;
  }, []);

  // Helper: Check if a logo is a system logo
  const isLogoSystem = useCallback((logo: BrandLogo): boolean => {
    return logo.isSystem;
  }, []);

  return {
    // Logo data
    logos,
    mainLogos,
    accessoryLogos,
    systemLogos,
    userLogos,
    
    // Available options
    availableTypes,
    availableVariants,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    refresh: fetchLogos,
    getLogo,
    addLogo,
    editLogo,
    removeLogo,
    uploadLogoFile,
    getVariants: getVariantsForType,
    
    // Protection helpers
    canDeleteLogo,
    isLogoSystem,
  };
}
