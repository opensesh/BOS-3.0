'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownEditor } from '@/components/brain/MarkdownEditor';
import { TabSelector } from '@/components/brain/TabSelector';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings, Loader2 } from 'lucide-react';
import { getAgentContent, listAgents } from './actions';

function AgentsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agents, setAgents] = useState<{ id: string; label: string }[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Load agent list on mount
  useEffect(() => {
    listAgents()
      .then(agentList => {
        setAgents(agentList);

        // Set initial tab
        let initialTab = '';
        if (tabParam && agentList.some(a => a.id === tabParam)) {
          initialTab = tabParam;
        } else if (agentList.length > 0) {
          initialTab = agentList[0].id;
        }
        setActiveTab(initialTab);
      })
      .catch(err => {
        console.error('Failed to load agents:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [tabParam]);

  // Load agent content when active tab changes
  useEffect(() => {
    if (!activeTab || content[activeTab]) return;

    setIsLoadingContent(true);
    getAgentContent(activeTab)
      .then(agentContent => {
        setContent(prev => ({ ...prev, [activeTab]: agentContent }));
      })
      .catch(err => {
        console.error('Failed to load agent content:', err);
        setContent(prev => ({
          ...prev,
          [activeTab]: `Error loading agent content for ${activeTab}`
        }));
      })
      .finally(() => {
        setIsLoadingContent(false);
      });
  }, [activeTab, content]);

  const tabs = agents.map(a => ({ id: a.id, label: a.label }));
  const currentContent = content[activeTab] || '';
  const currentFilename = `${activeTab || 'agent'}-README.md`;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />

      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)]">
                Agents
              </h1>
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
              Autonomous AI workflows that auto-activate based on context.
              Agents handle multi-step tasks and make decisions independently.
            </p>
          </MotionItem>

          {/* Loading State */}
          {(isLoading || !activeTab) && agents.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--fg-tertiary)]">
              <p>No agents found in .claude/agents/</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
            </div>
          )}

          {/* Tab Selector */}
          {tabs.length > 0 && !isLoading && activeTab && (
            <MotionItem className="mb-6">
              <TabSelector
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </MotionItem>
          )}

          {/* Content Viewer */}
          {!isLoading && activeTab && (
            <MotionItem>
              <MarkdownEditor
                documentId={activeTab}
                filename={currentFilename}
                content={currentContent}
                maxLines={100}
                isLoading={isLoadingContent}
                readOnly={true}
              />
            </MotionItem>
          )}
        </PageTransition>
      </MainContent>

      {/* Settings Modal */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="agents"
      />
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--fg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
        </div>
      }
    >
      <AgentsContent />
    </Suspense>
  );
}
