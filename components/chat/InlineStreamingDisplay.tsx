'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Loader2, Globe, Brain, Wrench, Calculator, Clock, FileText, Code, CheckCircle } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
import type { ToolCall } from '@/hooks/useChat';

// Tool name to icon and label mapping (descriptions removed for cleaner UI)
const toolConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  'web_search': {
    icon: Globe,
    label: 'Web Search',
  },
  'search_brand_knowledge': {
    icon: Brain,
    label: 'Brand Context',
  },
  'calculator': {
    icon: Calculator,
    label: 'Calculator',
  },
  'get_current_time': {
    icon: Clock,
    label: 'Time',
  },
  'read_file': {
    icon: FileText,
    label: 'File Read',
  },
  'create_artifact': {
    icon: Code,
    label: 'Artifact',
  },
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
        {/* Header - only expandable when there are sources */}
        <button
          onClick={() => hasSources && setIsExpanded(!isExpanded)}
          className={`flex items-start gap-2 text-left w-full ${hasSources ? 'group cursor-pointer' : 'cursor-default'}`}
          disabled={!hasSources}
        >
          {/* Chevron - only shown when expandable (has sources) */}
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 0 }}
            className={`mt-0.5 flex-shrink-0 ${hasSources ? 'text-[var(--fg-tertiary)] group-hover:text-[var(--fg-secondary)]' : 'text-transparent'}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 ${!hasSources ? 'invisible' : ''}`} />
            )}
          </motion.div>
          
          {/* Tool info - simplified: just label + status indicator */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Tool icon */}
              {primaryTool && (() => {
                const config = toolConfig[primaryTool.name];
                const Icon = config?.icon || Wrench;
                return <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isComplete ? 'text-[var(--fg-tertiary)]' : 'text-[var(--fg-brand-primary)]'}`} />;
              })()}
              
              {/* Tool label only - no description/query shown */}
              <span className={`text-xs ${isComplete ? 'text-[var(--fg-tertiary)]' : 'text-[var(--fg-secondary)]'}`}>
                {primaryTool ? getToolLabel(primaryTool) : 'Web Search'}
              </span>
              
              {/* Status indicator - spinner while searching, checkmark when done */}
              {isComplete ? (
                <CheckCircle className="w-3 h-3 text-[var(--fg-success-primary)] flex-shrink-0" />
              ) : (
                <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin flex-shrink-0" />
              )}
              
              {/* Source count badge - only shown when there are sources */}
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
        
        {/* Expandable content - only shows when there are sources to display */}
        <AnimatePresence>
          {isExpanded && hasSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-6 pt-2 pb-1">
                {/* Sources list - each source animates in one-by-one */}
                <div className="space-y-0.5">
                  {sources.map((source, idx) => (
                    <motion.a
                      key={`inline-source-${idx}-${source.id || source.url}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="flex items-center gap-2 text-xs py-1.5 hover:text-[var(--fg-primary)] transition-colors group"
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
                </div>
                
                {/* Show thinking content if available */}
                {hasThinking && thinking && (
                  <div className="mt-3 pt-2 border-t border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed font-mono whitespace-pre-wrap">
                      {thinking.length > 600 ? '...' + thinking.slice(-600) : thinking}
                    </p>
                  </div>
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
          {/* Just show tool label, no description */}
          <span className="text-[var(--fg-tertiary)]">
            {getToolLabel(uniqueActiveTools[0])}
          </span>
          <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
        </>
      )}
      
      {/* No fallback "Processing..." - just show the spinner if nothing else */}
      {!hasThinking && uniqueActiveTools.length === 0 && (
        <Loader2 className="w-3 h-3 text-[var(--fg-tertiary)] animate-spin" />
      )}
    </motion.div>
  );
}

export default InlineStreamingDisplay;
