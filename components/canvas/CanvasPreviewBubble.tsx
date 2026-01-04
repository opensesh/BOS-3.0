'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, FileText } from 'lucide-react';
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
}

/**
 * CanvasPreviewBubble Component
 * 
 * A collapsible preview shown inline in chat responses.
 * Styled to match ThinkingBubble for visual consistency.
 */
export function CanvasPreviewBubble({
  canvas,
  isStreaming = false,
  defaultCollapsed = false,
  onOpenCanvas,
}: CanvasPreviewBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check if content overflows
  useEffect(() => {
    if (contentRef.current && canvas.content) {
      setHasOverflow(contentRef.current.scrollHeight > 200);
    }
  }, [canvas.content]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current && isExpanded) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [canvas.content, isStreaming, isExpanded]);

  // Handle click to open full canvas
  const handleOpenCanvas = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenCanvas?.(canvas);
  };

  // Get header label
  const getHeaderLabel = () => {
    if (isStreaming) {
      return `Writing "${canvas.title}"...`;
    }
    return canvas.title;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      }}
      className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden"
    >
      {/* Fixed Header - Collapsible trigger - matching ThinkingBubble */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Document icon - small and subtle */}
          <FileText className="w-3.5 h-3.5 text-[var(--fg-tertiary)] shrink-0" />
          
          {/* Label text */}
          <span className="text-sm text-[var(--fg-secondary)] truncate">
            {getHeaderLabel()}
          </span>
          
          {/* Streaming indicator dots */}
          {isStreaming && (
            <div className="flex items-center gap-1 ml-1">
              <motion.div
                className="w-1 h-1 bg-[var(--fg-tertiary)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="w-1 h-1 bg-[var(--fg-tertiary)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
              />
              <motion.div
                className="w-1 h-1 bg-[var(--fg-tertiary)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
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

      {/* Expandable scrollable content with delightful animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { type: 'spring', stiffness: 400, damping: 30 },
              opacity: { duration: 0.15 }
            }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-secondary)]">
              {/* Scrollable content area with max height */}
              <motion.div
                ref={contentRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="px-4 py-3 text-[13px] text-[var(--fg-tertiary)] leading-relaxed max-h-[200px] overflow-y-auto"
              >
                {canvas.content ? (
                  <div className="whitespace-pre-wrap font-mono text-xs">
                    {canvas.content}
                    
                    {/* Streaming cursor */}
                    {isStreaming && (
                      <motion.span
                        className="inline-block w-[2px] h-3 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
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
              </motion.div>

              {/* Scroll fade indicator */}
              {hasOverflow && (
                <div className="h-4 bg-gradient-to-t from-[var(--bg-secondary)]/80 to-transparent pointer-events-none -mt-4 relative z-[1]" />
              )}

              {/* Open canvas button - right aligned, always clickable */}
              <div className="px-4 py-2 border-t border-[var(--border-secondary)] flex justify-end">
                <button
                  onClick={handleOpenCanvas}
                  className="text-sm text-[var(--fg-brand-primary)] hover:text-[var(--fg-brand-primary-hover)] transition-colors flex items-center gap-1.5"
                >
                  {isStreaming ? (
                    <>
                      <span>Open in Canvas</span>
                      <motion.span
                        className="inline-block"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      >
                        →
                      </motion.span>
                    </>
                  ) : (
                    'Open in Canvas →'
                  )}
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
