'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';

interface ThinkingBubbleProps {
  /** The thinking content to display */
  thinking?: string;
  /** Whether thinking is still in progress (streaming) */
  isThinking?: boolean;
  /** Whether to start collapsed (default: true) */
  defaultCollapsed?: boolean;
  /** Callback when thinking summary is requested */
  onSummaryRequest?: (thinking: string) => void;
  /** Summary of the thinking content (provided after LLM summarization) */
  summary?: string;
}

/**
 * ThinkingBubble Component
 * 
 * A Claude-inspired collapsible component that displays the AI's reasoning process.
 * 
 * **Features:**
 * - Live timer during thinking phase
 * - Fixed header with scrollable content
 * - Summary display when collapsed (after thinking completes)
 * 
 * **Collapsed state:** 
 * - Shows: DotFlow animation (during thinking) + live timer
 * - Or: Summary text + final duration (after complete)
 * 
 * **Expanded state:**
 * - Fixed header with timer/duration
 * - Scrollable thinking content in monospace style
 */
export function ThinkingBubble({
  thinking,
  isThinking = false,
  defaultCollapsed = true,
  summary,
}: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  
  // Live timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer when thinking begins
  useEffect(() => {
    if (isThinking && timerStartRef.current === null) {
      // Start the timer
      timerStartRef.current = Date.now();
      setElapsedSeconds(0);
      setFinalDuration(null);
      
      timerIntervalRef.current = setInterval(() => {
        if (timerStartRef.current) {
          const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else if (!isThinking && timerStartRef.current !== null) {
      // Stop the timer and save final duration
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const duration = Math.floor((Date.now() - timerStartRef.current) / 1000);
      setFinalDuration(duration);
      timerStartRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isThinking]);

  // Check if content overflows
  useEffect(() => {
    if (contentRef.current && thinking) {
      setHasOverflow(contentRef.current.scrollHeight > 200);
    }
  }, [thinking]);

  // Auto-scroll content during streaming
  useEffect(() => {
    if (isThinking && contentRef.current && isExpanded) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [thinking, isThinking, isExpanded]);

  // Don't render if no thinking content and not currently thinking
  const hasThinking = thinking && thinking.length > 0;
  if (!hasThinking && !isThinking) {
    return null;
  }

  // Format duration display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const displayDuration = isThinking ? elapsedSeconds : (finalDuration ?? 0);
  const showTimer = isThinking || finalDuration !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden"
    >
      {/* Fixed Header - Collapsible trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)]/50 transition-colors group sticky top-0 bg-[var(--bg-secondary)]/30 backdrop-blur-sm z-10"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isThinking ? (
            // During thinking: show dot animation
            <ThinkingDotFlow className="scale-75 origin-left shrink-0" />
          ) : summary ? (
            // After thinking with summary: show truncated summary
            <span className="text-sm text-[var(--fg-secondary)] truncate">
              {summary}
            </span>
          ) : (
            // After thinking without summary: show generic label
            <span className="text-sm text-[var(--fg-secondary)]">
              Thought process
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Timer display */}
          {showTimer && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
              <Clock className="w-3 h-3" />
              <span className="tabular-nums">
                {formatDuration(displayDuration)}
              </span>
            </div>
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

      {/* Expandable scrollable content */}
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
              {/* Scrollable content area with max height */}
              <div
                ref={contentRef}
                className="px-4 py-3 text-[13px] text-[var(--fg-tertiary)] font-mono leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto"
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

              {/* Scroll fade indicator when content overflows */}
              {hasOverflow && (
                <div className="h-4 bg-gradient-to-t from-[var(--bg-secondary)]/80 to-transparent pointer-events-none -mt-4 relative z-[1]" />
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
        <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
          <Clock className="w-3 h-3" />
          <span>Reasoned for {thinkingDuration}s</span>
        </div>
      )}
    </div>
  );
}

export default ThinkingBubble;
