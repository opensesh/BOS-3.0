'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { BrainSettingsModal } from '@/components/brain/BrainSettingsModal';
import { AddBrainResourceModal } from '@/components/brain/AddBrainResourceModal';
import { useBrainResources, BrainResource } from '@/hooks/useBrainResources';
import { PageTransition, MotionItem, staggerContainer, fadeInUp } from '@/lib/motion';
import { Icon } from '@/components/ui/Icon';
import {
  Settings,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  FolderTree,
  BookOpen,
  PenTool,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

// Bento cards for subpages
const brainPages = [
  {
    id: 'architecture',
    title: 'Architecture',
    description: 'System structure and AI configuration',
    href: '/brain/architecture',
    icon: FolderTree,
  },
  {
    id: 'brand-identity',
    title: 'Brand Identity',
    description: 'Identity, messaging, and art direction',
    href: '/brain/brand-identity',
    icon: BookOpen,
  },
  {
    id: 'writing-styles',
    title: 'Writing Styles',
    description: 'Voice and tone guidelines',
    href: '/brain/writing-styles',
    icon: PenTool,
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'System capabilities and configuration',
    href: '/brain/skills',
    icon: Zap,
  },
];

// Helper to render icon by name (supports both Lucide and Font Awesome)
function ResourceIconPreview({ iconName }: { iconName?: string }) {
  return <Icon name={iconName || 'Link'} className="w-5 h-5" />;
}

// Resource Card Component
function ResourceCard({ 
  resource, 
  onDelete,
  onEdit
}: { 
  resource: BrainResource; 
  onDelete: (id: string) => void;
  onEdit: (resource: BrainResource) => void;
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
        <ResourceIconPreview iconName={resource.iconName} />
      </div>
      
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-display font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors">
          {resource.name}
        </h4>
        <p className="text-xs text-[var(--fg-tertiary)] truncate">
          {new URL(resource.url).hostname}
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      
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

// Add Resource Card - Accessible with all states
// Fixed 64x64 square on tablet/desktop, full-width on mobile
function AddResourceCard({ 
  onClick, 
  isDisabled = false 
}: { 
  onClick: () => void;
  isDisabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Add new resource"
      aria-disabled={isDisabled}
      className={`
        group flex items-center justify-center rounded-xl 
        border-2 border-dashed transition-all duration-200
        w-full h-[60px] sm:w-16 sm:h-16 sm:flex-shrink-0
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]
        ${isDisabled 
          ? 'border-[var(--border-disabled)] bg-[var(--bg-disabled)] cursor-not-allowed opacity-50' 
          : `
            border-[var(--border-primary)] bg-[var(--bg-secondary)]/30
            hover:border-[var(--fg-brand-primary)] hover:bg-[var(--fg-brand-primary)]/10
            active:scale-[0.98] active:bg-[var(--fg-brand-primary)]/20
          `
        }
      `}
    >
      <Plus 
        className={`
          w-5 h-5 transition-all duration-200
          ${isDisabled 
            ? 'text-[var(--fg-disabled)]' 
            : 'text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] group-hover:scale-110'
          }
        `}
        aria-hidden="true"
      />
    </button>
  );
}

// Bento Card for subpages
function BentoCard({ item }: { item: typeof brainPages[0] }) {
  const Icon = item.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={item.href}
        className="group relative h-full flex flex-col p-6 md:p-8 gap-6 md:gap-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] hover:bg-secondary-hover transition-all duration-300 ease-out"
      >
        {/* Top Section: Icon and Arrow */}
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
            <Icon className="w-6 h-6 text-[var(--fg-tertiary)]" />
          </div>
          <ArrowUpRight className="w-5 h-5 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 translate-x-2 group-hover:translate-y-0 group-hover:translate-x-0" />
        </div>
        
        {/* Bottom Section: Text */}
        <div className="space-y-2">
          <h3 className="text-xl md:text-2xl font-display font-bold text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors">
            {item.title}
          </h3>
          <div className="h-10">
            <p className="text-sm md:text-base text-[var(--fg-tertiary)] line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BrainPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BrainResource | undefined>();
  
  const { resources, isLoaded, addResource, deleteResource, updateResource } = useBrainResources();

  const handleEditResource = (resource: BrainResource) => {
    setEditingResource(resource);
    setIsAddResourceOpen(true);
  };

  const handleCloseResourceModal = () => {
    setIsAddResourceOpen(false);
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
                  Brain
                </h1>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setIsAddResourceOpen(true)}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Add Resource"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                  </motion.button>
                  <motion.button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Brain Settings"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                  </motion.button>
                </div>
              </div>
              <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
                Your brand&apos;s AI knowledge center. Configure Claude with your brand identity, 
                messaging, and writing styles for consistent, on-brand content generation.
              </p>
            </MotionItem>

            {/* Bento Cards for Subpages */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {brainPages.map((page, index) => (
                <motion.div key={page.id} variants={fadeInUp} custom={index}>
                  <BentoCard item={page} />
                </motion.div>
              ))}
            </motion.div>

            {/* Claude Resources Section */}
            <MotionItem>
              <section>
                <h2 className="text-xl font-display font-semibold text-[var(--fg-primary)] mb-4">
                  Resources
                </h2>
                <motion.div 
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-stretch gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {isLoaded && resources.map((resource, index) => (
                    <motion.div 
                      key={resource.id} 
                      variants={fadeInUp} 
                      custom={index}
                      className="w-full sm:w-[200px]"
                    >
                      <ResourceCard 
                        resource={resource} 
                        onDelete={deleteResource}
                        onEdit={handleEditResource}
                      />
                    </motion.div>
                  ))}
                  <motion.div variants={fadeInUp} className="w-full sm:w-auto">
                    <AddResourceCard onClick={() => setIsAddResourceOpen(true)} />
                  </motion.div>
                </motion.div>
              </section>
            </MotionItem>
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
    </div>
  );
}
