'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';

interface ThinkingBubbleProps {
  /** The thinking content to display */
  thinking?: string;
  /** Whether thinking is still in progress (streaming) */
  isThinking?: boolean;
  /** Duration of thinking in seconds (available after thinking completes) */
  thinkingDuration?: number;
  /** Whether to start collapsed (default: true) */
  defaultCollapsed?: boolean;
}

/**
 * ThinkingBubble Component
 * 
 * A Claude-inspired collapsible component that displays the AI's reasoning process.
 * 
 * **Collapsed state:** 
 * - Shows: DotFlow animation (during thinking) or "Thought process" label + "{duration}s" + chevron
 * 
 * **Expanded state:**
 * - Full thinking text in muted monospace style, scrollable if content exceeds max height
 * 
 * **Behavior:**
 * - Only renders when thinking content exists or is streaming
 * - Starts collapsed by default
 * - Stays visible after streaming completes so users can review reasoning
 */
export function ThinkingBubble({
  thinking,
  isThinking = false,
  thinkingDuration,
  defaultCollapsed = true,
}: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check if content overflows (for scroll indicator)
  useEffect(() => {
    if (contentRef.current && thinking) {
      setHasOverflow(contentRef.current.scrollHeight > 200);
    }
  }, [thinking]);

  // Don't render if no thinking content and not currently thinking
  const hasThinking = thinking && thinking.length > 0;
  if (!hasThinking && !isThinking) {
    return null;
  }

  // Format duration display
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden"
    >
      {/* Header - Collapsible trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Dot animation during thinking, or static indicator when done */}
          {isThinking ? (
            <ThinkingDotFlow className="scale-75 origin-left" />
          ) : (
            <span className="text-sm text-[var(--fg-secondary)]">
              Thought process
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Duration badge - only shown when thinking is complete */}
          {!isThinking && thinkingDuration && (
            <span className="text-xs text-[var(--fg-tertiary)] tabular-nums">
              {formatDuration(thinkingDuration)}
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
              <div
                ref={contentRef}
                className={`
                  px-4 py-3 text-[13px] text-[var(--fg-tertiary)]
                  font-mono leading-relaxed whitespace-pre-wrap
                  ${hasOverflow ? 'max-h-[300px] overflow-y-auto' : ''}
                `}
              >
                {hasThinking ? (
                  <>
                    {thinking}
                    {/* Streaming cursor */}
                    {isThinking && (
                      <motion.span
                        className="inline-block w-[2px] h-4 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </>
                ) : (
                  /* Placeholder while waiting for first thinking chunk */
                  <div className="flex items-center gap-2 text-[var(--fg-tertiary)]/60">
                    <motion.div
                      className="w-1.5 h-1.5 bg-[var(--fg-brand-primary)] rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-[var(--fg-brand-primary)] rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-[var(--fg-brand-primary)] rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                )}
              </div>

              {/* Scroll hint when content overflows */}
              {hasOverflow && !isThinking && (
                <div className="px-4 py-2 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]/20">
                  <span className="text-[11px] text-[var(--fg-quaternary)]">
                    Scroll to see more
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Compact inline thinking indicator 
 * Use this for a minimal UI in the streaming area
 */
export function ThinkingIndicatorCompact({ 
  isThinking,
  thinkingDuration,
}: { 
  isThinking: boolean;
  thinkingDuration?: number;
}) {
  if (!isThinking && !thinkingDuration) return null;

  return (
    <div className="flex items-center gap-2">
      {isThinking ? (
        <ThinkingDotFlow className="scale-75 origin-left" />
      ) : (
        <span className="text-xs text-[var(--fg-tertiary)]">
          Reasoned for {thinkingDuration}s
        </span>
      )}
    </div>
  );
}

export default ThinkingBubble;

