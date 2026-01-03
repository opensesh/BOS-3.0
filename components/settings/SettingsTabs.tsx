'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  badge?: string;
}

interface SettingsTabsProps {
  tabs: readonly Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SettingsTabs({ tabs, activeTab, onTabChange }: SettingsTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {/* Left gradient fade + arrow */}
      <div 
        className={`
          absolute left-0 top-0 bottom-0 z-10
          flex items-center
          pointer-events-none
          transition-opacity duration-200
          ${showLeftArrow ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Gradient fade */}
        <div 
          className="
            absolute left-0 top-0 bottom-0 w-16
            bg-gradient-to-r from-[var(--bg-secondary-alt)] via-[var(--bg-secondary-alt)]/80 to-transparent
            rounded-l-lg
          "
        />
        {/* Arrow button */}
        <button
          onClick={() => scroll('left')}
          disabled={!showLeftArrow}
          className="
            relative z-10
            ml-1
            w-8 h-8
            flex items-center justify-center
            bg-[var(--bg-primary)]
            border border-[var(--border-secondary)]
            rounded-md
            text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
            hover:bg-primary_hover
            shadow-sm
            transition-all duration-150
            pointer-events-auto
          "
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Right gradient fade + arrow */}
      <div 
        className={`
          absolute right-0 top-0 bottom-0 z-10
          flex items-center justify-end
          pointer-events-none
          transition-opacity duration-200
          ${showRightArrow ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Gradient fade */}
        <div 
          className="
            absolute right-0 top-0 bottom-0 w-16
            bg-gradient-to-l from-[var(--bg-secondary-alt)] via-[var(--bg-secondary-alt)]/80 to-transparent
            rounded-r-lg
          "
        />
        {/* Arrow button */}
        <button
          onClick={() => scroll('right')}
          disabled={!showRightArrow}
          className="
            relative z-10
            mr-1
            w-8 h-8
            flex items-center justify-center
            bg-[var(--bg-primary)]
            border border-[var(--border-secondary)]
            rounded-md
            text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
            hover:bg-primary_hover
            shadow-sm
            transition-all duration-150
            pointer-events-auto
          "
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        className="
          flex items-center gap-1
          p-1
          bg-[var(--bg-secondary-alt)]
          border border-[var(--border-secondary)]
          rounded-lg
          overflow-x-auto
          scrollbar-hide
          scroll-smooth
          touch-pan-x
        "
        role="tablist"
        aria-label="Settings tabs"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className={`
                flex items-center gap-2
                px-3 py-2
                rounded-md
                text-sm font-semibold
                whitespace-nowrap
                transition-all duration-150
                ${isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--fg-secondary)] shadow-sm'
                  : 'text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)]/50'
                }
              `}
            >
              {tab.label}
              {tab.badge && (
                <span
                  className={`
                    inline-flex items-center justify-center
                    px-2 py-0.5
                    text-xs font-medium
                    rounded-full
                    ${isActive
                      ? 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]'
                      : 'bg-[var(--bg-quaternary)] text-[var(--fg-quaternary)]'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

