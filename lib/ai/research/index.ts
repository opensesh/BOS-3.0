/**
 * Deep Research Module
 *
 * Provides comprehensive research capabilities by orchestrating:
 * - Query complexity classification
 * - Sub-question planning
 * - Parallel web searches via Perplexity
 * - Answer synthesis with Claude
 * - Gap analysis and iterative refinement
 */

// Types
export type {
  QueryComplexity,
  ClassificationResult,
  SubQuestion,
  ResearchPlan,
  Citation,
  ResearchNote,
  ResearchGap,
  SessionStatus,
  ResearchSession,
  SessionMetrics,
  ResearchStreamEvent,
  ResearchStreamEventType,
  ResearchEventData,
  ResearchConfig,
  SynthesisInput,
  SynthesisOutput,
} from './types';

// Configuration
export {
  RESEARCH_CONFIG,
  COST_PER_QUERY,
  RESEARCH_TRIGGER_KEYWORDS,
  shouldTriggerResearch,
  estimateSessionCost,
  getRecommendedModel,
} from './config';

// Classifier
export {
  classifyQuery,
  classifyQueryHeuristic,
  shouldUseFastPath,
} from './classifier';

// Planner
export {
  createResearchPlan,
  sortByDependency,
  getParallelBatch,
  updateSubQuestionStatus,
} from './planner';

// Search Workers
export {
  executeParallelSearches,
  estimateBatchCost,
  retrySearch,
  type SearchProgressCallback,
} from './search-workers';

// Synthesizer
export {
  synthesizeAnswer,
  shouldProceedToRound2,
  getRound2Queries,
  mergeCitations,
  renumberCitations,
  type SynthesisProgressCallback,
} from './synthesizer';

// Orchestrator
export {
  executeResearch,
  createSession,
  type OrchestratorOptions,
  type StreamController,
} from './orchestrator';
