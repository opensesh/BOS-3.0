'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Globe, Brain, Wrench, Calculator, Clock, FileText, Code } from 'lucide-react';
import { ThinkingDotFlow } from '@/components/ui/dot-flow';
import { ThinkingBubble } from './ThinkingBubble';
import type { ToolCall } from '@/hooks/useChat';

// Tool name to icon and label mapping
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

interface InlineStreamingDisplayProps {
  /** Claude's thinking/reasoning content */
  thinking?: string;
  /** Duration of thinking in seconds (available after thinking completes) */
  thinkingDuration?: number;
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
 * Simplified streaming display that:
 * - Shows DotFlow animation as a "trailblazer" during initial streaming
 * - Shows ThinkingBubble when extended thinking content is present
 * - Removed: "Web Search X sources" collapsible (handled by ResponseActions footer)
 * 
 * Two modes:
 * 1. Extended thinking OFF: Just animation leading text
 * 2. Extended thinking ON: ThinkingBubble with expandable reasoning
 */
export function InlineStreamingDisplay({
  thinking,
  thinkingDuration,
  toolCalls,
  isStreaming,
  hasContent,
}: InlineStreamingDisplayProps) {
  const hasThinking = thinking && thinking.length > 0;
  const hasToolCalls = toolCalls && toolCalls.length > 0;
  
  // Check if we're actively thinking (thinking content but no text yet)
  const isThinking = Boolean(hasThinking && !hasContent && isStreaming);
  
  // De-duplicate tools by name - keep the most recent one
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

  // Determine what to show:
  // 1. If we have thinking content → show ThinkingBubble
  // 2. If streaming with no content yet → show animation
  // 3. If tool is running → show tool indicator
  // 4. Otherwise → show nothing

  // Mode 1: Extended thinking content present → ThinkingBubble
  if (hasThinking) {
    return (
      <div className="py-2">
        <ThinkingBubble
          thinking={thinking}
          isThinking={isThinking}
          thinkingDuration={thinkingDuration}
          defaultCollapsed={true}
        />
      </div>
    );
  }

  // Mode 2: Initial streaming with no content → DotFlow animation
  if (isStreaming && !hasContent && !hasToolCalls) {
    return (
      <div className="py-2">
        <ThinkingDotFlow />
      </div>
    );
  }

  // Mode 3: Tool is actively running → show minimal tool indicator
  if (isStreaming && activeTools.length > 0) {
    const activeTool = activeTools[activeTools.length - 1];
    const config = toolConfig[activeTool.name];
    const Icon = config?.icon || Wrench;
    
    return (
      <div className="py-2">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <Icon className="w-3.5 h-3.5 text-[var(--fg-brand-primary)]" />
          <span className="text-xs text-[var(--fg-secondary)]">
            {getToolLabel(activeTool)}
          </span>
          <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Nothing to show
  return null;
}

/**
 * Compact version for minimal UI
 */
export function InlineStreamingIndicator({
  thinking,
  toolCalls,
  isStreaming,
}: Omit<InlineStreamingDisplayProps, 'hasContent' | 'thinkingDuration'>) {
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
          <span className="text-[var(--fg-tertiary)]">
            {getToolLabel(uniqueActiveTools[0])}
          </span>
          <Loader2 className="w-3 h-3 text-[var(--fg-brand-primary)] animate-spin" />
        </>
      )}
      
      {!hasThinking && uniqueActiveTools.length === 0 && (
        <Loader2 className="w-3 h-3 text-[var(--fg-tertiary)] animate-spin" />
      )}
    </motion.div>
  );
}

export default InlineStreamingDisplay;
