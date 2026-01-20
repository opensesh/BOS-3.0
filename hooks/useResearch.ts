'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ResearchStreamEvent,
  ResearchSession,
  SubQuestion,
  ResearchNote,
  Citation,
  ResearchGap,
  QueryComplexity,
  SessionStatus,
  SessionMetrics,
} from '@/lib/ai/research/types';

// ============================================
// TYPES
// ============================================

export interface UseResearchOptions {
  api?: string;
  onError?: (error: Error) => void;
  onComplete?: (session: ResearchSession) => void;
  timeout?: number;
}

export type ResearchPhase =
  | 'idle'
  | 'starting'
  | 'classifying'
  | 'planning'
  | 'searching'
  | 'synthesizing'
  | 'gap_analysis'
  | 'round2'
  | 'completed'
  | 'error';

export interface ResearchProgress {
  phase: ResearchPhase;
  complexity: QueryComplexity | null;
  confidence: number;
  estimatedTime: number;
  subQuestions: SubQuestion[];
  completedSearches: number;
  totalSearches: number;
  currentSearch: string | null;
  sourcesFound: number;
  synthesisProgress: number;
  gaps: ResearchGap[];
  isRound2: boolean;
}

export interface ResearchResult {
  sessionId: string;
  answer: string;
  citations: Citation[];
  notes: ResearchNote[];
  gaps: ResearchGap[];
  metrics: Partial<SessionMetrics>;
  totalTime: number;
}

// ============================================
// INITIAL STATE
// ============================================

const initialProgress: ResearchProgress = {
  phase: 'idle',
  complexity: null,
  confidence: 0,
  estimatedTime: 0,
  subQuestions: [],
  completedSearches: 0,
  totalSearches: 0,
  currentSearch: null,
  sourcesFound: 0,
  synthesisProgress: 0,
  gaps: [],
  isRound2: false,
};

// Default timeout (2 minutes)
const DEFAULT_TIMEOUT = 120000;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useResearch(options: UseResearchOptions = {}) {
  const {
    api = '/api/research',
    onError,
    onComplete,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ResearchProgress>(initialProgress);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notesRef = useRef<ResearchNote[]>([]);

  // Helper to clear timeout
  const clearTimeoutSafe = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(initialProgress);
    setResult(null);
    setError(null);
    notesRef.current = [];
  }, []);

  // Stop research
  const stop = useCallback(() => {
    clearTimeoutSafe();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, [clearTimeoutSafe]);

  // Process a stream event
  const processEvent = useCallback((event: ResearchStreamEvent) => {
    const { type, data } = event;

    switch (type) {
      case 'research_start': {
        const startData = data as { query: string; estimatedTime: number };
        setProgress((prev) => ({
          ...prev,
          phase: 'starting',
          estimatedTime: startData.estimatedTime,
        }));
        break;
      }

      case 'classify': {
        const classifyData = data as {
          complexity: QueryComplexity;
          confidence: number;
          estimatedTime: number;
        };
        setProgress((prev) => ({
          ...prev,
          phase: 'classifying',
          complexity: classifyData.complexity,
          confidence: classifyData.confidence,
          estimatedTime: classifyData.estimatedTime,
        }));
        break;
      }

      case 'plan': {
        const planData = data as {
          subQuestions: SubQuestion[];
          totalEstimatedTime: number;
        };
        setProgress((prev) => ({
          ...prev,
          phase: 'planning',
          subQuestions: planData.subQuestions,
          totalSearches: planData.subQuestions.length,
          estimatedTime: planData.totalEstimatedTime,
        }));
        break;
      }

      case 'search_start': {
        const searchStartData = data as { subQuestionId: string; question: string };
        setProgress((prev) => ({
          ...prev,
          phase: prev.isRound2 ? 'round2' : 'searching',
          currentSearch: searchStartData.question,
          subQuestions: prev.subQuestions.map((sq) =>
            sq.id === searchStartData.subQuestionId
              ? { ...sq, status: 'searching' as const }
              : sq
          ),
        }));
        break;
      }

      case 'search_progress': {
        const searchProgressData = data as { subQuestionId: string; sourcesFound: number };
        setProgress((prev) => ({
          ...prev,
          sourcesFound: prev.sourcesFound + searchProgressData.sourcesFound,
        }));
        break;
      }

      case 'search_complete': {
        const searchCompleteData = data as {
          subQuestionId: string;
          note: ResearchNote;
          citationsCount: number;
        };
        notesRef.current.push(searchCompleteData.note);
        setProgress((prev) => ({
          ...prev,
          completedSearches: prev.completedSearches + 1,
          currentSearch: null,
          subQuestions: prev.subQuestions.map((sq) =>
            sq.id === searchCompleteData.subQuestionId
              ? { ...sq, status: 'completed' as const }
              : sq
          ),
        }));
        break;
      }

      case 'synthesize_start': {
        setProgress((prev) => ({
          ...prev,
          phase: prev.isRound2 ? 'round2' : 'synthesizing',
          synthesisProgress: 0,
        }));
        break;
      }

      case 'synthesize_progress': {
        const synthProgressData = data as { progress: number; partialAnswer?: string };
        setProgress((prev) => ({
          ...prev,
          synthesisProgress: synthProgressData.progress,
        }));
        break;
      }

      case 'gap_found': {
        const gapData = data as { gap: ResearchGap; willStartRound2: boolean };
        setProgress((prev) => ({
          ...prev,
          phase: 'gap_analysis',
          gaps: [...prev.gaps, gapData.gap],
        }));
        break;
      }

      case 'round2_start': {
        const round2Data = data as { gaps: ResearchGap[]; newQueries: string[] };
        setProgress((prev) => ({
          ...prev,
          phase: 'round2',
          isRound2: true,
          totalSearches: prev.totalSearches + round2Data.newQueries.length,
        }));
        break;
      }

      case 'research_complete': {
        const completeData = data as {
          answer: string;
          citations: Citation[];
          totalTime: number;
          metrics: Partial<SessionMetrics>;
        };
        setProgress((prev) => ({
          ...prev,
          phase: 'completed',
          synthesisProgress: 100,
        }));
        setResult({
          sessionId: event.sessionId,
          answer: completeData.answer,
          citations: completeData.citations,
          notes: notesRef.current,
          gaps: progress.gaps,
          metrics: completeData.metrics,
          totalTime: completeData.totalTime,
        });
        break;
      }

      case 'error': {
        const errorData = data as { message: string; code: string; recoverable: boolean };
        setProgress((prev) => ({ ...prev, phase: 'error' }));
        setError(new Error(errorData.message));
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start research
  const startResearch = useCallback(
    async (
      query: string,
      researchOptions?: {
        useLLMClassification?: boolean;
        forceComplexity?: QueryComplexity;
        skipRound2?: boolean;
        maxCost?: number;
      }
    ) => {
      // Reset state
      reset();
      setIsLoading(true);

      // Clear any existing abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Set up timeout
      clearTimeoutSafe();
      timeoutRef.current = setTimeout(() => {
        console.warn('[useResearch] Request timeout - aborting');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setError(new Error('Research request timed out. Please try again.'));
        setIsLoading(false);
        setProgress((prev) => ({ ...prev, phase: 'error' }));
      }, timeout);

      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, options: researchOptions }),
          signal: abortControllerRef.current.signal,
        });

        // Clear timeout once we get a response
        clearTimeoutSafe();

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Process the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const event = JSON.parse(data) as ResearchStreamEvent;
                processEvent(event);
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        clearTimeoutSafe();

        if ((err as Error).name === 'AbortError') {
          // Request was cancelled
          setIsLoading(false);
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[useResearch] Error:', error.message);
        setError(error);
        setIsLoading(false);
        setProgress((prev) => ({ ...prev, phase: 'error' }));

        if (onError) {
          onError(error);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [api, timeout, clearTimeoutSafe, reset, processEvent, onError]
  );

  // Call onComplete when result is available
  useEffect(() => {
    if (result && onComplete) {
      onComplete({
        id: result.sessionId,
        query: '', // Query is not stored in result
        status: 'completed' as SessionStatus,
        complexity: progress.complexity,
        plan: null,
        notes: result.notes,
        gaps: result.gaps,
        currentRound: progress.isRound2 ? 2 : 1,
        finalAnswer: result.answer,
        citations: result.citations,
        startedAt: new Date(),
        completedAt: new Date(),
        error: null,
      });
    }
  }, [result, onComplete, progress.complexity, progress.isRound2]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeoutSafe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearTimeoutSafe]);

  return {
    startResearch,
    stop,
    reset,
    isLoading,
    progress,
    result,
    error,
  };
}

export default useResearch;
