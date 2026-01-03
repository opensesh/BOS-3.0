'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, FileText, Pencil } from 'lucide-react';
import type { Canvas } from '@/lib/supabase/canvas-service';

interface CanvasPreviewBubbleProps {
  /** Canvas data */
  canvas: Canvas;
  /** Whether canvas content is being streamed */
  isStreaming?: boolean;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
  /** Callback when clicked to open full canvas */
  onOpenCanvas?: (canvas: Canvas) => void;
  /** Preview content (if different from canvas.content) */
  previewContent?: string;
}

/**
 * CanvasPreviewBubble Component
 * 
 * A collapsible preview shown inline in chat responses.
 * Similar to ThinkingBubble - shows a preview of the canvas content
 * with the ability to expand/collapse and open the full canvas panel.
 */
export function CanvasPreviewBubble({
  canvas,
  isStreaming = false,
  defaultCollapsed = true,
  onOpenCanvas,
  previewContent,
}: CanvasPreviewBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const content = previewContent || canvas.content;

  // Check if content overflows
  useEffect(() => {
    if (contentRef.current && content) {
      setHasOverflow(contentRef.current.scrollHeight > 200);
    }
  }, [content]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current && isExpanded) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isStreaming, isExpanded]);

  // Handle click to open full canvas
  const handleOpenCanvas = () => {
    onOpenCanvas?.(canvas);
  };

  // Get preview text (first few lines)
  const getPreviewText = () => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).join(' ').slice(0, 150);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden"
    >
      {/* Header - Click to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Document icon */}
          <div className="p-2 rounded-lg bg-[var(--bg-brand-primary)]/10 shrink-0">
            <FileText className="w-4 h-4 text-[var(--fg-brand-primary)]" />
          </div>

          {/* Title and preview */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-[var(--fg-primary)] truncate max-w-[250px]">
              {canvas.title}
            </span>
            {!isExpanded && (
              <span className="text-xs text-[var(--fg-tertiary)] truncate max-w-[250px]">
                {isStreaming ? 'Writing...' : getPreviewText()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 bg-[var(--fg-brand-primary)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="w-1.5 h-1.5 bg-[var(--fg-brand-primary)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
              />
              <motion.div
                className="w-1.5 h-1.5 bg-[var(--fg-brand-primary)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          )}

          {/* Version badge */}
          {canvas.version > 1 && (
            <span className="text-xs text-[var(--fg-tertiary)] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]">
              v{canvas.version}
            </span>
          )}

          {/* Chevron toggle */}
          <div className="text-[var(--fg-tertiary)] group-hover:text-[var(--fg-secondary)] transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-secondary)]">
              {/* Scrollable content preview */}
              <div
                ref={contentRef}
                className="px-4 py-3 text-sm text-[var(--fg-secondary)] leading-relaxed max-h-[200px] overflow-y-auto font-mono"
              >
                {content ? (
                  <div className="whitespace-pre-wrap">
                    {content.slice(0, 1000)}
                    {content.length > 1000 && '...'}
                    
                    {/* Streaming cursor */}
                    {isStreaming && (
                      <motion.span
                        className="inline-block w-[2px] h-4 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-[var(--fg-tertiary)] italic">
                    {isStreaming ? 'Generating content...' : 'Empty canvas'}
                  </span>
                )}
              </div>

              {/* Scroll fade indicator */}
              {hasOverflow && (
                <div className="h-4 bg-gradient-to-t from-[var(--bg-secondary)]/80 to-transparent pointer-events-none -mt-4 relative z-[1]" />
              )}

              {/* Open canvas button */}
              <div className="px-4 py-3 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30">
                <button
                  onClick={handleOpenCanvas}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand-primary)] hover:bg-[var(--bg-brand-primary)]/5 transition-colors text-sm font-medium text-[var(--fg-primary)]"
                >
                  <Pencil className="w-4 h-4" />
                  Open in Canvas
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Compact version for inline display
 */
export function CanvasPreviewCompact({
  canvas,
  onClick,
}: {
  canvas: Canvas;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-[var(--border-brand-primary)] hover:bg-[var(--bg-brand-primary)]/5 transition-colors"
    >
      <FileText className="w-4 h-4 text-[var(--fg-brand-primary)]" />
      <span className="text-sm font-medium text-[var(--fg-primary)]">{canvas.title}</span>
      <span className="text-xs text-[var(--fg-tertiary)]">· v{canvas.version}</span>
    </button>
  );
}

export default CanvasPreviewBubble;

