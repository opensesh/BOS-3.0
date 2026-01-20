/**
 * Deep Research Module - Query Classifier
 *
 * Classifies incoming queries by complexity to determine the appropriate
 * research strategy. Uses a combination of heuristics and optional LLM
 * classification for edge cases.
 */

import type { ClassificationResult, QueryComplexity } from './types';
import {
  COMPLEXITY_INDICATORS,
  QUERY_LENGTH_THRESHOLDS,
  ESTIMATED_TIME_BY_COMPLEXITY,
  getRecommendedModel,
} from './config';
import { getAnthropicClient, getAnthropicModelId } from '../providers';

// ============================================
// HEURISTIC CLASSIFICATION
// ============================================

interface HeuristicScore {
  simple: number;
  moderate: number;
  complex: number;
}

/**
 * Score a query based on keyword indicators
 */
function scoreByKeywords(query: string): HeuristicScore {
  const normalizedQuery = query.toLowerCase();
  const scores: HeuristicScore = { simple: 0, moderate: 0, complex: 0 };

  // Check for simple indicators
  for (const indicator of COMPLEXITY_INDICATORS.simple) {
    if (normalizedQuery.includes(indicator)) {
      scores.simple += 2;
    }
  }

  // Check for moderate indicators
  for (const indicator of COMPLEXITY_INDICATORS.moderate) {
    if (normalizedQuery.includes(indicator)) {
      scores.moderate += 2;
    }
  }

  // Check for complex indicators
  for (const indicator of COMPLEXITY_INDICATORS.complex) {
    if (normalizedQuery.includes(indicator)) {
      scores.complex += 3; // Weight complex indicators higher
    }
  }

  return scores;
}

/**
 * Score a query based on length
 */
function scoreByLength(query: string): HeuristicScore {
  const length = query.trim().length;
  const scores: HeuristicScore = { simple: 0, moderate: 0, complex: 0 };

  if (length < QUERY_LENGTH_THRESHOLDS.simple) {
    scores.simple += 3;
  } else if (length < QUERY_LENGTH_THRESHOLDS.moderate) {
    scores.moderate += 2;
  } else {
    scores.complex += 2;
  }

  return scores;
}

/**
 * Score based on question structure
 */
function scoreByStructure(query: string): HeuristicScore {
  const scores: HeuristicScore = { simple: 0, moderate: 0, complex: 0 };

  // Multiple questions (contains "?" more than once)
  const questionCount = (query.match(/\?/g) || []).length;
  if (questionCount > 1) {
    scores.complex += 2;
  }

  // Conjunctions suggesting multiple aspects
  const conjunctions = ['and', 'as well as', 'along with', 'including'];
  for (const conj of conjunctions) {
    if (query.toLowerCase().includes(conj)) {
      scores.moderate += 1;
    }
  }

  // Temporal/comparative aspects
  const temporalWords = ['over time', 'historically', 'evolution', 'trend'];
  for (const word of temporalWords) {
    if (query.toLowerCase().includes(word)) {
      scores.complex += 2;
    }
  }

  // Quantitative aspects
  const quantitativeWords = ['statistics', 'data', 'numbers', 'metrics', 'percentage'];
  for (const word of quantitativeWords) {
    if (query.toLowerCase().includes(word)) {
      scores.moderate += 1;
    }
  }

  return scores;
}

/**
 * Combine scores and determine complexity
 */
function combineScores(...scoreArrays: HeuristicScore[]): {
  complexity: QueryComplexity;
  confidence: number;
} {
  const totals: HeuristicScore = { simple: 0, moderate: 0, complex: 0 };

  for (const scores of scoreArrays) {
    totals.simple += scores.simple;
    totals.moderate += scores.moderate;
    totals.complex += scores.complex;
  }

  const total = totals.simple + totals.moderate + totals.complex;

  // Determine complexity based on highest score
  let complexity: QueryComplexity;
  let winningScore: number;

  if (totals.complex >= totals.moderate && totals.complex >= totals.simple) {
    complexity = 'complex';
    winningScore = totals.complex;
  } else if (totals.moderate >= totals.simple) {
    complexity = 'moderate';
    winningScore = totals.moderate;
  } else {
    complexity = 'simple';
    winningScore = totals.simple;
  }

  // Calculate confidence (0-1) based on margin of victory
  const confidence =
    total > 0 ? Math.min(0.95, 0.5 + (winningScore / total) * 0.45) : 0.5;

  return { complexity, confidence };
}

/**
 * Fast heuristic classification without LLM call
 */
export function classifyQueryHeuristic(query: string): ClassificationResult {
  const keywordScores = scoreByKeywords(query);
  const lengthScores = scoreByLength(query);
  const structureScores = scoreByStructure(query);

  const { complexity, confidence } = combineScores(
    keywordScores,
    lengthScores,
    structureScores
  );

  return {
    complexity,
    confidence,
    reasoning: `Heuristic classification based on keywords, length, and structure`,
    estimatedTime: ESTIMATED_TIME_BY_COMPLEXITY[complexity],
    suggestedModel: getRecommendedModel(complexity),
  };
}

// ============================================
// LLM-BASED CLASSIFICATION
// ============================================

const CLASSIFICATION_PROMPT = `You are a query complexity classifier for a research assistant. Analyze the user's query and classify it into one of three complexity levels.

SIMPLE queries:
- Single factual questions with clear answers
- Definitions or explanations of single concepts
- "What is X?" or "Who is Y?" style questions
- Examples: "What is photosynthesis?", "Who founded Apple?"

MODERATE queries:
- Comparisons between 2-3 items
- Questions requiring synthesis of multiple facts
- "How does X work?" or "Why does Y happen?"
- Examples: "Compare React vs Vue", "How does machine learning work?"

COMPLEX queries:
- Multi-faceted research questions
- Questions requiring analysis from multiple angles
- Questions with temporal, causal, or systemic aspects
- In-depth comparisons across many dimensions
- Examples: "Analyze the impact of AI on healthcare over the past decade"

Respond with JSON only:
{
  "complexity": "simple" | "moderate" | "complex",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of your classification"
}`;

/**
 * Use LLM to classify query complexity (more accurate but slower)
 */
export async function classifyQueryWithLLM(
  query: string
): Promise<ClassificationResult> {
  try {
    const client = await getAnthropicClient();
    const modelId = getAnthropicModelId('claude-sonnet');

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 200,
      system: CLASSIFICATION_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from classifier');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in classifier response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      complexity: QueryComplexity;
      confidence: number;
      reasoning: string;
    };

    return {
      complexity: parsed.complexity,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      reasoning: parsed.reasoning,
      estimatedTime: ESTIMATED_TIME_BY_COMPLEXITY[parsed.complexity],
      suggestedModel: getRecommendedModel(parsed.complexity),
    };
  } catch (error) {
    console.error('[Classifier] LLM classification failed, falling back to heuristic:', error);
    // Fall back to heuristic classification
    return classifyQueryHeuristic(query);
  }
}

// ============================================
// MAIN CLASSIFICATION FUNCTION
// ============================================

export interface ClassifyOptions {
  useLLM?: boolean; // Default: false for speed
  forceComplexity?: QueryComplexity; // For testing
}

/**
 * Main classification function
 *
 * By default uses fast heuristic classification. Can optionally use LLM
 * for more accurate classification on edge cases.
 */
export async function classifyQuery(
  query: string,
  options: ClassifyOptions = {}
): Promise<ClassificationResult> {
  const { useLLM = false, forceComplexity } = options;

  // Allow forcing complexity for testing
  if (forceComplexity) {
    return {
      complexity: forceComplexity,
      confidence: 1,
      reasoning: 'Forced complexity for testing',
      estimatedTime: ESTIMATED_TIME_BY_COMPLEXITY[forceComplexity],
      suggestedModel: getRecommendedModel(forceComplexity),
    };
  }

  // Use heuristic classification first (fast)
  const heuristicResult = classifyQueryHeuristic(query);

  // If confidence is high enough, use heuristic result
  if (!useLLM || heuristicResult.confidence >= 0.8) {
    console.log('[Classifier] Using heuristic classification:', heuristicResult.complexity);
    return heuristicResult;
  }

  // For edge cases, use LLM classification
  console.log('[Classifier] Low confidence heuristic, using LLM classification');
  return classifyQueryWithLLM(query);
}

/**
 * Check if a query should skip deep research (fast path)
 *
 * Returns true for simple queries that can be answered with a single
 * Perplexity call, bypassing the full research pipeline.
 */
export function shouldUseFastPath(result: ClassificationResult): boolean {
  // Simple queries with high confidence go to fast path
  return result.complexity === 'simple' && result.confidence >= 0.7;
}
