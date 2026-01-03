'use client';

import React from 'react';

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
  return (
    <div className={`relative flex items-end gap-0.5 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-3 py-1.5 text-xs font-medium
              transition-all duration-150 ease-out
              rounded-t-md
              ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.08)] border-t border-l border-r border-[var(--border-primary)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg-secondary)] border-t border-l border-r border-transparent'
              }
            `}
            style={{
              // Folder tab trapezoid effect via clip-path
              clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 100%, 0% 100%)',
              marginBottom: isActive ? '-1px' : '0',
            }}
          >
            {tab.label}
          </button>
        );
      })}
      {/* Subtle baseline that active tab "breaks through" */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-secondary)] -z-10" />
    </div>
  );
}
