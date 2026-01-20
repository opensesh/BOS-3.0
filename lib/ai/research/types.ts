/**
 * Deep Research Module - Type Definitions
 *
 * This module provides comprehensive type definitions for the research pipeline,
 * including session management, planning, search, synthesis, and streaming events.
 */

// ============================================
// COMPLEXITY CLASSIFICATION
// ============================================

export type QueryComplexity = 'simple' | 'moderate' | 'complex';

export interface ClassificationResult {
  complexity: QueryComplexity;
  confidence: number;
  reasoning: string;
  estimatedTime: number; // seconds
  suggestedModel: 'sonar' | 'sonar-pro';
}

// ============================================
// RESEARCH PLANNING
// ============================================

export interface SubQuestion {
  id: string;
  question: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  dependsOn?: string[]; // IDs of sub-questions this depends on
  status: 'pending' | 'searching' | 'completed' | 'failed';
}

export interface ResearchPlan {
  id: string;
  sessionId: string;
  originalQuery: string;
  subQuestions: SubQuestion[];
  createdAt: Date;
  totalEstimatedTime: number;
}

// ============================================
// SEARCH & NOTES
// ============================================

export interface Citation {
  id: string;
  url: string;
  title: string;
  domain: string;
  snippet?: string;
  favicon?: string;
  relevanceScore?: number;
}

export interface ResearchNote {
  id: string;
  sessionId: string;
  subQuestionId: string;
  content: string;
  citations: Citation[];
  confidence: number; // 0-1 how confident the note addresses the sub-question
  createdAt: Date;
}

// ============================================
// GAP ANALYSIS
// ============================================

export interface ResearchGap {
  id: string;
  sessionId: string;
  round: number;
  description: string;
  suggestedQuery: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export type SessionStatus =
  | 'initializing'
  | 'classifying'
  | 'planning'
  | 'searching'
  | 'synthesizing'
  | 'gap_analysis'
  | 'round2_searching'
  | 'round2_synthesizing'
  | 'completed'
  | 'failed';

export interface ResearchSession {
  id: string;
  query: string;
  status: SessionStatus;
  complexity: QueryComplexity | null;
  plan: ResearchPlan | null;
  notes: ResearchNote[];
  gaps: ResearchGap[];
  currentRound: number;
  finalAnswer: string | null;
  citations: Citation[];
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
}

// ============================================
// SESSION METRICS
// ============================================

export interface SessionMetrics {
  sessionId: string;
  totalDurationMs: number;
  classificationDurationMs: number;
  planningDurationMs: number;
  searchDurationMs: number;
  synthesisDurationMs: number;
  round2DurationMs: number | null;
  totalQueries: number;
  totalCitations: number;
  gapsFound: number;
  gapsResolved: number;
  parallelizationEfficiency: number; // 0-1
  estimatedCostUsd: number;
}

// ============================================
// STREAMING EVENTS
// ============================================

export type ResearchStreamEventType =
  | 'research_start'
  | 'classify'
  | 'plan'
  | 'search_start'
  | 'search_progress'
  | 'search_complete'
  | 'synthesize_start'
  | 'synthesize_progress'
  | 'gap_found'
  | 'round2_start'
  | 'research_complete'
  | 'error';

export interface ResearchStreamEvent {
  type: ResearchStreamEventType;
  sessionId: string;
  timestamp: number;
  data: ResearchEventData;
}

export type ResearchEventData =
  | ResearchStartData
  | ClassifyData
  | PlanData
  | SearchStartData
  | SearchProgressData
  | SearchCompleteData
  | SynthesizeStartData
  | SynthesizeProgressData
  | GapFoundData
  | Round2StartData
  | ResearchCompleteData
  | ResearchErrorData;

export interface ResearchStartData {
  query: string;
  estimatedTime: number;
}

export interface ClassifyData {
  complexity: QueryComplexity;
  confidence: number;
  estimatedTime: number;
}

export interface PlanData {
  subQuestions: SubQuestion[];
  totalEstimatedTime: number;
}

export interface SearchStartData {
  subQuestionId: string;
  question: string;
}

export interface SearchProgressData {
  subQuestionId: string;
  sourcesFound: number;
  partialContent?: string;
}

export interface SearchCompleteData {
  subQuestionId: string;
  note: ResearchNote;
  citationsCount: number;
}

export interface SynthesizeStartData {
  notesCount: number;
  citationsCount: number;
}

export interface SynthesizeProgressData {
  progress: number; // 0-100
  partialAnswer?: string;
}

export interface GapFoundData {
  gap: ResearchGap;
  willStartRound2: boolean;
}

export interface Round2StartData {
  gaps: ResearchGap[];
  newQueries: string[];
}

export interface ResearchCompleteData {
  answer: string;
  citations: Citation[];
  totalTime: number;
  metrics: Partial<SessionMetrics>;
}

export interface ResearchErrorData {
  message: string;
  code: string;
  recoverable: boolean;
}

// ============================================
// ORCHESTRATOR CONFIGURATION
// ============================================

export interface ResearchConfig {
  maxRounds: number;
  maxQueriesPerRound: number;
  maxTotalCost: number;
  parallelSearches: number;
  gapThreshold: number; // Confidence threshold below which we consider it a gap
  timeoutMs: number;
}

// ============================================
// WORKER TYPES
// ============================================

export interface SearchWorkerInput {
  subQuestion: SubQuestion;
  sessionId: string;
  context?: string; // Optional context from previous notes
}

export interface SearchWorkerOutput {
  subQuestionId: string;
  success: boolean;
  note?: ResearchNote;
  error?: string;
  durationMs: number;
}

// ============================================
// SYNTHESIS TYPES
// ============================================

export interface SynthesisInput {
  query: string;
  notes: ResearchNote[];
  previousAnswer?: string; // For round 2, include round 1 answer
  gaps?: ResearchGap[]; // Gaps to specifically address in round 2
}

export interface SynthesisOutput {
  answer: string;
  citations: Citation[];
  gaps: ResearchGap[];
  confidence: number;
}

// ============================================
// DATABASE TYPES (for Supabase)
// ============================================

export interface DbResearchSession {
  id: string;
  user_id: string | null;
  brand_id: string | null;
  query: string;
  status: SessionStatus;
  complexity: QueryComplexity | null;
  current_round: number;
  final_answer: string | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbResearchPlan {
  id: string;
  session_id: string;
  original_query: string;
  sub_questions: SubQuestion[];
  total_estimated_time: number;
  created_at: string;
}

export interface DbResearchNote {
  id: string;
  session_id: string;
  sub_question_id: string;
  content: string;
  citations: Citation[];
  confidence: number;
  created_at: string;
}

export interface DbResearchGap {
  id: string;
  session_id: string;
  round: number;
  description: string;
  suggested_query: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface DbSessionMetrics {
  id: string;
  session_id: string;
  total_duration_ms: number;
  classification_duration_ms: number;
  planning_duration_ms: number;
  search_duration_ms: number;
  synthesis_duration_ms: number;
  round2_duration_ms: number | null;
  total_queries: number;
  total_citations: number;
  gaps_found: number;
  gaps_resolved: number;
  parallelization_efficiency: number;
  estimated_cost_usd: number;
  created_at: string;
}
