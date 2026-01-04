'use client';

import { useState } from 'react';
import { Layers, Check, Plus, X, Loader2 } from 'lucide-react';

export interface SpaceOption {
  id: string;
  slug: string;
  title: string;
  icon?: string;
  description?: string;
}

interface SpaceSelectorProps {
  spaces: SpaceOption[];
  currentSpace: SpaceOption | null;
  onSelect: (space: SpaceOption | null) => void;
  onCreateSpace?: (title: string) => Promise<void>;
  showCreateOption?: boolean;
}

export function SpaceSelector({
  spaces,
  currentSpace,
  onSelect,
  onCreateSpace,
  showCreateOption = true,
}: SpaceSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newSpaceName.trim() || !onCreateSpace) return;

    setIsLoading(true);
    try {
      await onCreateSpace(newSpaceName.trim());
      setNewSpaceName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating space:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewSpaceName('');
    }
  };

  return (
    <div className="py-2 max-h-64 overflow-y-auto">
      {/* None option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`
          w-full flex items-center justify-between px-4 py-2
          text-left transition-colors duration-150
          ${!currentSpace
            ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
            : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
          }
        `}
      >
        <span className="text-sm">None</span>
        {!currentSpace && (
          <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />
        )}
      </button>

      {/* Existing spaces */}
      {spaces.map((space) => {
        const isSelected = currentSpace?.id === space.id;
        return (
          <button
            key={space.id}
            type="button"
            onClick={() => onSelect(space)}
            className={`
              w-full flex items-center justify-between px-4 py-2
              text-left transition-colors duration-150
              ${isSelected
                ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
                : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
              }
            `}
          >
            <div className="flex items-center gap-2">
              {space.icon ? (
                <span className="text-sm">{space.icon}</span>
              ) : (
                <Layers className="w-4 h-4 text-[var(--fg-tertiary)]" />
              )}
              <span className="text-sm truncate">{space.title}</span>
            </div>
            {isSelected && (
              <Check className="w-4 h-4 text-[var(--fg-brand-primary)] flex-shrink-0" />
            )}
          </button>
        );
      })}

      {/* Empty state */}
      {spaces.length === 0 && (
        <div className="px-4 py-3 text-center">
          <Layers className="w-6 h-6 mx-auto mb-1 text-[var(--fg-quaternary)]" />
          <p className="text-xs text-[var(--fg-tertiary)]">No spaces yet</p>
        </div>
      )}

      {/* Divider */}
      {showCreateOption && onCreateSpace && (
        <div className="mx-3 my-2 border-t border-[var(--border-secondary)]" />
      )}

      {/* Create new space */}
      {showCreateOption && onCreateSpace && (
        isCreating ? (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Space name..."
                className="flex-1 px-2 py-1 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] focus:outline-none focus:border-[var(--border-brand-solid)]"
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newSpaceName.trim() || isLoading}
                className="p-1 rounded-md text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewSpaceName('');
                }}
                disabled={isLoading}
                className="p-1 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Create new space</span>
          </button>
        )
      )}
    </div>
  );
}

