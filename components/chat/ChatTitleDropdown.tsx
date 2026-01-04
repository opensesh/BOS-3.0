'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

interface ChatTitleDropdownProps {
  title: string;
  createdAt?: Date;
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
    // Lock the width before entering edit mode
    if (triggerRef.current) {
      setLockedWidth(triggerRef.current.offsetWidth);
    }
    setEditValue(title);
    setIsEditing(true);
    setIsOpen(false);
  }, [title]);

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

  const menuItems = [
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
    { type: 'divider' as const },
    {
      icon: FileText,
      label: 'Export as PDF',
      onClick: handleExportPdf,
    },
    {
      icon: FileCode,
      label: 'Export as Markdown',
      onClick: handleExportMarkdown,
    },
    { type: 'divider' as const },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: handleDelete,
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* Title container - Claude-style */}
      <div
        ref={triggerRef}
        className={`
          flex items-center gap-1.5 px-2.5 h-7 rounded-lg border transition-all cursor-pointer
          min-w-0 max-w-[200px] overflow-hidden flex-shrink
          ${isOpen || isEditing
            ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'
            : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50'
          }
        `}
        style={lockedWidth ? { width: lockedWidth } : undefined}
        onClick={() => !isEditing && setIsOpen(!isOpen)}
      >
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
          <>
            <span
              className="text-xs font-medium text-[var(--fg-secondary)] truncate flex-1 min-w-0"
              onDoubleClick={handleDoubleClick}
              title={`${title} (double-click to rename)`}
            >
              {title}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--fg-tertiary)] flex-shrink-0 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && !isEditing && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-xl z-50 overflow-hidden">
          {/* Date header */}
          <div className="px-3.5 py-2.5 border-b border-[var(--border-primary)]">
            <p className="text-xs text-[var(--fg-tertiary)]">
              Created {formatDate(createdAt)}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map((item, idx) => {
              if ('type' in item && item.type === 'divider') {
                return (
                  <div
                    key={idx}
                    className="my-1.5 border-t border-[var(--border-primary)]"
                  />
                );
              }

              const Icon = 'icon' in item ? item.icon : null;
              const isDanger = 'danger' in item && item.danger;

              return (
                <button
                  key={idx}
                  onClick={'onClick' in item ? item.onClick : undefined}
                  className={`
                    w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors
                    ${
                      isDanger
                        ? 'text-[var(--fg-error-primary)] hover:bg-[var(--bg-error-primary)]'
                        : 'text-[var(--fg-primary)] hover:bg-[var(--bg-primary)]'
                    }
                  `}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{'label' in item ? item.label : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

