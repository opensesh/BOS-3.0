/**
 * Re-ranking Service
 *
 * Multi-stage relevance scoring for search results:
 * 1. Cohere Rerank API - Primary re-ranker for relevance scoring
 * 2. MMR (Maximal Marginal Relevance) - Ensures result diversity
 *
 * Usage:
 * - Retrieve 3x candidates from hybrid search
 * - Apply Cohere re-ranking for relevance
 * - Apply MMR for diversity
 * - Return top K results
 */

import { generateEmbedding } from './embedding-service';

// ===========================================
// Types
// ===========================================

export interface SearchResult {
  id: string;
  content: string;
  similarity?: number;
  rrfScore?: number;
  matchType?: 'semantic' | 'keyword' | 'both';
  [key: string]: unknown; // Allow additional fields to pass through
}

export interface RankedResult extends SearchResult {
  relevanceScore: number;
  originalRank: number;
  diversityScore?: number;
  finalScore?: number;
}

export interface RerankerOptions {
  topK: number;
  minScore?: number;
  model?: 'rerank-v3.5' | 'rerank-english-v3.0' | 'rerank-multilingual-v3.0';
  maxChunksPerDoc?: number;
}

export interface MMROptions {
  lambda?: number; // Balance relevance vs diversity (0-1, default 0.7)
  topK?: number;
}

// ===========================================
// Cohere API Configuration
// ===========================================

const COHERE_API_URL = 'https://api.cohere.ai/v1/rerank';

interface CohereRerankResponse {
  id: string;
  results: Array<{
    index: number;
    relevance_score: number;
  }>;
  meta?: {
    api_version: {
      version: string;
    };
    billed_units?: {
      search_units: number;
    };
  };
}

/**
 * Get Cohere API key from environment
 */
function getCohereApiKey(): string | null {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    return null;
  }
  // Strip quotes and trailing commas (Vercel CLI export format)
  return apiKey.replace(/^["']|["'],?$/g, '').trim();
}

// ===========================================
// Primary Re-ranking: Cohere
// ===========================================

/**
 * Re-rank results using Cohere Rerank API
 *
 * @param query - Original search query
 * @param results - Array of search results to re-rank
 * @param options - Re-ranking options
 * @returns Re-ranked results with relevance scores
 */
export async function rerankWithCohere(
  query: string,
  results: SearchResult[],
  options: RerankerOptions
): Promise<RankedResult[]> {
  const apiKey = getCohereApiKey();

  if (!apiKey) {
    console.warn('COHERE_API_KEY not set, falling back to original ranking');
    return results.map((r, idx) => ({
      ...r,
      relevanceScore: r.similarity || r.rrfScore || 0,
      originalRank: idx,
    }));
  }

  if (results.length === 0) {
    return [];
  }

  const { topK, minScore = 0, model = 'rerank-v3.5' } = options;

  // Prepare documents for Cohere
  const documents = results.map((r) => r.content);

  try {
    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        documents,
        top_n: Math.min(topK, results.length),
        model,
        return_documents: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Cohere API error: ${response.status} - ${error}`);
      // Fallback to original ranking
      return results.slice(0, topK).map((r, idx) => ({
        ...r,
        relevanceScore: r.similarity || r.rrfScore || 0,
        originalRank: idx,
      }));
    }

    const data: CohereRerankResponse = await response.json();

    // Map Cohere results back to our result format
    const rankedResults: RankedResult[] = data.results
      .filter((r) => r.relevance_score >= minScore)
      .map((r) => ({
        ...results[r.index],
        relevanceScore: r.relevance_score,
        originalRank: r.index,
      }));

    return rankedResults;
  } catch (error) {
    console.error('Cohere re-ranking failed:', error);
    // Fallback to original ranking
    return results.slice(0, topK).map((r, idx) => ({
      ...r,
      relevanceScore: r.similarity || r.rrfScore || 0,
      originalRank: idx,
    }));
  }
}

// ===========================================
// Diversity: Maximal Marginal Relevance (MMR)
// ===========================================

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Apply Maximal Marginal Relevance to ensure result diversity
 *
 * MMR balances relevance with diversity by penalizing results
 * that are too similar to already-selected results.
 *
 * @param results - Re-ranked results with relevance scores
 * @param embeddings - Pre-computed embeddings for each result
 * @param options - MMR options (lambda, topK)
 * @returns Diverse subset of results
 */
export function applyMMR(
  results: RankedResult[],
  embeddings: number[][],
  options: MMROptions = {}
): RankedResult[] {
  const { lambda = 0.7, topK = 5 } = options;

  if (results.length === 0 || results.length <= topK) {
    return results;
  }

  const selected: RankedResult[] = [];
  const selectedIndices = new Set<number>();
  const selectedEmbeddings: number[][] = [];

  // Normalize relevance scores to 0-1 range
  const maxRelevance = Math.max(...results.map((r) => r.relevanceScore));
  const minRelevance = Math.min(...results.map((r) => r.relevanceScore));
  const relevanceRange = maxRelevance - minRelevance || 1;

  while (selected.length < topK && selectedIndices.size < results.length) {
    let bestScore = -Infinity;
    let bestIndex = -1;

    for (let i = 0; i < results.length; i++) {
      if (selectedIndices.has(i)) continue;

      // Normalized relevance (0-1)
      const normalizedRelevance =
        (results[i].relevanceScore - minRelevance) / relevanceRange;

      // Calculate max similarity to already-selected items
      let maxSimilarity = 0;
      if (selectedEmbeddings.length > 0) {
        for (const selectedEmb of selectedEmbeddings) {
          const sim = cosineSimilarity(embeddings[i], selectedEmb);
          maxSimilarity = Math.max(maxSimilarity, sim);
        }
      }

      // MMR score: lambda * relevance - (1 - lambda) * similarity_to_selected
      const mmrScore = lambda * normalizedRelevance - (1 - lambda) * maxSimilarity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0) {
      selectedIndices.add(bestIndex);
      selected.push({
        ...results[bestIndex],
        diversityScore: bestScore,
        finalScore: bestScore,
      });
      selectedEmbeddings.push(embeddings[bestIndex]);
    } else {
      break;
    }
  }

  return selected;
}

/**
 * Apply MMR with automatic embedding generation
 *
 * Convenience wrapper that generates embeddings for results
 * before applying MMR. Use this when embeddings aren't pre-computed.
 *
 * @param results - Re-ranked results
 * @param options - MMR options
 * @returns Diverse subset with embeddings computed
 */
export async function applyMMRWithEmbeddings(
  results: RankedResult[],
  options: MMROptions = {}
): Promise<RankedResult[]> {
  if (results.length === 0) return [];

  // Generate embeddings for all result contents
  const texts = results.map((r) => r.content);

  try {
    // Import dynamically to avoid circular deps
    const { generateEmbeddings } = await import('./embedding-service');
    const embeddings = await generateEmbeddings(texts);
    return applyMMR(results, embeddings, options);
  } catch (error) {
    console.error('Failed to generate embeddings for MMR:', error);
    // Fallback: return top K without diversity filtering
    return results.slice(0, options.topK || 5);
  }
}

// ===========================================
// Combined Pipeline
// ===========================================

export interface RerankPipelineOptions {
  // Cohere options
  topK: number;
  minScore?: number;
  model?: 'rerank-v3.5' | 'rerank-english-v3.0' | 'rerank-multilingual-v3.0';
  // MMR options
  applyDiversity?: boolean;
  diversityLambda?: number;
  // Pipeline options
  candidateMultiplier?: number; // How many candidates to retrieve (default 3x)
}

/**
 * Complete re-ranking pipeline:
 * 1. Take candidates from initial search
 * 2. Re-rank with Cohere for relevance
 * 3. Apply MMR for diversity (optional)
 *
 * @param query - Original search query
 * @param candidates - Initial search candidates (should be 3x topK)
 * @param options - Pipeline options
 * @returns Final re-ranked, diverse results
 */
export async function rerankPipeline(
  query: string,
  candidates: SearchResult[],
  options: RerankPipelineOptions
): Promise<RankedResult[]> {
  const {
    topK,
    minScore = 0,
    model = 'rerank-v3.5',
    applyDiversity = true,
    diversityLambda = 0.7,
  } = options;

  // Step 1: Re-rank with Cohere
  const rerankedResults = await rerankWithCohere(query, candidates, {
    topK: applyDiversity ? topK * 2 : topK, // Get more if applying MMR
    minScore,
    model,
  });

  if (!applyDiversity || rerankedResults.length <= topK) {
    return rerankedResults.slice(0, topK);
  }

  // Step 2: Apply MMR for diversity
  const diverseResults = await applyMMRWithEmbeddings(rerankedResults, {
    lambda: diversityLambda,
    topK,
  });

  return diverseResults;
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Check if Cohere re-ranking is available
 */
export function isCohereAvailable(): boolean {
  return getCohereApiKey() !== null;
}

/**
 * Validate re-ranker configuration
 */
export async function validateRerankerSetup(): Promise<{
  valid: boolean;
  cohereConfigured: boolean;
  error?: string;
}> {
  const result = {
    valid: false,
    cohereConfigured: false,
    error: undefined as string | undefined,
  };

  const apiKey = getCohereApiKey();
  if (!apiKey) {
    result.error = 'COHERE_API_KEY not configured (re-ranking will use fallback)';
    result.valid = true; // Still valid, just using fallback
    return result;
  }

  // Test the API with a simple request
  try {
    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test',
        documents: ['test document'],
        top_n: 1,
        model: 'rerank-v3.5',
      }),
    });

    if (response.ok) {
      result.cohereConfigured = true;
      result.valid = true;
    } else {
      const error = await response.text();
      result.error = `Cohere API validation failed: ${error}`;
      result.valid = true; // Still valid, will use fallback
    }
  } catch (error) {
    result.error = `Cohere API connection failed: ${error}`;
    result.valid = true; // Still valid, will use fallback
  }

  return result;
}

// Export configuration for reference
export const RERANKER_CONFIG = {
  defaultModel: 'rerank-v3.5' as const,
  defaultMinScore: 0,
  defaultDiversityLambda: 0.7,
  defaultCandidateMultiplier: 3,
};
