'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownCodeViewer } from '@/components/brain/MarkdownCodeViewer';
import { TabSelector } from '@/components/brain/TabSelector';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings, Loader2 } from 'lucide-react';

const writingStyles = [
  { id: 'blog', label: 'Blog', file: 'blog.md', path: '/claude-data/knowledge/writing-styles/blog.md' },
  { id: 'creative', label: 'Creative', file: 'creative.md', path: '/claude-data/knowledge/writing-styles/creative.md' },
  { id: 'long-form', label: 'Long Form', file: 'long-form.md', path: '/claude-data/knowledge/writing-styles/long-form.md' },
  { id: 'short-form', label: 'Short Form', file: 'short-form.md', path: '/claude-data/knowledge/writing-styles/short-form.md' },
  { id: 'strategic', label: 'Strategic', file: 'strategic.md', path: '/claude-data/knowledge/writing-styles/strategic.md' },
];

function WritingStylesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('blog');
  const [content, setContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Set active tab from URL param on mount
  useEffect(() => {
    if (tabParam && writingStyles.some(w => w.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const activeFile = writingStyles.find(w => w.id === activeTab);
    if (activeFile) {
      fetch(activeFile.path)
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(err => console.error('Failed to load content:', err));
    }
  }, [activeTab]);

  const activeFile = writingStyles.find(w => w.id === activeTab);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      
      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
                Writing Styles
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
              Context-specific voice guidelines for different content types. From blog posts to
              strategic communications, each style guide ensures consistent, on-brand messaging.
            </p>
          </MotionItem>

          {/* Tab Selector */}
          <MotionItem className="mb-6">
            <TabSelector
              tabs={writingStyles.map(w => ({ id: w.id, label: w.label }))}
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

      {/* Settings Modal - Opens with writing section pre-selected */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="writing"
      />
    </div>
  );
}

export default function WritingStylesPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--fg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
        </div>
      }
    >
      <WritingStylesContent />
    </Suspense>
  );
}
