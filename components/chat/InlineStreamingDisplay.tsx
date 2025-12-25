'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Loader2, Globe, Brain, Wrench, Calculator, Clock, FileText, Code, CheckCircle } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
import type { ToolCall } from '@/hooks/useChat';

// Tool name to icon and description mapping
const toolConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  getDescription: (input?: Record<string, unknown>) => string;
}> = {
  'web_search': {
    icon: Globe,
    label: 'Web Search',
    getDescription: (input) => input?.query ? `"${input.query}"` : '',
  },
  'search_brand_knowledge': {
    icon: Brain,
    label: 'Brand Knowledge',
    getDescription: (input) => input?.query ? `"${input.query}"` : 'Searching brand knowledge...',
  },
  'calculator': {
    icon: Calculator,
    label: 'Calculator',
    getDescription: (input) => input?.expression ? `${input.expression}` : 'Calculating...',
  },
  'get_current_time': {
    icon: Clock,
    label: 'Time',
    getDescription: (input) => input?.timezone ? `${input.timezone}` : 'Getting current time...',
  },
  'read_file': {
    icon: FileText,
    label: 'File Read',
    getDescription: () => 'Reading file...',
  },
  'create_artifact': {
    icon: Code,
    label: 'Artifact',
    getDescription: (input) => input?.title ? `${input.title}` : 'Creating artifact...',
  },
};

// Helper to get tool description
const getToolDescription = (tool: ToolCall): string => {
  const config = toolConfig[tool.name];
  if (config) {
    return config.getDescription(tool.input);
  }
  // Fallback for unknown tools
  if (tool.input?.query) {
    return `"${tool.input.query}"`;
  }
  const formattedName = tool.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return formattedName;
};

// Helper to get tool label
const getToolLabel = (tool: ToolCall): string => {
  const config = toolConfig[tool.name];
  if (config) {
    return config.label;
  }
  return tool.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

interface SourceInfo {
  id: string;
  name: string;
  url: string;
  title?: string;
}

interface InlineStreamingDisplayProps {
  /** Claude's thinking/reasoning content */
  thinking?: string;
  /** Tool calls being executed */
  toolCalls?: ToolCall[];
  /** Whether the response is still streaming */
  isStreaming: boolean;
  /** Whether any text content has arrived yet */
  hasContent: boolean;
  /** Sources collected during tool execution */
  sources?: SourceInfo[];
}

/**
 * InlineStreamingDisplay Component
 * 
 * Displays Claude's thinking process and tool usage inline.
 * STAYS VISIBLE after streaming completes so users can always see reasoning.
 */
export function InlineStreamingDisplay({
  thinking,
  toolCalls,
  isStreaming,
  hasContent,
  sources = [],
}: InlineStreamingDisplayProps) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [isExpanded, setIsExpanded] = useState(false);
  const prevHasContent = useRef(hasContent);
  
  const hasThinking = thinking && thinking.length > 0;
  const hasToolCalls = toolCalls && toolCalls.length > 0;
  const hasSources = sources.length > 0;
  
  // Auto-close dropdown when content starts arriving (saves viewport space)
  useEffect(() => {
    if (hasContent && !prevHasContent.current && isExpanded) {
      setIsExpanded(false);
    }
    prevHasContent.current = hasContent;
  }, [hasContent, isExpanded]);
  
  // De-duplicate tools by name - keep the most recent one (with latest input)
  const uniqueTools = useMemo(() => {
    if (!toolCalls) return [];
    const toolMap = new Map<string, ToolCall>();
    toolCalls.forEach(tool => {
      toolMap.set(tool.name, tool);
    });
    return Array.from(toolMap.values());
  }, [toolCalls]);
  
  const activeTools = useMemo(() => {
    return uniqueTools.filter(t => t.status === 'running' || t.status === 'pending');
  }, [uniqueTools]);
  
  const completedTools = useMemo(() => {
    return uniqueTools.filter(t => t.status === 'completed');
  }, [uniqueTools]);

  // Always show if we have tool calls, thinking, or sources - even after streaming completes
  const hasActivityToShow = hasToolCalls || hasThinking || hasSources;
  
  // Don't show anything if nothing has happened yet
  if (!hasActivityToShow && !isStreaming) return null;
  
  // Show placeholder only during initial streaming with no activity yet
  if (!hasActivityToShow && isStreaming && !hasContent) {
    return (
      <div className="py-2">
        <ThinkingDotFlow />
      </div>
    );
  }
  
  // Don't show if no activity and we have content (just text response, no tools)
  if (!hasActivityToShow) return null;

  // Determine what to show in the header
  const isComplete = !isStreaming || (completedTools.length > 0 && activeTools.length === 0);
  const primaryTool = activeTools.length > 0 ? activeTools[activeTools.length - 1] : uniqueTools[uniqueTools.length - 1];

  return (
    <div className="py-2">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Clickable header - always expandable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-start gap-2 text-left w-full group cursor-pointer"
        >
          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 0 }}
            className="text-[var(--fg-tertiary)] group-hover:text-[var(--fg-secondary)] mt-0.5 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </motion.div>
          
          {/* Tool info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Tool icon */}
              {primaryTool && (() => {
                const config = toolConfig[primaryTool.name];
                const Icon = config?.icon || Wrench;
                return <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isComplete ? 'text-[var(--fg-tertiary)]' : 'text-[var(--fg-brand-primary)]'}`} />;
              })()}
              
              {/* Tool label and query (if available) */}
              <span className={`text-xs ${isComplete ? 'text-[var(--fg-tertiary)]' : 'text-[var(--fg-secondary)]'}`}>
                {primaryTool ? getToolLabel(primaryTool) : 'Processing'}
              </span>
              {primaryTool && getToolDescription(primaryTool) && (
                <span className="text-xs text-[var(--fg-tertiary)]">
                  {getToolDescription(primaryTool)}
                </span>
              )}
              
              {/* Status indicator - show spinner while searching, checkmark when done */}
              {isComplete ? (
                <CheckCircle className="w-3 h-3 text-[var(--fg-success-primary)] flex-shrink-0" />
              ) : (
                <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin flex-shrink-0" />
              )}
              
              {/* Show source count - only when complete or when sources exist */}
              {hasSources && (
                <motion.span 
                  key={sources.length}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] text-[var(--fg-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded tabular-nums"
                >
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                </motion.span>
              )}
            </div>
          </div>
        </button>
        
        {/* Expandable content - shows sources as they're collected */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-6 pt-2 pb-1">
                {/* Show sources as they're collected */}
                {sources.length > 0 ? (
                  <div className="divide-y divide-[var(--border-primary)]">
                    {sources.map((source, idx) => (
                      <motion.a
                        key={source.id || idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.03 }}
                        className="flex items-center gap-2 text-xs py-1.5 first:pt-0 last:pb-0 hover:text-[var(--fg-primary)] transition-colors group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] truncate">
                          {source.title || source.name}
                        </span>
                        <span className="text-[var(--fg-quaternary)] text-[10px] flex-shrink-0">
                          {source.name}
                        </span>
                      </motion.a>
                    ))}
                    {/* Show streaming indicator while still searching */}
                    {isStreaming && activeTools.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-xs text-[var(--fg-tertiary)] py-1.5"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Searching...</span>
                      </motion.div>
                    )}
                  </div>
                ) : isStreaming && activeTools.length > 0 ? (
                  // Show searching indicator when no sources yet
                  <div className="flex items-center gap-2 text-xs text-[var(--fg-tertiary)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  // Show thinking content if available and no sources
                  hasThinking && thinking && (
                    <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed font-mono whitespace-pre-wrap">
                      {thinking.length > 600 ? '...' + thinking.slice(-600) : thinking}
                    </p>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
  // ALL HOOKS FIRST - before any conditional returns
  const hasThinking = thinking && thinking.length > 0;
  
  // De-duplicate tools by name, keep most recent
  const uniqueActiveTools = useMemo(() => {
    if (!toolCalls) return [];
    const toolMap = new Map<string, ToolCall>();
    toolCalls
      .filter(t => t.status === 'running' || t.status === 'pending')
      .forEach(tool => {
        toolMap.set(tool.name, tool);
      });
    return Array.from(toolMap.values());
  }, [toolCalls]);

  // NOW we can conditionally return
  if (!isStreaming) return null;

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
            const config = toolConfig[uniqueActiveTools[0].name];
            const Icon = config?.icon || Wrench;
            return <Icon className="w-3 h-3 text-[var(--fg-brand-primary)]" />;
          })()}
          <span className="text-[var(--fg-tertiary)] max-w-[200px] truncate">
            {getToolDescription(uniqueActiveTools[0])}
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
