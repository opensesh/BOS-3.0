'use client';

import { useState, useRef, useEffect } from 'react';
import { Zap, X, MessageSquare } from 'lucide-react';
import { QUICK_ACTIONS, type QuickActionType } from '@/lib/quick-actions';

export type QuickActionFilterValue = 'all' | QuickActionType;

interface QuickActionFilterDropdownProps {
  value: QuickActionFilterValue;
  onChange: (value: QuickActionFilterValue) => void;
}

// Build filter options from QUICK_ACTIONS config
const quickActionOptions = [
  { id: 'all' as const, label: 'All Actions', icon: MessageSquare },
  ...QUICK_ACTIONS.map(action => ({
    id: action.id as QuickActionType,
    label: action.title,
    icon: Zap,
  })),
];

function formatQuickAction(value: QuickActionFilterValue): string {
  const option = quickActionOptions.find(o => o.id === value);
  return option?.label || 'All Actions';
}

export function QuickActionFilterDropdown({ value, onChange }: QuickActionFilterDropdownProps) {
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

  const handleOptionClick = (optionId: QuickActionFilterValue) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const selectedOption = quickActionOptions.find(o => o.id === value);
  const Icon = selectedOption?.icon || Zap;

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
            <Icon className={`w-4 h-4 ${value !== 'all' ? 'text-brand-aperol' : 'text-[var(--fg-tertiary)]'}`} />
            <span className="text-[var(--fg-primary)]">{formatQuickAction(value)}</span>
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
              min-w-[220px]
              z-40
            "
            role="dialog"
            aria-label="Quick action filter"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 border-b border-[var(--border-secondary)]">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                Filter by Quick Action
              </p>
            </div>

            {/* Options List */}
            <div className="py-2">
              {quickActionOptions.map((option) => {
                const OptionIcon = option.icon;
                const isSelected = value === option.id;
                const isQuickAction = option.id !== 'all';
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5
                      text-sm transition-colors
                      ${isSelected
                        ? 'bg-brand-aperol/15 text-brand-aperol'
                        : 'text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                      }
                    `}
                  >
                    <OptionIcon className={`w-4 h-4 ${isQuickAction && !isSelected ? 'text-brand-aperol/60' : ''}`} />
                    <span className="font-medium">{option.label}</span>
                    {isSelected && (
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

