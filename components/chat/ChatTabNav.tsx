'use client';

import { Sparkles, Layers } from 'lucide-react';

export type ChatTab = 'answer' | 'resources';

interface ChatTabNavProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  hasResources?: boolean;
  resourcesCount?: number;
}

export function ChatTabNav({
  activeTab,
  onTabChange,
  hasResources = false,
  resourcesCount = 0,
}: ChatTabNavProps) {
  const tabs = [
    {
      id: 'answer' as ChatTab,
      label: 'Answer',
      icon: Sparkles,
      available: true,
    },
    {
      id: 'resources' as ChatTab,
      label: 'Resources',
      icon: Layers,
      available: hasResources,
      count: resourcesCount,
    },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-[var(--border-primary)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isAvailable = tab.available;

        return (
          <button
            key={tab.id}
            onClick={() => isAvailable && onTabChange(tab.id)}
            disabled={!isAvailable}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative
              ${
                isActive
                  ? 'text-[var(--fg-primary)]'
                  : isAvailable
                  ? 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
                  : 'text-[var(--fg-tertiary)]/40 cursor-not-allowed'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-xs text-[var(--fg-tertiary)]">
                ({tab.count})
              </span>
            )}
            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--bg-brand-solid)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

