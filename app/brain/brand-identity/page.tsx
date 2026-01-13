'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import { Settings, Plus, Loader2, FileText, FileCode } from 'lucide-react';
import { SyncStatusIndicator } from '@/components/brain/SyncStatusIndicator';
import type { BrainBrandIdentity } from '@/lib/supabase/types';

// Fallback data for when database is not seeded
// Includes both Markdown and PDF files
const FALLBACK_DOCUMENTS: Array<{
  id: string;
  slug: string;
  label: string;
  file: string;
  path: string;
  fileType: 'markdown' | 'pdf';
}> = [
  { 
    id: 'brand-identity', 
    slug: 'brand-identity', 
    label: 'Brand Identity', 
    file: 'OS_brand identity.md', 
    path: '/api/claude/brand-identity/OS_brand identity.md',
    fileType: 'markdown',
  },
  { 
    id: 'brand-identity-pdf', 
    slug: 'brand-identity-pdf', 
    label: 'Brand Identity (PDF)', 
    file: 'OS_Brand Identity.pdf', 
    path: '/api/claude/brand-identity/OS_Brand Identity.pdf',
    fileType: 'pdf',
  },
  { 
    id: 'brand-messaging', 
    slug: 'brand-messaging', 
    label: 'Brand Messaging', 
    file: 'OS_brand messaging.md', 
    path: '/api/claude/brand-identity/OS_brand messaging.md',
    fileType: 'markdown',
  },
  { 
    id: 'brand-messaging-pdf', 
    slug: 'brand-messaging-pdf', 
    label: 'Brand Messaging (PDF)', 
    file: 'OS_brand messaging.pdf', 
    path: '/api/claude/brand-identity/OS_brand messaging.pdf',
    fileType: 'pdf',
  },
  { 
    id: 'art-direction', 
    slug: 'art-direction', 
    label: 'Art Direction', 
    file: 'OS_art direction.md', 
    path: '/api/claude/brand-identity/OS_art direction.md',
    fileType: 'markdown',
  },
  { 
    id: 'art-direction-pdf', 
    slug: 'art-direction-pdf', 
    label: 'Art Direction (PDF)', 
    file: 'OS_art direction.pdf', 
    path: '/api/claude/brand-identity/OS_art direction.pdf',
    fileType: 'pdf',
  },
];

// Custom tab with file type badge
interface DocumentTab {
  id: string;
  label: string;
  fileType?: 'markdown' | 'pdf';
}

export default function BrandIdentityPage() {
  const [activeTab, setActiveTab] = useState('brand-identity');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fallbackContent, setFallbackContent] = useState<Record<string, string>>({});
  const [isUsingFallback, setIsUsingFallback] = useState(false);
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
    fetchDocuments,
  } = useBrainBrandIdentity();

  // Check if we need to use fallback (database not seeded or empty documents)
  useEffect(() => {
    if (!isLoading && (error || documents.length === 0)) {
      setIsUsingFallback(true);
      // Load fallback content from static files (only markdown)
      FALLBACK_DOCUMENTS.forEach(doc => {
        if (doc.fileType === 'markdown') {
          fetch(doc.path)
            .then(res => res.text())
            .then(text => {
              setFallbackContent(prev => ({ ...prev, [doc.slug]: text }));
            })
            .catch(err => console.error('Failed to load fallback:', err));
        }
      });
    } else {
      setIsUsingFallback(false);
    }
  }, [isLoading, error, documents]);

  // Set active document when tab changes
  useEffect(() => {
    if (isUsingFallback) {
      return;
    }
    const doc = documents.find(d => d.slug === activeTab);
    if (doc) {
      setActiveDocument(doc);
    }
  }, [activeTab, documents, isUsingFallback, setActiveDocument]);

  // Generate tabs from documents or fallback
  const tabs: DocumentTab[] = isUsingFallback
    ? FALLBACK_DOCUMENTS.map(d => ({ 
        id: d.slug, 
        label: d.label,
        fileType: d.fileType,
      }))
    : documents.map(d => ({ 
        id: d.slug, 
        label: d.title,
        fileType: d.fileType,
      }));

  // Get current document info
  const currentFallbackDoc = FALLBACK_DOCUMENTS.find(d => d.slug === activeTab);
  const currentFileType = isUsingFallback
    ? currentFallbackDoc?.fileType || 'markdown'
    : activeDocument?.fileType || 'markdown';

  const currentContent = isUsingFallback
    ? (currentFileType === 'pdf' 
        ? currentFallbackDoc?.path || '' 
        : fallbackContent[activeTab] || 'Loading...')
    : (activeDocument?.fileType === 'pdf' 
        ? activeDocument?.publicUrl || activeDocument?.storagePath || ''
        : activeDocument?.content || '');

  const currentFilename = isUsingFallback
    ? currentFallbackDoc?.file || 'document.md'
    : activeDocument?.fileType === 'pdf'
      ? `${activeDocument?.slug || 'document'}.pdf`
      : `${activeDocument?.slug || 'document'}.md`;

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
    }
  }, [activeDocument, deleteDocument, documents]);

  // Custom tab renderer with file type badge
  const renderTab = useCallback((tab: DocumentTab, isActive: boolean) => {
    const isPdf = tab.fileType === 'pdf';
    return (
      <div className="flex items-center gap-2">
        {isPdf ? (
          <FileText className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>{tab.label}</span>
      </div>
    );
  }, []);

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
                {!isUsingFallback && <SyncStatusIndicator compact />}
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

          {/* Tab Selector with File Type Badges */}
          {tabs.length > 0 && (
            <MotionItem className="mb-6">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  const isPdf = tab.fileType === 'pdf';
                  
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => !isEditing && setActiveTab(tab.id)}
                      disabled={isEditing}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] border border-[var(--border-brand)]' 
                          : 'bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                        }
                        ${isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      whileHover={!isEditing ? { scale: 1.02 } : {}}
                      whileTap={!isEditing ? { scale: 0.98 } : {}}
                    >
                      <span className={`p-1 rounded ${isPdf ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                        {isPdf ? (
                          <FileText className="w-3 h-3 text-red-400" />
                        ) : (
                          <FileCode className="w-3 h-3 text-emerald-400" />
                        )}
                      </span>
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </MotionItem>
          )}

          {/* Content Viewer - switches between Markdown and PDF */}
          <MotionItem>
            {currentFileType === 'pdf' ? (
              <PDFViewer
                url={currentContent}
                filename={currentFilename}
                title={isUsingFallback 
                  ? currentFallbackDoc?.label 
                  : activeDocument?.title
                }
                fileSize={activeDocument?.fileSize}
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
                isLoading={isLoading}
                readOnly={isUsingFallback}
              />
            )}
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
