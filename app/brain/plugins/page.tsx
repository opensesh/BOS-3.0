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
import { getPluginContent, listPlugins } from './actions';

function PluginsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [plugins, setPlugins] = useState<{ id: string; label: string }[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Load plugin list on mount
  useEffect(() => {
    listPlugins()
      .then(pluginList => {
        setPlugins(pluginList);

        // Set initial tab
        let initialTab = '';
        if (tabParam && pluginList.some(p => p.id === tabParam)) {
          initialTab = tabParam;
        } else if (pluginList.length > 0) {
          initialTab = pluginList[0].id;
        }
        setActiveTab(initialTab);
      })
      .catch(err => {
        console.error('Failed to load plugins:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [tabParam]);

  // Load plugin content when active tab changes
  useEffect(() => {
    if (!activeTab || content[activeTab]) return;

    setIsLoadingContent(true);
    getPluginContent(activeTab)
      .then(pluginContent => {
        setContent(prev => ({ ...prev, [activeTab]: pluginContent }));
      })
      .catch(err => {
        console.error('Failed to load plugin content:', err);
        setContent(prev => ({
          ...prev,
          [activeTab]: `Error loading plugin content for ${activeTab}`
        }));
      })
      .finally(() => {
        setIsLoadingContent(false);
      });
  }, [activeTab, content]);

  const tabs = plugins.map(p => ({ id: p.id, label: p.label }));
  const currentContent = content[activeTab] || '';
  const currentFilename = `${activeTab || 'plugin'}-README.md`;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />

      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)]">
                Plugins
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
              Complete capability packages combining commands, agents, and skills.
              Plugins provide specialized workflows and integrations.
            </p>
          </MotionItem>

          {/* Loading State */}
          {(isLoading || !activeTab) && (
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
        defaultSection="plugins"
      />
    </div>
  );
}

export default function PluginsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--fg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
        </div>
      }
    >
      <PluginsContent />
    </Suspense>
  );
}
