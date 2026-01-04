'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLoaderOnly, ThinkingDotFlow } from '@/components/ui/dot-flow';
import { ThinkingBubble } from './ThinkingBubble';
import { Globe } from 'lucide-react';

interface InlineStreamingDisplayProps {
  /** Claude's thinking/reasoning content */
  thinking?: string;
  /** Whether the response is still streaming */
  isStreaming: boolean;
  /** Whether any text content has arrived yet */
  hasContent: boolean;
}

/**
 * InlineStreamingDisplay Component
 * 
 * This component manages the visual feedback during AI response generation.
 * 
 * **Key Design Principle**: The ThinkingBubble (reasoning) ALWAYS stays positioned
 * ABOVE the actual response content. It never moves to the bottom with other
 * inline actions. The response appears directly below after reasoning completes.
 * 
 * **Flow**:
 * 1. Streaming starts, no content yet → ThinkingDotFlow with fun random words
 * 2. If extended thinking ON → ThinkingBubble shown, actively counting time
 * 3. Text arrives → Switch to DotLoaderOnly (just dots trailing the text)
 * 4. Streaming ends → Animation disappears, ThinkingBubble collapses with summary
 * 
 * **Important**: Response content is rendered OUTSIDE this component (in AnswerView).
 * This component only handles the activity indicators and reasoning display.
 */
export function InlineStreamingDisplay({
  thinking,
  isStreaming,
  hasContent,
}: InlineStreamingDisplayProps) {
  // Note: thinking can be an empty string when "thinking has started" but no content yet
  // We treat both undefined/null and empty string differently:
  // - undefined/null = no extended thinking at all  
  // - empty string = extended thinking started, waiting for content (show bubble with placeholder)
  // - non-empty string = extended thinking with content
  const hasThinking = thinking !== undefined && thinking !== null;
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [hasFetchedSummary, setHasFetchedSummary] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const lastThinkingRef = useRef<string | undefined>(undefined);
  
  // Check if we're actively thinking (thinking content arriving but no text yet)
  const isActivelyThinking = Boolean(hasThinking && !hasContent && isStreaming);
  
  // Show the fun word animation before content arrives (not during extended thinking)
  const showWordAnimation = isStreaming && !hasContent && !hasThinking;

  // Fetch summary when thinking completes (transition from thinking to text)
  // This creates a smart, contextual summary of the reasoning process
  useEffect(() => {
    if (
      hasThinking && 
      !isActivelyThinking && 
      !hasFetchedSummary &&
      thinking !== lastThinkingRef.current
    ) {
      lastThinkingRef.current = thinking;
      setHasFetchedSummary(true);
      setIsGeneratingSummary(true);
      
      // Generate an intelligent summary that captures the key reasoning
      fetch('/api/summarize-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thinking }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.summary) {
            setSummary(data.summary);
          }
        })
        .catch(err => {
          console.error('Failed to fetch thinking summary:', err);
          // Fallback to a generic but helpful summary
          setSummary('Analyzed context and crafted response');
        })
        .finally(() => {
          setIsGeneratingSummary(false);
        });
    }
  }, [hasThinking, isActivelyThinking, hasFetchedSummary, thinking]);

  // Reset state when thinking content is cleared (new conversation)
  useEffect(() => {
    if (!hasThinking) {
      setSummary(undefined);
      setHasFetchedSummary(false);
      setIsGeneratingSummary(false);
      lastThinkingRef.current = undefined;
    }
  }, [hasThinking]);

  return (
    <>
      {/* ThinkingBubble - ALWAYS positioned above response content
          This is the reasoning/thinking display that shows Claude's thought process */}
      {hasThinking && (
        <div className="py-2">
          <ThinkingBubble
            thinking={thinking}
            isThinking={isActivelyThinking}
            isStreaming={isStreaming}
            summary={summary}
            isGeneratingSummary={isGeneratingSummary}
          />
        </div>
      )}

      {/* Fun word animation - shown BEFORE content arrives (when not in extended thinking mode)
          Random phrases like "synergizing thoughtbits", "weaving brandwaves", etc. */}
      {showWordAnimation && (
        <div className="py-2">
          <ThinkingDotFlow />
        </div>
      )}
    </>
  );
}

/**
 * StreamingSourcesCounter
 * 
 * Shows the "Finding sources..." counter during streaming.
 * Should be rendered AFTER the canvas preview bubble in ChatContent.
 */
export function StreamingSourcesCounter({
  isStreaming,
  sourcesCount,
}: {
  isStreaming: boolean;
  sourcesCount: number;
}) {
  return (
    <AnimatePresence>
      {isStreaming && sourcesCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)]/60 border border-[var(--border-secondary)]">
            <Globe className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
            <span className="text-[13px] text-[var(--fg-tertiary)]">
              Finding sources...{' '}
              <motion.span
                key={sourcesCount}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--fg-primary)] font-medium"
              >
                {sourcesCount}
              </motion.span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * StreamingTrailIndicator
 * 
 * A separate component for the trailing dot animation that shows
 * AFTER content while text is streaming. This should be rendered
 * BELOW the response content, not above it.
 */
export function StreamingTrailIndicator({
  isStreaming,
  hasContent,
}: {
  isStreaming: boolean;
  hasContent: boolean;
}) {
  if (!isStreaming || !hasContent) return null;

  return (
    <div className="py-2">
      <DotLoaderOnly />
    </div>
  );
}

/**
 * Compact version for minimal UI
 */
export function InlineStreamingIndicator({
  isStreaming,
}: {
  isStreaming: boolean;
}) {
  if (!isStreaming) return null;

  return <DotLoaderOnly className="scale-75" />;
}

export default InlineStreamingDisplay;
