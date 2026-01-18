'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShortLinkTag, ShortLinkTagColor } from '@/lib/supabase/types';

// Default brand ID for Open Session (fallback for local development)
const OPEN_SESSION_BRAND_ID = '16aa5681-c792-45cf-bf65-9f9cbc3197af';
const DEFAULT_BRAND_ID =
  process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || OPEN_SESSION_BRAND_ID;

export interface UseLinkTagsOptions {
  brandId?: string;
  autoFetch?: boolean;
}

export interface UseLinkTagsReturn {
  tags: ShortLinkTag[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createTag: (name: string, color?: ShortLinkTagColor) => Promise<ShortLinkTag>;
  updateTag: (
    id: string,
    updates: { name?: string; color?: ShortLinkTagColor }
  ) => Promise<ShortLinkTag>;
  deleteTag: (id: string) => Promise<void>;
  getOrCreateTag: (
    name: string,
    color?: ShortLinkTagColor
  ) => Promise<ShortLinkTag>;
  getTagByName: (name: string) => ShortLinkTag | undefined;
  getTagById: (id: string) => ShortLinkTag | undefined;
}

/**
 * React hook for managing link tags
 */
export function useLinkTags(options: UseLinkTagsOptions = {}): UseLinkTagsReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [tags, setTags] = useState<ShortLinkTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch tags from API
  const fetchTags = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/links/tags?brandId=${brandId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data.tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tags'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchTags();
    }
  }, [autoFetch, fetchTags]);

  // Create tag
  const createTag = useCallback(
    async (name: string, color?: ShortLinkTagColor): Promise<ShortLinkTag> => {
      try {
        const response = await fetch('/api/links/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            name,
            color,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create tag');
        }

        const tag = await response.json();

        // Add to list
        setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));

        return tag;
      } catch (err) {
        console.error('Error creating tag:', err);
        throw err;
      }
    },
    [brandId]
  );

  // Get or create tag
  const getOrCreateTag = useCallback(
    async (name: string, color?: ShortLinkTagColor): Promise<ShortLinkTag> => {
      // Check if exists locally first
      const existing = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      try {
        const response = await fetch('/api/links/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            name,
            color,
            getOrCreate: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to get or create tag');
        }

        const tag = await response.json();

        // Add to list if new
        setTags((prev) => {
          const exists = prev.some((t) => t.id === tag.id);
          if (exists) return prev;
          return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
        });

        return tag;
      } catch (err) {
        console.error('Error getting or creating tag:', err);
        throw err;
      }
    },
    [brandId, tags]
  );

  // Update tag
  const updateTag = useCallback(
    async (
      id: string,
      updates: { name?: string; color?: ShortLinkTagColor }
    ): Promise<ShortLinkTag> => {
      try {
        const response = await fetch('/api/links/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update tag');
        }

        const tag = await response.json();

        // Update in list
        setTags((prev) =>
          prev
            .map((t) => (t.id === id ? tag : t))
            .sort((a, b) => a.name.localeCompare(b.name))
        );

        return tag;
      } catch (err) {
        console.error('Error updating tag:', err);
        throw err;
      }
    },
    []
  );

  // Delete tag
  const deleteTag = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/links/tags?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }

      // Remove from list
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Error deleting tag:', err);
      throw err;
    }
  }, []);

  // Get tag by name (local lookup)
  const getTagByName = useCallback(
    (name: string): ShortLinkTag | undefined => {
      return tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    },
    [tags]
  );

  // Get tag by ID (local lookup)
  const getTagById = useCallback(
    (id: string): ShortLinkTag | undefined => {
      return tags.find((t) => t.id === id);
    },
    [tags]
  );

  return {
    tags,
    isLoading,
    error,
    refresh: fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getOrCreateTag,
    getTagByName,
    getTagById,
  };
}

// Export tag color utilities
export const TAG_COLOR_OPTIONS: ShortLinkTagColor[] = [
  'gray',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'sky',
  'indigo',
  'violet',
  'purple',
  'pink',
];

export function getTagColorClasses(color: ShortLinkTagColor): {
  bg: string;
  text: string;
  border: string;
} {
  const colorMap: Record<ShortLinkTagColor, { bg: string; text: string; border: string }> = {
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  };

  return colorMap[color] || colorMap.gray;
}
