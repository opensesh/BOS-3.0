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
import { useBrainDocuments } from '@/hooks/useBrainDocuments';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings, Plus, Loader2 } from 'lucide-react';
import { listBrandIdentityFiles, getBrandIdentityContent, getBrandIdentityPdfPath, type BrandIdentityFile } from './actions';

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
  
  // Fallback state for reading from .claude/ files
  const [fallbackFiles, setFallbackFiles] = useState<BrandIdentityFile[]>([]);
  const [fallbackContent, setFallbackContent] = useState<Record<string, string>>({});
  const [isLoadingFallback, setIsLoadingFallback] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Try to use database first
  const {
    documents,
    isLoading: isLoadingDb,
    error: dbError,
    activeDocument,
    setActiveDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    restoreVersion,
  } = useBrainDocuments({ category: 'brand-identity' });

  // Determine if we should use fallback
  const shouldUseFallback = !isLoadingDb && (!!dbError || documents.length === 0 || documents.every(d => !d.content));
  const isUsingFallback = hasInitialized && shouldUseFallback;

  // Load fallback files on mount
  useEffect(() => {
    listBrandIdentityFiles()
      .then(files => {
        setFallbackFiles(files);
        setIsLoadingFallback(false);
      })
      .catch(err => {
        console.error('Failed to list brand identity files:', err);
        setIsLoadingFallback(false);
      });
  }, []);

  // Initialize active tab once loading completes
  useEffect(() => {
    if (!isLoadingDb && !isLoadingFallback && !hasInitialized) {
      let initialTab = '';
      
      if (documents.length > 0 && documents.some(d => d.content)) {
        // Use first database document with content
        const firstDocWithContent = documents.find(d => d.content);
        initialTab = firstDocWithContent?.slug || documents[0].slug;
      } else if (fallbackFiles.length > 0) {
        // Use first fallback file
        initialTab = fallbackFiles[0].slug;
      }
      
      setActiveTab(initialTab);
      setHasInitialized(true);
    }
  }, [isLoadingDb, isLoadingFallback, hasInitialized, documents, fallbackFiles]);

  // Load fallback content when active tab changes
  useEffect(() => {
    if (shouldUseFallback && hasInitialized && activeTab) {
      const file = fallbackFiles.find(f => f.slug === activeTab);
      if (!file) return;
      
      if (file.fileType === 'markdown' && !fallbackContent[activeTab]) {
        setIsLoadingFallback(true);
        getBrandIdentityContent(activeTab)
          .then(content => {
            setFallbackContent(prev => ({ ...prev, [activeTab]: content }));
          })
          .catch(err => {
            console.error('Failed to load brand identity content:', err);
            setFallbackContent(prev => ({ 
              ...prev, 
              [activeTab]: `Error loading content for ${activeTab}` 
            }));
          })
          .finally(() => {
            setIsLoadingFallback(false);
          });
      } else if (file.fileType === 'pdf' && !fallbackContent[activeTab]) {
        // Get PDF path
        getBrandIdentityPdfPath(activeTab)
          .then(pdfPath => {
            if (pdfPath) {
              setFallbackContent(prev => ({ ...prev, [activeTab]: `/api/claude/${pdfPath}` }));
            }
          })
          .catch(err => {
            console.error('Failed to get PDF path:', err);
          });
      }
    }
  }, [shouldUseFallback, hasInitialized, activeTab, fallbackFiles, fallbackContent]);

  // Set active document when tab changes (for database mode)
  useEffect(() => {
    if (isUsingFallback || !hasInitialized || !activeTab) return;
    const doc = documents.find(d => d.slug === activeTab);
    if (doc) {
      setActiveDocument(doc);
    }
  }, [activeTab, documents, isUsingFallback, hasInitialized, setActiveDocument]);

  // Generate tabs from documents or fallback (lowercase filename.ext format)
  const tabs = useMemo(() => {
    if (isUsingFallback) {
      return fallbackFiles.map(f => ({
        id: f.slug,
        label: `${f.slug}.${f.fileType === 'pdf' ? 'pdf' : 'md'}`,
      }));
    }
    return documents.map(d => ({
      id: d.slug,
      label: `${d.slug}.md`,
    }));
  }, [isUsingFallback, fallbackFiles, documents]);

  // Get current content and file type
  const currentFile = fallbackFiles.find(f => f.slug === activeTab);
  const currentFileType = isUsingFallback 
    ? (currentFile?.fileType || 'markdown')
    : 'markdown';
  
  const currentContent = isUsingFallback
    ? fallbackContent[activeTab] || ''
    : activeDocument?.content || '';
  
  const currentFilename = isUsingFallback
    ? `${activeTab}.${currentFileType === 'pdf' ? 'pdf' : 'md'}`
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
    const remaining = documents.filter(d => d.id !== activeDocument.id);
    if (remaining.length > 0) {
      setActiveTab(remaining[0].slug);
    } else {
      setActiveTab('');
    }
  }, [activeDocument, deleteDocument, documents]);

  // Handle restore version
  const handleRestoreVersion = useCallback(async (versionNumber: number) => {
    if (!activeDocument) return;
    await restoreVersion(activeDocument.id, versionNumber);
  }, [activeDocument, restoreVersion]);

  // Handle tab change with editing lock
  const handleTabChange = useCallback((tabId: string) => {
    if (!isEditing) {
      setActiveTab(tabId);
    }
  }, [isEditing]);

  // Show loading state
  const showLoading = (isLoadingDb || isLoadingFallback) && !hasInitialized;

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
                    title="Add document"
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
          {showLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
            </div>
          )}

          {/* Tab Selector */}
          {tabs.length > 0 && !showLoading && hasInitialized && activeTab && (
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
          {!showLoading && hasInitialized && activeTab && (
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
                    title={currentFile?.title || activeTab}
                    maxHeight={700}
                  />
                ) : (
                  <MarkdownEditor
                    documentId={activeDocument?.id || activeTab}
                    filename={currentFilename}
                    content={currentContent}
                    maxLines={50}
                    onSave={isUsingFallback ? undefined : handleSave}
                    onDelete={!isUsingFallback && activeDocument ? handleDelete : undefined}
                    onViewHistory={isUsingFallback ? undefined : () => setIsHistoryOpen(true)}
                    onEditingChange={setIsEditing}
                    isLoading={isLoadingFallback}
                    readOnly={isUsingFallback}
                  />
                )}
              </motion.div>
            </AnimatePresence>
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
      {activeDocument && !isUsingFallback && (
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
