/**
 * Deep Research Module - Research Planner
 *
 * Decomposes complex research queries into focused sub-questions that
 * can be answered independently and then synthesized together.
 */

import type { SubQuestion, ResearchPlan, QueryComplexity } from './types';
import {
  MAX_SUB_QUESTIONS,
  MIN_SUB_QUESTIONS_COMPLEX,
  PLANNER_SYSTEM_PROMPT,
  ESTIMATED_TIME_BY_COMPLEXITY,
} from './config';
import { getAnthropicClient, getAnthropicModelId } from '../providers';

// ============================================
// TYPES
// ============================================

interface PlannerOutput {
  subQuestions: Array<{
    question: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
    dependsOn?: string[];
  }>;
}

// ============================================
// PLANNER PROMPTS
// ============================================

const PLANNING_USER_PROMPT = (query: string, complexity: QueryComplexity) => `
Research Query: "${query}"

Complexity Level: ${complexity}

${
  complexity === 'simple'
    ? 'Generate 1-2 focused sub-questions.'
    : complexity === 'moderate'
    ? 'Generate 2-3 focused sub-questions covering different aspects.'
    : 'Generate 3-5 comprehensive sub-questions covering all important angles.'
}

Ensure sub-questions are:
1. Specific and searchable (good for web search)
2. Non-redundant (each covers unique ground)
3. Ordered by dependency (independent questions first)
4. Prioritized by importance to the main query

Output JSON only.`;

// ============================================
// MAIN PLANNING FUNCTION
// ============================================

/**
 * Generate a research plan by decomposing the query into sub-questions
 */
export async function createResearchPlan(
  query: string,
  sessionId: string,
  complexity: QueryComplexity
): Promise<ResearchPlan> {
  const startTime = Date.now();

  try {
    const client = await getAnthropicClient();
    const modelId = getAnthropicModelId('claude-sonnet');

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 1000,
      system: PLANNER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: PLANNING_USER_PROMPT(query, complexity),
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from planner');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in planner response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as PlannerOutput;

    // Validate and transform sub-questions
    const subQuestions = validateAndTransformSubQuestions(
      parsed.subQuestions,
      complexity
    );

    const plan: ResearchPlan = {
      id: `plan-${sessionId}`,
      sessionId,
      originalQuery: query,
      subQuestions,
      createdAt: new Date(),
      totalEstimatedTime: calculateEstimatedTime(subQuestions),
    };

    console.log(
      `[Planner] Generated ${subQuestions.length} sub-questions in ${Date.now() - startTime}ms`
    );

    return plan;
  } catch (error) {
    console.error('[Planner] Failed to create plan:', error);

    // Fall back to single-question plan
    return createFallbackPlan(query, sessionId, complexity);
  }
}

// ============================================
// VALIDATION & TRANSFORMATION
// ============================================

/**
 * Validate and transform sub-questions from LLM output
 */
function validateAndTransformSubQuestions(
  rawQuestions: PlannerOutput['subQuestions'],
  complexity: QueryComplexity
): SubQuestion[] {
  // Ensure minimum questions for complex queries
  const minQuestions = complexity === 'complex' ? MIN_SUB_QUESTIONS_COMPLEX : 1;
  const maxQuestions = MAX_SUB_QUESTIONS;

  // Filter and validate
  const validQuestions = rawQuestions
    .filter(
      (q) =>
        q.question &&
        typeof q.question === 'string' &&
        q.question.trim().length > 10
    )
    .slice(0, maxQuestions);

  // Ensure minimum
  if (validQuestions.length < minQuestions) {
    console.warn(
      `[Planner] Only ${validQuestions.length} valid questions, minimum is ${minQuestions}`
    );
  }

  // Transform to SubQuestion format with IDs
  return validQuestions.map((q, index) => ({
    id: `sq-${index + 1}`,
    question: q.question.trim(),
    reasoning: q.reasoning || 'Addresses a key aspect of the research query',
    priority: q.priority || 'medium',
    dependsOn: q.dependsOn?.map((dep) => {
      // Handle both numeric and string dependencies
      const depNum = parseInt(dep, 10);
      return !isNaN(depNum) ? `sq-${depNum}` : dep;
    }),
    status: 'pending' as const,
  }));
}

/**
 * Create a fallback plan when LLM planning fails
 */
function createFallbackPlan(
  query: string,
  sessionId: string,
  complexity: QueryComplexity
): ResearchPlan {
  console.log('[Planner] Using fallback plan');

  // Create a simple plan that searches the original query
  const subQuestions: SubQuestion[] = [
    {
      id: 'sq-1',
      question: query,
      reasoning: 'Direct search for the research query',
      priority: 'high',
      status: 'pending',
    },
  ];

  // For moderate/complex, add a follow-up question
  if (complexity !== 'simple') {
    subQuestions.push({
      id: 'sq-2',
      question: `What are the key considerations and implications of ${query}?`,
      reasoning: 'Exploring implications and considerations',
      priority: 'medium',
      status: 'pending',
    });
  }

  return {
    id: `plan-${sessionId}`,
    sessionId,
    originalQuery: query,
    subQuestions,
    createdAt: new Date(),
    totalEstimatedTime: ESTIMATED_TIME_BY_COMPLEXITY[complexity],
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate total estimated time for a plan
 */
function calculateEstimatedTime(subQuestions: SubQuestion[]): number {
  // Base time per search (seconds)
  const baseTimePerSearch = 5;

  // Calculate based on priorities (high questions take longer)
  const priorityWeights = { high: 1.5, medium: 1, low: 0.8 };

  const searchTime = subQuestions.reduce(
    (total, q) => total + baseTimePerSearch * priorityWeights[q.priority],
    0
  );

  // Add synthesis time (roughly proportional to number of questions)
  const synthesisTime = 5 + subQuestions.length * 2;

  return Math.ceil(searchTime + synthesisTime);
}

/**
 * Sort sub-questions by dependency order
 *
 * Questions with no dependencies come first, followed by questions
 * whose dependencies have been resolved.
 */
export function sortByDependency(subQuestions: SubQuestion[]): SubQuestion[] {
  const sorted: SubQuestion[] = [];
  const remaining = [...subQuestions];
  const completedIds = new Set<string>();

  while (remaining.length > 0) {
    // Find questions whose dependencies are satisfied
    const readyIndex = remaining.findIndex(
      (q) => !q.dependsOn || q.dependsOn.every((dep) => completedIds.has(dep))
    );

    if (readyIndex === -1) {
      // Circular dependency or missing dependency - add remaining as-is
      console.warn('[Planner] Unresolved dependencies, adding remaining questions');
      sorted.push(...remaining);
      break;
    }

    const ready = remaining.splice(readyIndex, 1)[0];
    sorted.push(ready);
    completedIds.add(ready.id);
  }

  return sorted;
}

/**
 * Get questions that can be executed in parallel (no dependencies on pending questions)
 */
export function getParallelBatch(
  subQuestions: SubQuestion[],
  completedIds: Set<string>
): SubQuestion[] {
  return subQuestions.filter(
    (q) =>
      q.status === 'pending' &&
      (!q.dependsOn || q.dependsOn.every((dep) => completedIds.has(dep)))
  );
}

/**
 * Update a sub-question's status in the plan
 */
export function updateSubQuestionStatus(
  plan: ResearchPlan,
  subQuestionId: string,
  status: SubQuestion['status']
): ResearchPlan {
  return {
    ...plan,
    subQuestions: plan.subQuestions.map((q) =>
      q.id === subQuestionId ? { ...q, status } : q
    ),
  };
}
