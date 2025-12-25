'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
import { ToolUseIndicator } from './ToolExecutionCard';
import type { ToolCall } from '@/hooks/useChat';

interface InlineStreamingDisplayProps {
  /** Claude's thinking/reasoning content */
  thinking?: string;
  /** Tool calls being executed */
  toolCalls?: ToolCall[];
  /** Whether the response is still streaming */
  isStreaming: boolean;
  /** Whether any text content has arrived yet */
  hasContent: boolean;
}

/**
 * InlineStreamingDisplay Component
 * 
 * Displays Claude's thinking process and tool usage inline during streaming.
 * Shows actual thinking content instead of generic placeholder text.
 * 
 * Visual states:
 * - No content yet: Show animated DotLoader with rotating phrases
 * - Thinking arrives: Display thinking text inline with streaming cursor
 * - Tool use starts: Show tool card with "Running" status
 * - Tool completes: Update card to show "Completed"
 * - Response starts: Smoothly transition away
 */
export function InlineStreamingDisplay({
  thinking,
  toolCalls,
  isStreaming,
  hasContent,
}: InlineStreamingDisplayProps) {
  // Don't show anything if not streaming or if we have content
  if (!isStreaming) return null;
  
  const hasThinking = thinking && thinking.length > 0;
  const hasToolCalls = toolCalls && toolCalls.length > 0;
  const activeTools = toolCalls?.filter(t => t.status === 'running' || t.status === 'pending') || [];
  
  // If we have text content and no active thinking/tools, don't show this component
  if (hasContent && !hasThinking && activeTools.length === 0) return null;

  return (
    <div className="py-2 space-y-3">
      <AnimatePresence mode="wait">
        {/* Tool calls - show these prominently */}
        {hasToolCalls && (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {toolCalls.map((tool) => (
              <ToolUseIndicator
                key={tool.id}
                toolName={tool.name}
                isRunning={tool.status === 'running' || tool.status === 'pending'}
              />
            ))}
          </motion.div>
        )}

        {/* Thinking content - show inline like Claude desktop */}
        {hasThinking && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            <div className="flex items-start gap-2">
              {/* Thinking indicator */}
              <div className="flex-shrink-0 mt-0.5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="text-[var(--fg-brand-primary)]"
                >
                  <Brain className="w-4 h-4" />
                </motion.div>
              </div>
              
              {/* Thinking text */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-[var(--fg-brand-primary)] uppercase tracking-wider mb-1 block">
                  Thinking
                </span>
                <div className="text-sm text-[var(--fg-tertiary)] font-mono leading-relaxed">
                  {/* Show last 500 chars of thinking to keep it manageable */}
                  {thinking.length > 500 
                    ? '...' + thinking.slice(-500) 
                    : thinking
                  }
                  {/* Streaming cursor */}
                  <motion.span
                    className="inline-block w-1.5 h-4 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Fallback: Show animated placeholder when no thinking or tools yet */}
        {!hasThinking && !hasToolCalls && !hasContent && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ThinkingDotFlow />
          </motion.div>
        )}

        {/* Simple loading indicator when we have content but still streaming */}
        {hasContent && !hasThinking && activeTools.length === 0 && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-[var(--fg-tertiary)]"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs font-mono">generating...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact version for minimal UI
 */
export function InlineStreamingIndicator({
  thinking,
  toolCalls,
  isStreaming,
}: Omit<InlineStreamingDisplayProps, 'hasContent'>) {
  if (!isStreaming) return null;

  const hasThinking = thinking && thinking.length > 0;
  const activeTools = toolCalls?.filter(t => t.status === 'running') || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-xs"
    >
      {hasThinking && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-3 h-3 text-[var(--fg-brand-primary)]" />
          </motion.div>
          <span className="text-[var(--fg-secondary)]">Thinking...</span>
        </>
      )}
      
      {activeTools.length > 0 && !hasThinking && (
        <>
          <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
          <span className="text-[var(--fg-secondary)]">
            Using {activeTools[0].name.replace(/_/g, ' ')}
          </span>
        </>
      )}
      
      {!hasThinking && activeTools.length === 0 && (
        <>
          <Loader2 className="w-3 h-3 text-[var(--fg-tertiary)] animate-spin" />
          <span className="text-[var(--fg-tertiary)]">Processing...</span>
        </>
      )}
    </motion.div>
  );
}

export default InlineStreamingDisplay;

