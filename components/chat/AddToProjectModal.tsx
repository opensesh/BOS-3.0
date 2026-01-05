'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Check, Plus, Loader2 } from 'lucide-react';
import type { Project } from '@/lib/supabase/projects-service';

// Re-export Project type for consumers of this module
export type { Project };

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProject: Project | null;
  chatId?: string | null; // The current chat session ID
  onSelectProject: (project: Project | null) => void;
  onAssignChatToProject?: (chatId: string, projectId: string | null) => Promise<boolean>;
  onCreateProject: (name: string) => Promise<void>;
}

export function AddToProjectModal({
  isOpen,
  onClose,
  projects,
  currentProject,
  chatId,
  onSelectProject,
  onAssignChatToProject,
  onCreateProject,
}: AddToProjectModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSelect = async (project: Project | null) => {
    // Always update the context
    onSelectProject(project);

    // If we have a chat ID and an assignment handler, save to database
    if (chatId && onAssignChatToProject) {
      setIsSaving(true);
      try {
        const success = await onAssignChatToProject(chatId, project?.id || null);
        if (success) {
          onClose();
        } else {
          console.error('Failed to assign chat to project');
        }
      } catch (error) {
        console.error('Error assigning chat to project:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      onClose();
    }
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

  // Don't render on server
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={onClose}
          />

          {/* Centering container - uses flexbox, not transforms */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="
                w-full max-w-sm
                max-h-[calc(100vh-64px)]
                bg-[var(--bg-secondary)]
                border border-[var(--border-primary)]
                rounded-xl
                shadow-2xl
                flex flex-col
                overflow-hidden
                pointer-events-auto
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
                  disabled={isSaving}
                  className="p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto py-2 relative">
                {isSaving && (
                  <div className="absolute inset-0 bg-[var(--bg-secondary)]/80 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-[var(--fg-brand-primary)] animate-spin" />
                  </div>
                )}

                {/* None option */}
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  disabled={isSaving}
                  className={`
                    w-full flex items-center justify-between px-5 py-2.5
                    text-left transition-colors duration-150
                    disabled:opacity-50
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
                      disabled={isSaving}
                      className={`
                        w-full flex items-center justify-between px-5 py-2.5
                        text-left transition-colors duration-150
                        disabled:opacity-50
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
                        disabled={isLoading || isSaving}
                      />
                      <button
                        type="button"
                        onClick={handleCreate}
                        disabled={!newProjectName.trim() || isLoading || isSaving}
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
                        disabled={isLoading || isSaving}
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
                    disabled={isSaving}
                    className="
                      w-full flex items-center gap-2.5 px-5 py-2.5
                      text-left text-[var(--fg-tertiary)]
                      hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
                      transition-colors
                      disabled:opacity-50
                    "
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Create new project</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render using portal to document.body
  return createPortal(modalContent, document.body);
}
