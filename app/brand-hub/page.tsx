'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useResources } from '@/hooks/useResources';
import { useCategoryLastUpdated, type CategoryTimestamps } from '@/hooks/useCategoryLastUpdated';
import { AddResourceModal, ResourceIconPreview } from '@/components/brand-hub/AddResourceModal';
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
  Plus,
  ExternalLink,
  Trash2,
  Pencil
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

// Compact Resource Card
function ResourceCard({ 
  resource, 
  onDelete,
  onEdit
}: { 
  resource: BrandResource; 
  onDelete: (id: string) => void;
  onEdit: (resource: BrandResource) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] hover:border-[var(--border-brand)] hover:bg-[var(--bg-secondary)] transition-all"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Icon - fixed size square container */}
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex-shrink-0 text-[var(--fg-tertiary)]">
        <ResourceIconPreview 
          type={resource.icon} 
          lucideIconName={resource.lucideIconName}
          customIconUrl={resource.customIconUrl}
          size="md" 
        />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-display font-medium text-[var(--fg-primary)] truncate group-hover:text-[var(--fg-brand-primary)] transition-colors">
          {resource.name}
        </h4>
        <p className="text-xs text-[var(--fg-tertiary)] truncate">
          {new URL(resource.url).hostname}
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      
      {/* Edit and Delete buttons */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(resource);
            }}
            className="p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-brand-solid)] hover:border-[var(--border-brand-solid)] text-[var(--fg-tertiary)] hover:text-white transition-all shadow-lg"
            aria-label="Edit resource"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(resource.id);
            }}
            className="p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-error-solid)] hover:border-[var(--border-error-solid)] text-[var(--fg-tertiary)] hover:text-white transition-all shadow-lg"
            aria-label="Delete resource"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </a>
  );
}

// Add Resource Card
function AddResourceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 hover:border-[var(--border-brand-solid)] hover:bg-[var(--bg-secondary)]/50 transition-all w-16 h-16 cursor-pointer active:scale-95"
      title="Add Resource"
    >
      <Plus className="w-6 h-6 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] group-hover:scale-110 transition-all pointer-events-none" />
    </button>
  );
}

export default function BrandHubPage() {
  const { resources, isLoaded, addResource, deleteResource, updateResource } = useResources();
  const { timestamps } = useCategoryLastUpdated();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BrandResource | undefined>();

  const handleEditResource = (resource: BrandResource) => {
    setEditingResource(resource);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingResource(undefined);
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
                {/* Spacer to match Brain page structure if button is added later */}
                <div className="w-10 h-10"></div>
              </div>
              <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
                Your central hub for brand assets, guidelines, and creative resources. 
                Everything you need to build on-brand experiences.
              </p>
            </MotionItem>

            {/* Cards Grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10"
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
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Resources Section */}
            <MotionItem>
              <section>
                <h2 className="text-xl font-display font-semibold text-[var(--fg-primary)] mb-4">
                  Resources
                </h2>
                <motion.div 
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {isLoaded && resources.map((resource, index) => (
                    <motion.div key={resource.id} variants={fadeInUp} custom={index}>
                      <ResourceCard 
                        resource={resource} 
                        onDelete={deleteResource}
                        onEdit={handleEditResource}
                      />
                    </motion.div>
                  ))}
                  <motion.div variants={fadeInUp}>
                    <AddResourceCard onClick={() => setIsAddModalOpen(true)} />
                  </motion.div>
                </motion.div>
              </section>
            </MotionItem>
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
    </div>
  );
}
