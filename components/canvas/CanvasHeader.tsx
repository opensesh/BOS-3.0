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
import { Tooltip, TooltipTrigger } from '@/components/ui/base/tooltip/tooltip';
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
          <Tooltip title="Back to chat" placement="bottom" delay={300}>
            <TooltipTrigger
              onPress={onClose}
              className="p-1.5 -ml-1 mr-1 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </TooltipTrigger>
          </Tooltip>
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
        {/* View/Source Toggle - icon only with animated indicator */}
        <div className="relative flex items-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/50 p-0.5">
          {/* Animated background indicator */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--bg-tertiary)]"
            initial={false}
            animate={{
              left: viewMode === 'source' ? '2px' : 'calc(50% + 1px)',
              width: 'calc(50% - 3px)',
              height: 'calc(100% - 4px)',
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
          <Tooltip title="Source view" placement="bottom" delay={300}>
            <TooltipTrigger
              onPress={() => onViewModeChange('source')}
              className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200 ${
                viewMode === 'source' 
                  ? 'text-[var(--fg-primary)]' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }`}
            >
              <Code className="w-4 h-4" />
            </TooltipTrigger>
          </Tooltip>
          <Tooltip title="Preview" placement="bottom" delay={300}>
            <TooltipTrigger
              onPress={() => onViewModeChange('view')}
              className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200 ${
                viewMode === 'view' 
                  ? 'text-[var(--fg-primary)]' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }`}
            >
              <Eye className="w-4 h-4" />
            </TooltipTrigger>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border-secondary)] mx-1" />

        {/* Copy */}
        <Tooltip title={copied ? "Copied!" : "Copy content"} placement="bottom" delay={300}>
          <TooltipTrigger
            onPress={handleCopy}
            className="p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </TooltipTrigger>
        </Tooltip>

        {/* Download with dropdown */}
        <div className="relative">
          <Tooltip title="Download" placement="bottom" delay={300}>
            <TooltipTrigger
              onPress={(e) => {
                setShowDownloadMenu(!showDownloadMenu);
              }}
              className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
            >
              <Download className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </TooltipTrigger>
          </Tooltip>

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
            <Tooltip title="Close (Esc)" placement="bottom" delay={300}>
              <TooltipTrigger
                onPress={onClose}
                className="p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]"
              >
                <X className="w-4 h-4" />
              </TooltipTrigger>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
