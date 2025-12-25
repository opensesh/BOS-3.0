'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Loader2, Globe, Brain, Search, Wrench } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
import type { ToolCall } from '@/hooks/useChat';

// Tool name to icon mapping
const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'web_search': Globe,
  'search_brand_knowledge': Brain,
  'search': Search,
};

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
 * - Tool use starts: Show tool name with expandable details
 * - Response starts: Smoothly transition away
 */
export function InlineStreamingDisplay({
  thinking,
  toolCalls,
  isStreaming,
  hasContent,
}: InlineStreamingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Don't show anything if not streaming
  if (!isStreaming) return null;
  
  const hasThinking = thinking && thinking.length > 0;
  const hasToolCalls = toolCalls && toolCalls.length > 0;
  
  // De-duplicate tools by name - only show each unique tool once
  const uniqueTools = useMemo(() => {
    if (!toolCalls) return [];
    const seen = new Set<string>();
    return toolCalls.filter(tool => {
      if (seen.has(tool.name)) return false;
      seen.add(tool.name);
      return true;
    });
  }, [toolCalls]);
  
  const activeTools = uniqueTools.filter(t => t.status === 'running' || t.status === 'pending');
  
  // If we have text content and no active thinking/tools, don't show this component
  if (hasContent && !hasThinking && activeTools.length === 0) return null;

  // Format tool name for display
  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="py-2">
      <AnimatePresence mode="wait">
        {/* Tool calls with expandable thinking */}
        {(hasToolCalls || hasThinking) && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {/* Tool/Thinking header row */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-left group w-full"
            >
              {/* Chevron */}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-[var(--fg-tertiary)] group-hover:text-[var(--fg-secondary)]"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
              
              {/* Tool icons and names */}
              <div className="flex items-center gap-3">
                {uniqueTools.map((tool, idx) => {
                  const Icon = toolIcons[tool.name] || Wrench;
                  const isActive = tool.status === 'running' || tool.status === 'pending';
                  
                  return (
                    <div key={tool.id} className="flex items-center gap-1.5">
                      {idx > 0 && <span className="text-[var(--fg-quaternary)]">·</span>}
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)]'}`} />
                      <span className={`text-xs ${isActive ? 'text-[var(--fg-secondary)]' : 'text-[var(--fg-tertiary)]'}`}>
                        {formatToolName(tool.name)}
                      </span>
                      {isActive && (
                        <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
                      )}
                    </div>
                  );
                })}
                
                {/* If only thinking (no tools), show thinking label */}
                {!hasToolCalls && hasThinking && (
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-[var(--fg-brand-primary)]" />
                    <span className="text-xs text-[var(--fg-secondary)]">Thinking</span>
                    <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
                  </div>
                )}
              </div>
            </button>
            
            {/* Expandable thinking content */}
            <AnimatePresence>
              {isExpanded && hasThinking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pt-2">
                    <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed font-mono whitespace-pre-wrap">
                      {/* Show last portion of thinking to keep it manageable */}
                      {thinking && thinking.length > 800 
                        ? '...' + thinking.slice(-800) 
                        : thinking
                      }
                      {/* Streaming cursor */}
                      <motion.span
                        className="inline-block w-1 h-3 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
  
  // De-duplicate tools by name
  const uniqueActiveTools = useMemo(() => {
    if (!toolCalls) return [];
    const seen = new Set<string>();
    return toolCalls
      .filter(t => t.status === 'running' || t.status === 'pending')
      .filter(tool => {
        if (seen.has(tool.name)) return false;
        seen.add(tool.name);
        return true;
      });
  }, [toolCalls]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="inline-flex items-center gap-2 text-xs"
    >
      {hasThinking && (
        <>
          <Brain className="w-3 h-3 text-[var(--fg-brand-primary)]" />
          <span className="text-[var(--fg-tertiary)]">Thinking...</span>
          <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
        </>
      )}
      
      {uniqueActiveTools.length > 0 && !hasThinking && (
        <>
          {(() => {
            const Icon = toolIcons[uniqueActiveTools[0].name] || Wrench;
            return <Icon className="w-3 h-3 text-[var(--fg-brand-primary)]" />;
          })()}
          <span className="text-[var(--fg-tertiary)]">
            {uniqueActiveTools[0].name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
        </>
      )}
      
      {!hasThinking && uniqueActiveTools.length === 0 && (
        <>
          <Loader2 className="w-3 h-3 text-[var(--fg-tertiary)] animate-spin" />
          <span className="text-[var(--fg-tertiary)]">Processing...</span>
        </>
      )}
    </motion.div>
  );
}

export default InlineStreamingDisplay;

