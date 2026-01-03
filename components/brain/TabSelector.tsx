'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

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

  // Update indicator position when active tab changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLButtonElement;
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  const handleTabClick = (tabId: string) => {
    if (locked) return;
    onChange(tabId);
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        ref={containerRef}
        className={`relative inline-flex items-center gap-0.5 p-1 rounded-lg bg-[var(--bg-tertiary)] transition-opacity duration-200 ${locked ? 'opacity-60' : ''} ${className}`}
      >
        {/* Sliding indicator (the "button" that moves) */}
        <div
          className="absolute top-1 bottom-1 rounded-md bg-[var(--bg-primary)] shadow-sm transition-all duration-200 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          aria-hidden="true"
        />
        
        {/* Tab buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={locked && !isActive}
              title={locked && !isActive ? lockedMessage : undefined}
              aria-disabled={locked && !isActive}
              className={`
                relative z-10 px-3 py-1.5 text-xs font-medium rounded-md
                transition-colors duration-150 ease-out
                ${locked && !isActive ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${
                  isActive
                    ? 'text-[var(--fg-primary)]'
                    : locked
                    ? 'text-[var(--fg-quaternary)]'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lock indicator */}
      {locked && (
        <div 
          className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)] animate-in fade-in slide-in-from-left-2 duration-200"
          title={lockedMessage}
        >
          <Lock className="w-3 h-3" />
          <span className="hidden sm:inline">Editing</span>
        </div>
      )}
    </div>
  );
}
