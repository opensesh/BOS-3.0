'use client';

import React from 'react';
import { ArrowLeft, Globe, Image } from 'lucide-react';
import { OverflowMenu } from './OverflowMenu';
import { ShareButton } from './ShareModal';
import { SourceInfo } from './AnswerView';
import { ImageResult } from './ImagesView';

export type ChatTab = 'answer' | 'links' | 'images';

interface ChatHeaderProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  hasLinks?: boolean;
  hasImages?: boolean;
  linksCount?: number;
  imagesCount?: number;
  threadTitle?: string;
  onBack?: () => void;
}

export function ChatHeader({
  activeTab,
  onTabChange,
  hasLinks = false,
  hasImages = false,
  linksCount = 0,
  imagesCount = 0,
  threadTitle = 'New Thread',
  onBack,
}: ChatHeaderProps) {
  const tabs = [
    {
      id: 'answer' as ChatTab,
      label: 'Chat',
      icon: null, // No icon for Chat tab
      available: true,
    },
    {
      id: 'links' as ChatTab,
      label: 'Links',
      icon: Globe,
      available: hasLinks,
      count: linksCount,
    },
    {
      id: 'images' as ChatTab,
      label: 'Images',
      icon: Image,
      available: hasImages,
      count: imagesCount,
    },
  ];

  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)]">
      <div className="px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left side - Back button and tabs */}
          <div className="flex items-center gap-2">
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
                const Icon = tab.icon;
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
                    {Icon && <Icon className={`w-4 h-4 ${!isAvailable ? 'opacity-50' : ''}`} />}
                    <span>{tab.label}</span>
                    {/* Count badge for available tabs with items */}
                    {isAvailable && tab.count !== undefined && tab.count > 0 && (
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

          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            <OverflowMenu threadTitle={threadTitle} />
            <ShareButton />
          </div>
        </div>
      </div>
    </div>
  );
}

