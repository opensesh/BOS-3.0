'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandArtImage, BrandArtImageMetadata, ArtDirectionCategory } from '@/lib/supabase/types';
import {
  getArtImagesByBrand,
  getArtImageById,
  getArtImagesByCategory,
  createArtImage,
  updateArtImage,
  deleteArtImage,
  uploadArtImage,
  getArtImagesGroupedByCategory,
  getArtImageCounts,
  ART_DIRECTION_CATEGORIES,
} from '@/lib/supabase/brand-art-service';

// Default brand ID for Open Session
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '16aa5681-c792-45cf-bf65-9f9cbc3197af';

interface UseBrandArtDirectionOptions {
  brandId?: string;
  autoFetch?: boolean;
  category?: ArtDirectionCategory | 'All';
}

interface UseBrandArtDirectionReturn {
  images: BrandArtImage[];
  imagesByCategory: Map<ArtDirectionCategory | 'Other', BrandArtImage[]>;
  counts: Record<ArtDirectionCategory | 'All', number>;
  categories: typeof ART_DIRECTION_CATEGORIES;
  selectedCategory: ArtDirectionCategory | 'All';
  setSelectedCategory: (category: ArtDirectionCategory | 'All') => void;
  filteredImages: BrandArtImage[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getImage: (id: string) => Promise<BrandArtImage | null>;
  addImage: (
    name: string,
    filename: string,
    storagePath: string,
    metadata: BrandArtImageMetadata,
    options?: { description?: string; mimeType?: string; fileSize?: number }
  ) => Promise<BrandArtImage>;
  editImage: (id: string, updates: Partial<BrandArtImage> & { metadata?: BrandArtImageMetadata }) => Promise<BrandArtImage>;
  removeImage: (id: string) => Promise<void>;
  uploadImageFile: (file: File | Blob, name: string, metadata: BrandArtImageMetadata) => Promise<BrandArtImage>;
}

/**
 * React hook for managing brand art direction images
 */
export function useBrandArtDirection(options: UseBrandArtDirectionOptions = {}): UseBrandArtDirectionReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true, category: initialCategory = 'All' } = options;

  const [images, setImages] = useState<BrandArtImage[]>([]);
  const [imagesByCategory, setImagesByCategory] = useState<Map<ArtDirectionCategory | 'Other', BrandArtImage[]>>(new Map());
  const [counts, setCounts] = useState<Record<ArtDirectionCategory | 'All', number>>({
    All: 0,
    Auto: 0,
    Lifestyle: 0,
    Move: 0,
    Escape: 0,
    Work: 0,
    Feel: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<ArtDirectionCategory | 'All'>(initialCategory);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate filtered images based on selected category
  const filteredImages = selectedCategory === 'All'
    ? images
    : images.filter(img => {
        // First check variant field (primary source from database)
        if (img.variant) {
          const variantLower = img.variant.toLowerCase();
          const categoryMap: Record<string, ArtDirectionCategory> = {
            'auto': 'Auto',
            'lifestyle': 'Lifestyle',
            'move': 'Move',
            'escape': 'Escape',
            'work': 'Work',
            'feel': 'Feel',
          };
          if (categoryMap[variantLower] === selectedCategory) {
            return true;
          }
        }
        // Fall back to metadata artCategory
        const meta = img.metadata as BrandArtImageMetadata;
        return meta.artCategory === selectedCategory;
      });

  // Fetch images from Supabase
  const fetchImages = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [allImages, grouped, imageCounts] = await Promise.all([
        getArtImagesByBrand(brandId),
        getArtImagesGroupedByCategory(brandId),
        getArtImageCounts(brandId),
      ]);

      setImages(allImages);
      setImagesByCategory(grouped);
      setCounts(imageCounts);
    } catch (err) {
      console.error('Error fetching art images:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch art images'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchImages();
    }
  }, [autoFetch, fetchImages]);

  // Get a single image by ID
  const getImage = useCallback(async (id: string): Promise<BrandArtImage | null> => {
    try {
      return await getArtImageById(id);
    } catch (err) {
      console.error('Error getting art image:', err);
      throw err;
    }
  }, []);

  // Add a new image
  const addImage = useCallback(
    async (
      name: string,
      filename: string,
      storagePath: string,
      metadata: BrandArtImageMetadata,
      opts?: { description?: string; mimeType?: string; fileSize?: number }
    ): Promise<BrandArtImage> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const newImage = await createArtImage(brandId, name, filename, storagePath, metadata, opts);
        await fetchImages(); // Refresh the list
        return newImage;
      } catch (err) {
        console.error('Error adding art image:', err);
        throw err;
      }
    },
    [brandId, fetchImages]
  );

  // Edit an image
  const editImage = useCallback(
    async (id: string, updates: Partial<BrandArtImage> & { metadata?: BrandArtImageMetadata }): Promise<BrandArtImage> => {
      try {
        // Transform app types to DB types
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.variant) dbUpdates.variant = updates.variant;
        if (updates.metadata) dbUpdates.metadata = updates.metadata;

        const updatedImage = await updateArtImage(id, dbUpdates);
        await fetchImages(); // Refresh the list
        return updatedImage;
      } catch (err) {
        console.error('Error editing art image:', err);
        throw err;
      }
    },
    [fetchImages]
  );

  // Remove an image
  const removeImage = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteArtImage(id);
        await fetchImages(); // Refresh the list
      } catch (err) {
        console.error('Error removing art image:', err);
        throw err;
      }
    },
    [fetchImages]
  );

  // Upload an image file
  const uploadImageFile = useCallback(
    async (file: File | Blob, name: string, metadata: BrandArtImageMetadata): Promise<BrandArtImage> => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }

      try {
        const brandSlug = 'open-session'; // TODO: Get from context
        const newImage = await uploadArtImage(brandId, brandSlug, file, name, metadata);
        await fetchImages(); // Refresh the list
        return newImage;
      } catch (err) {
        console.error('Error uploading art image:', err);
        throw err;
      }
    },
    [brandId, fetchImages]
  );

  return {
    images,
    imagesByCategory,
    counts,
    categories: ART_DIRECTION_CATEGORIES,
    selectedCategory,
    setSelectedCategory,
    filteredImages,
    isLoading,
    error,
    refresh: fetchImages,
    getImage,
    addImage,
    editImage,
    removeImage,
    uploadImageFile,
  };
}

