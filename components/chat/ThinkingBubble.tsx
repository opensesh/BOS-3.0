'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Clock, Brain, Sparkles } from 'lucide-react';

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
  // Start expanded during active thinking, collapse after completion
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed || isThinking);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  
  // Timer state
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const timerStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track if we have thinking content
  const hasThinking = Boolean(thinking && thinking.length > 0);
  
  // Timer should run while streaming AND we have thinking content
  const shouldTimerRun = hasThinking && isStreaming;
  
  // Thinking is "complete" when we have content but streaming ended
  const isThinkingComplete = hasThinking && !isStreaming;

  // Auto-expand when actively thinking, collapse when complete
  useEffect(() => {
    if (isThinking) {
      setIsExpanded(true);
    } else if (isThinkingComplete && summary) {
      // Auto-collapse once we have a summary
      setIsExpanded(false);
    }
  }, [isThinking, isThinkingComplete, summary]);

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
      return 'Reasoning...';
    }
    if (isGeneratingSummary) {
      return 'Summarizing...';
    }
    if (summary) {
      return summary;
    }
    return 'Reasoned through the question';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border overflow-hidden transition-colors ${
        isThinking 
          ? 'border-[var(--border-brand-primary)]/50 bg-[var(--bg-brand-primary)]/5' 
          : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30'
      }`}
    >
      {/* Fixed Header - Collapsible trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)]/50 transition-colors group sticky top-0 backdrop-blur-sm z-10"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Brain icon with active indicator */}
          <div className="relative flex-shrink-0">
            <Brain className={`w-4 h-4 ${isThinking ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)]'}`} />
            {isThinking && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--bg-brand-solid)] rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          
          {/* Label text - shows status, then summary */}
          <span className={`text-sm truncate ${
            isThinking ? 'text-[var(--fg-brand-primary)] font-medium' : 'text-[var(--fg-secondary)]'
          }`}>
            {getHeaderLabel()}
          </span>
          
          {/* Processing sparkle indicator */}
          {isThinking && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-shrink-0"
            >
              <Sparkles className="w-3 h-3 text-[var(--fg-brand-primary)]" />
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Timer display - always visible, actively counting during thinking */}
          <div className={`flex items-center gap-1.5 text-xs ${
            isThinking ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)]'
          }`}>
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
                {hasThinking ? (
                  <div>
                    {/* Natural flowing thinking content - no artificial structure */}
                    <div className="font-mono whitespace-pre-wrap">
                      {thinking}
                    </div>
                    
                    {/* Streaming cursor */}
                    {isThinking && (
                      <motion.span
                        className="inline-block w-[2px] h-4 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </div>
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
