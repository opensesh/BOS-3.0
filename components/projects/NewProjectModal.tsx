'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string) => Promise<void>;
}

const PROJECT_COLORS = [
  '#FE5102', // Orange (default)
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
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
      setSelectedColor(PROJECT_COLORS[0]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim(), selectedColor);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="
              fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-md
              bg-[var(--bg-secondary)]
              border border-[var(--border-primary)]
              rounded-xl
              shadow-2xl
              z-50
              overflow-hidden
            "
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
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
                className="
                  p-2 rounded-lg
                  text-[var(--fg-tertiary)]
                  hover:text-[var(--fg-primary)]
                  hover:bg-[var(--bg-tertiary)]
                  transition-colors
                "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5">
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
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-[var(--fg-secondary)] mb-3">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`
                          w-8 h-8 rounded-full
                          transition-all duration-150
                          ${selectedColor === color 
                            ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--fg-primary)] scale-110' 
                            : 'hover:scale-110'
                          }
                        `}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50">
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
        </>
      )}
    </AnimatePresence>
  );
}

