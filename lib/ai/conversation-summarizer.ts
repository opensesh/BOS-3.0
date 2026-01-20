/**
 * Conversation Summarizer
 *
 * Summarizes long conversations to fit within context windows while
 * preserving important context and intent.
 *
 * Strategies:
 * 1. Extractive: Pull key sentences from messages
 * 2. Abstractive: Use Claude to generate summary (async)
 * 3. Hierarchical: Summarize in chunks, then combine
 */

import { countTokens, countMessageTokens, trimToTokenBudget } from './token-budgeter';

// ===========================================
// Types
// ===========================================

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

export interface SummarizationResult {
  summary: string;
  preservedMessages: Message[];
  summarizedCount: number;
  originalTokens: number;
  resultTokens: number;
  compressionRatio: number;
}

export interface SummarizationOptions {
  maxSummaryTokens?: number;     // Max tokens for summary (default: 500)
  preserveRecentCount?: number;  // Number of recent messages to keep (default: 4)
  preserveSystemMessages?: boolean; // Keep system messages (default: true)
  strategy?: 'extractive' | 'hybrid'; // Summary strategy (default: hybrid)
}

// ===========================================
// Message Utilities
// ===========================================

/**
 * Extract text content from a message
 */
function getMessageContent(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (message.parts) {
    return message.parts
      .filter(p => p.type === 'text' && p.text)
      .map(p => p.text)
      .join('\n');
  }
  return '';
}

/**
 * Check if a message contains important content markers
 */
function isImportantMessage(message: Message): boolean {
  const content = getMessageContent(message).toLowerCase();

  // Important patterns
  const importantPatterns = [
    /\b(important|critical|must|required|essential)\b/i,
    /\b(remember|note that|key point)\b/i,
    /\b(decision|decided|agree|confirmed)\b/i,
    /\?$/, // Questions often establish context
    /\b(error|bug|issue|problem|fix)\b/i, // Technical issues
  ];

  return importantPatterns.some(pattern => pattern.test(content));
}

// ===========================================
// Extractive Summarization
// ===========================================

/**
 * Extract key sentences from messages using heuristics
 */
function extractKeyContent(messages: Message[], maxTokens: number): string {
  const sentences: Array<{ text: string; score: number; index: number }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = getMessageContent(msg);
    if (!content) continue;

    // Split into sentences
    const msgSentences = content
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10);

    for (const sentence of msgSentences) {
      let score = 0;

      // Score based on position (earlier = more context-setting)
      score += (1 - i / messages.length) * 2;

      // Score based on role (user messages often set intent)
      if (msg.role === 'user') score += 3;

      // Score for questions
      if (sentence.includes('?')) score += 2;

      // Score for important patterns
      if (isImportantMessage({ ...msg, content: sentence })) score += 3;

      // Score for first sentence of message (often key)
      if (msgSentences.indexOf(sentence) === 0) score += 1;

      // Penalize very long sentences
      if (sentence.length > 200) score -= 1;

      sentences.push({
        text: sentence.trim(),
        score,
        index: i,
      });
    }
  }

  // Sort by score and select top sentences within token budget
  const sorted = sentences.sort((a, b) => b.score - a.score);
  const selected: string[] = [];
  let usedTokens = 0;

  for (const s of sorted) {
    const tokens = countTokens(s.text);
    if (usedTokens + tokens <= maxTokens) {
      selected.push(s.text);
      usedTokens += tokens;
    }
  }

  // Re-order by original position for coherence
  const reordered = selected.sort((a, b) => {
    const aIndex = sorted.find(s => s.text === a)?.index || 0;
    const bIndex = sorted.find(s => s.text === b)?.index || 0;
    return aIndex - bIndex;
  });

  return reordered.join(' ');
}

/**
 * Generate a structured summary from messages
 */
function generateStructuredSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  const parts: string[] = [];

  // Summarize user intent
  if (userMessages.length > 0) {
    const firstUserContent = getMessageContent(userMessages[0]);
    const lastUserContent = getMessageContent(userMessages[userMessages.length - 1]);

    parts.push(`User's initial request: "${trimToTokenBudget(firstUserContent, 100)}"`);

    if (userMessages.length > 1 && lastUserContent !== firstUserContent) {
      parts.push(`Most recent user message: "${trimToTokenBudget(lastUserContent, 100)}"`);
    }
  }

  // Count topics/themes
  const topics: string[] = [];
  const allContent = messages.map(m => getMessageContent(m)).join(' ').toLowerCase();

  // Extract potential topics
  const topicPatterns: Record<string, RegExp> = {
    'brand voice': /brand voice|tone|personality/i,
    'colors': /color|palette|hex|rgb/i,
    'typography': /font|typography|typeface/i,
    'writing style': /writing style|copy|messaging/i,
    'guidelines': /guideline|rule|standard/i,
    'assets': /asset|logo|image|file/i,
    'technical': /code|implement|build|develop/i,
  };

  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(allContent)) {
      topics.push(topic);
    }
  }

  if (topics.length > 0) {
    parts.push(`Topics discussed: ${topics.join(', ')}`);
  }

  // Message count summary
  parts.push(`Conversation length: ${userMessages.length} user messages, ${assistantMessages.length} assistant responses`);

  return parts.join('\n');
}

// ===========================================
// Main Summarization Function
// ===========================================

/**
 * Summarize conversation to fit within token budget
 *
 * @param messages - Full conversation history
 * @param maxTokens - Maximum tokens for entire result (summary + preserved)
 * @param options - Summarization options
 * @returns Summarization result with summary and preserved messages
 */
export function summarizeConversation(
  messages: Message[],
  maxTokens: number,
  options: SummarizationOptions = {}
): SummarizationResult {
  const {
    maxSummaryTokens = 500,
    preserveRecentCount = 4,
    preserveSystemMessages = true,
    strategy = 'hybrid',
  } = options;

  const originalTokens = countMessageTokens(messages);

  // If already within budget, return as-is
  if (originalTokens <= maxTokens) {
    return {
      summary: '',
      preservedMessages: messages,
      summarizedCount: 0,
      originalTokens,
      resultTokens: originalTokens,
      compressionRatio: 1,
    };
  }

  // Separate system messages if preserving them
  const systemMessages = preserveSystemMessages
    ? messages.filter(m => m.role === 'system')
    : [];
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  // Always preserve recent messages
  const preserved = nonSystemMessages.slice(-preserveRecentCount);
  const toSummarize = nonSystemMessages.slice(0, -preserveRecentCount);

  // Calculate token budgets
  const preservedTokens = countMessageTokens(preserved) + countMessageTokens(systemMessages);
  const summaryBudget = Math.min(maxSummaryTokens, maxTokens - preservedTokens - 100);

  if (toSummarize.length === 0 || summaryBudget <= 0) {
    // Nothing to summarize or no budget - just trim preserved
    const result: Message[] = [...systemMessages, ...preserved];
    return {
      summary: '',
      preservedMessages: result,
      summarizedCount: 0,
      originalTokens,
      resultTokens: countMessageTokens(result),
      compressionRatio: originalTokens / countMessageTokens(result),
    };
  }

  // Generate summary based on strategy
  let summary: string;

  if (strategy === 'extractive') {
    summary = extractKeyContent(toSummarize, summaryBudget);
  } else {
    // Hybrid: combine structured summary with key extracts
    const structuredSummary = generateStructuredSummary(toSummarize);
    const remainingBudget = summaryBudget - countTokens(structuredSummary) - 20;

    if (remainingBudget > 100) {
      const keyContent = extractKeyContent(toSummarize, remainingBudget);
      summary = `${structuredSummary}\n\nKey context: ${keyContent}`;
    } else {
      summary = structuredSummary;
    }
  }

  // Trim summary if still too long
  summary = trimToTokenBudget(summary, summaryBudget);

  // Create summary message
  const summaryMessage: Message = {
    role: 'system',
    content: `[Conversation Summary - ${toSummarize.length} messages]\n${summary}`,
  };

  // Assemble result
  const resultMessages: Message[] = [
    ...systemMessages,
    summaryMessage,
    ...preserved,
  ];

  const resultTokens = countMessageTokens(resultMessages);

  return {
    summary,
    preservedMessages: resultMessages,
    summarizedCount: toSummarize.length,
    originalTokens,
    resultTokens,
    compressionRatio: originalTokens / resultTokens,
  };
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Check if conversation needs summarization
 */
export function needsSummarization(
  messages: Message[],
  tokenBudget: number,
  threshold: number = 0.8 // Trigger at 80% of budget
): boolean {
  const currentTokens = countMessageTokens(messages);
  return currentTokens > tokenBudget * threshold;
}

/**
 * Get conversation statistics
 */
export function getConversationStats(messages: Message[]): {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  totalTokens: number;
  avgTokensPerMessage: number;
} {
  const totalTokens = countMessageTokens(messages);
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;
  const systemMessages = messages.filter(m => m.role === 'system').length;

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    systemMessages,
    totalTokens,
    avgTokensPerMessage: messages.length > 0 ? totalTokens / messages.length : 0,
  };
}
