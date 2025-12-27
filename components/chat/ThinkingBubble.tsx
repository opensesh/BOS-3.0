'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

interface ThinkingBubbleProps {
  /** The thinking content to display */
  thinking?: string;
  /** Whether thinking is actively in progress (no text content yet) */
  isThinking?: boolean;
  /** Whether the response is still streaming */
  isStreaming?: boolean;
  /** Whether to start collapsed (default: false - expanded during active thinking) */
  defaultCollapsed?: boolean;
  /** Summary of the thinking content (provided after LLM summarization) */
  summary?: string;
  /** Whether the summary is being generated */
  isGeneratingSummary?: boolean;
}

/**
 * ThinkingBubble Component
 * 
 * A collapsible component that displays the AI's extended reasoning process.
 * 
 * **Visual Design**:
 * - During active thinking: Expanded view with live streaming content and timer
 * - After thinking completes: Collapsed view with intelligent summary
 * - Clicking the header toggles between expanded/collapsed states
 * 
 * **Position Principle**:
 * This bubble ALWAYS stays positioned ABOVE the response content.
 * The response appears directly below after reasoning completes.
 * It never moves to the bottom with other inline actions.
 * 
 * **Features:**
 * - Live counting timer during thinking phase
 * - Real-time streaming of reasoning content (word-by-word)
 * - Fixed header with scrollable content
 * - Intelligent summary display when collapsed (after thinking completes)
 * - Visual indicator showing thinking state vs completed state
 */
export function ThinkingBubble({
  thinking,
  isThinking = false,
  isStreaming = false,
  defaultCollapsed = false, // Default to expanded so users can see reasoning
  summary,
  isGeneratingSummary = false,
}: ThinkingBubbleProps) {
  // Start collapsed - user can expand if they want to see the thinking content
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  
  // Timer state
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const timerStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track if we have thinking content
  // Note: thinking can be an empty string when "thinking has started" but no content yet
  // We treat both undefined/null and empty string differently:
  // - undefined/null = no extended thinking at all
  // - empty string = extended thinking started, waiting for content
  // - non-empty string = extended thinking with content
  const hasThinking = thinking !== undefined && thinking !== null;
  
  // Timer should run while streaming AND we have thinking content
  const shouldTimerRun = hasThinking && isStreaming;
  
  // Thinking is "complete" when we have content but streaming ended
  const isThinkingComplete = hasThinking && !isStreaming;

  // Auto-collapse when thinking completes and we have a summary
  useEffect(() => {
    if (isThinkingComplete && summary) {
      setIsExpanded(false);
    }
  }, [isThinkingComplete, summary]);

  // Timer effect - start when thinking appears, stop when streaming ends
  useEffect(() => {
    if (shouldTimerRun && !intervalRef.current) {
      // Start the timer
      if (!timerStartRef.current) {
        timerStartRef.current = Date.now();
        setDisplaySeconds(0);
      }
      
      // Start interval to update display every 100ms
      intervalRef.current = setInterval(() => {
        if (timerStartRef.current) {
          const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
          setDisplaySeconds(elapsed);
        }
      }, 100);
    }
    
    // Stop timer when streaming ends
    if (!shouldTimerRun && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      
      // Calculate and set final elapsed time
      if (timerStartRef.current) {
        const finalElapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
        setDisplaySeconds(finalElapsed);
        timerStartRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldTimerRun]);
  
  // Reset timer when thinking content is cleared (new conversation)
  useEffect(() => {
    if (!hasThinking) {
      setDisplaySeconds(0);
      timerStartRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [hasThinking]);

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

  // Display the current elapsed seconds
  const displayDuration = displaySeconds;
  
  // Determine header label based on state
  const getHeaderLabel = () => {
    if (isThinking) {
      return 'Thought process';
    }
    if (isGeneratingSummary) {
      return 'Thought process';
    }
    if (summary) {
      return summary;
    }
    return 'Thought process';
  };

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
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)]/50 transition-colors group sticky top-0 backdrop-blur-sm z-10"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Label text - shows status, then summary */}
          <span className="text-sm text-[var(--fg-secondary)] truncate">
            {getHeaderLabel()}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Timer display - always visible, actively counting during thinking */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
            <Clock className="w-3 h-3" />
            <span className="tabular-nums min-w-[24px]">
              {formatDuration(displayDuration)}
            </span>
          </div>
          
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
                className="px-4 py-3 text-[13px] text-[var(--fg-tertiary)] leading-relaxed max-h-[300px] overflow-y-auto"
              >
                {/* Thinking content - inherits Neue Haas Grotesk from body */}
                {thinking && thinking.length > 0 && (
                  <div>
                    <div className="whitespace-pre-wrap">
                      {thinking}
                    </div>
                    
                    {/* Streaming cursor while actively thinking */}
                    {isThinking && (
                      <motion.span
                        className="inline-block w-[2px] h-4 bg-[var(--fg-tertiary)] ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
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
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 bg-[var(--fg-tertiary)] rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-[var(--fg-tertiary)] rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-[var(--fg-tertiary)] rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
          <Clock className="w-3 h-3" />
          <span>Thought for {thinkingDuration}s</span>
        </div>
      )}
    </div>
  );
}

export default ThinkingBubble;
