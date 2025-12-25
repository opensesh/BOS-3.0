'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, Globe, Brain, Search, Wrench, Calculator, Clock, FileText, Code } from 'lucide-react';
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
 * Shows actual thinking content and tool activity descriptions.
 * 
 * Visual states:
 * - No content yet: Show animated DotLoader with rotating phrases
 * - Tool use starts: Show tool name with description of what's happening
 * - Thinking arrives: Display thinking text when expanded
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
  
  // De-duplicate tools by name - only show each unique tool once, keep the most recent
  const uniqueTools = useMemo(() => {
    if (!toolCalls) return [];
    const toolMap = new Map<string, ToolCall>();
    // Process in order so later tools override earlier ones (keeps most recent input)
    toolCalls.forEach(tool => {
      toolMap.set(tool.name, tool);
    });
    return Array.from(toolMap.values());
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

  // Get tool description based on its input
  const getToolDescription = (tool: ToolCall) => {
    const config = toolConfig[tool.name];
    if (config) {
      return config.getDescription(tool.input);
    }
    // Fallback for unknown tools
    if (tool.input?.query) {
      return `Processing: "${tool.input.query}"`;
    }
    return `Running ${formatToolName(tool.name)}...`;
  };

  // Build the activity log content
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
      // Show last portion of thinking
      const thinkingPreview = thinking.length > 600 ? '...' + thinking.slice(-600) : thinking;
      lines.push(thinkingPreview);
    }
    
    return lines.join('\n');
  }, [uniqueTools, hasThinking, thinking]);

  // Check if there's meaningful content to show when expanded
  const hasExpandableContent = hasThinking || uniqueTools.some(t => t.input);

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
            {/* Tool/Thinking header row */}
            <button
              onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
              className={`flex items-start gap-2 text-left w-full ${hasExpandableContent ? 'group cursor-pointer' : 'cursor-default'}`}
            >
              {/* Chevron - only show if expandable */}
              {hasExpandableContent ? (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[var(--fg-tertiary)] group-hover:text-[var(--fg-secondary)] mt-0.5 flex-shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <div className="w-3.5" /> // Spacer
              )}
              
              {/* Tool info */}
              <div className="flex-1 min-w-0">
                {/* Tool icons and names row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {uniqueTools.map((tool, idx) => {
                    const config = toolConfig[tool.name];
                    const Icon = config?.icon || Wrench;
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
                
                {/* Tool description - show inline when not expanded */}
                {!isExpanded && activeTools.length > 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[var(--fg-tertiary)] mt-1 truncate"
                  >
                    {getToolDescription(activeTools[activeTools.length - 1])}
                  </motion.p>
                )}
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
  if (!isStreaming) return null;

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

  // Get description for active tool
  const getDescription = (tool: ToolCall) => {
    const config = toolConfig[tool.name];
    if (config) {
      return config.getDescription(tool.input);
    }
    return `Running ${tool.name.replace(/_/g, ' ')}...`;
  };

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
            {getDescription(uniqueActiveTools[0])}
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

