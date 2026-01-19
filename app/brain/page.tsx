'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { AddBrainResourceModal } from '@/components/brain/AddBrainResourceModal';
import { ResourcesDrawer } from '@/components/ui/ResourcesDrawer';
import { useBrainResources, BrainResource } from '@/hooks/useBrainResources';
import { useCategoryLastUpdated, type CategoryTimestamps } from '@/hooks/useCategoryLastUpdated';
import { ProjectStyleCard } from '@/components/ui/ProjectStyleCard';
import { PageTransition, MotionItem, staggerContainer, fadeInUp } from '@/lib/motion';
import {
  Settings,
  FolderTree,
  BookOpen,
  PenTool,
  Zap,
  Puzzle,
  Bot,
  Github,
  Library,
} from 'lucide-react';

// Cards for subpages
const brainPages = [
  {
    id: 'architecture',
    title: 'Architecture',
    description: 'System structure and AI configuration',
    href: '/brain/architecture',
    icon: FolderTree,
    iconLabel: 'System',
    timestampKey: 'architecture' as keyof CategoryTimestamps,
  },
  {
    id: 'brand-identity',
    title: 'Brand Identity',
    description: 'Identity, messaging, and art direction',
    href: '/brain/brand-identity',
    icon: BookOpen,
    iconLabel: 'Identity',
    timestampKey: 'brandIdentity' as keyof CategoryTimestamps,
  },
  {
    id: 'writing-styles',
    title: 'Writing Styles',
    description: 'Voice and tone guidelines',
    href: '/brain/writing-styles',
    icon: PenTool,
    iconLabel: 'Writing',
    timestampKey: 'writingStyles' as keyof CategoryTimestamps,
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'System capabilities and configuration',
    href: '/brain/skills',
    icon: Zap,
    iconLabel: 'Skills',
    timestampKey: 'skills' as keyof CategoryTimestamps,
  },
  {
    id: 'plugins',
    title: 'Plugins',
    description: 'Complete capability packages',
    href: '/brain/plugins',
    icon: Puzzle,
    iconLabel: 'Plugins',
    timestampKey: 'plugins' as keyof CategoryTimestamps,
  },
  {
    id: 'agents',
    title: 'Agents',
    description: 'Autonomous AI workflows',
    href: '/brain/agents',
    icon: Bot,
    iconLabel: 'Agents',
    timestampKey: 'agents' as keyof CategoryTimestamps,
  },
];

export default function BrainPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isResourcesDrawerOpen, setIsResourcesDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BrainResource | undefined>();

  const { resources, isLoaded, addResource, deleteResource, updateResource } = useBrainResources();
  const { timestamps } = useCategoryLastUpdated();

  const handleEditResource = (resource: BrainResource) => {
    setEditingResource(resource);
    setIsAddResourceOpen(true);
  };

  const handleCloseResourceModal = () => {
    setIsAddResourceOpen(false);
    setEditingResource(undefined);
  };

  const handleAddFromDrawer = () => {
    setIsResourcesDrawerOpen(false);
    setIsAddResourceOpen(true);
  };

  const handleEditFromDrawer = (resource: BrainResource | { id: string; name: string; url: string }) => {
    setIsResourcesDrawerOpen(false);
    // Type guard to ensure we have a BrainResource
    const brainResource = resources.find(r => r.id === resource.id);
    if (brainResource) {
      handleEditResource(brainResource);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      
      <MainContent className="overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
            {/* Page Header */}
            <MotionItem className="flex flex-col gap-2 mb-10">
              <div className="flex items-start justify-between w-full">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)]">
                  Brain
                </h1>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setIsResourcesDrawerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Resources"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Library className="w-4 h-4 text-[var(--fg-tertiary)]" />
                    <span className="text-sm font-medium text-[var(--fg-secondary)]">Resources</span>
                    {isLoaded && resources.length > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded-md bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]">
                        {resources.length}
                      </span>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      // Placeholder - will be implemented later
                      console.log('Connect to GitHub clicked');
                    }}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Connect to GitHub"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  </motion.button>
                  <motion.button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Brain Settings"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  </motion.button>
                </div>
              </div>
              <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
                Your brand&apos;s AI knowledge center. Configure Claude with your brand identity,
                messaging, and writing styles for consistent, on-brand content generation.
              </p>
            </MotionItem>

            {/* Cards Grid - compact with 3 columns on desktop */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {brainPages.map((page, index) => (
                <motion.div key={page.id} variants={fadeInUp} custom={index}>
                  <ProjectStyleCard
                    href={page.href}
                    title={page.title}
                    description={page.description}
                    icon={page.icon}
                    iconLabel={page.iconLabel}
                    lastUpdated={timestamps[page.timestampKey]}
                  />
                </motion.div>
              ))}
            </motion.div>
          </PageTransition>
        </div>
      </MainContent>

      {/* Settings Modal */}
      <BrainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Add/Edit Resource Modal */}
      <AddBrainResourceModal
        isOpen={isAddResourceOpen}
        onClose={handleCloseResourceModal}
        onAddResource={addResource}
        editResource={editingResource}
        onUpdateResource={updateResource}
      />

      {/* Resources Drawer */}
      <ResourcesDrawer
        isOpen={isResourcesDrawerOpen}
        onClose={() => setIsResourcesDrawerOpen(false)}
        resources={resources}
        onAddResource={handleAddFromDrawer}
        onEditResource={handleEditFromDrawer}
        onDeleteResource={deleteResource}
        title="Brain Resources"
      />
    </div>
  );
}
