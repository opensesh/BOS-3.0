'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MarkdownEditor } from '@/components/brain/MarkdownEditor';
import { TabSelector } from '@/components/brain/TabSelector';
import { FolderTreeNav, BreadcrumbNav, type TreeItem } from '@/components/brain/FolderTreeNav';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Settings, Loader2, FolderTree, X } from 'lucide-react';
import { getPluginContent, listPlugins, getPluginStructure } from './actions';

// Animation variants for content transitions
const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const sidebarVariants = {
  hidden: { x: -300, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

function PluginsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // State
  const [plugins, setPlugins] = useState<{ id: string; label: string }[]>([]);
  const [activePlugin, setActivePlugin] = useState<string>('');
  const [pluginTree, setPluginTree] = useState<TreeItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<TreeItem | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load plugin list on mount
  useEffect(() => {
    listPlugins()
      .then(pluginList => {
        setPlugins(pluginList);
        // Set initial plugin from URL or first in list
        const initialPlugin = tabParam && pluginList.some(p => p.id === tabParam) 
          ? tabParam 
          : pluginList[0]?.id || '';
        setActivePlugin(initialPlugin);
      })
      .catch(err => console.error('Failed to load plugins:', err))
      .finally(() => setIsLoading(false));
  }, [tabParam]);

  // Load plugin structure when active plugin changes
  useEffect(() => {
    if (!activePlugin) return;

    setIsTreeLoading(true);
    setPluginTree(null);
    setSelectedFile(null);

    getPluginStructure(activePlugin)
      .then(structure => {
        if (structure) {
          setPluginTree(structure);
          // Auto-select README.md if it exists at root
          const readme = structure.children?.find(
            child => child.itemType === 'file' && 
            child.slug.toLowerCase().includes('readme')
          );
          if (readme) {
            setSelectedFile(readme);
          } else if (structure.children?.[0]?.itemType === 'file') {
            setSelectedFile(structure.children[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load plugin structure:', err))
      .finally(() => setIsTreeLoading(false));
  }, [activePlugin]);

  // Load file content when selected file changes
  useEffect(() => {
    if (!selectedFile || selectedFile.itemType === 'folder') return;

    const contentKey = `${activePlugin}/${selectedFile.pathSegments?.join('/') || selectedFile.slug}`;
    if (content[contentKey]) return;

    setIsContentLoading(true);
    const filePath = selectedFile.pathSegments?.join('/') || selectedFile.slug;
    
    getPluginContent(activePlugin, filePath)
      .then(fileContent => {
        setContent(prev => ({ ...prev, [contentKey]: fileContent }));
      })
      .catch(err => {
        console.error('Failed to load file content:', err);
        setContent(prev => ({ ...prev, [contentKey]: `Error loading content` }));
      })
      .finally(() => setIsContentLoading(false));
  }, [activePlugin, selectedFile, content]);

  // Generate tabs with lowercase format
  const tabs = useMemo(() => {
    return plugins.map(p => ({
      id: p.id,
      label: p.id.toLowerCase(),
    }));
  }, [plugins]);

  // Handle plugin tab change
  const handlePluginChange = useCallback((pluginId: string) => {
    setActivePlugin(pluginId);
  }, []);

  // Handle file selection from tree
  const handleSelectItem = useCallback((item: TreeItem) => {
    if (item.itemType === 'file') {
      setSelectedFile(item);
      setIsSidebarOpen(false); // Close mobile sidebar
    }
  }, []);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index < 0) {
      // Navigate back to plugin root
      setSelectedFile(null);
    }
  }, []);

  // Current content
  const contentKey = selectedFile 
    ? `${activePlugin}/${selectedFile.pathSegments?.join('/') || selectedFile.slug}`
    : '';
  const currentContent = content[contentKey] || '';
  const currentFilename = selectedFile?.slug?.toLowerCase() || 'readme.md';

  // Current path for breadcrumb
  const currentPath = selectedFile?.pathSegments || [];

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />

      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-10 lg:px-12 lg:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--fg-primary)]">
                Plugins
              </h1>
              <div className="flex items-center gap-2">
                {/* Mobile tree toggle */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                  title="Toggle file tree"
                >
                  <FolderTree className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                  title="Brain Settings"
                >
                  <Settings className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                </button>
              </div>
            </div>
            <p className="text-sm md:text-base lg:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              Complete capability packages combining commands, agents, and skills.
            </p>
          </MotionItem>

          {/* Plugin Tab Selector */}
          {tabs.length > 0 && !isLoading && (
            <MotionItem className="mb-6">
              <TabSelector
                tabs={tabs}
                activeTab={activePlugin}
                onChange={handlePluginChange}
              />
            </MotionItem>
          )}

          {/* Loading State */}
          {(isLoading || isTreeLoading) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
            </div>
          )}

          {/* Main Content Area */}
          {!isLoading && !isTreeLoading && pluginTree && (
            <MotionItem>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Desktop Sidebar - File Tree */}
                <div className="hidden lg:block w-64 flex-shrink-0">
                  <div className="sticky top-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4">
                    <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-3 px-2">
                      files
                    </h3>
                    <FolderTreeNav
                      tree={pluginTree}
                      selectedId={selectedFile?.id}
                      onSelect={handleSelectItem}
                      showRoot={false}
                      initialExpanded={[pluginTree.id]}
                    />
                  </div>
                </div>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                      />
                      <motion.div
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ 
                          type: 'spring', 
                          damping: 30, 
                          stiffness: 300,
                        }}
                        className="fixed left-0 top-0 bottom-0 w-72 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] z-50 lg:hidden overflow-y-auto"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-[var(--fg-primary)]">
                              files
                            </h3>
                            <button
                              onClick={() => setIsSidebarOpen(false)}
                              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <FolderTreeNav
                            tree={pluginTree}
                            selectedId={selectedFile?.id}
                            onSelect={handleSelectItem}
                            showRoot={false}
                            initialExpanded={[pluginTree.id]}
                          />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                  {/* Breadcrumb */}
                  {selectedFile && currentPath.length > 0 && (
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <BreadcrumbNav
                        pathSegments={currentPath}
                        rootLabel={activePlugin.toLowerCase()}
                        onNavigate={handleBreadcrumbNavigate}
                      />
                    </motion.div>
                  )}

                  {/* File Content with animated transitions */}
                  <AnimatePresence mode="wait">
                    {selectedFile ? (
                      <motion.div
                        key={selectedFile.id}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <MarkdownEditor
                          documentId={selectedFile.id}
                          filename={currentFilename}
                          content={currentContent}
                          maxLines={100}
                          isLoading={isContentLoading}
                          readOnly={true}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 text-center"
                      >
                        <FolderTree className="w-12 h-12 mx-auto mb-4 text-[var(--fg-tertiary)]" />
                        <p className="text-[var(--fg-secondary)]">
                          Select a file from the tree to view its contents
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </MotionItem>
          )}

          {/* Empty State */}
          {!isLoading && !isTreeLoading && !pluginTree && plugins.length > 0 && (
            <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 text-center">
              <FolderTree className="w-12 h-12 mx-auto mb-4 text-[var(--fg-tertiary)]" />
              <p className="text-[var(--fg-secondary)]">
                No files found in this plugin
              </p>
            </div>
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
