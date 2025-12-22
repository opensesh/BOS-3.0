'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Layers } from 'lucide-react';

interface SpaceReferenceCardProps {
  spaceTitle: string;
  spaceSlug: string;
  spaceIcon?: string;
  discussionTitle?: string;
  onNavigate?: () => void;
}

/**
 * Reference card shown at top of space chat responses
 * Links back to the parent space
 */
export function SpaceReferenceCard({
  spaceTitle,
  spaceSlug,
  spaceIcon,
  discussionTitle,
  onNavigate,
}: SpaceReferenceCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      router.push(`/spaces/${spaceSlug}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-all group text-left"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-brand-primary)] flex items-center justify-center flex-shrink-0">
        {spaceIcon ? (
          <span className="text-lg">{spaceIcon}</span>
        ) : (
          <Layers className="w-5 h-5 text-[var(--fg-brand-primary)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--fg-tertiary)] mb-0.5">
          {discussionTitle ? 'Discussion in' : 'Chat in space'}
        </p>
        <p className="text-sm font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-1">
          {spaceTitle}
        </p>
      </div>

      {/* Arrow */}
      <ArrowUpRight className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors flex-shrink-0" />
    </button>
  );
}

/**
 * Recent discussion card shown in the space page
 */
interface DiscussionCardProps {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  updatedAt: string;
  spaceSlug: string;
  onClick?: () => void;
}

export function DiscussionCard({
  id,
  title,
  preview,
  messageCount,
  updatedAt,
  spaceSlug,
  onClick,
}: DiscussionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/spaces/${spaceSlug}/chat/${id}`);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return updatedAt;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors line-clamp-1 mb-1">
            {title}
          </h3>
          {preview && (
            <p className="text-sm text-[var(--fg-tertiary)] line-clamp-2 mb-2">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-[var(--fg-tertiary)]">
            <span>{messageCount} messages</span>
            <span>•</span>
            <span>{formatTime(updatedAt)}</span>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
