'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownCodeViewer } from '@/components/brain/MarkdownCodeViewer';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings } from 'lucide-react';

export default function ArchitecturePage() {
  const [content, setContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetch('/claude-data/system/architecture.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error('Failed to load architecture:', err));
  }, []);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      
      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
                  Architecture
                </h1>
                <span className="px-2.5 py-1 text-xs font-medium bg-[var(--bg-success-primary)] text-[var(--fg-success-primary)] rounded-full">
                  Automatic
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                title="Brain Settings"
              >
                <Settings className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
              </button>
            </div>
            <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              This website is structured to serve both as a landing page for humans and as a
              well-organized resource for AI agent interpretation. Think of it as our brand brain
              that will continue to grow and extend use cases over time.
            </p>
          </MotionItem>

          {/* Content */}
          <MotionItem>
            <MarkdownCodeViewer
              filename="architecture.md"
              content={content || 'Loading...'}
              maxLines={50}
            />
          </MotionItem>
        </PageTransition>
      </MainContent>

      {/* Settings Modal - Opens with architecture section (which is automatic) */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="architecture"
      />
    </div>
  );
}
