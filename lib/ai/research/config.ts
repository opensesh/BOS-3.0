/**
 * Deep Research Module - Configuration
 *
 * Central configuration for the research pipeline including cost limits,
 * timeouts, complexity thresholds, and model selection.
 */

import type { ResearchConfig, QueryComplexity } from './types';

// ============================================
// CORE PIPELINE CONFIGURATION
// ============================================

export const RESEARCH_CONFIG: ResearchConfig = {
  // Maximum number of research rounds (1 = initial, 2 = with gap filling)
  maxRounds: 2,

  // Maximum number of Perplexity queries per round
  maxQueriesPerRound: 5,

  // Hard cost cap per session in USD
  maxTotalCost: 0.5,

  // Number of parallel search workers
  parallelSearches: 3,

  // Confidence threshold below which we consider it a gap (0-1)
  gapThreshold: 0.6,

  // Overall session timeout in milliseconds (2 minutes)
  timeoutMs: 120000,
};

// ============================================
// COST ESTIMATION
// ============================================

// Perplexity Sonar pricing (approximate)
export const COST_PER_QUERY = {
  'sonar': 0.005, // ~$0.005 per query
  'sonar-pro': 0.02, // ~$0.02 per query
} as const;

// Claude pricing for synthesis (approximate)
export const CLAUDE_COST_PER_1K_TOKENS = {
  input: 0.003,
  output: 0.015,
} as const;

// Estimated tokens per operation
export const ESTIMATED_TOKENS = {
  classificationInput: 500,
  classificationOutput: 200,
  planningInput: 1000,
  planningOutput: 500,
  synthesisInputPer1kChars: 300,
  synthesisOutput: 2000,
} as const;

// ============================================
// COMPLEXITY CLASSIFICATION
// ============================================

// Keywords that suggest higher complexity
export const COMPLEXITY_INDICATORS = {
  simple: [
    'what is',
    'who is',
    'define',
    'meaning of',
    'when did',
    'where is',
  ],
  moderate: [
    'compare',
    'difference between',
    'how does',
    'explain',
    'why does',
    'benefits of',
    'pros and cons',
  ],
  complex: [
    'analyze',
    'evaluate',
    'comprehensive',
    'in-depth',
    'deep dive',
    'research',
    'investigate',
    'thorough',
    'detailed comparison',
    'implications of',
    'impact on',
    'factors affecting',
  ],
} as const;

// Query length thresholds for complexity detection
export const QUERY_LENGTH_THRESHOLDS = {
  simple: 50, // Less than 50 chars likely simple
  moderate: 150, // 50-150 chars likely moderate
  // Above 150 chars likely complex
} as const;

// Estimated time per complexity level (seconds)
export const ESTIMATED_TIME_BY_COMPLEXITY: Record<QueryComplexity, number> = {
  simple: 10,
  moderate: 30,
  complex: 60,
};

// ============================================
// SUB-QUESTION PLANNING
// ============================================

// Maximum number of sub-questions to generate
export const MAX_SUB_QUESTIONS = 5;

// Minimum number of sub-questions for complex queries
export const MIN_SUB_QUESTIONS_COMPLEX = 3;

// System prompt for sub-question generation
export const PLANNER_SYSTEM_PROMPT = `You are a research planning assistant. Your job is to break down a user's research query into focused sub-questions that, when answered together, will provide a comprehensive response.

Guidelines:
1. Generate 3-5 sub-questions depending on complexity
2. Each sub-question should be specific and searchable
3. Avoid redundancy between sub-questions
4. Order by dependency (independent questions first)
5. Assign priority based on importance to the main query

Output JSON format:
{
  "subQuestions": [
    {
      "question": "specific searchable question",
      "reasoning": "why this helps answer the main query",
      "priority": "high" | "medium" | "low",
      "dependsOn": [] // IDs of questions this depends on
    }
  ]
}`;

// ============================================
// SYNTHESIS CONFIGURATION
// ============================================

// System prompt for answer synthesis
export const SYNTHESIS_SYSTEM_PROMPT = `You are a research synthesis assistant. Your job is to combine research notes into a comprehensive, well-structured answer.

Guidelines:
1. Synthesize information from multiple sources, don't just concatenate
2. Maintain factual accuracy - only include information from the notes
3. Use clear structure with sections when appropriate
4. Include inline citations using [1], [2], etc. format
5. Acknowledge any gaps or uncertainties in the research
6. Write in a clear, professional tone

After your answer, output a JSON block with:
{
  "gaps": [
    {
      "description": "what information is missing",
      "suggestedQuery": "specific search query to fill this gap",
      "priority": "high" | "medium" | "low"
    }
  ],
  "confidence": 0.0-1.0 // how confident you are the answer is complete
}`;

// ============================================
// GAP ANALYSIS
// ============================================

// Maximum gaps to address in round 2
export const MAX_GAPS_TO_ADDRESS = 3;

// Minimum confidence to skip round 2
export const MIN_CONFIDENCE_TO_COMPLETE = 0.8;

// Gap priority weights for sorting
export const GAP_PRIORITY_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1,
} as const;

// ============================================
// STREAMING CONFIGURATION
// ============================================

// Delay between streaming events (ms) for smooth UX
export const STREAM_DELAY_MS = 50;

// Progress update interval during long operations (ms)
export const PROGRESS_UPDATE_INTERVAL_MS = 500;

// ============================================
// ERROR HANDLING
// ============================================

export const ERROR_CODES = {
  CLASSIFICATION_FAILED: 'CLASSIFICATION_FAILED',
  PLANNING_FAILED: 'PLANNING_FAILED',
  SEARCH_FAILED: 'SEARCH_FAILED',
  SYNTHESIS_FAILED: 'SYNTHESIS_FAILED',
  TIMEOUT: 'TIMEOUT',
  COST_LIMIT_EXCEEDED: 'COST_LIMIT_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN: 'UNKNOWN',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.CLASSIFICATION_FAILED]:
    'Unable to analyze the complexity of your query. Please try again.',
  [ERROR_CODES.PLANNING_FAILED]:
    'Unable to plan the research approach. Please try rephrasing your question.',
  [ERROR_CODES.SEARCH_FAILED]:
    'Some searches failed. Continuing with available results.',
  [ERROR_CODES.SYNTHESIS_FAILED]:
    'Unable to synthesize the research results. Please try again.',
  [ERROR_CODES.TIMEOUT]: 'Research took too long. Returning partial results.',
  [ERROR_CODES.COST_LIMIT_EXCEEDED]:
    'Research cost limit reached. Returning available results.',
  [ERROR_CODES.RATE_LIMITED]:
    'API rate limit reached. Please try again in a moment.',
  [ERROR_CODES.UNKNOWN]: 'An unexpected error occurred during research.',
};

// ============================================
// RESEARCH KEYWORDS FOR AUTO-DETECTION
// ============================================

export const RESEARCH_TRIGGER_KEYWORDS = [
  'research',
  'deep dive',
  'comprehensive analysis',
  'compare thoroughly',
  'investigate',
  'detailed breakdown',
  'in-depth analysis',
  'thorough research',
  'extensive research',
  'analyze in detail',
  'full analysis',
  'complete overview',
  'detailed comparison',
  'research report',
];

// Minimum query length to consider for deep research
export const MIN_RESEARCH_QUERY_LENGTH = 20;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Estimate the cost of a research session based on complexity
 */
export function estimateSessionCost(
  complexity: QueryComplexity,
  useProModel: boolean = false
): number {
  const model = useProModel ? 'sonar-pro' : 'sonar';
  const queriesPerComplexity: Record<QueryComplexity, number> = {
    simple: 1,
    moderate: 3,
    complex: 5,
  };

  const queries = queriesPerComplexity[complexity];
  const searchCost = queries * COST_PER_QUERY[model];

  // Add Claude synthesis cost estimate
  const synthesisCost =
    (ESTIMATED_TOKENS.synthesisInputPer1kChars * 5 * CLAUDE_COST_PER_1K_TOKENS.input +
      ESTIMATED_TOKENS.synthesisOutput * CLAUDE_COST_PER_1K_TOKENS.output) /
    1000;

  // Round 2 adds ~50% more cost
  const round2Multiplier = complexity === 'complex' ? 1.5 : 1;

  return (searchCost + synthesisCost) * round2Multiplier;
}

/**
 * Check if a query should trigger deep research mode
 */
export function shouldTriggerResearch(query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();

  // Check minimum length
  if (normalizedQuery.length < MIN_RESEARCH_QUERY_LENGTH) {
    return false;
  }

  // Check for research keywords
  return RESEARCH_TRIGGER_KEYWORDS.some((keyword) =>
    normalizedQuery.includes(keyword.toLowerCase())
  );
}

/**
 * Get recommended model based on complexity
 */
export function getRecommendedModel(
  complexity: QueryComplexity
): 'sonar' | 'sonar-pro' {
  return complexity === 'complex' ? 'sonar-pro' : 'sonar';
}
