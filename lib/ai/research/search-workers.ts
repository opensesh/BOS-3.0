/**
 * Deep Research Module - Search Workers
 *
 * Handles parallel execution of Perplexity searches for sub-questions.
 * Manages concurrency, rate limiting, and result aggregation.
 */

import type {
  SubQuestion,
  ResearchNote,
  Citation,
  SearchWorkerInput,
  SearchWorkerOutput,
} from './types';
import { RESEARCH_CONFIG, COST_PER_QUERY } from './config';
import { getPerplexityModelId } from '../providers';

// ============================================
// TYPES
// ============================================

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  citations?: string[];
}

export interface SearchProgressCallback {
  onSearchStart: (subQuestionId: string, question: string) => void;
  onSearchProgress: (subQuestionId: string, sourcesFound: number) => void;
  onSearchComplete: (subQuestionId: string, note: ResearchNote) => void;
  onSearchError: (subQuestionId: string, error: string) => void;
}

// ============================================
// SEARCH WORKER
// ============================================

/**
 * Execute a single search for a sub-question using Perplexity
 */
async function executeSearch(
  input: SearchWorkerInput,
  model: 'sonar' | 'sonar-pro',
  onProgress?: (sourcesFound: number) => void
): Promise<SearchWorkerOutput> {
  const startTime = Date.now();
  const { subQuestion, sessionId, context } = input;

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return {
      subQuestionId: subQuestion.id,
      success: false,
      error: 'PERPLEXITY_API_KEY not configured',
      durationMs: Date.now() - startTime,
    };
  }

  const modelId = getPerplexityModelId(model);

  // Build messages with optional context
  const messages: PerplexityMessage[] = [
    {
      role: 'system',
      content: `You are a research assistant gathering information to answer a specific question.
Be thorough and include specific facts, data, and sources.
Focus on answering the exact question asked.
${context ? `\nContext from previous research:\n${context}` : ''}`,
    },
    {
      role: 'user',
      content: subQuestion.question,
    },
  ];

  try {
    // Call Perplexity API with streaming to get progress updates
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from Perplexity');
    }

    // Process SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let citations: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const chunk = JSON.parse(data) as PerplexityStreamChunk;

            // Accumulate content
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
            }

            // Citations come in final chunk
            if (chunk.citations && chunk.citations.length > 0) {
              citations = chunk.citations;
              onProgress?.(citations.length);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }

    // Transform citations to our format
    const transformedCitations = transformCitations(citations);

    // Create research note
    const note: ResearchNote = {
      id: `note-${sessionId}-${subQuestion.id}`,
      sessionId,
      subQuestionId: subQuestion.id,
      content,
      citations: transformedCitations,
      confidence: calculateConfidence(content, transformedCitations),
      createdAt: new Date(),
    };

    return {
      subQuestionId: subQuestion.id,
      success: true,
      note,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[SearchWorker] Error searching for ${subQuestion.id}:`, error);
    return {
      subQuestionId: subQuestion.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown search error',
      durationMs: Date.now() - startTime,
    };
  }
}

// ============================================
// PARALLEL EXECUTION
// ============================================

/**
 * Execute multiple searches in parallel with concurrency control
 */
export async function executeParallelSearches(
  subQuestions: SubQuestion[],
  sessionId: string,
  model: 'sonar' | 'sonar-pro',
  callbacks?: SearchProgressCallback,
  context?: string
): Promise<{
  notes: ResearchNote[];
  failedQuestions: SubQuestion[];
  totalDurationMs: number;
  parallelizationEfficiency: number;
}> {
  const startTime = Date.now();
  const concurrency = RESEARCH_CONFIG.parallelSearches;

  // Prepare inputs
  const inputs: SearchWorkerInput[] = subQuestions.map((sq) => ({
    subQuestion: sq,
    sessionId,
    context,
  }));

  // Track results
  const results: SearchWorkerOutput[] = [];
  let currentIndex = 0;
  const inProgress = new Map<string, Promise<SearchWorkerOutput>>();

  // Process with controlled concurrency
  while (currentIndex < inputs.length || inProgress.size > 0) {
    // Start new searches up to concurrency limit
    while (inProgress.size < concurrency && currentIndex < inputs.length) {
      const input = inputs[currentIndex];
      currentIndex++;

      callbacks?.onSearchStart(input.subQuestion.id, input.subQuestion.question);

      const promise = executeSearch(input, model, (sourcesFound) => {
        callbacks?.onSearchProgress(input.subQuestion.id, sourcesFound);
      }).then((result) => {
        inProgress.delete(input.subQuestion.id);

        if (result.success && result.note) {
          callbacks?.onSearchComplete(input.subQuestion.id, result.note);
        } else {
          callbacks?.onSearchError(
            input.subQuestion.id,
            result.error || 'Unknown error'
          );
        }

        return result;
      });

      inProgress.set(input.subQuestion.id, promise);
    }

    // Wait for at least one to complete
    if (inProgress.size > 0) {
      const completed = await Promise.race(inProgress.values());
      results.push(completed);
    }
  }

  // Process results
  const notes: ResearchNote[] = [];
  const failedQuestions: SubQuestion[] = [];

  for (const result of results) {
    if (result.success && result.note) {
      notes.push(result.note);
    } else {
      const failedQ = subQuestions.find((sq) => sq.id === result.subQuestionId);
      if (failedQ) {
        failedQuestions.push(failedQ);
      }
    }
  }

  const totalDurationMs = Date.now() - startTime;

  // Calculate parallelization efficiency
  // (sum of individual durations) / (total wall clock time * concurrency)
  const sumIndividualMs = results.reduce((sum, r) => sum + r.durationMs, 0);
  const theoreticalMaxMs = totalDurationMs * concurrency;
  const parallelizationEfficiency =
    theoreticalMaxMs > 0 ? Math.min(1, sumIndividualMs / theoreticalMaxMs) : 0;

  console.log(
    `[SearchWorkers] Completed ${notes.length}/${subQuestions.length} searches ` +
      `in ${totalDurationMs}ms (${Math.round(parallelizationEfficiency * 100)}% efficient)`
  );

  return {
    notes,
    failedQuestions,
    totalDurationMs,
    parallelizationEfficiency,
  };
}

// ============================================
// HELPERS
// ============================================

/**
 * Transform raw citation URLs to Citation objects
 */
function transformCitations(urls: string[]): Citation[] {
  return urls.map((url, index) => {
    let domain = 'Unknown';
    let title = 'Source';

    try {
      const parsed = new URL(url);
      domain = parsed.hostname.replace(/^www\./, '');
      // Extract title from URL path
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        title = pathParts[pathParts.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\.(html?|php|aspx?)$/i, '')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    } catch {
      // Keep defaults
    }

    return {
      id: `citation-${index}`,
      url,
      title: title || domain,
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    };
  });
}

/**
 * Calculate confidence score for a research note
 * Based on content length, number of citations, and content quality indicators
 */
function calculateConfidence(content: string, citations: Citation[]): number {
  let score = 0.5; // Base score

  // Content length (more content = more confidence, up to a point)
  const contentLength = content.length;
  if (contentLength > 500) score += 0.1;
  if (contentLength > 1000) score += 0.1;
  if (contentLength > 2000) score += 0.05;

  // Number of citations
  const citationCount = citations.length;
  if (citationCount >= 2) score += 0.1;
  if (citationCount >= 4) score += 0.1;
  if (citationCount >= 6) score += 0.05;

  // Content quality indicators
  const hasNumbers = /\d+(\.\d+)?%?/.test(content);
  const hasQuotes = /"[^"]{10,}"/.test(content);
  const hasLists = /(\n[-•*]|\d+\.)/.test(content);

  if (hasNumbers) score += 0.05;
  if (hasQuotes) score += 0.05;
  if (hasLists) score += 0.03;

  // Cap at 0.95
  return Math.min(0.95, score);
}

/**
 * Estimate the cost of a search batch
 */
export function estimateBatchCost(
  questionCount: number,
  model: 'sonar' | 'sonar-pro'
): number {
  return questionCount * COST_PER_QUERY[model];
}

/**
 * Retry a failed search with exponential backoff
 */
export async function retrySearch(
  input: SearchWorkerInput,
  model: 'sonar' | 'sonar-pro',
  maxRetries: number = 2
): Promise<SearchWorkerOutput> {
  let lastError: string = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      console.log(
        `[SearchWorker] Retry ${attempt}/${maxRetries} for ${input.subQuestion.id}`
      );
    }

    const result = await executeSearch(input, model);

    if (result.success) {
      return result;
    }

    lastError = result.error || 'Unknown error';

    // Don't retry on certain errors
    if (
      lastError.includes('API key') ||
      lastError.includes('authentication') ||
      lastError.includes('rate limit')
    ) {
      break;
    }
  }

  return {
    subQuestionId: input.subQuestion.id,
    success: false,
    error: `Failed after ${maxRetries + 1} attempts: ${lastError}`,
    durationMs: 0,
  };
}
