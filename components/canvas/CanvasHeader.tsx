'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Download,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  Code,
  FileText,
} from 'lucide-react';
import type { CanvasPanelMode, CanvasViewMode } from '@/lib/canvas-context';

interface CanvasHeaderProps {
  /** Canvas title */
  title: string;
  /** File type indicator */
  fileType?: string;
  /** Current view mode */
  viewMode: CanvasViewMode;
  /** Current panel mode */
  panelMode: CanvasPanelMode;
  /** Markdown content for copy/download */
  content: string;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Whether saving is in progress */
  isSaving?: boolean;
  /** Callbacks */
  onViewModeChange: (mode: CanvasViewMode) => void;
  onPanelModeChange: (mode: CanvasPanelMode) => void;
  onClose: () => void;
  onSave?: () => void;
}

export function CanvasHeader({
  title,
  fileType = 'MD',
  viewMode,
  panelMode,
  content,
  hasUnsavedChanges = false,
  isSaving = false,
  onViewModeChange,
  onPanelModeChange,
  onClose,
  onSave,
}: CanvasHeaderProps) {
  const [copied, setCopied] = useState(false);

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  // Download as markdown file
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize title for filename
    const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.download = `${filename || 'canvas'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, title]);

  // Toggle panel mode
  const handleTogglePanelMode = useCallback(() => {
    onPanelModeChange(panelMode === 'half' ? 'full' : 'half');
  }, [panelMode, onPanelModeChange]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm">
      {/* Left side - View mode toggle and title */}
      <div className="flex items-center gap-3">
        {/* View/Source Toggle */}
        <div className="relative flex items-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/50 p-0.5">
          {/* Animated background indicator */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--bg-tertiary)]"
            initial={false}
            animate={{
              left: viewMode === 'view' ? '2px' : 'calc(50% + 1px)',
              width: 'calc(50% - 3px)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
          <button
            onClick={() => onViewModeChange('view')}
            className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200 ${
              viewMode === 'view'
                ? 'text-[var(--fg-primary)]'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
            }`}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('source')}
            className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200 ${
              viewMode === 'source'
                ? 'text-[var(--fg-primary)]'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
            }`}
            title="Source"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Title and file type */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--fg-tertiary)]" />
          <span className="text-sm font-medium text-[var(--fg-primary)] truncate max-w-[200px]">
            {title}
          </span>
          <span className="text-xs text-[var(--fg-tertiary)] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]">
            {fileType}
          </span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-[var(--fg-warning-primary)]" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
          title={copied ? 'Copied!' : 'Copy'}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-[var(--fg-success-primary)]" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
          title="Download"
        >
          <Download className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]" />
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--border-primary)] mx-1" />

        {/* Expand/Collapse button */}
        <button
          onClick={handleTogglePanelMode}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
          title={panelMode === 'half' ? 'Expand' : 'Collapse'}
        >
          {panelMode === 'half' ? (
            <Maximize2 className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]" />
          ) : (
            <Minimize2 className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]" />
          )}
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
          title="Close"
        >
          <X className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]" />
        </button>
      </div>
    </div>
  );
}

export default CanvasHeader;

