'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownEditor } from '@/components/brain/MarkdownEditor';
import { PDFViewer } from '@/components/brain/PDFViewer';
import { TabSelector } from '@/components/brain/TabSelector';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { VersionHistoryPanel } from '@/components/brain/VersionHistoryPanel';
import { AddDocumentModal } from '@/components/brain/AddDocumentModal';
import { useBrainBrandIdentity } from '@/hooks/useBrainBrandIdentity';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings, Plus, Loader2 } from 'lucide-react';
import { SyncStatusIndicator } from '@/components/brain/SyncStatusIndicator';

// Animation variants for content transitions
const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function BrandIdentityPage() {
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    documents,
    isLoading,
    isSeeding,
    error,
    activeDocument,
    setActiveDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    fetchDocuments,
  } = useBrainBrandIdentity({ autoSeed: true });

  // Set initial active tab when documents load
  useEffect(() => {
    if (documents.length > 0 && !activeTab) {
      setActiveTab(documents[0].slug);
    }
  }, [documents, activeTab]);

  // Set active document when tab changes
  useEffect(() => {
    const doc = documents.find(d => d.slug === activeTab);
    if (doc) {
      setActiveDocument(doc);
    }
  }, [activeTab, documents, setActiveDocument]);

  // Generate tabs with lowercase filename.ext format
  const tabs = useMemo(() => {
    return documents.map(d => ({
      id: d.slug,
      label: `${d.slug}.${d.fileType === 'pdf' ? 'pdf' : 'md'}`,
    }));
  }, [documents]);

  // Get current content based on file type
  const currentFileType = activeDocument?.fileType || 'markdown';
  const currentContent = currentFileType === 'pdf'
    ? activeDocument?.publicUrl || activeDocument?.storagePath || ''
    : activeDocument?.content || '';
  const currentFilename = `${activeDocument?.slug || 'document'}.${currentFileType === 'pdf' ? 'pdf' : 'md'}`;

  // Handle save
  const handleSave = useCallback(async (content: string) => {
    if (!activeDocument) return;
    await updateDocument(activeDocument.id, { content });
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
    } else {
      setActiveTab('');
    }
  }, [activeDocument, deleteDocument, documents]);

  // Handle tab change with editing lock
  const handleTabChange = useCallback((tabId: string) => {
    if (!isEditing) {
      setActiveTab(tabId);
    }
  }, [isEditing]);

  // Show loading/seeding state
  const showLoading = isLoading || isSeeding;

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
                <SyncStatusIndicator compact />
                <motion.button
                  onClick={() => setIsAddModalOpen(true)}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Add document"
                  aria-label="Add brand identity document"
                >
                  <Plus className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                </motion.button>
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
            </p>
          </MotionItem>

          {/* Loading/Seeding State */}
          {showLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
              {isSeeding && (
                <p className="text-sm text-[var(--fg-tertiary)]">
                  Initializing brand documents...
                </p>
              )}
            </div>
          )}

          {/* Error State */}
          {error && !showLoading && (
            <div className="rounded-xl bg-[var(--bg-error-subtle)] border border-[var(--border-error)] p-6 text-center">
              <p className="text-[var(--fg-error-primary)]">{error}</p>
              <button
                onClick={() => fetchDocuments()}
                className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Content */}
          {!showLoading && !error && (
            <>
              {/* Tab Selector */}
              {tabs.length > 0 && (
                <MotionItem className="mb-6">
                  <TabSelector
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={handleTabChange}
                    locked={isEditing}
                  />
                </MotionItem>
              )}

              {/* Content Viewer with animated transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  {currentFileType === 'pdf' ? (
                    <PDFViewer
                      url={currentContent}
                      filename={currentFilename}
                      title={activeDocument?.title}
                      fileSize={activeDocument?.fileSize}
                      maxHeight={700}
                    />
                  ) : (
                    <MarkdownEditor
                      documentId={activeDocument?.id || activeTab}
                      filename={currentFilename}
                      content={currentContent}
                      maxLines={50}
                      onSave={handleSave}
                      onDelete={activeDocument ? handleDelete : undefined}
                      onViewHistory={() => setIsHistoryOpen(true)}
                      onEditingChange={setIsEditing}
                      isLoading={isLoading}
                      readOnly={false}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Empty State */}
              {documents.length === 0 && (
                <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 text-center">
                  <p className="text-[var(--fg-tertiary)] mb-4">
                    No brand identity documents found.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid-hover)] transition-colors"
                  >
                    Add Document
                  </button>
                </div>
              )}
            </>
          )}
        </PageTransition>
      </MainContent>

      {/* Settings Modal */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSection="guidelines"
      />

      {/* Version History Panel */}
      {activeDocument && activeDocument.fileType !== 'pdf' && (
        <VersionHistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          documentId={activeDocument.id}
          documentTitle={activeDocument.title}
          currentContent={activeDocument.content}
          onRestore={async (versionNumber: number) => {
            // TODO: Implement version restore for new tables
            console.log('Restore version:', versionNumber);
          }}
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
