'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Clock, Lightbulb, Search, Sparkles, Target } from 'lucide-react';

interface ThinkingBubbleProps {
  /** The thinking content to display */
  thinking?: string;
  /** Whether thinking is still in progress (streaming) */
  isThinking?: boolean;
  /** Whether to start collapsed (default: true) */
  defaultCollapsed?: boolean;
  /** Summary of the thinking content (provided after LLM summarization) */
  summary?: string;
}

/**
 * Thinking phase types for structured display
 */
type ThinkingPhase = 'understand' | 'contextualize' | 'analyze' | 'synthesize' | 'general';

interface ThinkingSection {
  phase: ThinkingPhase;
  content: string;
}

/**
 * Phase metadata for visual styling
 */
const PHASE_CONFIG: Record<ThinkingPhase, { label: string; icon: typeof Lightbulb; color: string }> = {
  understand: { label: 'Understanding', icon: Target, color: 'text-blue-500' },
  contextualize: { label: 'Contextualizing', icon: Search, color: 'text-purple-500' },
  analyze: { label: 'Analyzing', icon: Lightbulb, color: 'text-amber-500' },
  synthesize: { label: 'Synthesizing', icon: Sparkles, color: 'text-emerald-500' },
  general: { label: 'Reasoning', icon: Lightbulb, color: 'text-[var(--fg-tertiary)]' },
};

/**
 * Parse thinking content into structured sections based on phase markers
 * Looks for patterns like "**Understand**:", "1. **Understand**:", or natural language cues
 */
function parseThinkingSections(thinking: string): ThinkingSection[] {
  if (!thinking) return [];
  
  const sections: ThinkingSection[] = [];
  
  // Pattern to match structured phase markers (e.g., "**Understand**:", "1. **Understand**:")
  const phasePattern = /(?:^|\n)(?:\d+\.\s*)?\*?\*?(Understand|Contextualize|Analyze|Synthesize)\*?\*?:?\s*/gi;
  
  // Check if content has structured phases
  const matches = thinking.match(phasePattern);
  
  if (matches && matches.length >= 2) {
    // Content has structured phases - parse them
    let lastIndex = 0;
    let lastPhase: ThinkingPhase = 'general';
    
    const regex = /(?:^|\n)(?:\d+\.\s*)?\*?\*?(Understand|Contextualize|Analyze|Synthesize)\*?\*?:?\s*/gi;
    let match;
    
    while ((match = regex.exec(thinking)) !== null) {
      // Save content before this match
      if (match.index > lastIndex) {
        const content = thinking.slice(lastIndex, match.index).trim();
        if (content) {
          sections.push({ phase: lastPhase, content });
        }
      }
      
      // Update phase for next section
      lastPhase = match[1].toLowerCase() as ThinkingPhase;
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining content
    if (lastIndex < thinking.length) {
      const content = thinking.slice(lastIndex).trim();
      if (content) {
        sections.push({ phase: lastPhase, content });
      }
    }
  } else {
    // No structured phases - return as single general section
    sections.push({ phase: 'general', content: thinking });
  }
  
  return sections;
}

/**
 * ThinkingBubble Component
 * 
 * A Claude-inspired collapsible component that displays the AI's reasoning process.
 * 
 * **Features:**
 * - Live counting timer during thinking phase
 * - "Thought process" label (no animated text)
 * - Fixed header with scrollable content
 * - Summary display when collapsed (after thinking completes)
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
  
  // Live timer state - actively counts while we have thinking content and streaming
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedTimerRef = useRef(false);

  // Track if we have thinking content
  const hasThinking = Boolean(thinking && thinking.length > 0);

  // Start timer when thinking content first appears, stop when isThinking becomes false
  useEffect(() => {
    // Start timer when thinking content first appears (regardless of isThinking prop)
    if (hasThinking && !hasStartedTimerRef.current) {
      hasStartedTimerRef.current = true;
      timerStartRef.current = Date.now();
      setElapsedSeconds(0);
      setFinalDuration(null);
      
      // Update every 100ms for smoother counting
      timerIntervalRef.current = setInterval(() => {
        if (timerStartRef.current) {
          const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 100);
    }
    
    // Stop timer when thinking is no longer active (streaming ended or moved to text phase)
    if (!isThinking && timerStartRef.current !== null && hasStartedTimerRef.current) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const duration = Math.floor((Date.now() - timerStartRef.current) / 1000);
      setFinalDuration(duration);
      timerStartRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [hasThinking, isThinking]);
  
  // Reset timer state when thinking content is cleared (new message)
  useEffect(() => {
    if (!hasThinking) {
      hasStartedTimerRef.current = false;
      setElapsedSeconds(0);
      setFinalDuration(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      timerStartRef.current = null;
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

  // Parse thinking into structured sections
  const thinkingSections = useMemo(() => {
    return parseThinkingSections(thinking || '');
  }, [thinking]);
  
  // Check if we have structured phases (more than just 'general')
  const hasStructuredPhases = thinkingSections.some(s => s.phase !== 'general');

  // Format duration display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Display the current elapsed time OR the final duration
  const displayDuration = isThinking ? elapsedSeconds : (finalDuration ?? elapsedSeconds);

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
          {/* Label text - always shows "Thought process" or summary 
              Note: DotLoader is shown separately below via InlineStreamingDisplay */}
          {summary && !isThinking ? (
            <span className="text-sm text-[var(--fg-secondary)] truncate">
              {summary}
            </span>
          ) : (
            <span className="text-sm text-[var(--fg-secondary)]">
              Thought process
            </span>
          )}
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
                {hasThinking ? (
                  <div className="space-y-3">
                    {hasStructuredPhases ? (
                      // Structured phase display with visual hierarchy
                      thinkingSections.map((section, idx) => {
                        const config = PHASE_CONFIG[section.phase];
                        const Icon = config.icon;
                        
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative"
                          >
                            {/* Phase header */}
                            {section.phase !== 'general' && (
                              <div className={`flex items-center gap-1.5 mb-1.5 ${config.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wide">
                                  {config.label}
                                </span>
                              </div>
                            )}
                            {/* Phase content */}
                            <div className="font-mono whitespace-pre-wrap text-[var(--fg-tertiary)] pl-0.5">
                              {section.content}
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      // Unstructured thinking - show as flowing text
                      <div className="font-mono whitespace-pre-wrap">
                        {thinking}
                      </div>
                    )}
                    
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
        <DotLoaderOnly className="scale-75 origin-left" />
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
