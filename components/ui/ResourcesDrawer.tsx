'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ExternalLink, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { BrainResource } from '@/hooks/useBrainResources';
import { BrandResource } from '@/types';

// Union type for both resource types
type Resource = BrainResource | BrandResource;

interface ResourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onAddResource: () => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  title?: string;
}

// Helper to get icon name from resource
function getIconName(resource: Resource): string {
  // BrainResource has iconName
  if ('iconName' in resource && resource.iconName) {
    return resource.iconName;
  }
  // BrandResource has lucideIconName
  if ('lucideIconName' in resource && resource.lucideIconName) {
    return resource.lucideIconName;
  }
  // Handle preset icon types
  if (resource.icon === 'figma') return 'fa-figma';
  if (resource.icon === 'notion') return 'fa-notion';
  if (resource.icon === 'google-drive') return 'fa-google-drive';
  if (resource.icon === 'skills') return 'Zap';
  if (resource.icon === 'projects') return 'FolderKanban';
  if (resource.icon === 'commands') return 'Terminal';
  if (resource.icon === 'writing-styles') return 'PenTool';
  if (resource.icon === 'claude-md') return 'FileCode';

  return 'Link';
}

// Resource item component
function ResourceItem({
  resource,
  onEdit,
  onDelete,
}: {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const hostname = (() => {
    try {
      return new URL(resource.url).hostname;
    } catch {
      return resource.url;
    }
  })();

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--bg-secondary)] cursor-pointer transition-all duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Icon */}
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] flex-shrink-0">
        <Icon name={getIconName(resource)} className="w-4 h-4 text-[var(--fg-tertiary)]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-[var(--fg-primary)] truncate">
          {resource.name}
        </h3>
        <p className="text-xs text-[var(--fg-tertiary)] truncate">
          {hostname}
        </p>
      </div>

      {/* Actions row - Edit, Delete, then Link */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-brand)] text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] transition-all"
                aria-label="Edit resource"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-error-solid)] text-[var(--fg-tertiary)] hover:text-white transition-all"
                aria-label="Delete resource"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </a>
  );
}

export function ResourcesDrawer({
  isOpen,
  onClose,
  resources,
  onAddResource,
  onEditResource,
  onDeleteResource,
  title = 'Resources',
}: ResourcesDrawerProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted on client side for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Don't render until mounted
  if (!mounted) return null;

  // Animation variants
  const drawerVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.8,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 0.8,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: {
      opacity: [1, 0.8, 0.6, 0],
      transition: {
        duration: 0.5,
        times: [0, 0.6, 0.85, 1],
        ease: 'easeOut',
      },
    },
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-14 bottom-0 left-0 lg:left-[var(--sidebar-width)] right-0 bg-black/40 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-14 bottom-0 w-[380px] max-w-[90vw] bg-[var(--bg-primary)] z-[101] flex flex-col shadow-2xl border-l border-[var(--border-secondary)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
              <h2 className="text-[15px] font-semibold text-[var(--fg-primary)]">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resources List */}
            <div className="flex-1 overflow-y-auto py-2">
              {resources.length > 0 ? (
                <div className="px-2">
                  {/* Uncategorized resources first */}
                  {(() => {
                    const uncategorized = resources.filter(r => !('category' in r) || !r.category);
                    const categorized = resources.filter(r => 'category' in r && r.category);

                    // Group categorized by category
                    const byCategory = categorized.reduce((acc, r) => {
                      const cat = (r as { category: string }).category;
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(r);
                      return acc;
                    }, {} as Record<string, Resource[]>);

                    const categoryNames = Object.keys(byCategory).sort();

                    return (
                      <>
                        {/* Uncategorized items */}
                        {uncategorized.length > 0 && (
                          <div className="space-y-1">
                            {uncategorized.map((resource) => (
                              <ResourceItem
                                key={resource.id}
                                resource={resource}
                                onEdit={() => onEditResource(resource)}
                                onDelete={() => onDeleteResource(resource.id)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Categorized items with section headers */}
                        {categoryNames.map((category) => (
                          <div key={category} className="mt-4 first:mt-0">
                            <h4 className="px-4 py-2 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                              {category}
                            </h4>
                            <div className="space-y-1">
                              {byCategory[category].map((resource) => (
                                <ResourceItem
                                  key={resource.id}
                                  resource={resource}
                                  onEdit={() => onEditResource(resource)}
                                  onDelete={() => onDeleteResource(resource.id)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[var(--bg-secondary)]/50 mb-4">
                    <BookOpen className="w-6 h-6 text-[var(--fg-tertiary)]" />
                  </div>
                  <h3 className="text-sm font-medium text-[var(--fg-primary)] mb-1">
                    No resources yet
                  </h3>
                  <p className="text-xs text-[var(--fg-tertiary)] mb-4 max-w-[200px]">
                    Add links to documentation, tools, or references you use often
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Add button */}
            <div className="px-4 py-4 border-t border-[var(--border-secondary)]">
              <button
                onClick={onAddResource}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:border-[var(--border-brand)] text-[var(--fg-primary)] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Resource</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
}

export default ResourcesDrawer;
