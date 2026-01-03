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
              group relative px-3 py-1.5 text-xs font-medium
              transition-all duration-150 ease-out
              rounded-t-md
              ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.08)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg-secondary)]'
              }
            `}
            style={{
              // Folder tab trapezoid effect via clip-path
              clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 100%, 0% 100%)',
              marginBottom: isActive ? '-1px' : '0',
            }}
          >
            {/* Aperol accent line on top - visible on active, appears on hover for inactive */}
            <span 
              className={`
                absolute top-0 left-1 right-1 h-0.5 rounded-full
                transition-opacity duration-150
                bg-[var(--border-brand-solid)]
                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}
              aria-hidden="true"
            />
            {/* Left edge - Aperol border (only on hover for inactive) - positioned inside clip area */}
            {!isActive && (
              <span 
                className="absolute top-0 left-1 w-px h-[calc(100%-1px)] bg-[var(--border-brand-solid)] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-hidden="true"
              />
            )}
            {/* Right edge - Aperol border (only on hover for inactive) - positioned inside clip area */}
            {!isActive && (
              <span 
                className="absolute top-0 right-1 w-px h-[calc(100%-1px)] bg-[var(--border-brand-solid)] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-hidden="true"
              />
            )}
            {tab.label}
          </button>
        );
      })}
      {/* Subtle baseline that active tab "breaks through" */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-secondary)] -z-10" />
    </div>
  );
}
