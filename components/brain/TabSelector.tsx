'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Use useLayoutEffect to measure before paint, avoiding visual jump
  useLayoutEffect(() => {
    const container = containerRef.current;
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

  const handleTabClick = (tabId: string) => {
    if (locked) return;
    onChange(tabId);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center gap-0.5 p-1 rounded-lg bg-[var(--bg-tertiary)] transition-opacity duration-200 ${locked ? 'opacity-50' : ''} ${className}`}
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
            className={`
              relative z-10 px-3 py-1.5 text-xs font-medium rounded-md
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
          </motion.button>
        );
      })}
    </div>
  );
}
