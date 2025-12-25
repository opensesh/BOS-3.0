'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SourceInfo } from './AnswerView';
import { SourcePopover } from './SourcePopover';
import { BrandSourcePopover, BrandSourceInfo } from './BrandSourcePopover';
import { BRAND_SOURCES } from '@/lib/brand-knowledge';

interface InlineCitationProps {
  sources: SourceInfo[];
  primarySource: string;
  additionalCount?: number;
}

export function InlineCitation({
  sources,
  primarySource,
  additionalCount = 0,
}: InlineCitationProps) {
  const router = useRouter();
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'above' | 'below'>('above');
  const containerRef = useRef<HTMLSpanElement>(null);

  // Check if primary source is a brand source
  const primarySourceData = sources[0];
  const isBrandSource = primarySourceData?.type === 'brand-doc' || primarySourceData?.type === 'asset';

  // Get the brand source details for navigation
  const getBrandSourceDetails = (sourceId: string) => {
    return BRAND_SOURCES[sourceId];
  };

  // Convert SourceInfo to BrandSourceInfo for brand sources
  const brandSources: BrandSourceInfo[] = sources
    .filter((s) => s.type === 'brand-doc' || s.type === 'asset')
    .map((s) => {
      const brandDetails = getBrandSourceDetails(s.id);
      return {
        id: s.id,
        name: s.name,
        type: s.type as 'brand-doc' | 'asset',
        title: s.title || s.name,
        path: s.path || s.url,
        snippet: s.snippet,
        thumbnail: s.thumbnail,
        href: brandDetails?.href,
        tab: brandDetails?.tab,
      };
    });

  // External sources for regular popover
  const externalSources = sources.filter((s) => !s.type || s.type === 'external');

  // Calculate popover position based on available space - be very conservative
  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Be very conservative - always show below if within 350px of top
    // This accounts for header (48px) + popover height (~280px) + comfortable margin
    const safeThreshold = 350;
    const spaceAbove = rect.top;
    const shouldShowBelow = spaceAbove < safeThreshold;
    
    setPopoverPosition(shouldShowBelow ? 'below' : 'above');
  }, []);

  // Recalculate position when showing popover
  useEffect(() => {
    if (showPopover) {
      calculatePosition();
    }
  }, [showPopover, calculatePosition]);

  // Handle click to navigate to the brand source page
  const handleClick = (e: React.MouseEvent) => {
    if (!isBrandSource) return;

    const primaryBrandSource = brandSources[0];
    if (primaryBrandSource?.href) {
      e.preventDefault();
      e.stopPropagation();

      // Build URL with tab param if applicable
      let url = primaryBrandSource.href;
      if (primaryBrandSource.tab) {
        url += `?tab=${primaryBrandSource.tab}`;
      }

      router.push(url);
    }
  };

  // Styling: brand colors for external sources to make them visible, subtle for brand sources
  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <span
        onClick={handleClick}
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 font-mono
          ${isBrandSource
            ? 'bg-[var(--bg-secondary)]/50 text-[var(--fg-tertiary)] hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--fg-primary)]'
            : 'bg-[var(--fg-brand-primary)]/15 text-[var(--fg-brand-primary)] hover:bg-[var(--fg-brand-primary)]/25'
          }
        `}
      >
        <span className="lowercase">{primarySource}</span>
        {additionalCount > 0 && (
          <span className={`text-[10px] ${isBrandSource ? 'opacity-60' : 'opacity-70'}`}>
            +{additionalCount}
          </span>
        )}
      </span>

      {/* Popover - use brand popover for brand sources, external popover for web sources */}
      {showPopover && sources.length > 0 && (
        isBrandSource && brandSources.length > 0 ? (
          <BrandSourcePopover sources={brandSources} position={popoverPosition} />
        ) : externalSources.length > 0 ? (
          <SourcePopover sources={externalSources} position={popoverPosition} />
        ) : null
      )}
    </span>
  );
}

