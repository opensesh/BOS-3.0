'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Check, Plus, Loader2 } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
}

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  onCreateProject: (name: string) => Promise<void>;
}

export function AddToProjectModal({
  isOpen,
  onClose,
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
}: AddToProjectModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;

    setIsLoading(true);
    try {
      await onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (project: Project | null) => {
    onSelectProject(project);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      if (isCreating) {
        setIsCreating(false);
        setNewProjectName('');
      } else {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="
              fixed inset-4 sm:inset-auto
              sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
              w-auto sm:w-full sm:max-w-sm
              max-h-[calc(100vh-32px)] sm:max-h-[70vh]
              bg-[var(--bg-secondary)]
              border border-[var(--border-primary)]
              rounded-xl
              shadow-2xl
              z-50
              flex flex-col
              overflow-hidden
            "
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-secondary)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <FolderPlus className="w-4 h-4 text-[var(--fg-brand-primary)]" />
                </div>
                <h2 className="text-base font-semibold text-[var(--fg-primary)]">
                  Add to project
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* None option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`
                  w-full flex items-center justify-between px-5 py-2.5
                  text-left transition-colors duration-150
                  ${!currentProject
                    ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                    : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                  }
                `}
              >
                <span className="text-sm">No project</span>
                {!currentProject && (
                  <Check className="w-4 h-4 text-[var(--fg-brand-primary)]" />
                )}
              </button>

              {/* Existing projects */}
              {projects.map((project) => {
                const isSelected = currentProject?.id === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleSelect(project)}
                    className={`
                      w-full flex items-center justify-between px-5 py-2.5
                      text-left transition-colors duration-150
                      ${isSelected
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                        : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm truncate">{project.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--fg-brand-primary)] flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="mx-4 my-2 border-t border-[var(--border-secondary)]" />

              {/* Create new project */}
              {isCreating ? (
                <div className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Project name..."
                      className="
                        flex-1 px-3 py-1.5
                        text-sm
                        bg-[var(--bg-tertiary)]
                        border border-[var(--border-primary)]
                        rounded-lg
                        text-[var(--fg-primary)]
                        placeholder:text-[var(--fg-quaternary)]
                        focus:outline-none focus:border-[var(--fg-brand-primary)]
                      "
                      autoFocus
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!newProjectName.trim() || isLoading}
                      className="p-1.5 rounded-lg text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setNewProjectName('');
                      }}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="
                    w-full flex items-center gap-2.5 px-5 py-2.5
                    text-left text-[var(--fg-tertiary)]
                    hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                    transition-colors
                  "
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Create new project</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

