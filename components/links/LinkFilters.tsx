'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Check,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadge, TAG_COLOR_CLASSES } from './TagBadge';
import type { ShortLinkTag, ShortLinkTagColor } from '@/lib/supabase/types';

export type SortBy = 'created' | 'clicks' | 'alphabetical' | 'updated';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

interface LinkFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: ShortLinkTag[];
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showArchived?: boolean;
  onShowArchivedChange?: (show: boolean) => void;
  className?: string;
}

/**
 * Filter controls for the links list
 */
export function LinkFilters({
  search,
  onSearchChange,
  selectedTags,
  onTagsChange,
  availableTags,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  viewMode = 'grid',
  onViewModeChange,
  showArchived = false,
  onShowArchivedChange,
  className,
}: LinkFiltersProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'created', label: 'Date Created' },
    { value: 'updated', label: 'Last Updated' },
    { value: 'clicks', label: 'Most Clicks' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onTagsChange([]);
    if (onShowArchivedChange) onShowArchivedChange(false);
  };

  const hasActiveFilters =
    search || selectedTags.length > 0 || showArchived;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search links..."
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm rounded-lg',
              'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
              'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
              'focus:outline-none focus:border-[var(--border-primary)] focus:bg-[var(--bg-secondary)]/50',
              'transition-colors'
            )}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag filter dropdown */}
        <div ref={tagDropdownRef} className="relative">
          <button
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
              'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
              'text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/60',
              'transition-colors',
              selectedTags.length > 0 && 'border-[var(--border-primary)]'
            )}
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <span>Tags</span>
            {selectedTags.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]">
                {selectedTags.length}
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-[var(--fg-tertiary)] transition-transform',
                showTagDropdown && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showTagDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 left-0 z-50 w-56 py-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
              >
                {availableTags.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto py-1">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleToggleTag(tag.name)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <span
                            className={cn(
                              'w-3 h-3 rounded-full',
                              TAG_COLOR_CLASSES[tag.color || 'gray']?.bg ||
                                'bg-gray-500'
                            )}
                          />
                          <span className="flex-1 text-left">{tag.name}</span>
                          {tag.usageCount > 0 && (
                            <span className="text-xs text-[var(--fg-tertiary)]">
                              {tag.usageCount}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-sm text-[var(--fg-tertiary)] text-center">
                    No tags available
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort dropdown */}
        <div ref={sortDropdownRef} className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
              'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
              'text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/60',
              'transition-colors'
            )}
          >
            <ArrowUpDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <span className="hidden sm:inline">
              {sortOptions.find((o) => o.value === sortBy)?.label || 'Sort'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-[var(--fg-tertiary)] transition-transform',
                showSortDropdown && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 right-0 z-50 w-44 py-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortByChange(option.value);
                      setShowSortDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <span className="flex-1 text-left">{option.label}</span>
                    {sortBy === option.value && (
                      <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />
                    )}
                  </button>
                ))}
                <div className="border-t border-[var(--border-secondary)] my-1" />
                <button
                  onClick={() => {
                    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
                    setShowSortDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <span className="flex-1 text-left">
                    {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View mode toggle */}
        {onViewModeChange && (
          <div className="flex items-center rounded-lg border border-[var(--border-primary)]/40 bg-[var(--bg-secondary)]/30 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
              )}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map((tagName) => {
            const tag = availableTags.find((t) => t.name === tagName);
            return (
              <TagBadge
                key={tagName}
                name={tagName}
                color={tag?.color as ShortLinkTagColor}
                size="sm"
                onRemove={() => handleToggleTag(tagName)}
              />
            );
          })}
          {showArchived && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Showing archived
              <button
                onClick={() => onShowArchivedChange?.(false)}
                className="p-0.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
