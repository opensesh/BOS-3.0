'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownCodeViewer } from '@/components/brain/MarkdownCodeViewer';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings } from 'lucide-react';

export default function ClaudeConfigPage() {
  const [content, setContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Fetch from API route that serves .claude/ files
    fetch('/api/claude/CLAUDE.md')
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then(text => setContent(text))
      .catch(err => {
        console.error('Failed to load CLAUDE.md:', err);
        setContent('# Claude Configuration\n\nClaude configuration not yet available. Create `.claude/CLAUDE.md` to display content here.');
      });
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
                  Claude Configuration
                </h1>
                <span className="px-2.5 py-1 text-xs font-medium bg-[var(--bg-success-primary)] text-[var(--fg-success-primary)] rounded-full">
                  Automatic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                  title="Brain Settings"
                >
                  <Settings className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                </button>
              </div>
            </div>
            <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              The main CLAUDE.md development guide that configures how Claude Code operates
              in this project. Contains code conventions, design system guidelines, and project-specific instructions.
            </p>
          </MotionItem>

          {/* Content */}
          <MotionItem>
            <MarkdownCodeViewer
              filename="CLAUDE.md"
              content={content || 'Loading...'}
              maxLines={50}
            />
          </MotionItem>
        </PageTransition>
      </MainContent>

      {/* Settings Modal */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
