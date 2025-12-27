'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon } from 'lucide-react';

interface ProjectInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
}

export function ProjectInstructionsModal({
  isOpen,
  onClose,
  projectName,
  initialContent,
  onSave,
}: ProjectInstructionsModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        // Place cursor at end
        textareaRef.current?.setSelectionRange(content.length, content.length);
      }, 100);
    }
  }, [isOpen, content.length]);

  // Reset content when modal opens with new initial content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(content);
      onClose();
    } catch (error) {
      console.error('Error saving instructions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Allow Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
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
            className="fixed inset-0 bg-black/60 z-50"
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
              w-full max-w-2xl max-h-[80vh]
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
              <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                Set project instructions
              </h2>
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Description */}
              <p className="text-sm text-[var(--fg-secondary)] mb-4">
                Provide Claude with relevant instructions and information for chats within{' '}
                <span className="font-medium text-[var(--fg-primary)]">{projectName}</span>.
                This will work alongside{' '}
                <button className="
                  inline-flex items-center gap-1
                  text-[var(--fg-brand-primary)]
                  hover:underline
                ">
                  user preferences
                  <LinkIcon className="w-3 h-3" />
                </button>
                {' '}and the selected style in a chat.
              </p>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Break down large tasks and ask clarifying questions when needed."
                className="
                  w-full h-64
                  px-4 py-3
                  bg-[var(--bg-primary)]
                  border border-[var(--border-secondary)]
                  rounded-lg
                  text-sm text-[var(--fg-primary)]
                  placeholder:text-[var(--fg-quaternary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20 focus:border-[var(--fg-brand-primary)]
                  transition-all
                  resize-none
                "
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
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
                onClick={handleSave}
                disabled={isSaving}
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
                {isSaving ? 'Saving...' : 'Save instructions'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

