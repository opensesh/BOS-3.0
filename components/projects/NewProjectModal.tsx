'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string) => Promise<void>;
}

// Default project color
const DEFAULT_COLOR = '#FE5102';

export function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim(), DEFAULT_COLOR);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
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
                w-full max-w-md
                max-h-[calc(100vh-64px)]
                bg-[var(--bg-secondary)]
                border border-[var(--border-primary)]
                rounded-xl
                shadow-2xl
                overflow-hidden
                flex flex-col
                pointer-events-auto
              "
              onKeyDown={handleKeyDown}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-secondary)] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="
                    w-10 h-10 rounded-lg
                    bg-[var(--bg-tertiary)]
                    flex items-center justify-center
                  ">
                    <FolderPlus className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                      New project
                    </h2>
                    <p className="text-xs text-[var(--fg-tertiary)]">
                      Organize your conversations
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="
                    p-2 rounded-lg
                    text-[var(--fg-tertiary)]
                    hover:text-[var(--fg-primary)]
                    hover:bg-[var(--bg-tertiary)]
                    transition-colors
                    disabled:opacity-50
                  "
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-5 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1">
                  {/* Name Input */}
                  <div>
                    <label
                      htmlFor="project-name"
                      className="block text-sm font-medium text-[var(--fg-secondary)] mb-2"
                    >
                      Project name
                    </label>
                    <input
                      ref={inputRef}
                      id="project-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Business Assistant"
                      className="
                        w-full px-4 py-2.5
                        bg-[var(--bg-primary)]
                        border border-[var(--border-secondary)]
                        rounded-lg
                        text-[var(--fg-primary)]
                        placeholder:text-[var(--fg-quaternary)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20 focus:border-[var(--fg-brand-primary)]
                        transition-all
                      "
                      maxLength={100}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label
                      htmlFor="project-description"
                      className="block text-sm font-medium text-[var(--fg-secondary)] mb-2"
                    >
                      Description
                      <span className="text-[var(--fg-quaternary)] font-normal"> (optional)</span>
                    </label>
                    <textarea
                      id="project-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this project about?"
                      rows={3}
                      className="
                        w-full px-4 py-2.5
                        bg-[var(--bg-primary)]
                        border border-[var(--border-secondary)]
                        rounded-lg
                        text-[var(--fg-primary)]
                        placeholder:text-[var(--fg-quaternary)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20 focus:border-[var(--fg-brand-primary)]
                        transition-all
                        resize-none
                      "
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50 flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="
                      px-4 py-2
                      text-sm font-medium
                      text-[var(--fg-secondary)]
                      hover:text-[var(--fg-primary)]
                      hover:bg-[var(--bg-tertiary)]
                      rounded-lg
                      transition-colors
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className="
                      px-4 py-2
                      text-sm font-medium
                      bg-[var(--bg-brand-solid)]
                      text-white
                      rounded-lg
                      hover:bg-[var(--bg-brand-solid)]/90
                      transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isSubmitting ? 'Creating...' : 'Create project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render using portal to document.body
  return createPortal(modalContent, document.body);
}
