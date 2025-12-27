'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DotLoaderOnly } from '@/components/ui/dot-flow';
import { ThinkingBubble } from './ThinkingBubble';

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
 * Simplified streaming display:
 * - Shows ThinkingBubble when extended thinking content is present
 * - Shows DotLoaderOnly (just dots, no text) at the BOTTOM during streaming
 * - The dot loader acts as a "trailblazer" that trails behind the text
 * - NO tool indicators (removed entirely)
 * 
 * Flow:
 * 1. Streaming starts → Dot animation at bottom (no text)
 * 2. Text arrives → Dot animation stays at bottom
 * 3. If extended thinking ON → ThinkingBubble shown with "Thought process" label
 * 4. Streaming ends → Dot animation disappears
 */
export function InlineStreamingDisplay({
  thinking,
  isStreaming,
  hasContent,
}: InlineStreamingDisplayProps) {
  const hasThinking = thinking && thinking.length > 0;
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [hasFetchedSummary, setHasFetchedSummary] = useState(false);
  const lastThinkingRef = useRef<string | undefined>(undefined);
  
  // Check if we're actively thinking (thinking content arriving but no text yet)
  const isActivelyThinking = Boolean(hasThinking && !hasContent && isStreaming);

  // Fetch summary when thinking completes (transition from thinking to text)
  useEffect(() => {
    if (
      hasThinking && 
      !isActivelyThinking && 
      !hasFetchedSummary &&
      thinking !== lastThinkingRef.current
    ) {
      lastThinkingRef.current = thinking;
      setHasFetchedSummary(true);
      
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
        });
    }
  }, [hasThinking, isActivelyThinking, hasFetchedSummary, thinking]);

  // Reset when thinking content changes significantly
  useEffect(() => {
    if (!hasThinking) {
      setSummary(undefined);
      setHasFetchedSummary(false);
      lastThinkingRef.current = undefined;
    }
  }, [hasThinking]);

  return (
    <>
      {/* ThinkingBubble - shown when extended thinking content is present */}
      {hasThinking && (
        <div className="py-2">
          <ThinkingBubble
            thinking={thinking}
            isThinking={isActivelyThinking}
            summary={summary}
          />
        </div>
      )}

      {/* Dot animation (no text) - shown at the BOTTOM during ALL streaming
          This is the "trailblazer" that stays visible while text streams */}
      {isStreaming && (
        <div className="py-2">
          <DotLoaderOnly />
        </div>
      )}
    </>
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
