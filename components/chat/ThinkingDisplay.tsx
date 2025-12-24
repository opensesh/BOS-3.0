'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Sparkles, Clock } from 'lucide-react';

interface ThinkingDisplayProps {
  /** The thinking content to display */
  content: string;
  /** Whether thinking is still in progress */
  isStreaming?: boolean;
  /** Token count for the thinking (if available) */
  tokenCount?: number;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
  /** Optional label override */
  label?: string;
}

/**
 * ThinkingDisplay Component
 * 
 * Displays Claude's extended thinking/reasoning process in a collapsible panel.
 * Shows a streaming animation when Claude is actively thinking.
 */
export function ThinkingDisplay({
  content,
  isStreaming = false,
  tokenCount,
  defaultCollapsed = true,
  label = 'Thinking',
}: ThinkingDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check if content overflows
  useEffect(() => {
    if (contentRef.current) {
      setHasOverflow(contentRef.current.scrollHeight > 200);
    }
  }, [content]);

  // Auto-expand when streaming starts, collapse when done
  useEffect(() => {
    if (isStreaming && content.length > 0) {
      setIsCollapsed(false);
    }
  }, [isStreaming, content.length]);

  // Don't render if no content
  if (!content && !isStreaming) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-primary)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="w-4 h-4 text-[var(--fg-brand-primary)]" />
            {isStreaming && (
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--bg-brand-solid)] rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <span className="text-sm font-medium text-[var(--fg-secondary)]">
            {isStreaming ? `${label}...` : label}
          </span>
          {isStreaming && (
            <motion.span
              className="text-xs text-[var(--fg-tertiary)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Processing
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tokenCount && !isStreaming && (
            <span className="text-xs text-[var(--fg-tertiary)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tokenCount.toLocaleString()} tokens
            </span>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)]" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-[var(--border-secondary)]">
              <div
                ref={contentRef}
                className={`
                  px-4 py-3 text-sm text-[var(--fg-tertiary)] 
                  font-mono leading-relaxed whitespace-pre-wrap
                  ${hasOverflow && !isStreaming ? 'max-h-[300px] overflow-y-auto' : ''}
                `}
              >
                {content || (
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
                
                {/* Streaming cursor */}
                {isStreaming && content && (
                  <motion.span
                    className="inline-block w-2 h-4 bg-[var(--fg-brand-primary)] ml-0.5"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Scroll indicator */}
              {hasOverflow && !isStreaming && (
                <div className="px-4 py-2 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30">
                  <span className="text-xs text-[var(--fg-tertiary)]">
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
 * ThinkingIndicator Component
 * 
 * A compact indicator that shows Claude is thinking without revealing content.
 * Use this for a minimal UI when you don't want to show the full thinking.
 */
export function ThinkingIndicator({ isThinking }: { isThinking: boolean }) {
  if (!isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-brand-primary)]/10 border border-[var(--border-brand-primary)]"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Brain className="w-4 h-4 text-[var(--fg-brand-primary)]" />
      </motion.div>
      <span className="text-sm text-[var(--fg-brand-primary)]">
        Claude is thinking...
      </span>
    </motion.div>
  );
}

export default ThinkingDisplay;

