/**
 * Token Budgeter
 *
 * Manages context window allocation across different content types.
 * Ensures optimal use of available tokens while preventing overflow.
 *
 * Based on Claude's context windows:
 * - Claude 3.5 Sonnet: 200K tokens
 * - Claude 3 Opus: 200K tokens
 * - Recommended working context: ~150K (leave room for response)
 */

import { encode } from 'gpt-tokenizer';

// ===========================================
// Types
// ===========================================

export interface TokenBudget {
  systemPrompt: number;      // Base system prompt + instructions
  brandVoice: number;        // Brand voice/personality context
  skillContext: number;      // Active skill instructions
  retrievedContext: number;  // RAG results (documents, assets)
  conversationHistory: number; // Message history
  responseBuffer: number;    // Reserved for model response
}

export interface TokenAllocation {
  budget: TokenBudget;
  total: number;
  remaining: number;
  utilization: number;
}

export interface ContentSection {
  type: keyof TokenBudget;
  content: string;
  tokens: number;
  priority: number; // 1 = highest, 5 = lowest
}

// Default budget for a 200K context window
const DEFAULT_BUDGET: TokenBudget = {
  systemPrompt: 2000,        // Core instructions
  brandVoice: 1500,          // Voice guidelines
  skillContext: 2000,        // Skill-specific instructions
  retrievedContext: 8000,    // RAG context (expandable)
  conversationHistory: 6000, // Recent messages
  responseBuffer: 4000,      // Response generation
};

// Priority order for budget allocation
const PRIORITY_ORDER: (keyof TokenBudget)[] = [
  'systemPrompt',      // Must have basic instructions
  'responseBuffer',    // Must have room to respond
  'conversationHistory', // Recent context is important
  'retrievedContext',  // Knowledge base context
  'skillContext',      // Task-specific instructions
  'brandVoice',        // Personality (can be summarized)
];

// ===========================================
// Token Counting
// ===========================================

/**
 * Count tokens in a string using gpt-tokenizer
 * This is a close approximation for Claude tokenization
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    // Fallback: rough estimate of 4 chars per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in a message array
 */
export function countMessageTokens(messages: Array<{ content?: string; role: string }>): number {
  return messages.reduce((total, msg) => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    // Add overhead for message structure (~4 tokens per message)
    return total + countTokens(content) + 4;
  }, 0);
}

// ===========================================
// Budget Allocation
// ===========================================

/**
 * Allocate token budget based on total available and priorities
 */
export function allocateTokenBudget(
  totalTokens: number = 150000,
  overrides: Partial<TokenBudget> = {}
): TokenAllocation {
  // Start with defaults
  const budget: TokenBudget = { ...DEFAULT_BUDGET, ...overrides };

  // Calculate current total
  const currentTotal = Object.values(budget).reduce((sum, val) => sum + val, 0);

  // If over budget, scale down lower priority items
  if (currentTotal > totalTokens) {
    const excess = currentTotal - totalTokens;
    let remaining = excess;

    // Scale down in reverse priority order
    for (const key of [...PRIORITY_ORDER].reverse()) {
      if (remaining <= 0) break;

      const reduction = Math.min(budget[key] * 0.3, remaining); // Max 30% reduction per item
      budget[key] = Math.max(budget[key] - reduction, 500); // Keep minimum 500 tokens
      remaining -= reduction;
    }
  }

  // If under budget, allocate extra to flexible items
  const newTotal = Object.values(budget).reduce((sum, val) => sum + val, 0);
  if (newTotal < totalTokens) {
    const extra = totalTokens - newTotal;

    // Allocate extra to retrieved context and conversation history
    budget.retrievedContext += Math.floor(extra * 0.5);
    budget.conversationHistory += Math.floor(extra * 0.3);
    budget.responseBuffer += Math.floor(extra * 0.2);
  }

  const total = Object.values(budget).reduce((sum, val) => sum + val, 0);

  return {
    budget,
    total,
    remaining: totalTokens - total,
    utilization: total / totalTokens,
  };
}

// ===========================================
// Content Trimming
// ===========================================

/**
 * Trim content to fit within token budget
 */
export function trimToTokenBudget(
  content: string,
  maxTokens: number,
  preserveEnd: boolean = false
): string {
  const currentTokens = countTokens(content);
  if (currentTokens <= maxTokens) {
    return content;
  }

  // Binary search for optimal cut point
  let low = 0;
  let high = content.length;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const slice = preserveEnd
      ? content.slice(-mid)
      : content.slice(0, mid);

    if (countTokens(slice) <= maxTokens) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  const trimmed = preserveEnd
    ? content.slice(-low)
    : content.slice(0, low);

  // Add ellipsis indicator
  return preserveEnd
    ? `[...truncated...]\n${trimmed}`
    : `${trimmed}\n[...truncated...]`;
}

/**
 * Trim message history to fit within budget while preserving recent messages
 */
export function trimMessageHistory(
  messages: Array<{ content?: string; role: string }>,
  maxTokens: number,
  preserveCount: number = 4 // Always keep last N messages
): Array<{ content?: string; role: string }> {
  const totalTokens = countMessageTokens(messages);

  if (totalTokens <= maxTokens) {
    return messages;
  }

  // Always preserve the last N messages
  const preserved = messages.slice(-preserveCount);
  const preservedTokens = countMessageTokens(preserved);

  if (preservedTokens >= maxTokens) {
    // Even preserved messages exceed budget - trim them
    return preserved.map(msg => ({
      ...msg,
      content: trimToTokenBudget(msg.content || '', Math.floor(maxTokens / preserveCount)),
    }));
  }

  // Add older messages until we hit budget
  const remainingBudget = maxTokens - preservedTokens;
  const olderMessages = messages.slice(0, -preserveCount);

  const includedOlder: typeof messages = [];
  let usedTokens = 0;

  // Include from most recent to oldest
  for (let i = olderMessages.length - 1; i >= 0; i--) {
    const msgTokens = countTokens(olderMessages[i].content || '') + 4;

    if (usedTokens + msgTokens <= remainingBudget) {
      includedOlder.unshift(olderMessages[i]);
      usedTokens += msgTokens;
    } else {
      break;
    }
  }

  // Add summary marker if messages were dropped
  if (includedOlder.length < olderMessages.length) {
    const droppedCount = olderMessages.length - includedOlder.length;
    includedOlder.unshift({
      role: 'system',
      content: `[${droppedCount} earlier messages omitted for context window management]`,
    });
  }

  return [...includedOlder, ...preserved];
}

// ===========================================
// Context Assembly
// ===========================================

/**
 * Assemble context sections within budget constraints
 */
export function assembleContext(
  sections: ContentSection[],
  totalBudget: number
): { assembled: string; sections: ContentSection[]; overflow: ContentSection[] } {
  // Sort by priority
  const sorted = [...sections].sort((a, b) => a.priority - b.priority);

  const included: ContentSection[] = [];
  const overflow: ContentSection[] = [];
  let usedTokens = 0;

  for (const section of sorted) {
    if (usedTokens + section.tokens <= totalBudget) {
      included.push(section);
      usedTokens += section.tokens;
    } else {
      // Try to include a trimmed version
      const remainingBudget = totalBudget - usedTokens;
      if (remainingBudget > 200) { // Worth including partial
        const trimmedContent = trimToTokenBudget(section.content, remainingBudget - 50);
        const trimmedTokens = countTokens(trimmedContent);

        included.push({
          ...section,
          content: trimmedContent,
          tokens: trimmedTokens,
        });
        usedTokens += trimmedTokens;
      } else {
        overflow.push(section);
      }
    }
  }

  // Assemble final context
  const assembled = included
    .map(s => s.content)
    .filter(Boolean)
    .join('\n\n');

  return { assembled, sections: included, overflow };
}

// ===========================================
// Budget Analysis
// ===========================================

/**
 * Analyze current context usage and provide recommendations
 */
export function analyzeContextUsage(
  systemPrompt: string,
  messages: Array<{ content?: string; role: string }>,
  retrievedContext: string,
  totalBudget: number = 150000
): {
  usage: Record<string, number>;
  total: number;
  remaining: number;
  utilization: number;
  warnings: string[];
  recommendations: string[];
} {
  const systemTokens = countTokens(systemPrompt);
  const messageTokens = countMessageTokens(messages);
  const contextTokens = countTokens(retrievedContext);
  const responseBuffer = 4000;

  const total = systemTokens + messageTokens + contextTokens + responseBuffer;
  const remaining = totalBudget - total;
  const utilization = total / totalBudget;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for issues
  if (utilization > 0.9) {
    warnings.push('Context window is >90% utilized. Response quality may suffer.');
    recommendations.push('Consider summarizing conversation history.');
  }

  if (messageTokens > 0.5 * totalBudget) {
    warnings.push('Conversation history is using >50% of context.');
    recommendations.push('Enable conversation summarization for long threads.');
  }

  if (contextTokens > 0.4 * totalBudget) {
    warnings.push('Retrieved context is using >40% of context.');
    recommendations.push('Reduce number of retrieved chunks or enable re-ranking.');
  }

  if (remaining < 2000) {
    warnings.push('Less than 2000 tokens remaining for response.');
    recommendations.push('Immediately trim older messages.');
  }

  return {
    usage: {
      systemPrompt: systemTokens,
      messages: messageTokens,
      retrievedContext: contextTokens,
      responseBuffer,
    },
    total,
    remaining,
    utilization,
    warnings,
    recommendations,
  };
}
