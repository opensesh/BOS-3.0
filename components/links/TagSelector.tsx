'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadge, TAG_COLOR_CLASSES } from './TagBadge';
import type { ShortLinkTag, ShortLinkTagColor } from '@/lib/supabase/types';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: ShortLinkTag[];
  onChange: (tags: string[]) => void;
  onCreateTag?: (name: string) => Promise<ShortLinkTag>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Multi-select tag selector with create capability
 */
export function TagSelector({
  selectedTags,
  availableTags,
  onChange,
  onCreateTag,
  placeholder = 'Add tags...',
  className,
  disabled = false,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tags based on search
  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTags.includes(tag.name)
  );

  // Check if search value matches an existing tag
  const exactMatch = availableTags.some(
    (tag) => tag.name.toLowerCase() === searchValue.toLowerCase()
  );

  const canCreateNew =
    onCreateTag && searchValue.trim() && !exactMatch && !isCreating;

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  };

  const handleCreateTag = async () => {
    if (!onCreateTag || !searchValue.trim()) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(searchValue.trim());
      onChange([...selectedTags, newTag.name]);
      setSearchValue('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Get tag object for selected tags
  const getTagInfo = (tagName: string) => {
    const tag = availableTags.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    );
    return tag ? { name: tag.name, color: tag.color } : { name: tagName };
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          'min-h-[38px] px-3 py-1.5 rounded-lg',
          'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
          'flex flex-wrap items-center gap-1.5',
          'cursor-pointer transition-colors',
          isOpen && 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selectedTags.length > 0 ? (
          <>
            {selectedTags.map((tagName) => {
              const tagInfo = getTagInfo(tagName);
              return (
                <TagBadge
                  key={tagName}
                  name={tagInfo.name}
                  color={tagInfo.color as ShortLinkTagColor}
                  size="sm"
                  onRemove={() => handleRemoveTag(tagName)}
                />
              );
            })}
          </>
        ) : (
          <span className="text-sm text-[var(--fg-tertiary)]">
            {placeholder}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 ml-auto text-[var(--fg-tertiary)] transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-[var(--border-secondary)]">
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search or create..."
                autoFocus
                className={cn(
                  'w-full px-2.5 py-1.5 text-sm rounded-md',
                  'bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]/40',
                  'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
                  'focus:outline-none focus:border-[var(--border-primary)]'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canCreateNew) {
                    handleCreateTag();
                  }
                }}
              />
            </div>

            {/* Tag list */}
            <div className="max-h-48 overflow-y-auto py-1">
              {/* Selected tags */}
              {selectedTags.map((tagName) => {
                const tagInfo = getTagInfo(tagName);
                return (
                  <button
                    key={`selected-${tagName}`}
                    onClick={() => handleToggleTag(tagName)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full',
                        TAG_COLOR_CLASSES[
                          (tagInfo.color as ShortLinkTagColor) || 'gray'
                        ]?.bg || 'bg-gray-500'
                      )}
                    />
                    <span>{tagInfo.name}</span>
                    <Check className="w-4 h-4 ml-auto text-[var(--fg-brand-primary)]" />
                  </button>
                );
              })}

              {/* Available tags */}
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.name)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <span
                    className={cn(
                      'w-3 h-3 rounded-full',
                      TAG_COLOR_CLASSES[tag.color || 'gray']?.bg || 'bg-gray-500'
                    )}
                  />
                  <span>{tag.name}</span>
                </button>
              ))}

              {/* Create new tag option */}
              {canCreateNew && (
                <button
                  onClick={handleCreateTag}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--fg-brand-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create "{searchValue}"</span>
                </button>
              )}

              {/* Empty state */}
              {filteredTags.length === 0 &&
                selectedTags.length === 0 &&
                !canCreateNew && (
                  <div className="px-3 py-3 text-sm text-[var(--fg-tertiary)] text-center">
                    {searchValue
                      ? 'No matching tags'
                      : 'No tags available'}
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TagColorPickerProps {
  value: ShortLinkTagColor;
  onChange: (color: ShortLinkTagColor) => void;
  className?: string;
}

/**
 * Color picker for tag colors
 */
export function TagColorPicker({
  value,
  onChange,
  className,
}: TagColorPickerProps) {
  const colors: ShortLinkTagColor[] = [
    'gray',
    'red',
    'orange',
    'amber',
    'green',
    'teal',
    'blue',
    'sky',
    'indigo',
    'violet',
    'purple',
    'pink',
  ];

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-6 h-6 rounded-full transition-all',
            TAG_COLOR_CLASSES[color]?.bg,
            value === color
              ? 'ring-2 ring-offset-2 ring-[var(--fg-primary)] ring-offset-[var(--bg-primary)]'
              : 'hover:scale-110'
          )}
          title={color}
        />
      ))}
    </div>
  );
}
