'use client';

import { useState, useEffect, useCallback } from 'react';

// View modes for the links display
export type LinksViewMode = 'grid' | 'list';

// Sort options
export type LinksSortOption = 'relevance' | 'alphabetical' | 'domain';

// Filter types
export type LinksFilterType = 'all' | 'brand' | 'web' | 'news';

// Preferences structure
export interface LinksViewPreferences {
  viewMode: LinksViewMode;
  sortBy: LinksSortOption;
  filterType: LinksFilterType;
  searchQuery: string;
}

// Default preferences
const DEFAULT_PREFERENCES: LinksViewPreferences = {
  viewMode: 'grid',
  sortBy: 'relevance',
  filterType: 'all',
  searchQuery: '',
};

// Storage key prefix
const STORAGE_KEY_PREFIX = 'bos-links-view-prefs';

/**
 * Hook to manage and persist links view preferences per conversation
 * Preferences are stored in localStorage keyed by session/conversation ID
 * 
 * @param sessionId - The unique identifier for the conversation/session
 * @returns Preferences state and setters
 */
export function useLinksViewPreferences(sessionId: string | null) {
  const [preferences, setPreferences] = useState<LinksViewPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate storage key for this session
  const storageKey = sessionId ? `${STORAGE_KEY_PREFIX}-${sessionId}` : null;

  // Load preferences from localStorage on mount or when sessionId changes
  useEffect(() => {
    if (!storageKey) {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LinksViewPreferences>;
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
        });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!isLoaded || !storageKey) return;

    try {
      // Don't persist searchQuery - it should reset between sessions
      const toStore: Partial<LinksViewPreferences> = {
        viewMode: preferences.viewMode,
        sortBy: preferences.sortBy,
        filterType: preferences.filterType,
      };
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [preferences, isLoaded, storageKey]);

  // Individual setters for better ergonomics
  const setViewMode = useCallback((mode: LinksViewMode) => {
    setPreferences((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const setSortBy = useCallback((sort: LinksSortOption) => {
    setPreferences((prev) => ({ ...prev, sortBy: sort }));
  }, []);

  const setFilterType = useCallback((filter: LinksFilterType) => {
    setPreferences((prev) => ({ ...prev, filterType: filter }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setPreferences((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Silently fail
      }
    }
  }, [storageKey]);

  return {
    ...preferences,
    isLoaded,
    setViewMode,
    setSortBy,
    setFilterType,
    setSearchQuery,
    resetPreferences,
  };
}

/**
 * Clean up old preferences from localStorage
 * Call this periodically or on app init to prevent localStorage bloat
 * 
 * @param maxAge - Maximum age in milliseconds (default: 30 days)
 */
export function cleanupOldLinksPreferences(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        // Extract timestamp from sessionId if present, or just remove old entries
        // Since we don't have timestamps in keys, we could add metadata
        // For now, this is a placeholder for future enhancement
      }
    });
  } catch {
    // Silently fail
  }
}

