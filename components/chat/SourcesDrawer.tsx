'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { X, Globe, ExternalLink, Hexagon, ArrowRight, Compass, Rss } from 'lucide-react';
import { SourceInfo } from './AnswerView';
import { BrandResourceCardProps } from './BrandResourceCard';

interface SourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

export function SourcesDrawer({ isOpen, onClose, sources, resourceCards = [] }: SourcesDrawerProps) {
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

  if (!isOpen) return null;

  const totalCount = sources.length + resourceCards.length;
  const hasDiscoverSources = discoverSources.length > 0;
  const hasWebSources = webSources.length > 0;
  const hasBrandResources = resourceCards.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-[var(--bg-primary)] border-l border-[var(--border-primary)] z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--fg-tertiary)]" />
            <h2 className="text-[15px] font-semibold text-[var(--fg-primary)]">
              {totalCount} {totalCount === 1 ? 'source' : 'sources'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto">
          {/* Brand Resources Section */}
          {hasBrandResources && (
            <div className="border-b border-[var(--border-primary)]/50">
              <div className="px-5 py-3 bg-[var(--bg-brand-primary)]">
                <div className="flex items-center gap-2">
                  <Hexagon className="w-4 h-4 text-[var(--fg-brand-primary)]" />
                  <span className="text-xs font-semibold text-[var(--fg-brand-primary)] uppercase tracking-wider">
                    Brand Resources
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--border-primary)]/50">
                {resourceCards.map((card, idx) => (
                  <Link
                    key={`brand-${idx}`}
                    href={card.href}
                    onClick={onClose}
                    className="block px-5 py-4 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-brand-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Hexagon className="w-3.5 h-3.5 text-[var(--fg-brand-primary)]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-[13px] text-[var(--fg-tertiary)] mt-0.5">
                          {card.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-[var(--fg-brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discover Sources Section */}
          {hasDiscoverSources && (
            <div className="border-b border-[var(--border-primary)]/50">
              <div className="px-5 py-3 bg-cyan-500/5">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    Your News Sources
                  </span>
                  <span className="text-[10px] text-[var(--fg-tertiary)] ml-auto">
                    RSS Feeds
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--border-primary)]/50">
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
                      className="block px-5 py-4 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon with category color */}
                        <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Rss className="w-3.5 h-3.5 text-cyan-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Source name and category */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs text-[var(--fg-tertiary)]">
                              {source.name}
                            </p>
                            {categoryConfig && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)] ${categoryConfig.color}`}>
                                {categoryConfig.label}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-[14px] font-medium text-[var(--fg-primary)] group-hover:text-cyan-400 transition-colors line-clamp-2">
                            {source.title || source.name}
                          </h3>

                          {/* Snippet */}
                          {source.snippet && (
                            <p className="text-[13px] text-[var(--fg-tertiary)] mt-1 line-clamp-2">
                              {source.snippet}
                            </p>
                          )}

                          {/* Published time */}
                          {source.publishedAt && (
                            <p className="text-[11px] text-[var(--fg-tertiary)]/60 mt-1.5">
                              {source.publishedAt}
                            </p>
                          )}
                        </div>

                        {/* External link icon */}
                        <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Web Sources Section */}
          {hasWebSources && (
            <div>
              {(hasBrandResources || hasDiscoverSources) && (
                <div className="px-5 py-3 bg-[var(--bg-secondary)]/30">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--fg-tertiary)]" />
                    <span className="text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
                      Web Sources
                    </span>
                    <span className="text-[10px] text-[var(--fg-tertiary)]/60 ml-auto">
                      Internet Search
                    </span>
                  </div>
                </div>
              )}
              <div className="divide-y divide-[var(--border-primary)]/50">
                {webSources.map((source, idx) => (
                  <a
                    key={source.id || idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-4 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Favicon */}
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {source.favicon ? (
                          <img
                            src={source.favicon}
                            alt=""
                            className="w-4 h-4 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
                        )}
                        <Globe className="w-3.5 h-3.5 text-[var(--fg-tertiary)] hidden" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Source name */}
                        <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">
                          {source.name}
                        </p>

                        {/* Title */}
                        <h3 className="text-[14px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-2">
                          {source.title || source.name}
                        </h3>

                        {/* Snippet */}
                        {source.snippet && (
                          <p className="text-[13px] text-[var(--fg-tertiary)] mt-1 line-clamp-2">
                            {source.snippet}
                          </p>
                        )}
                      </div>

                      {/* External link icon */}
                      <ExternalLink className="w-4 h-4 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

