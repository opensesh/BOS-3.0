'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  Maximize2, 
  Minimize2,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PDFViewerProps {
  /** The URL of the PDF to display */
  url: string;
  /** The filename to show in the header */
  filename: string;
  /** Optional title for the document */
  title?: string;
  /** Optional file size in bytes */
  fileSize?: number;
  /** Additional className for the container */
  className?: string;
  /** Max height for the viewer (default: 600px) */
  maxHeight?: number;
}

// Consistent icon button styles (matching MarkdownEditor)
const iconButtonBase = "p-2 rounded-lg transition-all duration-200 group hover:bg-[var(--bg-tertiary)]";
const iconDefault = "w-4 h-4 transition-colors duration-200 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]";

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PDFViewer({ 
  url, 
  filename, 
  title,
  fileSize,
  className = '', 
  maxHeight = 600,
}: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [url, filename]);

  const handleOpenExternal = useCallback(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [url]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <>
      {/* Main Viewer */}
      <motion.div 
        className={`rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)] ${className}`}
        layout
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-red-500/20">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-sans text-[var(--fg-primary)]">
                {title || filename}
              </span>
              {fileSize && (
                <span className="text-xs text-[var(--fg-tertiary)]">
                  {formatFileSize(fileSize)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Download button */}
            <motion.button
              onClick={handleDownload}
              className={iconButtonBase}
              title="Download PDF"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className={iconDefault} />
            </motion.button>

            {/* Open in new tab */}
            <motion.button
              onClick={handleOpenExternal}
              className={iconButtonBase}
              title="Open in new tab"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className={iconDefault} />
            </motion.button>

            {/* Fullscreen toggle */}
            <motion.button
              onClick={toggleFullscreen}
              className={iconButtonBase}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isFullscreen ? (
                <Minimize2 className={iconDefault} />
              ) : (
                <Maximize2 className={iconDefault} />
              )}
            </motion.button>
          </div>
        </div>

        {/* PDF Content */}
        <div 
          className="relative"
          style={{ height: `${maxHeight}px` }}
        >
          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
                  <span className="text-sm text-[var(--fg-tertiary)]">Loading PDF...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <div className="p-4 rounded-full bg-[var(--bg-error-subtle)]">
                <AlertCircle className="w-8 h-8 text-[var(--fg-error-primary)]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-[var(--fg-primary)] mb-2">
                  Unable to preview PDF
                </h3>
                <p className="text-sm text-[var(--fg-tertiary)] mb-4">
                  Your browser may not support embedded PDF viewing.
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-brand-solid)] text-white text-sm font-medium hover:bg-[var(--bg-brand-solid-hover)] transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Download PDF
                  </motion.button>
                  <motion.button
                    onClick={handleOpenExternal}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--fg-primary)] text-sm font-medium hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Open in New Tab
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            /* PDF iframe */
            <iframe
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={title || filename}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-red-500/20">
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-sans text-[var(--fg-primary)]">
                  {title || filename}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleDownload}
                  className={iconButtonBase}
                  title="Download PDF"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className={iconDefault} />
                </motion.button>
                <motion.button
                  onClick={handleOpenExternal}
                  className={iconButtonBase}
                  title="Open in new tab"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className={iconDefault} />
                </motion.button>
                <motion.button
                  onClick={toggleFullscreen}
                  className={iconButtonBase}
                  title="Exit fullscreen"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Minimize2 className={iconDefault} />
                </motion.button>
              </div>
            </div>

            {/* Fullscreen Content */}
            <div className="flex-1">
              <iframe
                src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                title={title || filename}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PDFViewer;
