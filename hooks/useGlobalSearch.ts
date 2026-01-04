'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SPACES, EXAMPLE_SPACES } from '@/lib/mock-data';
import { chatService, ChatSession } from '@/lib/supabase/chat-service';
import type { Space } from '@/types';

// ===========================================
// Search Result Types
// ===========================================

export type SearchResultType = 
  | 'page' 
  | 'action' 
  | 'chat' 
  | 'logo' 
  | 'image' 
  | 'illustration' 
  | 'space'
  | 'document';

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
  similarity?: number;
}

export interface PageResult extends BaseSearchResult {
  type: 'page' | 'action';
  icon: string; // Icon name from lucide-react
}

export interface ChatResult extends BaseSearchResult {
  type: 'chat';
  preview?: string;
  messageCount?: number;
  updatedAt: string;
}

export interface AssetResult extends BaseSearchResult {
  type: 'logo' | 'image' | 'illustration';
  thumbnailPath: string;
  assetCategory: string;
  variant?: string;
}

export interface SpaceResult extends BaseSearchResult {
  type: 'space';
  icon?: string;
  isPrivate: boolean;
  threadCount?: number;
}

export interface DocumentResult extends BaseSearchResult {
  type: 'document';
  category: string;
  slug: string;
  headingHierarchy?: string[];
}

export type SearchResult = PageResult | ChatResult | AssetResult | SpaceResult | DocumentResult;

// ===========================================
// Static Navigation Data
// ===========================================

export const navigationPages: PageResult[] = [
  // Main pages
  { id: 'home', type: 'page', title: 'Home', subtitle: 'Go to homepage', href: '/', icon: 'Home', keywords: ['start', 'main', 'chat', 'new'] },
  { id: 'brand-hub', type: 'page', title: 'Brand Hub', subtitle: 'Brand assets and guidelines', href: '/brand-hub', icon: 'ScanFace', keywords: ['brand', 'assets', 'identity', 'guidelines'] },
  { id: 'brain', type: 'page', title: 'Brain', subtitle: 'AI knowledge and training', href: '/brain', icon: 'BrainCog', keywords: ['ai', 'knowledge', 'training', 'learning'] },
  { id: 'spaces', type: 'page', title: 'Spaces', subtitle: 'Collaborative workspaces', href: '/spaces', icon: 'LayoutGrid', keywords: ['workspace', 'collaborate', 'projects', 'team'] },
  
  // Brand Hub subpages
  { id: 'logo', type: 'page', title: 'Logo', subtitle: 'Brand Hub › Logo assets', href: '/brand-hub/logo', icon: 'ScanFace', keywords: ['logo', 'mark', 'icon', 'symbol', 'brandmark'] },
  { id: 'colors', type: 'page', title: 'Colors', subtitle: 'Brand Hub › Color palette', href: '/brand-hub/colors', icon: 'Palette', keywords: ['color', 'palette', 'scheme', 'hex', 'rgb'] },
  { id: 'fonts', type: 'page', title: 'Typography', subtitle: 'Brand Hub › Fonts and type', href: '/brand-hub/fonts', icon: 'Type', keywords: ['font', 'typography', 'text', 'typeface', 'neue haas'] },
  { id: 'art-direction', type: 'page', title: 'Art Direction', subtitle: 'Brand Hub › Visual style', href: '/brand-hub/art-direction', icon: 'Image', keywords: ['art', 'direction', 'visual', 'style', 'photography'] },
  { id: 'design-tokens', type: 'page', title: 'Design Tokens', subtitle: 'Brand Hub › Token system', href: '/brand-hub/design-tokens', icon: 'Layers', keywords: ['tokens', 'design', 'system', 'variables', 'css'] },
  { id: 'guidelines', type: 'page', title: 'Guidelines', subtitle: 'Brand Hub › Usage guidelines', href: '/brand-hub/guidelines', icon: 'FileText', keywords: ['guidelines', 'rules', 'usage', 'standards', 'do', 'dont'] },
  
  // Brain subpages
  { id: 'architecture', type: 'page', title: 'Architecture', subtitle: 'Brain › System architecture', href: '/brain/architecture', icon: 'Building', keywords: ['architecture', 'structure', 'system'] },
  { id: 'brand-identity', type: 'page', title: 'Brand Identity', subtitle: 'Brain › Brand knowledge', href: '/brain/brand-identity', icon: 'ScanFace', keywords: ['identity', 'brand', 'personality'] },
  { id: 'skills', type: 'page', title: 'Skills', subtitle: 'Brain › AI capabilities', href: '/brain/skills', icon: 'Lightbulb', keywords: ['skills', 'capabilities', 'abilities'] },
  { id: 'writing-styles', type: 'page', title: 'Writing Styles', subtitle: 'Brain › Content tone', href: '/brain/writing-styles', icon: 'Pencil', keywords: ['writing', 'style', 'tone', 'voice', 'content'] },
];

export const quickActions: PageResult[] = [
  { id: 'new-chat', type: 'action', title: 'New Chat', subtitle: 'Start a new conversation', href: '/', icon: 'MessageSquarePlus', keywords: ['new', 'chat', 'conversation', 'start'] },
];

// ===========================================
// Space Search Helpers
// ===========================================

function createSpaceResults(spaces: Space[]): SpaceResult[] {
  return spaces.map(space => ({
    id: `space-${space.id}`,
    type: 'space',
    title: space.title,
    subtitle: space.description || 'Workspace',
    href: `/spaces/${space.slug}`,
    icon: space.icon,
    isPrivate: space.isPrivate,
    threadCount: space.threadCount,
    keywords: [
      space.title.toLowerCase(),
      space.slug,
      space.description?.toLowerCase() || '',
      'space',
      'workspace',
    ].filter(Boolean),
  }));
}

// ===========================================
// Chat Subtitle Helper
// ===========================================

function formatChatSubtitle(updatedAt: string): string {
  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// ===========================================
// Local Search (for pages/actions/spaces)
// ===========================================

function searchLocalResults(
  query: string,
  pages: PageResult[],
  spaces: SpaceResult[]
): SearchResult[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];
  
  const queryWords = trimmedQuery.split(/\s+/);
  const scoredResults: Array<{ result: SearchResult; score: number }> = [];
  
  const scoreResult = (result: SearchResult): number => {
    let score = 0;
    
    // Title match (highest weight)
    const titleLower = result.title.toLowerCase();
    if (titleLower === trimmedQuery) {
      score += 100;
    } else if (titleLower.startsWith(trimmedQuery)) {
      score += 80;
    } else if (titleLower.includes(trimmedQuery)) {
      score += 60;
    }
    
    // Subtitle match
    const subtitleLower = result.subtitle?.toLowerCase() || '';
    if (subtitleLower.includes(trimmedQuery)) {
      score += 30;
    }
    
    // Keyword matches
    if (result.keywords) {
      for (const keyword of result.keywords) {
        if (keyword === trimmedQuery) {
          score += 50;
        } else if (keyword.startsWith(trimmedQuery)) {
          score += 30;
        } else if (keyword.includes(trimmedQuery)) {
          score += 15;
        }
      }
      
      // Multi-word query matching
      for (const word of queryWords) {
        if (result.keywords.some(k => k.includes(word))) {
          score += 10;
        }
      }
    }
    
    return score;
  };
  
  const allLocal = [...pages, ...spaces];
  
  for (const result of allLocal) {
    const score = scoreResult(result);
    if (score > 0) {
      scoredResults.push({ result, score });
    }
  }
  
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.map(r => r.result);
}

// ===========================================
// Semantic Search API Types
// ===========================================

interface SemanticSearchResult {
  id: string;
  type: 'chat' | 'asset' | 'document';
  // Chat fields
  chatId?: string;
  title?: string;
  content?: string;
  role?: string;
  updatedAt?: string;
  // Asset fields
  name?: string;
  filename?: string;
  description?: string;
  category?: string;
  variant?: string | null;
  storagePath?: string;
  // Document fields
  documentId?: string;
  slug?: string;
  headingHierarchy?: string[];
  // Common
  similarity: number;
}

interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  query: string;
  timing: {
    embedding: number;
    search: number;
    total: number;
  };
}

// ===========================================
// Convert Semantic Results to App Results
// ===========================================

function convertSemanticResults(results: SemanticSearchResult[]): SearchResult[] {
  return results.map(result => {
    if (result.type === 'chat') {
      return {
        id: `chat-${result.chatId}`,
        type: 'chat' as const,
        title: result.title || 'Chat',
        subtitle: formatChatSubtitle(result.updatedAt || new Date().toISOString()),
        href: result.chatId || '',
        preview: result.content?.slice(0, 100),
        updatedAt: result.updatedAt || new Date().toISOString(),
        similarity: result.similarity,
      };
    }
    
    if (result.type === 'asset') {
      // Determine asset type from category
      let assetType: 'logo' | 'image' | 'illustration' = 'image';
      if (result.category === 'logos') assetType = 'logo';
      else if (result.category === 'illustrations') assetType = 'illustration';
      
      // Build public URL from storage path
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const thumbnailPath = result.storagePath 
        ? `${supabaseUrl}/storage/v1/object/public/brand-assets/${result.storagePath}`
        : '';
      
      return {
        id: `asset-${result.id}`,
        type: assetType,
        title: result.name || result.filename || 'Asset',
        subtitle: `${result.category} › ${result.variant || 'default'}`,
        href: thumbnailPath,
        thumbnailPath,
        assetCategory: result.category || 'images',
        variant: result.variant || undefined,
        similarity: result.similarity,
      };
    }
    
    // Document result
    return {
      id: `doc-${result.id}`,
      type: 'document' as const,
      title: result.title || 'Document',
      subtitle: result.headingHierarchy?.join(' › ') || result.category || '',
      href: `/brain/${result.category}`,
      category: result.category || '',
      slug: result.slug || '',
      headingHierarchy: result.headingHierarchy,
      similarity: result.similarity,
    };
  });
}

// ===========================================
// Main Hook
// ===========================================

interface UseGlobalSearchOptions {
  debounceMs?: number;
  maxResults?: number;
  semanticThreshold?: number;
}

interface UseGlobalSearchResult {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  recentChats: ChatResult[];
  search: (query: string) => void;
  clearResults: () => void;
}

export function useGlobalSearch(options: UseGlobalSearchOptions = {}): UseGlobalSearchResult {
  const { debounceMs = 200, maxResults = 50, semanticThreshold = 0.5 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentChatSessions, setRecentChatSessions] = useState<ChatSession[]>([]);
  
  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent chat sessions on mount (for empty state)
  useEffect(() => {
    let mounted = true;
    
    async function loadRecentChats() {
      try {
        const sessions = await chatService.getSessions(5);
        if (mounted) {
          setRecentChatSessions(sessions);
        }
      } catch (err) {
        console.error('Failed to load recent chats:', err);
      }
    }
    
    loadRecentChats();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Pre-compute static data (pages, actions, spaces)
  const staticData = useMemo(() => {
    const pages = [...navigationPages, ...quickActions];
    const spaces = createSpaceResults([...SPACES, ...EXAMPLE_SPACES]);
    return { pages, spaces };
  }, []);

  // Recent chats for empty state
  const recentChats = useMemo((): ChatResult[] => {
    return recentChatSessions.map(session => ({
      id: `chat-${session.id}`,
      type: 'chat' as const,
      title: session.title,
      subtitle: formatChatSubtitle(session.updated_at),
      href: session.id,
      preview: session.preview || undefined,
      messageCount: session.messages.length,
      updatedAt: session.updated_at,
    }));
  }, [recentChatSessions]);

  // Default results (pages + recent chats)
  const defaultResults = useMemo(() => {
    return [
      ...staticData.pages.slice(0, 6),
      ...recentChats.slice(0, 3),
    ];
  }, [staticData.pages, recentChats]);

  // Perform search (combines local + semantic)
  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      setResults(defaultResults);
      setIsLoading(false);
      return;
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Run local search for pages/spaces (instant)
      const localResults = searchLocalResults(
        trimmedQuery, 
        staticData.pages, 
        staticData.spaces
      );
      
      // For short queries (< 3 chars), only do local search
      if (trimmedQuery.length < 3) {
        setResults(localResults.slice(0, maxResults));
        setIsLoading(false);
        return;
      }
      
      // Run semantic search API
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedQuery,
          types: ['chats', 'assets', 'documents'],
          limit: maxResults,
          threshold: semanticThreshold,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data: SemanticSearchResponse = await response.json();
      
      // Convert semantic results to app format
      const semanticResults = convertSemanticResults(data.results);
      
      // Merge local and semantic results
      // Local results (pages/spaces) come first, then semantic results
      // Dedupe by id
      const seenIds = new Set<string>();
      const mergedResults: SearchResult[] = [];
      
      // Add local results first (they're fast and reliable)
      for (const result of localResults) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          mergedResults.push(result);
        }
      }
      
      // Add semantic results, sorted by similarity
      const sortedSemantic = semanticResults.sort(
        (a, b) => (b.similarity || 0) - (a.similarity || 0)
      );
      
      for (const result of sortedSemantic) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          mergedResults.push(result);
        }
      }
      
      setResults(mergedResults.slice(0, maxResults));
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Search error:', err);
      setError('Search failed');
      // Fall back to local results on error
      const localResults = searchLocalResults(
        trimmedQuery, 
        staticData.pages, 
        staticData.spaces
      );
      setResults(localResults.slice(0, maxResults));
    } finally {
      setIsLoading(false);
    }
  }, [defaultResults, staticData, maxResults, semanticThreshold]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs, performSearch]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (!newQuery.trim()) {
      setResults(defaultResults);
    }
  }, [defaultResults]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    recentChats,
    search,
    clearResults,
  };
}

// ===========================================
// Utility: Group results by type
// ===========================================

export interface GroupedResults {
  pages: PageResult[];
  actions: PageResult[];
  chats: ChatResult[];
  logos: AssetResult[];
  images: AssetResult[];
  illustrations: AssetResult[];
  spaces: SpaceResult[];
  documents: DocumentResult[];
}

export function groupResultsByType(results: SearchResult[]): GroupedResults {
  return {
    pages: results.filter((r): r is PageResult => r.type === 'page'),
    actions: results.filter((r): r is PageResult => r.type === 'action'),
    chats: results.filter((r): r is ChatResult => r.type === 'chat'),
    logos: results.filter((r): r is AssetResult => r.type === 'logo'),
    images: results.filter((r): r is AssetResult => r.type === 'image'),
    illustrations: results.filter((r): r is AssetResult => r.type === 'illustration'),
    spaces: results.filter((r): r is SpaceResult => r.type === 'space'),
    documents: results.filter((r): r is DocumentResult => r.type === 'document'),
  };
}
