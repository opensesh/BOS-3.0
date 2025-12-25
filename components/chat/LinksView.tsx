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
      <div className="flex items-center gap-2 mb-6">
        <LinkIcon className="w-4 h-4 text-[var(--fg-tertiary)]" />
        <span className="text-sm text-[var(--fg-tertiary)]">
          {totalCount} source{totalCount !== 1 ? 's' : ''} referenced
        </span>
      </div>

      {/* Brand Context Section */}
      {hasBrandResources && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Hexagon className="w-4 h-4 text-[var(--fg-brand-primary)]" />
            <span className="text-xs font-medium text-[var(--fg-brand-primary)] uppercase tracking-wider">
              Brand Context
            </span>
            <span className="text-xs text-[var(--fg-tertiary)]/50 ml-auto">
              {resourceCards.length}
            </span>
          </div>
          <div className="space-y-2">
            {resourceCards.map((card, idx) => (
              <Link
                key={`brand-${idx}`}
                href={card.href}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)]/20 hover:bg-[var(--bg-secondary)]/40 transition-all duration-200 group border border-[var(--border-secondary)]/50"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-brand-primary)]/50 flex items-center justify-center flex-shrink-0">
                  <Hexagon className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-[14px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[12px] text-[var(--fg-tertiary)]/70 mt-1 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-2 translate-x-0 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discover/News Sources Section */}
      {hasDiscoverSources && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
              News Sources
            </span>
            <span className="text-xs text-[var(--fg-tertiary)]/50 ml-auto">
              {discoverSources.length}
            </span>
          </div>
          <div className="space-y-2">
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
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)]/20 hover:bg-cyan-500/10 transition-all duration-200 group border border-[var(--border-secondary)]/50"
                >
                  {/* Icon with category color */}
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Rss className="w-5 h-5 text-cyan-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Title */}
                    <h3 className="text-[14px] font-medium text-[var(--fg-primary)] group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                      {source.title || source.name}
                    </h3>

                    {/* Source name and category */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-[var(--fg-tertiary)]/60">
                        {source.name}
                      </p>
                      {categoryConfig && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)]/50 ${categoryConfig.color}`}>
                          {categoryConfig.label}
                        </span>
                      )}
                    </div>

                    {/* Published time */}
                    {source.publishedAt && (
                      <p className="text-[10px] text-[var(--fg-tertiary)]/40 mt-1">
                        {source.publishedAt}
                      </p>
                    )}
                  </div>

                  {/* External link icon */}
                  <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-2" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Web Citations Section */}
      {hasWebSources && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[var(--fg-tertiary)]/60" />
            <span className="text-xs font-medium text-[var(--fg-tertiary)]/80 uppercase tracking-wider">
              Web Citations
            </span>
            <span className="text-xs text-[var(--fg-tertiary)]/50 ml-auto">
              {webSources.length}
            </span>
          </div>
          <div className="space-y-2">
            {webSources.map((source, idx) => (
              <a
                key={source.id || idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)]/20 hover:bg-[var(--bg-secondary)]/40 transition-all duration-200 group border border-[var(--border-secondary)]/50"
              >
                {/* Favicon */}
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)]/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {source.favicon ? (
                    <img
                      src={source.favicon}
                      alt=""
                      className="w-5 h-5 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Globe className={`w-5 h-5 text-[var(--fg-tertiary)]/50 ${source.favicon ? 'hidden' : ''}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* Title */}
                  <h3 className="text-[14px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-2 leading-snug">
                    {source.title && source.title !== source.name ? source.title : `Article from ${source.name}`}
                  </h3>

                  {/* Snippet */}
                  {source.snippet && (
                    <p className="text-[12px] text-[var(--fg-secondary)]/70 mt-1 line-clamp-2 leading-relaxed">
                      {source.snippet}
                    </p>
                  )}

                  {/* Source site name and citation index */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-[var(--fg-tertiary)]/50 truncate">
                      {source.name}
                    </span>
                    <span className="text-[10px] text-[var(--fg-tertiary)]/30 bg-[var(--bg-secondary)]/50 px-1.5 py-0.5 rounded">
                      [{idx + 1}]
                    </span>
                  </div>
                </div>

                {/* External link icon */}
                <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
