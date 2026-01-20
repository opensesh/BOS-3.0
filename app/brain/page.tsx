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
  Library,
  Terminal,
  FileText,
  Plug,
  Database,
} from 'lucide-react';

// Brain page card type
interface BrainPageCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconLabel: string;
  timestampKey: keyof CategoryTimestamps;
}

// Category section type
interface CategorySection {
  id: string;
  title: string;
  description: string;
  pages: BrainPageCard[];
}

// Organized by category: Brand, Tools, Reference, System
const brainCategories: CategorySection[] = [
  {
    id: 'brand',
    title: 'Brand',
    description: 'Identity, messaging, and creative direction',
    pages: [
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
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    description: 'Developer capabilities and automation',
    pages: [
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
        id: 'skills',
        title: 'Skills',
        description: 'Auto-activating knowledge modules',
        href: '/brain/skills',
        icon: Zap,
        iconLabel: 'Skills',
        timestampKey: 'skills' as keyof CategoryTimestamps,
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
      {
        id: 'commands',
        title: 'Commands',
        description: 'Slash commands for quick actions',
        href: '/brain/commands',
        icon: Terminal,
        iconLabel: 'Commands',
        timestampKey: 'commands' as keyof CategoryTimestamps,
      },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    description: 'Documentation and data sources',
    pages: [
      {
        id: 'design-system',
        title: 'Design System',
        description: 'UI components and patterns',
        href: '/brain/reference/design-system',
        icon: FileText,
        iconLabel: 'Docs',
        timestampKey: 'designSystem' as keyof CategoryTimestamps,
      },
      {
        id: 'mcp-setup',
        title: 'MCP Setup',
        description: 'Model Context Protocol configuration',
        href: '/brain/reference/mcp-setup',
        icon: Plug,
        iconLabel: 'MCP',
        timestampKey: 'mcpSetup' as keyof CategoryTimestamps,
      },
      {
        id: 'data',
        title: 'Data Sources',
        description: 'Reference data and external sources',
        href: '/brain/reference/data',
        icon: Database,
        iconLabel: 'Data',
        timestampKey: 'data' as keyof CategoryTimestamps,
      },
    ],
  },
  {
    id: 'system',
    title: 'System',
    description: 'Auto-generated configuration',
    pages: [
      {
        id: 'architecture',
        title: 'Architecture',
        description: 'System structure and AI configuration',
        href: '/brain/architecture',
        icon: FolderTree,
        iconLabel: 'System',
        timestampKey: 'architecture' as keyof CategoryTimestamps,
      },
    ],
  },
];


export default function BrainPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isResourcesDrawerOpen, setIsResourcesDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BrainResource | undefined>();

  const { resources, isLoaded, addResource, deleteResource, updateResource, getCategories } = useBrainResources();
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
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Resources"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Library className="w-5 h-5 text-[var(--fg-tertiary)]" />
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

            {/* Category Sections */}
            <div className="space-y-10">
              {brainCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.id}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={categoryIndex}
                >
                  {/* Category Header */}
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[var(--fg-primary)]">
                      {category.title}
                    </h2>
                    <p className="text-sm text-[var(--fg-tertiary)]">
                      {category.description}
                    </p>
                  </div>

                  {/* Category Cards Grid */}
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {category.pages.map((page, pageIndex) => (
                      <motion.div key={page.id} variants={fadeInUp} custom={pageIndex}>
                        <ProjectStyleCard
                          href={page.href}
                          title={page.title}
                          description={page.description}
                          icon={page.icon}
                          iconLabel={page.iconLabel}
                          lastUpdated={timestamps[page.timestampKey]}
                          minHeight="140px"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ))}
            </div>
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
        existingCategories={getCategories()}
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
