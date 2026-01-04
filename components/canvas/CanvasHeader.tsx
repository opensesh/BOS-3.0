'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Code,
  Copy,
  Download,
  X,
  Check,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import type { CanvasPanelMode, CanvasViewMode } from '@/lib/canvas-context';

interface CanvasHeaderProps {
  title: string;
  viewMode: CanvasViewMode;
  panelMode: CanvasPanelMode;
  content: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onViewModeChange: (mode: CanvasViewMode) => void;
  onPanelModeChange: (mode: CanvasPanelMode) => void;
  onClose: () => void;
  onSave: () => void;
  /** Show back button instead of X (for mobile) */
  showBackButton?: boolean;
}

export function CanvasHeader({
  title,
  viewMode,
  panelMode,
  content,
  hasUnsavedChanges,
  isSaving,
  onViewModeChange,
  onPanelModeChange,
  onClose,
  onSave,
  showBackButton = false,
}: CanvasHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleDownloadMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }, [content, title]);

  const handleDownloadPDF = useCallback(() => {
    // For PDF, we'll create a simple print-friendly version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { font-size: 24px; margin-bottom: 16px; }
              h2 { font-size: 20px; margin-top: 24px; margin-bottom: 12px; }
              h3 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
              p { line-height: 1.6; margin-bottom: 12px; }
              pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
              code { font-family: monospace; }
              ul, ol { margin-bottom: 12px; padding-left: 24px; }
              li { margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    setShowDownloadMenu(false);
  }, [content, title]);

  // Close download menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowDownloadMenu(false);
    if (showDownloadMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDownloadMenu]);

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)] flex-shrink-0">
      {/* Left side - Back button (mobile) + Title + MD badge */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Back button on mobile */}
        {showBackButton && (
          <button
            onClick={onClose}
            className="p-1 -ml-1 mr-1 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Back to chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="text-sm font-medium text-[var(--fg-primary)] truncate max-w-[200px]">
          {title}
        </h2>
        <span className="text-[10px] font-medium text-[var(--fg-tertiary)] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] shrink-0">
          MD
        </span>
        {hasUnsavedChanges && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-warning-primary)] shrink-0" />
        )}
        {isSaving && (
          <span className="text-[10px] text-[var(--fg-tertiary)]">Saving...</span>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-1">
        {/* View/Source Toggle */}
        <div className="flex items-center bg-[var(--bg-secondary)] rounded-md p-0.5">
          <button
            onClick={() => onViewModeChange('view')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'view'
                ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => onViewModeChange('source')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'source'
                ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Source</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border-secondary)] mx-1" />

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
          title="Copy content"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Download with dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDownloadMenu(!showDownloadMenu);
            }}
            className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
            title="Download"
          >
            <Download className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {showDownloadMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg py-1 min-w-[140px] z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  PDF (Print)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Close button - hidden on mobile since we have back button */}
        {!showBackButton && (
          <>
            <div className="w-px h-5 bg-[var(--border-secondary)] mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
              title="Close canvas (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
