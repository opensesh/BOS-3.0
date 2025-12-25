'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  Globe, 
  Hexagon, 
  ArrowRight, 
  Compass, 
  Rss, 
  Search,
  LinkIcon 
} from 'lucide-react';
import { SourceInfo } from './AnswerView';
import { BrandResourceCardProps } from './BrandResourceCard';

interface LinksViewProps {
  query: string;
  sources: SourceInfo[];
  resourceCards?: BrandResourceCardProps[];
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

export function LinksView({ query, sources, resourceCards = [] }: LinksViewProps) {
  // Separate sources by type
  const { discoverSources, webSources } = useMemo(() => {
    const discover: SourceInfo[] = [];
    const web: SourceInfo[] = [];
    
    sources.forEach(source => {
      if (source.type === 'discover') {
        discover.push(source);
      } else {
        web.push(source);
      }
    });
    
    return { discoverSources: discover, webSources: web };
  }, [sources]);

  const totalCount = sources.length + resourceCards.length;
  const hasDiscoverSources = discoverSources.length > 0;
  const hasWebSources = webSources.length > 0;
  const hasBrandResources = resourceCards.length > 0;
  const hasAnySources = hasDiscoverSources || hasWebSources || hasBrandResources;

  // Generate search query for external links
  const searchQuery = encodeURIComponent(query || 'related topics');

  if (!hasAnySources) {
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
              href={`https://www.google.com/search?q=${searchQuery}`}
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
              href={`https://www.perplexity.ai/search?q=${searchQuery}`}
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

  return (
    <div className="py-6">
      {/* Summary header */}
      <div className="flex items-center gap-2 mb-5">
        <LinkIcon className="w-4 h-4 text-[var(--fg-quaternary)]" />
        <span className="text-sm text-[var(--fg-quaternary)]">
          {totalCount} source{totalCount !== 1 ? 's' : ''} referenced
        </span>
      </div>

      {/* Brand Context Section */}
      {hasBrandResources && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Hexagon className="w-3.5 h-3.5 text-[var(--fg-brand-primary)]" />
            <span className="text-[10px] font-medium text-[var(--fg-brand-primary)] uppercase tracking-wider">
              Brand Context
            </span>
          </div>
          <div className="-mx-1">
            {resourceCards.map((card, idx) => (
              <Link
                key={`brand-${idx}`}
                href={card.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors duration-150 group"
              >
                {/* Icon */}
                <Hexagon className="w-4 h-4 text-[var(--fg-brand-primary)] flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors truncate">
                    {card.title}
                  </h3>
                  {card.description && (
                    <p className="text-[11px] text-[var(--fg-quaternary)] truncate mt-0.5">
                      {card.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discover/News Sources Section */}
      {hasDiscoverSources && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Compass className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
            <span className="text-[10px] font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              News Sources
            </span>
          </div>
          <div className="-mx-1">
            {discoverSources.map((source, idx) => {
              const categoryConfig = source.category 
                ? CATEGORY_CONFIG[source.category] 
                : null;
              
              return (
                <a
                  key={source.id || `discover-${idx}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors duration-150 group"
                >
                  {/* Icon */}
                  <Rss className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors truncate">
                      {source.title || source.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--fg-quaternary)] truncate">
                        {source.name}
                      </span>
                      {categoryConfig && (
                        <span className={`text-[9px] ${categoryConfig.color}`}>
                          {categoryConfig.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* External link icon */}
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Web Citations Section */}
      {hasWebSources && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Globe className="w-3.5 h-3.5 text-[var(--fg-quaternary)]" />
            <span className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider">
              Web Citations
            </span>
          </div>
          <div className="-mx-1">
            {webSources.map((source, idx) => (
              <a
                key={source.id || idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors duration-150 group"
              >
                {/* Favicon */}
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {source.favicon ? (
                    <img
                      src={source.favicon}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Globe className={`w-4 h-4 text-[var(--fg-quaternary)] ${source.favicon ? 'hidden' : ''}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors truncate">
                    {source.title && source.title !== source.name ? source.title : source.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[var(--fg-quaternary)] truncate">
                      {source.name}
                    </span>
                    <span className="text-[9px] text-[var(--fg-quinary)]">
                      [{idx + 1}]
                    </span>
                  </div>
                </div>

                {/* External link icon */}
                <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
