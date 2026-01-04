'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ChatTitleDropdown } from './ChatTitleDropdown';
import { ShareButton } from './ShareModal';

export type ChatTab = 'answer' | 'resources';

interface ChatHeaderProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  hasResources?: boolean;
  resourcesCount?: number;
  threadTitle?: string;
  threadCreatedAt?: Date;
  onBack?: () => void;
  onRenameThread?: (newTitle: string) => void;
  onAddToProject?: () => void;
  onAddToSpace?: () => void;
  onDeleteThread?: () => void;
  content?: string;
  /** Whether the response is still streaming - hides counts during streaming */
  isStreaming?: boolean;
  /** Hide share button (e.g., when canvas is open) */
  hideShare?: boolean;
}

export function ChatHeader({
  activeTab,
  onTabChange,
  hasResources = false,
  resourcesCount = 0,
  threadTitle = 'New Thread',
  threadCreatedAt,
  onBack,
  onRenameThread,
  onAddToProject,
  onAddToSpace,
  onDeleteThread,
  content = '',
  isStreaming = false,
  hideShare = false,
}: ChatHeaderProps) {
  const tabs = [
    {
      id: 'answer' as ChatTab,
      label: 'Chat',
      available: true,
    },
    {
      id: 'resources' as ChatTab,
      label: 'Links',
      available: hasResources,
      count: resourcesCount,
    },
  ];

  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)]">
      <div className="px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left side - Back button and tabs */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                title="Back to home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Tabs */}
            <div className="flex items-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isAvailable = tab.available;

                return (
                  <button
                    key={tab.id}
                    onClick={() => isAvailable && onTabChange(tab.id)}
                    disabled={!isAvailable}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all relative
                      ${
                        isActive
                          ? 'text-[var(--fg-primary)]'
                          : isAvailable
                          ? 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
                          : 'text-[var(--fg-tertiary)]/30 cursor-not-allowed opacity-50 pointer-events-none'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    {/* Count badge - only shown when NOT streaming to avoid distraction */}
                    {!isStreaming && isAvailable && tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]">
                        {tab.count}
                      </span>
                    )}
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--bg-brand-solid)] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side - Title dropdown and Share */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <ChatTitleDropdown
              title={threadTitle}
              createdAt={threadCreatedAt}
              onRename={onRenameThread}
              onAddToProject={onAddToProject}
              onAddToSpace={onAddToSpace}
              onDelete={onDeleteThread}
              content={content}
            />
            {!hideShare && <ShareButton />}
          </div>
        </div>
      </div>
    </div>
  );
}

