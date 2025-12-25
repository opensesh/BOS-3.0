'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, Globe, Brain, Wrench, Calculator, Clock, FileText, Code } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
import type { ToolCall } from '@/hooks/useChat';

// Tool name to icon and description mapping
const toolConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>;
  getDescription: (input?: Record<string, unknown>) => string;
}> = {
  'web_search': {
    icon: Globe,
    getDescription: (input) => input?.query ? `Searching: "${input.query}"` : 'Searching the web...',
  },
  'search_brand_knowledge': {
    icon: Brain,
    getDescription: (input) => input?.query ? `Looking up: "${input.query}"` : 'Searching brand knowledge...',
  },
  'calculator': {
    icon: Calculator,
    getDescription: (input) => input?.expression ? `Calculating: ${input.expression}` : 'Performing calculation...',
  },
  'get_current_time': {
    icon: Clock,
    getDescription: (input) => input?.timezone ? `Getting time in ${input.timezone}` : 'Getting current time...',
  },
  'read_file': {
    icon: FileText,
    getDescription: (input) => input?.file_id ? `Reading file...` : 'Accessing file...',
  },
  'create_artifact': {
    icon: Code,
    getDescription: (input) => input?.title ? `Creating: ${input.title}` : 'Creating artifact...',
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
    return `Processing: "${tool.input.query}"`;
  }
  const formattedName = tool.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `Running ${formattedName}...`;
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
 * Always shows what's happening - never just a tool name without context.
 */
export function InlineStreamingDisplay({
  thinking,
  toolCalls,
  isStreaming,
  hasContent,
}: InlineStreamingDisplayProps) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasThinking = thinking && thinking.length > 0;
  const hasToolCalls = toolCalls && toolCalls.length > 0;
  
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

  // Build the activity log content for expanded view
  const activityContent = useMemo(() => {
    const lines: string[] = [];
    
    // Add tool activity descriptions
    uniqueTools.forEach(tool => {
      const status = tool.status === 'completed' ? '✓' : tool.status === 'error' ? '✗' : '→';
      lines.push(`${status} ${getToolDescription(tool)}`);
    });
    
    // Add thinking if available
    if (hasThinking && thinking) {
      lines.push('');
      lines.push('Reasoning:');
      const thinkingPreview = thinking.length > 600 ? '...' + thinking.slice(-600) : thinking;
      lines.push(thinkingPreview);
    }
    
    return lines.join('\n');
  }, [uniqueTools, hasThinking, thinking]);

  // Check if there's meaningful content to show when expanded
  const hasExpandableContent = hasThinking || uniqueTools.some(t => t.input);

  // NOW we can do conditional returns - after all hooks are called
  if (!isStreaming) return null;
  if (hasContent && !hasThinking && activeTools.length === 0) return null;

  // Get the current activity description to show
  const currentDescription = activeTools.length > 0 
    ? getToolDescription(activeTools[activeTools.length - 1])
    : hasThinking 
      ? 'Processing your request...'
      : null;

  return (
    <div className="py-2">
      <AnimatePresence mode="wait">
        {/* Tool calls with expandable details */}
        {(hasToolCalls || hasThinking) && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {/* Clickable row - always shows description */}
            <button
              onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
              className={`flex items-start gap-2 text-left w-full ${hasExpandableContent ? 'group cursor-pointer' : 'cursor-default'}`}
            >
              {/* Chevron */}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-[var(--fg-tertiary)] group-hover:text-[var(--fg-secondary)] mt-0.5 flex-shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
              
              {/* Tool info - always shows icon + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {/* Tool icon */}
                  {activeTools.length > 0 ? (
                    <>
                      {(() => {
                        const tool = activeTools[activeTools.length - 1];
                        const config = toolConfig[tool.name];
                        const Icon = config?.icon || Wrench;
                        return <Icon className="w-3.5 h-3.5 text-[var(--fg-brand-primary)] flex-shrink-0" />;
                      })()}
                    </>
                  ) : hasThinking ? (
                    <Brain className="w-3.5 h-3.5 text-[var(--fg-brand-primary)] flex-shrink-0" />
                  ) : null}
                  
                  {/* Description text - always shows what's happening */}
                  <span className="text-xs text-[var(--fg-secondary)] truncate">
                    {currentDescription}
                  </span>
                  
                  {/* Spinner */}
                  <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin flex-shrink-0" />
                </div>
              </div>
            </button>
            
            {/* Expandable activity log */}
            <AnimatePresence>
              {isExpanded && hasExpandableContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pt-2">
                    <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed font-mono whitespace-pre-wrap">
                      {activityContent}
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
