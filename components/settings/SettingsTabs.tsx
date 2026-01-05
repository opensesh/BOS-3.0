'use client';

import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  // Update sliding indicator position
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLButtonElement;
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
      // Mark as initialized after first measurement
      if (!isInitialized) {
        requestAnimationFrame(() => setIsInitialized(true));
      }
    }
  }, [activeTab, tabs, isInitialized]);

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

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Left arrow button - outside the scroll container */}
      <button
        onClick={() => scroll('left')}
        className={`
          flex-shrink-0
          w-8 h-8
          flex items-center justify-center
          bg-[var(--bg-primary)]
          border border-[var(--border-secondary)]
          rounded-md
          text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
          hover:bg-[var(--bg-secondary)]
          shadow-sm
          transition-all duration-150
          ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        aria-label="Scroll tabs left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        className="
          relative flex-1 min-w-0
          flex items-center gap-0.5
          p-1
          bg-[var(--bg-tertiary)]
          rounded-lg
          overflow-x-auto
          scrollbar-hide
          scroll-smooth
          touch-pan-x
          overscroll-x-contain
        "
        role="tablist"
        aria-label="Settings tabs"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Sliding indicator with spring animation */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-md bg-[var(--bg-primary)] shadow-sm"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35,
            mass: 1,
          }}
          style={{
            // Hide until initialized to prevent flash
            opacity: isInitialized ? 1 : 0,
          }}
          aria-hidden="true"
        />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className="
                relative z-10 
                flex items-center gap-2
                px-3 py-1.5
                rounded-md
                text-xs font-medium
                whitespace-nowrap
                cursor-pointer
                select-none
              "
              animate={{
                color: isActive ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
              }}
              whileHover={!isActive ? { 
                color: 'var(--fg-secondary)',
              } : {}}
              whileTap={{ scale: 0.98 }}
              transition={{
                color: { duration: 0.15, ease: 'easeOut' },
                scale: { type: 'spring', stiffness: 400, damping: 25 },
              }}
            >
              {tab.label}
              {tab.badge && (
                <span
                  className={`
                    inline-flex items-center justify-center
                    px-2 py-0.5
                    text-xs font-medium
                    rounded-full
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]'
                      : 'bg-[var(--bg-quaternary)] text-[var(--fg-quaternary)]'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Right arrow button - outside the scroll container */}
      <button
        onClick={() => scroll('right')}
        className={`
          flex-shrink-0
          w-8 h-8
          flex items-center justify-center
          bg-[var(--bg-primary)]
          border border-[var(--border-secondary)]
          rounded-md
          text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
          hover:bg-[var(--bg-secondary)]
          shadow-sm
          transition-all duration-150
          ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        aria-label="Scroll tabs right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
