'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSuggestionsOptions {
  mode: 'search' | 'research';
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
}

interface UseSuggestionsResult {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (query: string) => void;
  clearSuggestions: () => void;
}

/**
 * Hook for fetching fast search suggestions
 * Uses DuckDuckGo autocomplete for real-time suggestions
 */
export function useSearchSuggestions({
  mode,
  debounceMs = 150, // Fast debounce for responsive feel
  minQueryLength = 2,
  maxSuggestions = 6,
}: UseSuggestionsOptions): UseSuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  const fetchSuggestions = useCallback((query: string) => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const trimmedQuery = query.trim();

    // If query is too short, clear suggestions immediately
    if (!trimmedQuery || trimmedQuery.length < minQueryLength) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Store query for comparison
    lastQueryRef.current = trimmedQuery;
    
    // Show loading state immediately for better UX
    setIsLoading(true);

    // Debounce the actual API call
    debounceTimeoutRef.current = setTimeout(async () => {
      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: trimmedQuery, 
            mode, 
            limit: maxSuggestions 
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        
        // Only update if this is still the latest query
        if (trimmedQuery === lastQueryRef.current) {
          setSuggestions(data.suggestions || []);
          setError(null);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching suggestions:', err);
        setError('Failed to fetch suggestions');
        // Clear suggestions on error for clean UX
        setSuggestions([]);
      } finally {
        // Only clear loading if this is still the latest query
        if (trimmedQuery === lastQueryRef.current) {
          setIsLoading(false);
        }
      }
    }, debounceMs);
  }, [mode, debounceMs, minQueryLength, maxSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}

/**
 * Log a search query to history (optional analytics)
 */
export async function logSearchQuery(query: string, mode: 'search' | 'research'): Promise<void> {
  try {
    // Dynamic import to avoid server-side issues
    const { chatService } = await import('@/lib/supabase/chat-service');
    await chatService.logSearch(query, mode);
  } catch (error) {
    console.error('Error logging search:', error);
  }
}
