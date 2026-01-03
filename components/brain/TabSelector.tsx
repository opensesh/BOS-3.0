'use client';

import React, { useRef, useState, useEffect } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabSelector({ tabs, activeTab, onChange, className = '' }: TabSelectorProps) {
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

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center gap-0.5 p-1 rounded-lg bg-[var(--bg-tertiary)] ${className}`}
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
            onClick={() => onChange(tab.id)}
            className={`
              relative z-10 px-3 py-1.5 text-xs font-medium rounded-md
              transition-colors duration-150 ease-out
              ${
                isActive
                  ? 'text-[var(--fg-primary)]'
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
