'use client';

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  badge?: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  /** When true, tabs are locked and cannot be switched (e.g., during editing) */
  locked?: boolean;
  /** Message to show when tabs are locked */
  lockedMessage?: string;
}

export function TabSelector({ 
  tabs, 
  activeTab, 
  onChange, 
  className = '',
  locked = false,
  lockedMessage = 'Save or exit edit mode to switch tabs',
}: TabSelectorProps) {
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

  // Setup scroll listeners
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

  // Scroll active tab into view when it changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLButtonElement;
    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      // Check if button is outside visible area
      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleTabClick = (tabId: string) => {
    if (locked) return;
    onChange(tabId);
  };

  return (
    <div 
      className={`relative flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1 transition-opacity duration-200 ${locked ? 'opacity-50' : ''} ${className}`}
    >
      {/* Left arrow - only render when needed */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            onClick={() => scroll('left')}
            className="
              flex-shrink-0
              w-7 h-7
              flex items-center justify-center
              rounded-md
              text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
              hover:bg-[var(--bg-quaternary)]
              transition-colors duration-150
            "
            aria-label="Scroll tabs left"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tabs scroll container */}
      <div
        ref={scrollContainerRef}
        className="
          relative flex-1 min-w-0
          flex items-center gap-0.5
          overflow-x-auto
          scrollbar-hide
          scroll-smooth
          touch-pan-x
          overscroll-x-contain
        "
        role="tablist"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Sliding indicator with spring animation */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-md bg-[var(--bg-primary)] shadow-sm"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
          style={{
            // Hide until initialized to prevent flash
            opacity: isInitialized ? 1 : 0,
          }}
          aria-hidden="true"
        />
        
        {/* Tab buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={locked && !isActive}
              title={locked && !isActive ? lockedMessage : undefined}
              aria-disabled={locked && !isActive}
              role="tab"
              aria-selected={isActive}
              className={`
                relative z-10 
                flex items-center gap-2
                px-3 py-1.5 
                text-xs font-medium 
                rounded-md
                whitespace-nowrap
                select-none
                ${locked && !isActive ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              animate={{
                color: isActive 
                  ? 'var(--fg-primary)' 
                  : locked 
                    ? 'var(--fg-quaternary)' 
                    : 'var(--fg-tertiary)',
              }}
              whileHover={!locked && !isActive ? { 
                color: 'var(--fg-secondary)',
              } : {}}
              whileTap={!locked ? { scale: 0.98 } : {}}
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
                    px-1.5 py-0.5
                    text-[10px] font-medium
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

      {/* Right arrow - only render when needed */}
      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            onClick={() => scroll('right')}
            className="
              flex-shrink-0
              w-7 h-7
              flex items-center justify-center
              rounded-md
              text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
              hover:bg-[var(--bg-quaternary)]
              transition-colors duration-150
            "
            aria-label="Scroll tabs right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
