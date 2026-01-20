'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useResources } from '@/hooks/useResources';
import { useCategoryLastUpdated, type CategoryTimestamps } from '@/hooks/useCategoryLastUpdated';
import { AddResourceModal } from '@/components/brand-hub/AddResourceModal';
import { ResourcesDrawer } from '@/components/ui/ResourcesDrawer';
import { ProjectStyleCard } from '@/components/ui/ProjectStyleCard';
import { BrandResource } from '@/types';
import { PageTransition, MotionItem, staggerContainer, fadeInUp } from '@/lib/motion';
import {
  Fingerprint,
  Palette,
  Type,
  ImageIcon,
  FileText,
  Braces,
  Layers,
  Library,
} from 'lucide-react';

const brandHubItems = [
  {
    id: 'logo',
    title: 'Logo',
    description: 'Brand marks, lockups, and usage guidelines',
    href: '/brand-hub/logo',
    icon: Fingerprint,
    iconLabel: 'Logo',
    timestampKey: 'logo' as keyof CategoryTimestamps,
  },
  {
    id: 'colors',
    title: 'Colors',
    description: 'Brand palette and color tokens',
    href: '/brand-hub/colors',
    icon: Palette,
    iconLabel: 'Colors',
    timestampKey: 'colors' as keyof CategoryTimestamps,
  },
  {
    id: 'fonts',
    title: 'Typography',
    description: 'Type system and font specimens',
    href: '/brand-hub/fonts',
    icon: Type,
    iconLabel: 'Typography',
    timestampKey: 'fonts' as keyof CategoryTimestamps,
  },
  {
    id: 'art-direction',
    title: 'Art Direction',
    description: 'Visual language and imagery',
    href: '/brand-hub/art-direction',
    icon: ImageIcon,
    iconLabel: 'Art',
    timestampKey: 'artDirection' as keyof CategoryTimestamps,
  },
  {
    id: 'textures',
    title: 'Textures',
    description: 'Patterns and surface treatments',
    href: '/brand-hub/textures',
    icon: Layers,
    iconLabel: 'Textures',
    timestampKey: 'textures' as keyof CategoryTimestamps,
  },
  {
    id: 'guidelines',
    title: 'Guidelines',
    description: 'Complete brand documentation',
    href: '/brand-hub/guidelines',
    icon: FileText,
    iconLabel: 'Docs',
    timestampKey: 'guidelines' as keyof CategoryTimestamps,
  },
  {
    id: 'design-tokens',
    title: 'Tokens',
    description: 'Portable styles package for AI tools',
    href: '/brand-hub/design-tokens',
    icon: Braces,
    iconLabel: 'Tokens',
    timestampKey: 'tokens' as keyof CategoryTimestamps,
  },
];

// Calculate dynamic min-height based on card count
const getCardMinHeight = (cardCount: number, columns: number) => {
  const rows = Math.ceil(cardCount / columns);
  if (rows <= 2) return '200px';
  if (rows === 3) return '160px';
  return '140px';
};

export default function BrandHubPage() {
  const { resources, isLoaded, addResource, deleteResource, updateResource } = useResources();
  const { timestamps } = useCategoryLastUpdated();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResourcesDrawerOpen, setIsResourcesDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BrandResource | undefined>();

  // Calculate min card height based on number of cards (4 columns on xl)
  const minCardHeight = getCardMinHeight(brandHubItems.length, 4);

  const handleEditResource = (resource: BrandResource) => {
    setEditingResource(resource);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingResource(undefined);
  };

  const handleAddFromDrawer = () => {
    setIsResourcesDrawerOpen(false);
    setIsAddModalOpen(true);
  };

  const handleEditFromDrawer = (resource: BrandResource | { id: string; name: string; url: string }) => {
    setIsResourcesDrawerOpen(false);
    const brandResource = resources.find(r => r.id === resource.id);
    if (brandResource) {
      handleEditResource(brandResource);
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
                  Brand Hub
                </h1>
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
              </div>
              <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
                Your central hub for brand assets, guidelines, and creative resources.
                Everything you need to build on-brand experiences.
              </p>
            </MotionItem>

            {/* Cards Grid - compact with 4 columns on xl */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {brandHubItems.map((item, index) => (
                <motion.div key={item.id} variants={fadeInUp} custom={index}>
                  <ProjectStyleCard
                    href={item.href}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    iconLabel={item.iconLabel}
                    lastUpdated={timestamps[item.timestampKey]}
                    minHeight={minCardHeight}
                  />
                </motion.div>
              ))}
            </motion.div>
          </PageTransition>
        </div>
      </MainContent>

      {/* Add/Edit Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
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
        title="Brand Resources"
      />
    </div>
  );
}
