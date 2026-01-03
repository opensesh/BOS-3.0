'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownEditor } from '@/components/brain/MarkdownEditor';
import { TabSelector } from '@/components/brain/TabSelector';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { VersionHistoryPanel } from '@/components/brain/VersionHistoryPanel';
import { AddDocumentModal } from '@/components/brain/AddDocumentModal';
import { useBrainDocuments } from '@/hooks/useBrainDocuments';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings, Plus, Loader2 } from 'lucide-react';
import { getSkillContent } from './actions';

// Fallback skill files matching the .claude/skills directory
const FALLBACK_SKILLS = [
  { id: 'algorithmic-art', slug: 'algorithmic-art', label: 'Algorithmic Art', file: 'SKILL.md' },
  { id: 'artifacts-builder', slug: 'artifacts-builder', label: 'Artifacts Builder', file: 'SKILL.md' },
  { id: 'brand-guidelines', slug: 'brand-guidelines', label: 'Brand Guidelines', file: 'SKILL.md' },
  { id: 'canvas-design', slug: 'canvas-design', label: 'Canvas Design', file: 'SKILL.md' },
  { id: 'mcp-builder', slug: 'mcp-builder', label: 'MCP Builder', file: 'SKILL.md' },
  { id: 'skill-creator', slug: 'skill-creator', label: 'Skill Creator', file: 'SKILL.md' },
];

function SkillsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(FALLBACK_SKILLS[0].slug);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fallbackContent, setFallbackContent] = useState<Record<string, string>>({});
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    documents,
    isLoading,
    error,
    activeDocument,
    setActiveDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    restoreVersion,
  } = useBrainDocuments({ category: 'skills' });

  // Set active tab from URL param on mount
  useEffect(() => {
    if (tabParam && FALLBACK_SKILLS.some(s => s.slug === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Check if we need to use fallback
  useEffect(() => {
    if (!isLoading && (error || documents.length === 0 || documents.every(d => !d.content))) {
      setIsUsingFallback(true);
    } else {
      setIsUsingFallback(false);
    }
  }, [isLoading, error, documents]);

  // Load fallback content when active tab changes (using server action)
  useEffect(() => {
    if (isUsingFallback && activeTab) {
      setIsLoadingFallback(true);
      getSkillContent(activeTab)
        .then(content => {
          setFallbackContent(prev => ({ ...prev, [activeTab]: content }));
        })
        .catch(err => {
          console.error('Failed to load skill content:', err);
          setFallbackContent(prev => ({ 
            ...prev, 
            [activeTab]: `Error loading skill content for ${activeTab}` 
          }));
        })
        .finally(() => {
          setIsLoadingFallback(false);
        });
    }
  }, [isUsingFallback, activeTab]);

  // Set active document when tab changes
  useEffect(() => {
    if (isUsingFallback) return;
    const doc = documents.find(d => d.slug === activeTab);
    if (doc) {
      setActiveDocument(doc);
    }
  }, [activeTab, documents, isUsingFallback, setActiveDocument]);

  // Generate tabs from documents or fallback
  const tabs = isUsingFallback
    ? FALLBACK_SKILLS.map(s => ({ id: s.slug, label: s.label }))
    : documents.map(d => ({ id: d.slug, label: d.title }));

  // Get current content
  const currentContent = isUsingFallback
    ? fallbackContent[activeTab] || 'Loading...'
    : activeDocument?.content || '';

  const currentFilename = isUsingFallback
    ? FALLBACK_SKILLS.find(s => s.slug === activeTab)?.file || 'SKILL.md'
    : `${activeDocument?.slug || 'skill'}.md`;

  // Handle save
  const handleSave = useCallback(async (content: string, changeSummary?: string) => {
    if (!activeDocument) return;
    await updateDocument(activeDocument.id, content, changeSummary);
  }, [activeDocument, updateDocument]);

  // Handle add document
  const handleAddDocument = useCallback(async (title: string, content: string) => {
    const newDoc = await createDocument(title, content);
    setActiveTab(newDoc.slug);
    setActiveDocument(newDoc);
  }, [createDocument, setActiveDocument]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!activeDocument) return;
    if (!confirm(`Are you sure you want to delete "${activeDocument.title}"?`)) return;
    
    await deleteDocument(activeDocument.id);
    const remaining = documents.filter(d => d.id !== activeDocument.id);
    if (remaining.length > 0) {
      setActiveTab(remaining[0].slug);
    }
  }, [activeDocument, deleteDocument, documents]);

  // Handle restore version
  const handleRestoreVersion = useCallback(async (versionNumber: number) => {
    if (!activeDocument) return;
    await restoreVersion(activeDocument.id, versionNumber);
  }, [activeDocument, restoreVersion]);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      
      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)]">
                Skills
              </h1>
              <div className="flex items-center gap-2">
                {!isUsingFallback && (
                  <motion.button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Add"
                    aria-label="Add skill"
                  >
                    <Plus className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                  </motion.button>
                )}
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
              AI capabilities and skill definitions. These documents teach the AI how to perform 
              specific tasks and when to use them.
              {isUsingFallback && (
                <span className="block mt-2 text-sm text-[var(--fg-warning-primary)]">
                  Viewing static files. Connect to database to enable editing.
                </span>
              )}
            </p>
          </MotionItem>

          {/* Loading State */}
          {(isLoading || isLoadingFallback) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
            </div>
          )}

          {/* Tab Selector */}
          {tabs.length > 0 && !isLoading && (
            <MotionItem className="mb-6">
              <TabSelector
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                locked={isEditing}
              />
            </MotionItem>
          )}

          {/* Content Editor */}
          {!isLoading && (
            <MotionItem>
              <MarkdownEditor
                documentId={activeDocument?.id || activeTab}
                filename={currentFilename}
                content={currentContent}
                maxLines={100}
                onSave={isUsingFallback ? undefined : handleSave}
                onDelete={!isUsingFallback && activeDocument ? handleDelete : undefined}
                onViewHistory={isUsingFallback ? undefined : () => setIsHistoryOpen(true)}
                onEditingChange={setIsEditing}
                isLoading={isLoadingFallback}
                readOnly={isUsingFallback}
              />
            </MotionItem>
          )}
        </PageTransition>
      </MainContent>

      {/* Settings Modal */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="skills"
      />

      {/* Version History Panel */}
      {activeDocument && (
        <VersionHistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          documentId={activeDocument.id}
          documentTitle={activeDocument.title}
          currentContent={activeDocument.content}
          onRestore={handleRestoreVersion}
        />
      )}

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        category="skills"
        onAddDocument={handleAddDocument}
      />
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--fg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
        </div>
      }
    >
      <SkillsContent />
    </Suspense>
  );
}
