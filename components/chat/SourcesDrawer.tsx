'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Globe, ExternalLink, Hexagon, ArrowRight, Compass, Rss, Search } from 'lucide-react';
import { SourceInfo } from './AnswerView';
import { BrandResourceCardProps } from './BrandResourceCard';

interface SourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceInfo[];
  resourceCards?: BrandResourceCardProps[];
  query?: string;
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

export function SourcesDrawer({ isOpen, onClose, sources, resourceCards = [], query = '' }: SourcesDrawerProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted on client side for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  // Don't render until mounted
  if (!mounted) return null;

  const totalCount = sources.length + resourceCards.length;
  const hasDiscoverSources = discoverSources.length > 0;
  const hasWebSources = webSources.length > 0;
  const hasBrandResources = resourceCards.length > 0;
  const hasAnySources = hasDiscoverSources || hasWebSources || hasBrandResources;
  
  // Generate search query for external links
  const searchQuery = encodeURIComponent(query || 'related topics');

  // Animation variants for smooth slide-in/out
  const drawerVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.8,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 0.8,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { 
      opacity: [1, 0.8, 0.6, 0], // Keyframes: stay darker longer, then fade quickly
      transition: { 
        duration: 0.5,
        times: [0, 0.6, 0.85, 1], // Spend most time at higher opacity values
        ease: "easeOut",
      } 
    },
  };

  // Portal content to document.body to escape stacking context
  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - covers main content area only, excludes sidebar and header */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-14 bottom-0 left-0 lg:left-[var(--sidebar-width)] right-0 bg-black/40 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer - top-14 aligns with bottom of header */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-14 bottom-0 w-[400px] max-w-[90vw] bg-[var(--bg-primary)] z-[101] flex flex-col shadow-2xl"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-secondary)]">
          <h2 className="text-[15px] font-semibold text-[var(--fg-primary)]">
            Sources
            <span className="text-xs text-[var(--fg-tertiary)]/50 font-normal ml-2">
              {totalCount}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto">
          {/* Brand Context Section - internal knowledge that informed the response */}
          {hasBrandResources && (
            <div className="pt-4 pb-2">
              <div className="px-5 mb-3">
                <div className="flex items-center gap-2">
                  <Hexagon className="w-3.5 h-3.5 text-[var(--fg-tertiary)]/50" />
                  <span className="text-[11px] font-medium text-[var(--fg-tertiary)]/60 uppercase tracking-wider">
                    Brand Context
                  </span>
                </div>
              </div>
              <div className="px-3 space-y-1">
                {resourceCards.map((card, idx) => (
                  <Link
                    key={`brand-${idx}`}
                    href={card.href}
                    onClick={onClose}
                    className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-[var(--bg-secondary)]/30 transition-all duration-200 group"
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)]/50 flex items-center justify-center flex-shrink-0">
                      <Hexagon className="w-4 h-4 text-[var(--fg-tertiary)]/60" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="text-[13px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-primary)] transition-colors leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-[12px] text-[var(--fg-tertiary)]/50 mt-0.5 line-clamp-1">
                        {card.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-1 translate-x-0 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discover Sources Section */}
          {hasDiscoverSources && (
            <div className="pt-4 pb-2">
              <div className="px-5 mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">
                    News Sources
                  </span>
                </div>
              </div>
              <div className="px-3 space-y-1">
                {discoverSources.map((source, idx) => {
                  const categoryConfig = source.category 
                    ? CATEGORY_CONFIG[source.category] 
                    : null;
                  
                  return (
                    <a
                      key={`drawer-discover-${idx}-${source.id || source.url}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-cyan-500/5 transition-all duration-200 group"
                    >
                      {/* Icon with category color */}
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Rss className="w-4 h-4 text-cyan-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        {/* Title */}
                        <h3 className="text-[13px] font-medium text-[var(--fg-primary)] group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                          {source.title || source.name}
                        </h3>

                        {/* Source name and category */}
                        <div className="flex items-center gap-2 mt-1">
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
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-1" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Web Sources Section - actual citations from AI response */}
          {hasWebSources && (
            <div className="pt-4 pb-2">
              <div className="px-5 mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[var(--fg-tertiary)]/60" />
                  <span className="text-[11px] font-medium text-[var(--fg-tertiary)]/60 uppercase tracking-wider">
                    Citations
                  </span>
                  <span className="text-[10px] text-[var(--fg-tertiary)]/40 ml-auto">
                    {webSources.length}
                  </span>
                </div>
              </div>
              <div className="px-3 space-y-1">
                {webSources.map((source, idx) => (
                  <a
                    key={`drawer-web-${idx}-${source.id || source.url}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-[var(--bg-secondary)]/30 transition-all duration-200 group"
                  >
                    {/* Favicon */}
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)]/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                        <Globe className="w-4 h-4 text-[var(--fg-tertiary)]/50" />
                      )}
                      <Globe className="w-4 h-4 text-[var(--fg-tertiary)]/50 hidden" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* Title - use extracted title, fallback to site name */}
                      <h3 className="text-[13px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-2 leading-snug">
                        {source.title && source.title !== source.name ? source.title : `Article from ${source.name}`}
                      </h3>

                      {/* Snippet - show if available */}
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
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty state with search links */}
          {!hasAnySources && (
            <div className="px-5 py-12">
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
                <div className="space-y-2">
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
          )}
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render using portal to escape parent stacking context
  return createPortal(drawerContent, document.body);
}

