'use client';

import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import Image from 'next/image';
import { SourceInfo } from './AnswerView';

interface SourcePopoverProps {
  sources: SourceInfo[];
  position?: 'above' | 'below';
}

export function SourcePopover({ sources, position = 'above' }: SourcePopoverProps) {
  if (sources.length === 0) return null;

  const positionClasses = position === 'above' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';

  // Using span-based elements to avoid hydration errors when rendered inside <p> tags
  return (
    <span className={`absolute left-0 ${positionClasses} w-72 bg-[var(--bg-secondary)] rounded-xl shadow-2xl z-50 overflow-hidden block`}>
      {/* Header */}
      <span className="px-3 py-2.5 flex items-center gap-2 bg-[var(--bg-primary)]/30">
        <Globe className="w-3.5 h-3.5 text-[var(--fg-tertiary)]/50" />
        <span className="text-[11px] font-medium text-[var(--fg-tertiary)]/60 uppercase tracking-wider">
          Citations
        </span>
        <span className="text-[10px] text-[var(--fg-tertiary)]/40 ml-auto">
          {sources.length}
        </span>
      </span>

      {/* Sources list */}
      <span className="max-h-64 overflow-y-auto block p-1.5">
        {sources.map((source, idx) => (
          <SourceItem key={source.id || idx} source={source} />
        ))}
      </span>
    </span>
  );
}

function SourceItem({ source }: { source: SourceInfo }) {
  // Get a display title - prefer extracted title, fallback to site name
  const displayTitle = source.title && source.title !== source.name 
    ? source.title 
    : `Article from ${source.name}`;
  
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--bg-primary)]/50 transition-all duration-200 group"
    >
      {/* Favicon */}
      <span className="flex-shrink-0">
        <span className="w-8 h-8 rounded-lg bg-[var(--bg-primary)]/50 flex items-center justify-center overflow-hidden">
          {source.favicon ? (
            <Image
              src={source.favicon}
              alt=""
              width={16}
              height={16}
              className="w-4 h-4 rounded"
              unoptimized
            />
          ) : (
            <Globe className="w-4 h-4 text-[var(--fg-tertiary)]/50" />
          )}
        </span>
      </span>

      {/* Content */}
      <span className="flex-1 min-w-0 flex flex-col pt-0.5">
        <span className="text-[13px] font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-2">
          {displayTitle}
        </span>
        {/* Show snippet if available */}
        {source.snippet && (
          <span className="text-[11px] text-[var(--fg-secondary)]/60 mt-0.5 line-clamp-1">
            {source.snippet}
          </span>
        )}
        <span className="text-[10px] text-[var(--fg-tertiary)]/50 mt-0.5 truncate">
          {source.name}
        </span>
      </span>

      {/* External link icon */}
      <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)]/30 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1" />
    </a>
  );
}


