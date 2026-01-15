'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShortLinkTagColor } from '@/lib/supabase/types';

// Color definitions matching Dub's tag style
export const TAG_COLOR_CLASSES: Record<
  ShortLinkTagColor,
  { bg: string; text: string; border: string }
> = {
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
  },
};

interface TagBadgeProps {
  name: string;
  color?: ShortLinkTagColor;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Colored tag badge component for link organization
 */
export function TagBadge({
  name,
  color = 'gray',
  size = 'md',
  onRemove,
  onClick,
  className,
}: TagBadgeProps) {
  const colorClasses = TAG_COLOR_CLASSES[color] || TAG_COLOR_CLASSES.gray;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        colorClasses.bg,
        colorClasses.text,
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'rounded-full p-0.5 transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10'
          )}
          aria-label={`Remove ${name} tag`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </Component>
  );
}

interface TagBadgeGroupProps {
  tags: Array<{ name: string; color?: ShortLinkTagColor }>;
  maxVisible?: number;
  size?: 'sm' | 'md';
  onTagClick?: (tag: string) => void;
  className?: string;
}

/**
 * Group of tag badges with overflow handling
 */
export function TagBadgeGroup({
  tags,
  maxVisible = 3,
  size = 'md',
  onTagClick,
  className,
}: TagBadgeGroupProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.name}
          name={tag.name}
          color={tag.color}
          size={size}
          onClick={onTagClick ? () => onTagClick(tag.name) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            'text-[var(--fg-tertiary)] font-medium',
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
