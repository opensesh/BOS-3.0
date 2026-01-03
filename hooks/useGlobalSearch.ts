'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ASSET_MANIFEST, getLogos } from '@/lib/brand-knowledge/asset-manifest';
import { SPACES, EXAMPLE_SPACES } from '@/lib/mock-data';
import { chatService, ChatSession } from '@/lib/supabase/chat-service';
import type { AssetEntry } from '@/lib/brand-knowledge/types';
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
  | 'space';

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
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

export type SearchResult = PageResult | ChatResult | AssetResult | SpaceResult;

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
// Asset Search Helpers
// ===========================================

function createAssetResults(assets: AssetEntry[], type: 'logo' | 'image' | 'illustration'): AssetResult[] {
  return assets.map((asset, index) => ({
    id: `${type}-${index}`,
    type,
    title: formatAssetTitle(asset),
    subtitle: `${asset.category} › ${asset.variant || 'default'}`,
    href: asset.path, // Direct link to view/download
    thumbnailPath: asset.path,
    assetCategory: asset.category,
    variant: asset.variant,
    keywords: generateAssetKeywords(asset),
  }));
}

function formatAssetTitle(asset: AssetEntry): string {
  // Clean up the filename for display
  let name = asset.filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Title case
  
  // For logos, make it more descriptive
  if (asset.category === 'logos' && asset.variant) {
    const parts = asset.variant.split('-');
    const format = parts[0];
    const color = parts.slice(1).join(' ');
    name = `${format.charAt(0).toUpperCase() + format.slice(1)} Logo${color ? ` (${color})` : ''}`;
  }
  
  return name;
}

function generateAssetKeywords(asset: AssetEntry): string[] {
  const keywords: string[] = [asset.category];
  
  if (asset.variant) {
    keywords.push(...asset.variant.split('-'));
  }
  
  if (asset.description) {
    keywords.push(...asset.description.toLowerCase().split(' '));
  }
  
  // Add filename parts as keywords
  const filenameParts = asset.filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .split(/[-_\s]+/);
  keywords.push(...filenameParts);
  
  return [...new Set(keywords)]; // Remove duplicates
}

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
// Chat Search Helpers
// ===========================================

function createChatResults(sessions: ChatSession[]): ChatResult[] {
  return sessions.map(session => ({
    id: `chat-${session.id}`,
    type: 'chat',
    title: session.title,
    subtitle: formatChatSubtitle(session),
    // Store the actual chat ID in href for loading via context
    href: session.id, // Will be used to load session via context
    preview: session.preview || undefined,
    messageCount: session.messages.length,
    updatedAt: session.updated_at,
    keywords: generateChatKeywords(session),
  }));
}

function formatChatSubtitle(session: ChatSession): string {
  const messageCount = session.messages.length;
  const date = new Date(session.updated_at);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let timeAgo: string;
  if (diffHours < 1) {
    timeAgo = 'Just now';
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays}d ago`;
  } else {
    timeAgo = date.toLocaleDateString();
  }
  
  return `${messageCount} messages • ${timeAgo}`;
}

function generateChatKeywords(session: ChatSession): string[] {
  const keywords: string[] = ['chat', 'conversation', 'history'];
  
  // Add words from title
  keywords.push(...session.title.toLowerCase().split(/\s+/));
  
  // Add words from preview
  if (session.preview) {
    keywords.push(...session.preview.toLowerCase().split(/\s+/).slice(0, 10));
  }
  
  // Add words from first few messages
  session.messages.slice(0, 3).forEach(msg => {
    keywords.push(...msg.content.toLowerCase().split(/\s+/).slice(0, 5));
  });
  
  return [...new Set(keywords)];
}

// ===========================================
// Main Hook
// ===========================================

interface UseGlobalSearchOptions {
  debounceMs?: number;
  maxResults?: number;
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
  const { debounceMs = 150, maxResults = 50 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);

  // Load chat sessions on mount
  useEffect(() => {
    let mounted = true;
    
    async function loadChats() {
      try {
        const sessions = await chatService.getSessions(30);
        if (mounted) {
          setChatSessions(sessions);
          setChatsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
        if (mounted) {
          setChatsLoaded(true);
        }
      }
    }
    
    loadChats();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Pre-compute all searchable data
  const allSearchableData = useMemo(() => {
    // Pages and actions
    const pages = [...navigationPages, ...quickActions];
    
    // Brand assets
    const logos = createAssetResults(getLogos(), 'logo');
    const images = createAssetResults(ASSET_MANIFEST.images.slice(0, 20), 'image'); // Limit images
    const illustrations = createAssetResults(ASSET_MANIFEST.illustrations, 'illustration');
    
    // Spaces
    const spaces = createSpaceResults([...SPACES, ...EXAMPLE_SPACES]);
    
    // Chats
    const chats = createChatResults(chatSessions);
    
    return {
      pages,
      logos,
      images,
      illustrations,
      spaces,
      chats,
    };
  }, [chatSessions]);

  // Recent chats for empty state
  const recentChats = useMemo(() => {
    return allSearchableData.chats.slice(0, 5);
  }, [allSearchableData.chats]);

  // Search function
  const performSearch = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    
    if (!trimmedQuery) {
      // Return default results when no query
      setResults([
        ...allSearchableData.pages.slice(0, 6),
        ...allSearchableData.chats.slice(0, 3),
      ]);
      return;
    }
    
    setIsLoading(true);
    
    // Score and filter results
    const scoredResults: Array<{ result: SearchResult; score: number }> = [];
    
    const scoreResult = (result: SearchResult): number => {
      let score = 0;
      const queryWords = trimmedQuery.split(/\s+/);
      
      // Title match (highest weight)
      const titleLower = result.title.toLowerCase();
      if (titleLower === trimmedQuery) {
        score += 100; // Exact match
      } else if (titleLower.startsWith(trimmedQuery)) {
        score += 80; // Starts with
      } else if (titleLower.includes(trimmedQuery)) {
        score += 60; // Contains
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
      
      // Type-specific boosts
      if (result.type === 'page') score += 5;
      if (result.type === 'chat') score += 3;
      if (result.type === 'logo') score += 2;
      
      return score;
    };
    
    // Search through all data
    const allResults = [
      ...allSearchableData.pages,
      ...allSearchableData.chats,
      ...allSearchableData.logos,
      ...allSearchableData.images,
      ...allSearchableData.illustrations,
      ...allSearchableData.spaces,
    ];
    
    for (const result of allResults) {
      const score = scoreResult(result);
      if (score > 0) {
        scoredResults.push({ result, score });
      }
    }
    
    // Sort by score and limit
    scoredResults.sort((a, b) => b.score - a.score);
    const finalResults = scoredResults.slice(0, maxResults).map(r => r.result);
    
    setResults(finalResults);
    setIsLoading(false);
  }, [allSearchableData, maxResults]);

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
      setResults([
        ...allSearchableData.pages.slice(0, 6),
        ...allSearchableData.chats.slice(0, 3),
      ]);
    }
  }, [allSearchableData]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
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
  };
}

