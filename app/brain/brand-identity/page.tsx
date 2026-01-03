'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownCodeViewer } from '@/components/brain/MarkdownCodeViewer';
import { TabSelector } from '@/components/brain/TabSelector';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings } from 'lucide-react';

const brandGuidelines = [
  { id: 'brand-identity', label: 'Brand Identity', file: 'OS_brand identity.md', path: '/claude-data/knowledge/core/OS_brand identity.md' },
  { id: 'brand-messaging', label: 'Brand Messaging', file: 'OS_brand messaging.md', path: '/claude-data/knowledge/core/OS_brand messaging.md' },
  { id: 'art-direction', label: 'Art Direction', file: 'OS_art direction.md', path: '/claude-data/knowledge/core/OS_art direction.md' },
];

export default function BrandIdentityPage() {
  const [activeTab, setActiveTab] = useState('brand-identity');
  const [content, setContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const activeFile = brandGuidelines.find(g => g.id === activeTab);
    if (activeFile) {
      fetch(activeFile.path)
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(err => console.error('Failed to load content:', err));
    }
  }, [activeTab]);

  const activeFile = brandGuidelines.find(g => g.id === activeTab);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      
      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
                Brand Identity
              </h1>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] transition-colors group"
                title="Brain Settings"
              >
                <Settings className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors" />
              </button>
            </div>
            <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              Core brand documentation that defines our identity, messaging, and visual direction.
              These files help AI understand and maintain brand consistency across all content.
            </p>
          </MotionItem>

          {/* Tab Selector */}
          <MotionItem className="mb-6">
            <TabSelector
              tabs={brandGuidelines.map(g => ({ id: g.id, label: g.label }))}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </MotionItem>

          {/* Content */}
          <MotionItem>
            <MarkdownCodeViewer
              filename={activeFile?.file || 'loading...'}
              content={content || 'Loading...'}
              maxLines={50}
            />
          </MotionItem>
        </PageTransition>
      </MainContent>

      {/* Settings Modal - Opens with guidelines section pre-selected */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="guidelines"
      />
    </div>
  );
}
