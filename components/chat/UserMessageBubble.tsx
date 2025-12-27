'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface UserMessageBubbleProps {
  /** The user's message content */
  query: string;
  /** Maximum height before truncation (default: 120px) */
  maxHeight?: number;
}

/**
 * UserMessageBubble Component
 * 
 * Displays user messages with:
 * - Right alignment
 * - Fill background
 * - 80% max width
 * - "Show more" functionality for long messages with gradient fade
 */
export function UserMessageBubble({ query, maxHeight = 120 }: UserMessageBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check if content overflows the max height
  useEffect(() => {
    if (contentRef.current) {
      const hasContentOverflow = contentRef.current.scrollHeight > maxHeight;
      setHasOverflow(hasContentOverflow);
    }
  }, [query, maxHeight]);

  return (
    <div className="flex justify-end mb-6">
      <div className="bg-[var(--bg-secondary)] rounded-2xl max-w-[80%] relative overflow-hidden">
        {/* Content wrapper with conditional max-height */}
        <div
          ref={contentRef}
          className={`px-4 py-2.5 ${!isExpanded && hasOverflow ? '' : ''}`}
          style={{
            maxHeight: !isExpanded && hasOverflow ? `${maxHeight}px` : 'none',
            overflow: 'hidden',
          }}
        >
          <p className="text-[15px] text-[var(--fg-primary)] whitespace-pre-wrap">
            {query}
          </p>
        </div>

        {/* Gradient overlay + Show more button */}
        {hasOverflow && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0">
            {/* Gradient fade */}
            <div className="h-12 bg-gradient-to-t from-[var(--bg-secondary)] via-[var(--bg-secondary)]/80 to-transparent" />
            
            {/* Show more button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full flex items-center justify-center gap-1 py-2 bg-[var(--bg-secondary)] text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
            >
              <span>Show more</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Show less button when expanded */}
        {hasOverflow && isExpanded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsExpanded(false)}
            className="w-full flex items-center justify-center gap-1 py-2 border-t border-[var(--border-secondary)] text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
          >
            <span>Show less</span>
            <motion.div animate={{ rotate: 180 }}>
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default UserMessageBubble;

