'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Globe,
  Hexagon,
  Rss,
  ArrowRight,
  MoreHorizontal,
  FolderPlus,
  Bookmark,
  Copy,
  Check,
  Palette,
  Type,
  BookOpen,
  Camera,
  Fingerprint,
  MessageSquare,
  PenTool,
  MessageCircle,
  Layers,
  Shapes,
  Image as ImageIcon,
  LucideIcon,
} from 'lucide-react';
import { useSpaces } from '@/hooks/useSpaces';
import { useChatContext } from '@/lib/chat-context';

// Map icon names to components (for brand resources)
const ICON_MAP: Record<string, LucideIcon> = {
  Hexagon,
  Palette,
  Type,
  BookOpen,
  Camera,
  Fingerprint,
  MessageSquare,
  PenTool,
  MessageCircle,
  Layers,
  Shapes,
  Image: ImageIcon,
};

// Link types
export type LinkType = 'brand' | 'web' | 'news';

export interface LinkCardData {
  id: string;
  url: string;
  title: string;
  description?: string;
  domain: string;
  favicon?: string;
  type: LinkType;
  category?: string;
  citationIndex?: number;
  /** Icon name for brand resources (maps to Lucide icons) */
  iconName?: string;
}

// Category display colors
const CATEGORY_COLORS: Record<string, string> = {
  'design-ux': 'text-blue-400',
  'branding': 'text-purple-400',
  'ai-creative': 'text-emerald-400',
  'social-trends': 'text-pink-400',
  'general-tech': 'text-sky-400',
  'startup-business': 'text-amber-400',
};

interface LinkCardProps {
  link: LinkCardData;
  variant?: 'grid' | 'list';
  className?: string;
}

/**
 * Get a better display title for links
 * Handles cases like YouTube where title might be generic
 */
function getDisplayTitle(link: LinkCardData): string {
  const { title, domain, url } = link;
  
  // If title is missing or too generic, try to extract from URL
  const genericTitles = ['watch', 'video', 'page', 'home', 'index', ''];
  const normalizedTitle = title.toLowerCase().replace(/\s*-\s*[a-z]+\.[a-z]+$/i, '').trim();
  
  if (!title || genericTitles.includes(normalizedTitle)) {
    // Try to extract meaningful info from URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // For YouTube, try to get video ID or meaningful path
      if (domain.includes('youtube')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `YouTube Video (${videoId.substring(0, 8)}...)`;
        }
        if (pathParts.length > 0) {
          return `YouTube: ${pathParts[pathParts.length - 1].replace(/-/g, ' ')}`;
        }
      }
      
      // Generic URL-based title
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        return lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]+$/, '') // Remove file extension
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    } catch {
      // Fall through to domain
    }
    
    return domain;
  }
  
  return title;
}

/**
 * LinkCard - A card component for displaying links in grid or list view
 */
export function LinkCard({
  link,
  variant = 'grid',
  className = '',
}: LinkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedToSpace, setSavedToSpace] = useState<string | null>(null);
  
  const { spaces, addLink } = useSpaces();
  const { projects, currentProject } = useChatContext();

  // Get display title with fallback logic
  const displayTitle = useMemo(() => getDisplayTitle(link), [link]);

  // Extract domain for display
  const displayDomain = useMemo(() => {
    try {
      const url = new URL(link.url);
      return url.hostname.replace('www.', '');
    } catch {
      return link.domain;
    }
  }, [link.url, link.domain]);

  // Get icon component for brand resources
  const BrandIcon = useMemo(() => {
    if (link.type === 'brand' && link.iconName) {
      return ICON_MAP[link.iconName] || Hexagon;
    }
    return null;
  }, [link.type, link.iconName]);

  // Type-specific fallback icon
  const FallbackIcon = useMemo(() => {
    switch (link.type) {
      case 'brand':
        return Hexagon;
      case 'news':
        return Rss;
      default:
        return Globe;
    }
  }, [link.type]);

  // Type-specific color
  const typeColor = useMemo(() => {
    switch (link.type) {
      case 'brand':
        return 'text-[var(--fg-brand-primary)]';
      case 'news':
        return 'text-amber-500';
      default:
        return 'text-[var(--fg-quaternary)]';
    }
  }, [link.type]);

  // Is this an internal (brand) link?
  const isInternal = link.type === 'brand' && !link.url.startsWith('http');

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1500);
  };

  // Handle save to space
  const handleSaveToSpace = (spaceId: string, spaceTitle: string) => {
    addLink(spaceId, {
      url: link.url,
      title: displayTitle,
      description: link.description,
    });
    setSavedToSpace(spaceTitle);
    setTimeout(() => {
      setSavedToSpace(null);
      setMenuOpen(false);
    }, 1500);
  };

  // Grid variant - compact card with fixed height
  if (variant === 'grid') {
    const CardWrapper = isInternal ? Link : 'a';
    const cardProps = isInternal
      ? { href: link.url }
      : { href: link.url, target: '_blank', rel: 'noopener noreferrer' };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group relative h-full ${className}`}
      >
        <CardWrapper
          {...cardProps}
          className="
            flex flex-col h-full min-h-[120px] p-3 rounded-xl
            bg-[var(--bg-secondary)]/30
            border border-[var(--border-primary)]/40
            hover:bg-[var(--bg-secondary)]/60 hover:border-[var(--border-primary)]
            transition-all duration-150
          "
        >
          {/* Top row: icon only */}
          <div className="flex items-start justify-between mb-2">
            {/* Favicon/Icon */}
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {link.type === 'brand' && BrandIcon ? (
                <BrandIcon className={`w-4 h-4 ${typeColor}`} />
              ) : link.favicon ? (
                <>
                  <img
                    src={link.favicon}
                    alt=""
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                      if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                    }}
                  />
                  <FallbackIcon className={`fallback-icon hidden w-4 h-4 ${typeColor}`} />
                </>
              ) : (
                <FallbackIcon className={`w-4 h-4 ${typeColor}`} />
              )}
            </div>

            {/* Type badge - top right */}
            <span className={`
              text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded
              ${link.type === 'brand' 
                ? 'bg-[var(--bg-brand-solid)]/10 text-[var(--fg-brand-primary)]'
                : link.type === 'news'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-[var(--bg-tertiary)]/50 text-[var(--fg-quaternary)]'
              }
            `}>
              {link.type}
            </span>
          </div>

          {/* Title - flex-grow to push domain to bottom */}
          <h3 className="text-[13px] font-medium text-[var(--fg-primary)] line-clamp-2 leading-snug flex-grow">
            {displayTitle}
          </h3>

          {/* Domain + citation number - always at bottom */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] text-[var(--fg-quaternary)] truncate">
              {displayDomain}
            </span>
            {link.citationIndex !== undefined && (
              <span className="text-[9px] text-[var(--fg-quinary)]">
                [{link.citationIndex}]
              </span>
            )}
          </div>
        </CardWrapper>

        {/* Overflow menu - bottom right corner */}
        <div className="absolute bottom-2 right-2 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className={`
                p-1.5 rounded-md transition-all duration-150
                ${menuOpen 
                  ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
                  : 'opacity-0 group-hover:opacity-100 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12 }}
                    onClick={(e) => e.preventDefault()}
                    className="
                      absolute right-0 bottom-full mb-1 z-50
                      w-48 py-1
                      bg-[var(--bg-secondary)] border border-[var(--border-primary)]
                      rounded-lg shadow-xl
                    "
                  >
                    {/* Add to Space */}
                    <div className="px-2 py-1">
                      <p className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider px-2 mb-1">
                        Add to Space
                      </p>
                      {spaces.length === 0 ? (
                        <p className="text-xs text-[var(--fg-tertiary)] px-2 py-1">No spaces yet</p>
                      ) : (
                        <div className="max-h-32 overflow-y-auto">
                          {spaces.slice(0, 5).map((space) => (
                            <button
                              key={space.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSaveToSpace(space.id, space.title);
                              }}
                              className="
                                w-full flex items-center gap-2 px-2 py-1.5
                                text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]
                                hover:bg-[var(--bg-tertiary)] rounded-md
                                transition-colors
                              "
                            >
                              <span className="text-sm">{space.icon || '📁'}</span>
                              <span className="truncate">{space.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-[var(--border-primary)] my-1" />

                    {/* Add to Project */}
                    {projects.length > 0 && (
                      <>
                        <div className="px-2 py-1">
                          <p className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider px-2 mb-1">
                            Add to Project
                          </p>
                          <div className="max-h-24 overflow-y-auto">
                            {projects.slice(0, 3).map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // TODO: Implement add to project
                                  setMenuOpen(false);
                                }}
                                className="
                                  w-full flex items-center gap-2 px-2 py-1.5
                                  text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]
                                  hover:bg-[var(--bg-tertiary)] rounded-md
                                  transition-colors
                                "
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span className="truncate">{project.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="h-px bg-[var(--border-primary)] my-1" />
                      </>
                    )}

                    {/* Copy link */}
                    <div className="px-2 py-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopyLink();
                        }}
                        className="
                          w-full flex items-center gap-2 px-2 py-1.5
                          text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]
                          hover:bg-[var(--bg-tertiary)] rounded-md
                          transition-colors
                        "
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy link</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Success feedback */}
                    {savedToSpace && (
                      <div className="px-4 py-2 text-xs text-emerald-500 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" />
                        Saved to {savedToSpace}
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  // List variant - horizontal row
  const ListWrapper = isInternal ? Link : 'a';
  const listProps = isInternal
    ? { href: link.url }
    : { href: link.url, target: '_blank', rel: 'noopener noreferrer' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group relative ${className}`}
    >
      <ListWrapper
        {...listProps}
        className="
          flex items-center gap-3 px-3 py-2.5
          rounded-lg hover:bg-[var(--bg-tertiary)]/50
          transition-colors duration-100
        "
      >
        {/* Favicon/Icon */}
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {link.type === 'brand' && BrandIcon ? (
            <BrandIcon className={`w-4 h-4 ${typeColor}`} />
          ) : link.favicon ? (
            <>
              <img
                src={link.favicon}
                alt=""
                className="w-4 h-4 rounded-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                }}
              />
              <FallbackIcon className={`fallback-icon hidden w-4 h-4 ${typeColor}`} />
            </>
          ) : (
            <FallbackIcon className={`w-4 h-4 ${typeColor}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors truncate">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[var(--fg-quaternary)] truncate">
              {displayDomain}
            </span>
            {link.category && CATEGORY_COLORS[link.category] && (
              <span className={`text-[9px] ${CATEGORY_COLORS[link.category]}`}>
                {link.category.replace('-', ' ')}
              </span>
            )}
            {link.citationIndex !== undefined && (
              <span className="text-[9px] text-[var(--fg-quinary)]">
                [{link.citationIndex}]
              </span>
            )}
          </div>
        </div>

        {/* Type badge */}
        <span className={`
          text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0
          ${link.type === 'brand' 
            ? 'bg-[var(--bg-brand-solid)]/10 text-[var(--fg-brand-primary)]'
            : link.type === 'news'
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-[var(--bg-tertiary)]/50 text-[var(--fg-quaternary)]'
          }
        `}>
          {link.type}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Overflow menu */}
          <div 
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onClick={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          
          {isInternal ? (
            <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          ) : (
            <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          )}
        </div>
      </ListWrapper>

      {/* List view dropdown menu - similar to grid but positioned differently */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="
                absolute right-12 top-0 z-50
                w-48 py-1
                bg-[var(--bg-secondary)] border border-[var(--border-primary)]
                rounded-lg shadow-xl
              "
            >
              {/* Same menu content as grid */}
              <div className="px-2 py-1">
                <p className="text-[10px] font-medium text-[var(--fg-quaternary)] uppercase tracking-wider px-2 mb-1">
                  Add to Space
                </p>
                {spaces.length === 0 ? (
                  <p className="text-xs text-[var(--fg-tertiary)] px-2 py-1">No spaces yet</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto">
                    {spaces.slice(0, 5).map((space) => (
                      <button
                        key={space.id}
                        type="button"
                        onClick={() => handleSaveToSpace(space.id, space.title)}
                        className="
                          w-full flex items-center gap-2 px-2 py-1.5
                          text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]
                          hover:bg-[var(--bg-tertiary)] rounded-md
                          transition-colors
                        "
                      >
                        <span className="text-sm">{space.icon || '📁'}</span>
                        <span className="truncate">{space.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-px bg-[var(--border-primary)] my-1" />
              <div className="px-2 py-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="
                    w-full flex items-center gap-2 px-2 py-1.5
                    text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]
                    hover:bg-[var(--bg-tertiary)] rounded-md
                    transition-colors
                  "
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * LinkCardSkeleton - Loading state for LinkCard
 */
export function LinkCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  if (variant === 'grid') {
    return (
      <div className="h-full min-h-[120px] p-3 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40 animate-pulse flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)]" />
          <div className="w-10 h-4 rounded bg-[var(--bg-tertiary)]" />
        </div>
        <div className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)] mb-1 flex-grow" />
        <div className="h-3 w-1/2 rounded bg-[var(--bg-tertiary)] mt-auto" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
      <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)]" />
      <div className="flex-1">
        <div className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)] mb-1" />
        <div className="h-3 w-1/3 rounded bg-[var(--bg-tertiary)]" />
      </div>
    </div>
  );
}
