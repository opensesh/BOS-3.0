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
    <span className={`absolute left-0 ${positionClasses} w-72 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]/50 shadow-xl z-50 overflow-hidden block`}>
      {/* Header */}
      <span className="px-3 py-2 border-b border-[var(--border-primary)]/30 flex">
        <span className="text-xs font-semibold text-[var(--fg-tertiary)]/80">
          Sources • {sources.length}
        </span>
      </span>

      {/* Sources list */}
      <span className="max-h-64 overflow-y-auto block">
        {sources.map((source, idx) => (
          <SourceItem key={source.id || idx} source={source} />
        ))}
      </span>
    </span>
  );
}

function SourceItem({ source }: { source: SourceInfo }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-3 py-2.5 hover:bg-[var(--bg-primary)] transition-colors group"
    >
      {/* Favicon */}
      <span className="flex-shrink-0 mt-0.5">
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
          <span className="w-4 h-4 rounded bg-[var(--bg-primary)] flex items-center justify-center">
            <Globe className="w-2.5 h-2.5 text-[var(--fg-tertiary)]" />
          </span>
        )}
      </span>

      {/* Content */}
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-2">
          {source.title || source.name}
        </span>
        <span className="text-xs text-[var(--fg-tertiary)] mt-0.5">
          {source.name}
        </span>
      </span>

      {/* External link icon */}
      <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
    </a>
  );
}


