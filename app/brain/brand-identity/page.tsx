'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

// Fallback data for when database is not seeded
const FALLBACK_DOCUMENTS = [
  { id: 'brand-identity', slug: 'brand-identity', label: 'Brand Identity', file: 'OS_brand identity.md', path: '/claude-data/knowledge/core/OS_brand identity.md' },
  { id: 'brand-messaging', slug: 'brand-messaging', label: 'Brand Messaging', file: 'OS_brand messaging.md', path: '/claude-data/knowledge/core/OS_brand messaging.md' },
  { id: 'art-direction', slug: 'art-direction', label: 'Art Direction', file: 'OS_art direction.md', path: '/claude-data/knowledge/core/OS_art direction.md' },
];

export default function BrandIdentityPage() {
  const [activeTab, setActiveTab] = useState('brand-identity');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fallbackContent, setFallbackContent] = useState<Record<string, string>>({});
  const [isUsingFallback, setIsUsingFallback] = useState(false);

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
    fetchDocuments,
  } = useBrainDocuments({ category: 'brand-identity' });

  // Check if we need to use fallback (database not seeded or empty documents)
  useEffect(() => {
    if (!isLoading && (error || documents.length === 0 || documents.every(d => !d.content))) {
      setIsUsingFallback(true);
      // Load fallback content from static files
      FALLBACK_DOCUMENTS.forEach(doc => {
        fetch(doc.path)
          .then(res => res.text())
          .then(text => {
            setFallbackContent(prev => ({ ...prev, [doc.slug]: text }));
          })
          .catch(err => console.error('Failed to load fallback:', err));
      });
    } else {
      setIsUsingFallback(false);
    }
  }, [isLoading, error, documents]);

  // Set active document when tab changes
  useEffect(() => {
    if (isUsingFallback) {
      // For fallback mode, we don't have real documents
      return;
    }
    const doc = documents.find(d => d.slug === activeTab);
    if (doc) {
      setActiveDocument(doc);
    }
  }, [activeTab, documents, isUsingFallback, setActiveDocument]);

  // Generate tabs from documents or fallback
  const tabs = isUsingFallback
    ? FALLBACK_DOCUMENTS.map(d => ({ id: d.slug, label: d.label }))
    : documents.map(d => ({ id: d.slug, label: d.title }));

  // Get current content
  const currentContent = isUsingFallback
    ? fallbackContent[activeTab] || 'Loading...'
    : activeDocument?.content || '';

  const currentFilename = isUsingFallback
    ? FALLBACK_DOCUMENTS.find(d => d.slug === activeTab)?.file || 'document.md'
    : `${activeDocument?.slug || 'document'}.md`;

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
    // Switch to first available tab
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
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
                Brand Identity
              </h1>
              <div className="flex items-center gap-2">
                {!isUsingFallback && (
                  <motion.button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Add"
                    aria-label="Add brand identity document"
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
              Core brand documentation that defines your identity, messaging, and visual direction.
              {isUsingFallback && (
                <span className="block mt-2 text-sm text-[var(--fg-warning-primary)]">
                  Viewing static files. Connect to database to enable editing.
                </span>
              )}
            </p>
          </MotionItem>

          {/* Loading State */}
          {isLoading && !isUsingFallback && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
            </div>
          )}

          {/* Tab Selector */}
          {tabs.length > 0 && (
            <MotionItem className="mb-6">
              <TabSelector
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </MotionItem>
          )}

          {/* Content Editor */}
          <MotionItem>
            <MarkdownEditor
              documentId={activeDocument?.id || activeTab}
              filename={currentFilename}
              content={currentContent}
              maxLines={50}
              onSave={isUsingFallback ? undefined : handleSave}
              onDelete={!isUsingFallback && activeDocument && !activeDocument.isSystem ? handleDelete : undefined}
              onViewHistory={isUsingFallback ? undefined : () => setIsHistoryOpen(true)}
              isLoading={isLoading}
              readOnly={isUsingFallback}
            />
          </MotionItem>
        </PageTransition>
      </MainContent>

      {/* Settings Modal */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="guidelines"
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
        category="brand-identity"
        onAddDocument={handleAddDocument}
      />
    </div>
  );
}
