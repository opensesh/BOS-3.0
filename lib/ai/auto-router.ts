import { ModelId } from './providers';

// Message format from AI SDK 5.x
interface UIMessage {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

// ============================================
// DEEP RESEARCH DETECTION
// ============================================

// Keywords that strongly suggest deep research mode
const DEEP_RESEARCH_KEYWORDS = [
  'deep dive',
  'comprehensive analysis',
  'thorough research',
  'detailed breakdown',
  'in-depth analysis',
  'extensive research',
  'analyze in detail',
  'full analysis',
  'complete overview',
  'detailed comparison',
  'research report',
  'investigate thoroughly',
  'comprehensive review',
  'systematic analysis',
];

// Minimum query length to consider for deep research
const MIN_RESEARCH_QUERY_LENGTH = 20;

/**
 * Check if a query should trigger deep research mode suggestion
 *
 * Returns true if the query contains indicators that it would benefit
 * from the multi-stage deep research pipeline (planning, parallel searches,
 * synthesis, gap analysis).
 */
export function shouldSuggestDeepResearch(query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();

  // Too short for research
  if (normalizedQuery.length < MIN_RESEARCH_QUERY_LENGTH) {
    return false;
  }

  // Check for explicit deep research keywords
  return DEEP_RESEARCH_KEYWORDS.some((keyword) =>
    normalizedQuery.includes(keyword.toLowerCase())
  );
}

/**
 * Get estimated time for deep research based on query characteristics
 */
export function estimateResearchTime(query: string): number {
  const normalizedQuery = query.toLowerCase();

  // Simple queries: ~10s
  if (normalizedQuery.length < 50) {
    return 10;
  }

  // Moderate queries: ~30s
  if (normalizedQuery.length < 150) {
    return 30;
  }

  // Complex queries: ~60s
  return 60;
}

// Helper to extract text content from a message (handles both formats)
function getMessageText(message: UIMessage): string {
  // Direct content string
  if (typeof message.content === 'string') {
    return message.content;
  }
  // Parts array format (AI SDK 5.x)
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is { type: string; text: string } => 
        part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string'
      )
      .map((part) => part.text)
      .join('');
  }
  return '';
}

// Keywords that suggest different model needs
const RESEARCH_KEYWORDS = [
  'research',
  'analyze',
  'compare',
  'explain in depth',
  'comprehensive',
  'detailed analysis',
  'investigate',
  'evaluate',
  'assess',
  'examine',
  'deep dive',
  'thorough',
  'extensive',
];

const CURRENT_EVENTS_KEYWORDS = [
  'latest',
  'current',
  'news',
  'today',
  'recent',
  'now',
  'new',
  'this week',
  'this month',
  '2024',
  '2025',
  'happening',
  'update',
  'updates',
  'trending',
  'breaking',
  'announced',
  'released',
  'launched',
  'just',
  'coming out',
  'coming soon',
];

const SIMPLE_QUERY_PATTERNS = [
  /^(what|who|when|where|how|why) is/i,
  /^define /i,
  /^translate /i,
  /^convert /i,
  /^what does .* mean/i,
  /^how do (you|i) /i,
];

export function autoSelectModel(messages: UIMessage[]): ModelId {
  // Get the last user message for analysis
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');

  if (!lastUserMessage) {
    return 'claude-sonnet'; // Default
  }

  const messageText = getMessageText(lastUserMessage);
  
  if (!messageText) {
    return 'claude-sonnet'; // Default if no text found
  }

  const query = messageText.toLowerCase();
  const queryLength = messageText.length;

  // Check for current events/web search needs
  if (CURRENT_EVENTS_KEYWORDS.some((keyword) => query.includes(keyword))) {
    return 'sonar';
  }

  // Check for research/complex analysis needs
  if (RESEARCH_KEYWORDS.some((keyword) => query.includes(keyword))) {
    return 'claude-sonnet';
  }

  // Check for simple queries
  const isSimpleQuery = SIMPLE_QUERY_PATTERNS.some((pattern) => pattern.test(query));

  if (isSimpleQuery || queryLength < 50) {
    return 'claude-sonnet'; // Use Sonnet for all queries (Haiku deprecated)
  }

  // Medium complexity - use balanced model
  if (queryLength < 200) {
    return 'claude-sonnet';
  }

  // Long/complex queries - use capable model
  return 'claude-sonnet';
}

export function getAutoRouterExplanation(query: string): string {
  const q = query.toLowerCase();

  if (CURRENT_EVENTS_KEYWORDS.some((k) => q.includes(k))) {
    return 'Using web search for current information';
  }
  if (RESEARCH_KEYWORDS.some((k) => q.includes(k))) {
    return 'Using advanced model for in-depth analysis';
  }
  if (query.length < 50 || SIMPLE_QUERY_PATTERNS.some((p) => p.test(q))) {
    return 'Using balanced model for quick response';
  }
  return 'Using balanced model for this query';
}

/**
 * Get a suggestion message for deep research mode
 */
export function getDeepResearchSuggestion(query: string): string | null {
  if (!shouldSuggestDeepResearch(query)) {
    return null;
  }

  return 'This looks like a research task. Enable Deep Research for comprehensive, multi-source analysis?';
}

/**
 * Determine the best routing for a query
 * Returns both the model selection and whether deep research is recommended
 */
export function routeQuery(messages: UIMessage[]): {
  model: ModelId;
  explanation: string;
  suggestDeepResearch: boolean;
  researchEstimatedTime: number | null;
} {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const query = lastUserMessage ? getMessageText(lastUserMessage) : '';

  const model = autoSelectModel(messages);
  const explanation = getAutoRouterExplanation(query);
  const suggestDeepResearch = shouldSuggestDeepResearch(query);
  const researchEstimatedTime = suggestDeepResearch ? estimateResearchTime(query) : null;

  return {
    model,
    explanation,
    suggestDeepResearch,
    researchEstimatedTime,
  };
}
