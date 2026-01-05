'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, X, MessageSquare, Layers, FolderOpen, User } from 'lucide-react';

export type CategoryFilterValue = 'all' | 'personal' | 'spaces' | 'projects';

interface CategoryFilterDropdownProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

const categories = [
  { id: 'all' as const, label: 'All', icon: MessageSquare },
  { id: 'personal' as const, label: 'Personal', icon: User },
  { id: 'spaces' as const, label: 'Spaces', icon: Layers },
  { id: 'projects' as const, label: 'Projects', icon: FolderOpen },
];

function formatCategory(value: CategoryFilterValue): string {
  const category = categories.find(c => c.id === value);
  return category?.label || 'All';
}

export function CategoryFilterDropdown({ value, onChange }: CategoryFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCategoryClick = (categoryId: CategoryFilterValue) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const selectedCategory = categories.find(c => c.id === value);
  const Icon = selectedCategory?.icon || Filter;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative z-30">
        {/* Trigger Button */}
        <div className="flex items-center gap-1">
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-2 px-3 py-2.5
              text-sm font-medium
              rounded-lg
              border border-[var(--border-secondary)]
              transition-all duration-150
              ${isOpen 
                ? 'bg-[var(--bg-tertiary)] ring-2 ring-brand-aperol/20 border-brand-aperol' 
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--fg-primary)]'
              }
            `}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <Icon className="w-4 h-4 text-[var(--fg-tertiary)]" />
            <span className="text-[var(--fg-primary)]">{formatCategory(value)}</span>
          </button>
          {value !== 'all' && (
            <button
              onClick={() => onChange('all')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)] transition-colors"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="
              absolute top-full right-0 mt-2
              bg-[var(--bg-primary)]
              border border-[var(--border-secondary)]
              rounded-xl
              shadow-xl shadow-black/20
              overflow-hidden
              animate-in fade-in slide-in-from-top-2 duration-150
              min-w-[200px]
              z-40
            "
            role="dialog"
            aria-label="Category filter"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 border-b border-[var(--border-secondary)]">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                Filter by category
              </p>
            </div>

            {/* Category List */}
            <div className="py-2">
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5
                      text-sm transition-colors
                      ${value === category.id
                        ? 'bg-brand-aperol/15 text-brand-aperol'
                        : 'text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                      }
                    `}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    <span className="font-medium">{category.label}</span>
                    {value === category.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-aperol" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

