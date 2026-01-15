'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ShortLink,
  ShortLinkInsert,
  ShortLinkUpdate,
} from '@/lib/supabase/types';

// Default brand ID for Open Session (fallback for local development)
const OPEN_SESSION_BRAND_ID = '16aa5681-c792-45cf-bf65-9f9cbc3197af';
const DEFAULT_BRAND_ID =
  process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || OPEN_SESSION_BRAND_ID;

export interface UseLinksOptions {
  brandId?: string;
  autoFetch?: boolean;
  initialPage?: number;
  pageSize?: number;
  includeArchived?: boolean;
}

export interface LinkFilters {
  search: string;
  tags: string[];
  sortBy: 'created' | 'clicks' | 'alphabetical' | 'updated';
  sortOrder: 'asc' | 'desc';
}

export interface LinkStats {
  total: number;
  active: number;
  archived: number;
  totalClicks: number;
}

export interface UseLinksReturn {
  // State
  links: ShortLink[];
  isLoading: boolean;
  error: Error | null;

  // Pagination
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;

  // Filters
  filters: LinkFilters;
  setSearch: (search: string) => void;
  setTags: (tags: string[]) => void;
  setSortBy: (sortBy: LinkFilters['sortBy']) => void;
  setSortOrder: (sortOrder: LinkFilters['sortOrder']) => void;
  clearFilters: () => void;

  // Stats
  stats: LinkStats | null;

  // Actions
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // CRUD
  createLink: (
    data: Omit<ShortLinkInsert, 'brand_id'>
  ) => Promise<ShortLink>;
  updateLink: (id: string, updates: ShortLinkUpdate) => Promise<ShortLink>;
  deleteLink: (id: string, hard?: boolean) => Promise<void>;
  archiveLink: (id: string) => Promise<ShortLink>;
  duplicateLink: (id: string) => Promise<ShortLink>;

  // Utilities
  isShortCodeAvailable: (shortCode: string) => Promise<boolean>;
}

const defaultFilters: LinkFilters = {
  search: '',
  tags: [],
  sortBy: 'created',
  sortOrder: 'desc',
};

/**
 * React hook for managing short links
 */
export function useLinks(options: UseLinksOptions = {}): UseLinksReturn {
  const {
    brandId = DEFAULT_BRAND_ID,
    autoFetch = true,
    initialPage = 1,
    pageSize = 20,
    includeArchived = false,
  } = options;

  // State
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Pagination
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState<LinkFilters>(defaultFilters);

  // Stats
  const [stats, setStats] = useState<LinkStats | null>(null);

  // Fetch links from API
  const fetchLinks = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        brandId,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        includeStats: 'true',
        includeArchived: includeArchived.toString(),
      });

      if (filters.search) {
        params.set('search', filters.search);
      }

      if (filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
      }

      const response = await fetch(`/api/links?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      const data = await response.json();

      setLinks(data.links);
      setTotalCount(data.total);
      setHasMore(data.hasMore);

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch links'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId, currentPage, pageSize, filters, includeArchived]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchLinks();
    }
  }, [autoFetch, fetchLinks]);

  // Filter setters
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setCurrentPage(1); // Reset to first page
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFilters((prev) => ({ ...prev, tags }));
    setCurrentPage(1);
  }, []);

  const setSortBy = useCallback((sortBy: LinkFilters['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: LinkFilters['sortOrder']) => {
    setFilters((prev) => ({ ...prev, sortOrder }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, []);

  // Pagination actions
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Create link
  const createLink = useCallback(
    async (data: Omit<ShortLinkInsert, 'brand_id'>): Promise<ShortLink> => {
      try {
        const response = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            brandId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create link');
        }

        const link = await response.json();

        // Optimistically add to list
        setLinks((prev) => [link, ...prev]);
        setTotalCount((prev) => prev + 1);

        return link;
      } catch (err) {
        console.error('Error creating link:', err);
        throw err;
      }
    },
    [brandId]
  );

  // Update link
  const updateLink = useCallback(
    async (id: string, updates: ShortLinkUpdate): Promise<ShortLink> => {
      try {
        const response = await fetch(`/api/links/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update link');
        }

        const link = await response.json();

        // Update in list
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? link : l))
        );

        return link;
      } catch (err) {
        console.error('Error updating link:', err);
        throw err;
      }
    },
    []
  );

  // Delete link
  const deleteLink = useCallback(
    async (id: string, hard = false): Promise<void> => {
      try {
        const params = new URLSearchParams();
        if (hard) {
          params.set('hard', 'true');
        }

        const response = await fetch(`/api/links/${id}?${params.toString()}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete link');
        }

        // Remove from list
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setTotalCount((prev) => prev - 1);
      } catch (err) {
        console.error('Error deleting link:', err);
        throw err;
      }
    },
    []
  );

  // Archive link
  const archiveLink = useCallback(async (id: string): Promise<ShortLink> => {
    try {
      const response = await fetch(`/api/links/${id}?action=archive`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive link');
      }

      const link = await response.json();

      // Update in list (or remove if not including archived)
      setLinks((prev) =>
        includeArchived
          ? prev.map((l) => (l.id === id ? link : l))
          : prev.filter((l) => l.id !== id)
      );

      return link;
    } catch (err) {
      console.error('Error archiving link:', err);
      throw err;
    }
  }, [includeArchived]);

  // Duplicate link
  const duplicateLink = useCallback(async (id: string): Promise<ShortLink> => {
    try {
      const response = await fetch(`/api/links/${id}?action=duplicate`, {
        method: 'DELETE', // Using DELETE with action=duplicate
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate link');
      }

      const link = await response.json();

      // Add to list
      setLinks((prev) => [link, ...prev]);
      setTotalCount((prev) => prev + 1);

      return link;
    } catch (err) {
      console.error('Error duplicating link:', err);
      throw err;
    }
  }, []);

  // Check short code availability
  const isShortCodeAvailable = useCallback(
    async (shortCode: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/links?brandId=${brandId}&search=${shortCode}&limit=1`
        );

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return !data.links.some(
          (l: ShortLink) => l.shortCode.toLowerCase() === shortCode.toLowerCase()
        );
      } catch {
        return false;
      }
    },
    [brandId]
  );

  return {
    // State
    links,
    isLoading,
    error,

    // Pagination
    totalCount,
    currentPage,
    pageSize,
    hasMore,

    // Filters
    filters,
    setSearch,
    setTags,
    setSortBy,
    setSortOrder,
    clearFilters,

    // Stats
    stats,

    // Actions
    refresh: fetchLinks,
    setPage,
    nextPage,
    prevPage,

    // CRUD
    createLink,
    updateLink,
    deleteLink,
    archiveLink,
    duplicateLink,

    // Utilities
    isShortCodeAvailable,
  };
}
