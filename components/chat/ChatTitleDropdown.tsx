'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  FolderPlus,
  Layers,
  FileText,
  FileCode,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface ChatTitleDropdownProps {
  title: string;
  createdAt?: Date;
  isLoading?: boolean;
  onRename?: (newTitle: string) => void;
  onAddToProject?: () => void;
  onAddToSpace?: () => void;
  onExportPdf?: () => void;
  onExportMarkdown?: () => void;
  onDelete?: () => void;
  content?: string;
}

export function ChatTitleDropdown({
  title,
  createdAt,
  isLoading = false,
  onRename,
  onAddToProject,
  onAddToSpace,
  onExportPdf,
  onExportMarkdown,
  onDelete,
  content = '',
}: ChatTitleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'Today';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    if (isLoading) return; // Don't allow editing while loading
    // Lock the width before entering edit mode
    if (triggerRef.current) {
      setLockedWidth(triggerRef.current.offsetWidth);
    }
    setEditValue(title);
    setIsEditing(true);
    setIsOpen(false);
  }, [title, isLoading]);

  // Handle save rename
  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== title) {
      onRename?.(trimmedValue);
    }
    setIsEditing(false);
    setLockedWidth(null);
  }, [editValue, title, onRename]);

  // Handle cancel rename
  const handleCancel = useCallback(() => {
    setEditValue(title);
    setIsEditing(false);
    setLockedWidth(null);
  }, [title]);

  // Handle key events in edit mode
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // Export handlers
  const handleExportPdf = () => {
    setIsOpen(false);
    if (onExportPdf) {
      onExportPdf();
    } else {
      // Default PDF export via print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1, h2, h3 { margin-top: 1.5em; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              ${content.split('\n').map((line) => `<p>${line}</p>`).join('')}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleExportMarkdown = () => {
    setIsOpen(false);
    if (onExportMarkdown) {
      onExportMarkdown();
    } else {
      // Default markdown export
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete?.();
  };

  // Primary actions - more prominent
  const primaryItems = [
    {
      icon: Layers,
      label: 'Add to Project',
      onClick: () => {
        onAddToProject?.();
        setIsOpen(false);
      },
    },
    {
      icon: FolderPlus,
      label: 'Add to Space',
      onClick: () => {
        onAddToSpace?.();
        setIsOpen(false);
      },
    },
  ];

  // Secondary actions - less prominent (export)
  const exportItems = [
    {
      icon: FileText,
      label: 'PDF',
      onClick: handleExportPdf,
    },
    {
      icon: FileCode,
      label: 'Markdown',
      onClick: handleExportMarkdown,
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* Title container with pulsing gradient background when loading */}
      <div
        ref={triggerRef}
        className={`
          relative flex items-center gap-1.5 px-2.5 h-7 rounded-lg border transition-all
          min-w-0 w-full overflow-hidden
          ${isLoading 
            ? 'border-[var(--border-secondary)] cursor-default' 
            : isOpen || isEditing
              ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)] cursor-pointer'
              : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50 cursor-pointer'
          }
        `}
        style={lockedWidth ? { width: lockedWidth } : undefined}
        onClick={() => !isEditing && !isLoading && setIsOpen(!isOpen)}
      >
        {/* Pulsing Aperol gradient background when loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
            >
              <div 
                className="absolute inset-0 aperol-pulse-gradient"
                style={{
                  background: `linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(254, 81, 2, 0.15) 30%, 
                    rgba(254, 81, 2, 0.2) 50%, 
                    rgba(254, 81, 2, 0.15) 70%, 
                    transparent 100%
                  )`,
                  animation: 'aperolPulse 2.5s ease-in-out infinite, aperolShimmer 2s ease-in-out infinite',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content - either loading, editing, or title display */}
        <div className="relative flex items-center gap-1.5 flex-1 min-w-0 z-10">
          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={(e) => {
                  // Don't save on blur if clicking one of the buttons
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (relatedTarget?.closest('button')) return;
                  handleSave();
                }}
                className="flex-1 min-w-0 bg-transparent text-xs font-medium text-[var(--fg-secondary)] outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)] transition-colors"
                  title="Save (Enter)"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] transition-colors"
                  title="Cancel (Escape)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <Loader 
                    variant="loading-dots" 
                    text="Thinking"
                    className="text-xs font-medium text-[var(--fg-tertiary)]"
                  />
                </motion.div>
              ) : (
                <motion.span
                  key="title"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="text-xs font-medium text-[var(--fg-secondary)] truncate flex-1 min-w-0"
                  onDoubleClick={handleDoubleClick}
                  title={`${title} (double-click to rename)`}
                >
                  {title}
                </motion.span>
              )}
            </AnimatePresence>
          )}

          {/* Chevron - hidden when loading */}
          <AnimatePresence>
            {!isLoading && !isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--fg-tertiary)] flex-shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && !isEditing && !isLoading && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)] shadow-lg z-50 overflow-hidden">
          {/* Date header */}
          <div className="px-4 min-h-[52px] flex flex-col justify-center border-b border-[var(--border-secondary)]">
            <p className="text-xs text-[var(--fg-tertiary)]">
              Created {formatDate(createdAt)}
            </p>
          </div>

          {/* Primary menu items */}
          <div className="py-1 border-b border-[var(--border-secondary)]">
            {primaryItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[var(--fg-tertiary)]" />
                  <span className="text-sm text-[var(--fg-secondary)]">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Export items - compact secondary actions */}
          <div className="px-4 py-2 border-b border-[var(--border-secondary)]">
            <p className="text-[10px] text-[var(--fg-quaternary)] uppercase tracking-wider mb-1.5">Export</p>
            <div className="flex items-center gap-1.5">
              {exportItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                  >
                    <Icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete - danger action */}
          <div className="py-1">
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Trash2 className="w-4 h-4 text-[var(--fg-error-primary)]" />
              <span className="text-sm text-[var(--fg-error-primary)]">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* CSS Keyframes for pulsing animation */}
      <style jsx>{`
        @keyframes aperolPulse {
          0%, 100% { 
            opacity: 0.6;
          }
          50% { 
            opacity: 1;
          }
        }
        @keyframes aperolShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
