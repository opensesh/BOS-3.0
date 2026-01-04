'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  Globe, 
  Hexagon, 
  Rss, 
  Search,
  LinkIcon,
  ChevronDown,
  X,
  ArrowUpAZ,
  ArrowDownZA
} from 'lucide-react';
import { SourceInfo } from './AnswerView';
import { BrandResourceCardProps } from './BrandResourceCard';

interface LinksViewProps {
  query: string;
  sources: SourceInfo[];
  resourceCards?: BrandResourceCardProps[];
}

// Filter types
type FilterType = 'all' | 'brand' | 'web' | 'news';
type SortOrder = 'asc' | 'desc';

// Unified link item for filtering/sorting
interface UnifiedLink {
  id: string;
  title: string;
  domain: string;
  url: string;
  favicon?: string;
  type: FilterType;
  isInternal: boolean;
  originalData: SourceInfo | BrandResourceCardProps;
}

// Category display names and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  'design-ux': { label: 'Design & UX', color: 'text-blue-400' },
  'branding': { label: 'Branding', color: 'text-purple-400' },
  'ai-creative': { label: 'AI & Creative', color: 'text-emerald-400' },
  'social-trends': { label: 'Social Trends', color: 'text-pink-400' },
  'general-tech': { label: 'Tech', color: 'text-sky-400' },
  'startup-business': { label: 'Business', color: 'text-amber-400' },
};

// Filter pill configuration
const FILTER_CONFIG: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: LinkIcon },
  { id: 'brand', label: 'Brand', icon: Hexagon },
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'news', label: 'News', icon: Rss },
];

// Extract domain from URL
function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Compact Link Card Component
function LinkCard({ link }: { link: UnifiedLink }) {
  const Icon = link.type === 'brand' ? Hexagon : link.type === 'news' ? Rss : Globe;
  const iconColor = link.type === 'brand' 
    ? 'text-[var(--fg-brand-primary)]' 
    : 'text-[var(--fg-quaternary)]';

  const CardWrapper = link.isInternal ? Link : 'a';
  const linkProps = link.isInternal 
    ? { href: link.url }
    : { href: link.url, target: '_blank', rel: 'noopener noreferrer' };

  return (
    <CardWrapper
      {...linkProps}
      className="group flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] border border-[var(--border-tertiary)] hover:border-[var(--border-secondary)] transition-all duration-150 cursor-pointer min-h-[72px]"
      title={link.title}
    >
      {/* Top row: Favicon + Domain */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {link.favicon ? (
            <img
              src={link.favicon}
              alt=""
              className="w-4 h-4 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <Icon className={`w-4 h-4 ${iconColor} ${link.favicon ? 'hidden' : ''}`} />
        </div>
        <span className="text-[10px] text-[var(--fg-quaternary)] truncate flex-1">
          {link.domain}
        </span>
        <ExternalLink className="w-3 h-3 text-[var(--fg-quinary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      
      {/* Title */}
      <h3 className="text-[12px] leading-tight text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors line-clamp-2">
        {link.title}
      </h3>
    </CardWrapper>
  );
}

// Filter Toolbar Component
function FilterToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortOrder,
  onSortChange,
  counts,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  counts: Record<FilterType, number>;
}) {
  return (
    <div className="sticky top-0 z-10 bg-[var(--bg-primary)] pb-4 space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-quaternary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search links..."
          className="w-full pl-9 pr-8 py-2 text-[13px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--fg-primary)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:border-[var(--border-brand)] focus:ring-1 focus:ring-[var(--border-brand)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-3.5 h-3.5 text-[var(--fg-quaternary)]" />
          </button>
        )}
      </div>

      {/* Filter Pills + Sort */}
      <div className="flex items-center justify-between gap-3">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_CONFIG.map((filter) => {
            const isActive = activeFilter === filter.id;
            const count = counts[filter.id];
            const Icon = filter.icon;
            
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                disabled={count === 0 && filter.id !== 'all'}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] border border-[var(--border-brand)]' 
                    : 'bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] border border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-secondary)]'
                  }
                  ${count === 0 && filter.id !== 'all' ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                <Icon className="w-3 h-3" />
                <span>{filter.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-[var(--fg-brand-primary)]/70' : 'text-[var(--fg-quaternary)]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <button
          onClick={() => onSortChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-secondary)] transition-all duration-150 border border-transparent"
          title={sortOrder === 'asc' ? 'Sorted A to Z' : 'Sorted Z to A'}
        >
          {sortOrder === 'asc' ? (
            <ArrowUpAZ className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownZA className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ 
  hasFilters, 
  searchQuery,
  onClearFilters,
  fallbackQuery 
}: { 
  hasFilters: boolean;
  searchQuery: string;
  onClearFilters: () => void;
  fallbackQuery: string;
}) {
  const encodedQuery = encodeURIComponent(fallbackQuery || 'related topics');

  if (hasFilters) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
          <Search className="w-5 h-5 text-[var(--fg-quaternary)]" />
        </div>
        <h3 className="text-[14px] font-medium text-[var(--fg-primary)] mb-1.5">
          No matches found
        </h3>
        <p className="text-[12px] text-[var(--fg-tertiary)] mb-4 max-w-[240px] mx-auto">
          {searchQuery 
            ? `No links match "${searchQuery}"`
            : 'No links match the current filter'}
        </p>
        <button
          onClick={onClearFilters}
          className="text-[12px] text-[var(--fg-brand-primary)] hover:underline"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)]/30 flex items-center justify-center mx-auto mb-5">
          <Search className="w-6 h-6 text-[var(--fg-tertiary)]/50" />
        </div>
        <h3 className="text-[15px] font-medium text-[var(--fg-primary)] mb-2">
          No sources available
        </h3>
        <p className="text-[13px] text-[var(--fg-tertiary)]/70 mb-6 max-w-[280px] mx-auto">
          This response was generated from AI knowledge. Explore more on the web:
        </p>
        <div className="space-y-2 max-w-sm mx-auto">
          <a
            href={`https://www.google.com/search?q=${encodedQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-200 group"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            <span className="text-[13px] text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors flex-1 text-left font-medium">
              Search on Google
            </span>
            <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)]/40 group-hover:text-[var(--fg-brand-primary)] transition-colors" />
          </a>
          <a
            href={`https://www.perplexity.ai/search?q=${encodedQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-200 group"
          >
            <Globe className="w-4 h-4 text-[var(--fg-tertiary)]/60" />
            <span className="text-[13px] text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors flex-1 text-left font-medium">
              Search on Perplexity
            </span>
            <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)]/40 group-hover:text-[var(--fg-brand-primary)] transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function LinksView({ query, sources, resourceCards = [] }: LinksViewProps) {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Convert all sources to unified format for easier filtering/sorting
  const unifiedLinks = useMemo(() => {
    const links: UnifiedLink[] = [];

    // Add brand resources
    resourceCards.forEach((card, idx) => {
      links.push({
        id: `brand-${idx}`,
        title: card.title,
        domain: 'Brand Hub',
        url: card.href,
        favicon: undefined,
        type: 'brand',
        isInternal: true,
        originalData: card,
      });
    });

    // Add sources
    sources.forEach((source, idx) => {
      const isNews = source.type === 'discover';
      links.push({
        id: source.id || `source-${idx}`,
        title: source.title || source.name,
        domain: getDomain(source.url),
        url: source.url,
        favicon: source.favicon,
        type: isNews ? 'news' : 'web',
        isInternal: false,
        originalData: source,
      });
    });

    return links;
  }, [sources, resourceCards]);

  // Calculate counts for each filter type
  const counts = useMemo(() => {
    const result: Record<FilterType, number> = {
      all: unifiedLinks.length,
      brand: 0,
      web: 0,
      news: 0,
    };

    unifiedLinks.forEach((link) => {
      result[link.type]++;
    });

    return result;
  }, [unifiedLinks]);

  // Filter and sort links
  const filteredLinks = useMemo(() => {
    let result = [...unifiedLinks];

    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter((link) => link.type === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.domain.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [unifiedLinks, activeFilter, searchQuery, sortOrder]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  const hasFilters = searchQuery.trim() !== '' || activeFilter !== 'all';
  const hasAnySources = unifiedLinks.length > 0;

  // If no sources at all, show empty state without toolbar
  if (!hasAnySources) {
    return (
      <EmptyState
        hasFilters={false}
        searchQuery=""
        onClearFilters={handleClearFilters}
        fallbackQuery={query}
      />
    );
  }

  return (
    <div className="py-4">
      {/* Header with count */}
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="w-4 h-4 text-[var(--fg-quaternary)]" />
        <span className="text-sm text-[var(--fg-quaternary)]">
          {unifiedLinks.length} source{unifiedLinks.length !== 1 ? 's' : ''} referenced
        </span>
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        counts={counts}
      />

      {/* Results count when filtered */}
      {hasFilters && filteredLinks.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-[var(--fg-tertiary)]">
            Showing {filteredLinks.length} of {unifiedLinks.length} links
          </span>
          <button
            onClick={handleClearFilters}
            className="text-[11px] text-[var(--fg-brand-primary)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid of cards */}
      {filteredLinks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredLinks.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      ) : (
        <EmptyState
          hasFilters={hasFilters}
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
          fallbackQuery={query}
        />
      )}
    </div>
  );
}
