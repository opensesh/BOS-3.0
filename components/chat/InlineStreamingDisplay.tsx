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
 * - ALWAYS shows DotFlow animation first when streaming starts
 * - Shows ThinkingBubble when extended thinking content is present
 * - Fetches summary from LLM when thinking completes
 * - NO tool indicators (removed entirely)
 * 
 * Flow:
 * 1. Streaming starts → DotFlow animation
 * 2. If extended thinking ON → ThinkingBubble replaces DotFlow
 * 3. Thinking completes → Fetch summary for collapsed header
 * 4. Text arrives → Display fades out
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
    // Only fetch if:
    // 1. We have thinking content
    // 2. We're no longer actively thinking (text has started or streaming ended)
    // 3. We haven't already fetched a summary for this thinking content
    if (
      hasThinking && 
      !isActivelyThinking && 
      !hasFetchedSummary &&
      thinking !== lastThinkingRef.current
    ) {
      lastThinkingRef.current = thinking;
      setHasFetchedSummary(true);
      
      // Fetch summary asynchronously
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

  // If we have thinking content, show ThinkingBubble
  // This handles both active thinking AND completed thinking (for review)
  if (hasThinking) {
    return (
      <div className="py-2">
        <ThinkingBubble
          thinking={thinking}
          isThinking={isActivelyThinking}
          summary={summary}
        />
      </div>
    );
  }

  // If streaming with no content yet, show DotFlow animation
  // This is the "trailblazer" that leads all responses
  if (isStreaming && !hasContent) {
    return (
      <div className="py-2">
        <ThinkingDotFlow />
      </div>
    );
  }

  // Nothing to show - text is streaming or complete
  return null;
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
