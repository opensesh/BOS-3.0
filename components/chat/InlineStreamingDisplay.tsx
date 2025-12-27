'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
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
 * - Shows DotFlow animation at the BOTTOM during ALL streaming (trails the text)
 * - Fetches summary from LLM when thinking completes
 * - NO tool indicators (removed entirely)
 * 
 * Flow:
 * 1. Streaming starts → DotFlow animation at bottom
 * 2. Text arrives → DotFlow stays at bottom, trailing the text
 * 3. If extended thinking ON → ThinkingBubble shown BEFORE content
 * 4. Streaming ends → DotFlow disappears
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

      {/* DotFlow animation - shown at the BOTTOM during ALL streaming
          This is the "trailblazer" that stays visible while text streams */}
      {isStreaming && (
        <div className="py-2">
          <ThinkingDotFlow />
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

  return <ThinkingDotFlow className="scale-75" />;
}

export default InlineStreamingDisplay;
