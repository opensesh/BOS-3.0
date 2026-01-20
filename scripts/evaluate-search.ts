#!/usr/bin/env npx tsx
/**
 * Search Evaluation Script
 *
 * Evaluates semantic search quality using a labeled test dataset.
 * Calculates key metrics:
 * - MRR@10 (Mean Reciprocal Rank) - How high is the correct result?
 * - Recall@K - What % of expected docs appear in top K?
 * - Exact match rate - For keyword queries, does exact match rank #1?
 *
 * Usage: npx tsx scripts/evaluate-search.ts [brand-slug] [--verbose]
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../lib/bos/embedding-service';

// Types
interface EvalQuery {
  id: string;
  query: string;
  type: 'exact-match' | 'semantic' | 'ambiguous' | 'edge-cases';
  expectedDocuments: string[];
  expectedTopics: string[];
  notes?: string;
}

interface EvalDataset {
  metadata: {
    version: string;
    createdAt: string;
    description: string;
    totalQueries: number;
  };
  queries: EvalQuery[];
}

interface SearchResult {
  id: string;
  document_id?: string;
  content: string;
  similarity: number;
  document_title?: string;
  document_category?: string;
  heading_hierarchy?: string[];
  match_type?: 'semantic' | 'keyword' | 'both';
}

interface QueryResult {
  queryId: string;
  query: string;
  type: string;
  results: SearchResult[];
  reciprocalRank: number;
  recall: { [k: number]: number };
  exactMatchRank: number | null;
  latencyMs: number;
}

interface EvaluationMetrics {
  timestamp: string;
  brandSlug: string;
  totalQueries: number;
  searchConfig: {
    model: string;
    threshold: number;
    topK: number;
    searchMode: string;
    rerank?: boolean;
    diversity?: boolean;
  };
  overallMetrics: {
    mrr10: number;
    recall5: number;
    recall10: number;
    exactMatchRate: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
  };
  byType: {
    [type: string]: {
      count: number;
      mrr10: number;
      recall5: number;
      recall10: number;
      exactMatchRate: number;
    };
  };
  queryResults: QueryResult[];
  rerankingAvailable?: boolean;
}

// Configuration
// Note: text-embedding-3-large produces lower similarity scores than ada-002
// Threshold lowered from 0.5 to 0.3 to account for this
const SEARCH_CONFIG = {
  threshold: 0.3,
  topK: 10,
  model: 'text-embedding-3-large',
  searchMode: 'hybrid' as 'semantic' | 'hybrid', // Using hybrid search with RRF
  semanticWeight: 0.7, // 70% semantic, 30% keyword
  // Re-ranking options (requires COHERE_API_KEY)
  rerank: Boolean(process.env.COHERE_API_KEY),
  rerankModel: 'rerank-v3.5' as const,
  diversity: true,
  diversityLambda: 0.7,
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function getBrandId(supabase: ReturnType<typeof createClient>, brandSlug: string): Promise<string> {
  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .single();

  if (error || !data) {
    throw new Error(`Brand not found: ${brandSlug}`);
  }

  return data.id;
}

async function searchDocumentChunks(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  query: string,
  limit: number = 10
): Promise<{ results: SearchResult[]; latencyMs: number }> {
  const startTime = performance.now();

  // If re-ranking is enabled, use the full pipeline with Cohere
  if (SEARCH_CONFIG.rerank) {
    return searchWithReranking(supabase, brandId, query, limit, startTime);
  }

  const embedding = await generateEmbedding(query);

  // Use hybrid search (semantic + keyword with RRF)
  if (SEARCH_CONFIG.searchMode === 'hybrid') {
    const { data, error } = await supabase.rpc('hybrid_search_chunks', {
      p_query: query,
      query_embedding: embedding,
      p_brand_id: brandId,
      match_threshold: SEARCH_CONFIG.threshold,
      match_count: limit,
      semantic_weight: SEARCH_CONFIG.semanticWeight,
      rrf_k: 60,
    });

    const latencyMs = performance.now() - startTime;

    if (error) {
      console.warn(`Hybrid search error: ${error.message}, falling back to semantic`);
      // Fallback to semantic-only
      return searchDocumentChunksSemantic(supabase, brandId, query, embedding, limit, startTime);
    }

    // Map hybrid results to standard format
    const results = (data || []).map((item: {
      id: string;
      document_id: string;
      heading_hierarchy: string[];
      content: string;
      token_count: number;
      semantic_similarity: number;
      keyword_rank: number;
      rrf_score: number;
      document_title: string;
      document_category: string;
      match_type: string;
    }) => ({
      id: item.id,
      document_id: item.document_id,
      heading_hierarchy: item.heading_hierarchy,
      content: item.content,
      token_count: item.token_count,
      similarity: item.semantic_similarity || item.rrf_score,
      document_title: item.document_title,
      document_category: item.document_category,
      match_type: item.match_type,
    }));

    return { results, latencyMs };
  }

  // Semantic-only search
  return searchDocumentChunksSemantic(supabase, brandId, query, embedding, limit, startTime);
}

/**
 * Search with full re-ranking pipeline (Cohere + MMR)
 */
async function searchWithReranking(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  query: string,
  limit: number,
  startTime: number
): Promise<{ results: SearchResult[]; latencyMs: number }> {
  const { rerankPipeline } = await import('../lib/bos/reranker');

  const embedding = await generateEmbedding(query);
  const candidateLimit = limit * 3; // Get 3x candidates for re-ranking

  // Get candidates from hybrid search
  const { data, error } = await supabase.rpc('hybrid_search_chunks', {
    p_query: query,
    query_embedding: embedding,
    p_brand_id: brandId,
    match_threshold: SEARCH_CONFIG.threshold,
    match_count: candidateLimit,
    semantic_weight: SEARCH_CONFIG.semanticWeight,
    rrf_k: 60,
  });

  if (error) {
    console.warn(`Hybrid search error: ${error.message}`);
    return { results: [], latencyMs: performance.now() - startTime };
  }

  // Map to reranker format
  const candidates = (data || []).map((item: {
    id: string;
    document_id: string;
    heading_hierarchy: string[];
    content: string;
    token_count: number;
    semantic_similarity: number;
    keyword_rank: number;
    rrf_score: number;
    document_title: string;
    document_category: string;
    match_type: string;
  }) => ({
    id: item.id,
    document_id: item.document_id,
    heading_hierarchy: item.heading_hierarchy,
    content: item.content,
    token_count: item.token_count,
    similarity: item.semantic_similarity || item.rrf_score,
    rrfScore: item.rrf_score,
    document_title: item.document_title,
    document_category: item.document_category,
    match_type: item.match_type,
  }));

  // Apply re-ranking pipeline
  const rankedResults = await rerankPipeline(query, candidates, {
    topK: limit,
    model: SEARCH_CONFIG.rerankModel,
    applyDiversity: SEARCH_CONFIG.diversity,
    diversityLambda: SEARCH_CONFIG.diversityLambda,
  });

  const latencyMs = performance.now() - startTime;

  // Map back to SearchResult format
  const results: SearchResult[] = rankedResults.map(r => ({
    id: r.id,
    document_id: r.document_id as string,
    heading_hierarchy: r.heading_hierarchy as string[],
    content: r.content,
    similarity: r.relevanceScore, // Use Cohere relevance score
    document_title: r.document_title as string,
    document_category: r.document_category as string,
    match_type: r.match_type as 'semantic' | 'keyword' | 'both',
  }));

  return { results, latencyMs };
}

async function searchDocumentChunksSemantic(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  _query: string,
  embedding: number[],
  limit: number,
  startTime: number
): Promise<{ results: SearchResult[]; latencyMs: number }> {
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: embedding,
    p_brand_id: brandId,
    match_threshold: SEARCH_CONFIG.threshold,
    match_count: limit,
  });

  const latencyMs = performance.now() - startTime;

  if (error) {
    throw new Error(`Search error: ${error.message}`);
  }

  return {
    results: data || [],
    latencyMs,
  };
}

/**
 * Check if a result matches expected documents/topics
 */
function isRelevantResult(result: SearchResult, query: EvalQuery): boolean {
  const content = result.content.toLowerCase();
  const title = (result.document_title || '').toLowerCase();
  const category = (result.document_category || '').toLowerCase();
  const hierarchy = (result.heading_hierarchy || []).join(' ').toLowerCase();

  const combined = `${content} ${title} ${category} ${hierarchy}`;

  // Check if any expected document slug matches
  for (const expectedDoc of query.expectedDocuments) {
    const docSlug = expectedDoc.toLowerCase().replace(/-/g, ' ');
    if (combined.includes(docSlug) || category.includes(expectedDoc.toLowerCase())) {
      return true;
    }
  }

  // Check if any expected topics appear in the content
  for (const topic of query.expectedTopics) {
    const topicLower = topic.toLowerCase();
    if (combined.includes(topicLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate Reciprocal Rank - 1/position of first relevant result
 */
function calculateReciprocalRank(results: SearchResult[], query: EvalQuery, k: number = 10): number {
  for (let i = 0; i < Math.min(results.length, k); i++) {
    if (isRelevantResult(results[i], query)) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

/**
 * Calculate Recall@K - % of expected items found in top K
 */
function calculateRecall(results: SearchResult[], query: EvalQuery, k: number): number {
  const topK = results.slice(0, k);
  const relevantFound = topK.filter(r => isRelevantResult(r, query)).length;
  const expectedCount = Math.max(query.expectedTopics.length, 1);
  return relevantFound / expectedCount;
}

/**
 * Check if query term appears exactly in top result
 */
function getExactMatchRank(results: SearchResult[], queryText: string): number | null {
  const queryLower = queryText.toLowerCase();

  for (let i = 0; i < results.length; i++) {
    const content = results[i].content.toLowerCase();
    const title = (results[i].document_title || '').toLowerCase();

    if (content.includes(queryLower) || title.includes(queryLower)) {
      return i + 1; // 1-indexed rank
    }
  }

  return null;
}

/**
 * Calculate percentile value from sorted array
 */
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runEvaluation(brandSlug: string, verbose: boolean): Promise<EvaluationMetrics> {
  console.log('='.repeat(70));
  console.log('Search Evaluation - Context Engineering Remediation');
  console.log('='.repeat(70));
  console.log(`Brand: ${brandSlug}`);
  console.log(`Search Mode: ${SEARCH_CONFIG.searchMode}`);
  console.log(`Model: ${SEARCH_CONFIG.model}`);
  console.log(`Re-ranking: ${SEARCH_CONFIG.rerank ? 'ENABLED (Cohere)' : 'DISABLED (no API key)'}`);
  console.log(`Diversity (MMR): ${SEARCH_CONFIG.diversity ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  // Load evaluation dataset
  const datasetPath = resolve(process.cwd(), 'tests/evaluation/search-eval-dataset.json');
  if (!existsSync(datasetPath)) {
    throw new Error(`Evaluation dataset not found at ${datasetPath}`);
  }

  const dataset: EvalDataset = JSON.parse(readFileSync(datasetPath, 'utf-8'));
  console.log(`Loaded ${dataset.queries.length} evaluation queries`);
  console.log('');

  const supabase = getSupabaseAdmin();
  const brandId = await getBrandId(supabase, brandSlug);

  const queryResults: QueryResult[] = [];
  const latencies: number[] = [];

  // Process each query
  console.log('Running queries...');
  console.log('-'.repeat(70));

  for (const evalQuery of dataset.queries) {
    try {
      const { results, latencyMs } = await searchDocumentChunks(
        supabase,
        brandId,
        evalQuery.query,
        SEARCH_CONFIG.topK
      );

      latencies.push(latencyMs);

      const reciprocalRank = calculateReciprocalRank(results, evalQuery, 10);
      const recall5 = calculateRecall(results, evalQuery, 5);
      const recall10 = calculateRecall(results, evalQuery, 10);
      const exactMatchRank = getExactMatchRank(results, evalQuery.query);

      const queryResult: QueryResult = {
        queryId: evalQuery.id,
        query: evalQuery.query,
        type: evalQuery.type,
        results: results.slice(0, 5), // Store top 5 for debugging
        reciprocalRank,
        recall: { 5: recall5, 10: recall10 },
        exactMatchRank,
        latencyMs,
      };

      queryResults.push(queryResult);

      if (verbose) {
        const relevantCount = results.filter(r => isRelevantResult(r, evalQuery)).length;
        const status = reciprocalRank > 0 ? 'OK' : 'MISS';
        console.log(`[${status}] ${evalQuery.id}: "${evalQuery.query}"`);
        console.log(`     RR: ${reciprocalRank.toFixed(3)} | Recall@5: ${recall5.toFixed(2)} | Exact: ${exactMatchRank ?? 'N/A'} | ${latencyMs.toFixed(0)}ms`);
        if (results.length > 0) {
          console.log(`     Top: ${results[0].document_title || 'Unknown'} (${(results[0].similarity * 100).toFixed(1)}%)`);
        }
      } else {
        process.stdout.write('.');
      }

    } catch (error) {
      console.error(`Error processing query ${evalQuery.id}:`, error);
      queryResults.push({
        queryId: evalQuery.id,
        query: evalQuery.query,
        type: evalQuery.type,
        results: [],
        reciprocalRank: 0,
        recall: { 5: 0, 10: 0 },
        exactMatchRank: null,
        latencyMs: 0,
      });
    }
  }

  if (!verbose) {
    console.log(' done');
  }
  console.log('');

  // Calculate overall metrics
  const mrr10 = queryResults.reduce((sum, r) => sum + r.reciprocalRank, 0) / queryResults.length;
  const recall5 = queryResults.reduce((sum, r) => sum + r.recall[5], 0) / queryResults.length;
  const recall10 = queryResults.reduce((sum, r) => sum + r.recall[10], 0) / queryResults.length;

  const exactMatchQueries = queryResults.filter(r => r.type === 'exact-match');
  const exactMatchRate = exactMatchQueries.filter(r => r.exactMatchRank === 1).length / exactMatchQueries.length;

  const avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95LatencyMs = percentile(latencies, 95);

  // Calculate metrics by query type
  const types = ['exact-match', 'semantic', 'ambiguous', 'edge-cases'];
  const byType: { [type: string]: { count: number; mrr10: number; recall5: number; recall10: number; exactMatchRate: number } } = {};

  for (const type of types) {
    const typeResults = queryResults.filter(r => r.type === type);
    if (typeResults.length === 0) continue;

    byType[type] = {
      count: typeResults.length,
      mrr10: typeResults.reduce((sum, r) => sum + r.reciprocalRank, 0) / typeResults.length,
      recall5: typeResults.reduce((sum, r) => sum + r.recall[5], 0) / typeResults.length,
      recall10: typeResults.reduce((sum, r) => sum + r.recall[10], 0) / typeResults.length,
      exactMatchRate: typeResults.filter(r => r.exactMatchRank === 1).length / typeResults.length,
    };
  }

  const metrics: EvaluationMetrics = {
    timestamp: new Date().toISOString(),
    brandSlug,
    totalQueries: queryResults.length,
    searchConfig: {
      ...SEARCH_CONFIG,
      rerank: SEARCH_CONFIG.rerank,
      diversity: SEARCH_CONFIG.diversity,
    },
    overallMetrics: {
      mrr10,
      recall5,
      recall10,
      exactMatchRate,
      avgLatencyMs,
      p95LatencyMs,
    },
    byType,
    queryResults,
    rerankingAvailable: Boolean(process.env.COHERE_API_KEY),
  };

  // Print results
  console.log('='.repeat(70));
  console.log('EVALUATION RESULTS');
  console.log('='.repeat(70));
  console.log('');
  console.log('Overall Metrics:');
  console.log(`  MRR@10:           ${(mrr10 * 100).toFixed(1)}%`);
  console.log(`  Recall@5:         ${(recall5 * 100).toFixed(1)}%`);
  console.log(`  Recall@10:        ${(recall10 * 100).toFixed(1)}%`);
  console.log(`  Exact Match Rate: ${(exactMatchRate * 100).toFixed(1)}%`);
  console.log(`  Avg Latency:      ${avgLatencyMs.toFixed(0)}ms`);
  console.log(`  P95 Latency:      ${p95LatencyMs.toFixed(0)}ms`);
  console.log('');
  console.log('By Query Type:');
  console.log('-'.repeat(70));
  console.log(`${'Type'.padEnd(15)} ${'Count'.padEnd(7)} ${'MRR@10'.padEnd(10)} ${'Recall@5'.padEnd(10)} ${'Exact%'.padEnd(10)}`);
  console.log('-'.repeat(70));

  for (const [type, data] of Object.entries(byType)) {
    console.log(
      `${type.padEnd(15)} ${String(data.count).padEnd(7)} ${(data.mrr10 * 100).toFixed(1).padStart(5)}%    ${(data.recall5 * 100).toFixed(1).padStart(5)}%    ${(data.exactMatchRate * 100).toFixed(1).padStart(5)}%`
    );
  }
  console.log('');

  // Show worst performing queries
  const worstQueries = [...queryResults]
    .sort((a, b) => a.reciprocalRank - b.reciprocalRank)
    .slice(0, 5);

  console.log('Worst Performing Queries:');
  console.log('-'.repeat(70));
  for (const q of worstQueries) {
    console.log(`  [${q.type}] "${q.query}" - RR: ${q.reciprocalRank.toFixed(3)}`);
    if (q.results.length > 0) {
      console.log(`    Top result: ${q.results[0].document_title || 'Unknown'} (${(q.results[0].similarity * 100).toFixed(1)}%)`);
    } else {
      console.log(`    No results found`);
    }
  }
  console.log('');

  return metrics;
}

async function main() {
  const args = process.argv.slice(2);
  const brandSlug = args.find(a => !a.startsWith('--')) || 'open-session';
  const verbose = args.includes('--verbose') || args.includes('-v');

  try {
    const metrics = await runEvaluation(brandSlug, verbose);

    // Save results
    const resultsDir = resolve(process.cwd(), 'tests/evaluation/results');
    if (!existsSync(resultsDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = resolve(resultsDir, `eval-${timestamp}.json`);
    writeFileSync(resultsPath, JSON.stringify(metrics, null, 2));
    console.log(`Results saved to: ${resultsPath}`);

    // Also save as latest baseline
    const baselinePath = resolve(resultsDir, 'baseline.json');
    if (!existsSync(baselinePath)) {
      writeFileSync(baselinePath, JSON.stringify(metrics, null, 2));
      console.log(`Baseline saved to: ${baselinePath}`);
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('Evaluation complete!');
    console.log('='.repeat(70));

    // Return exit code based on MRR threshold
    const targetMRR = 0.70; // 70% target from plan
    if (metrics.overallMetrics.mrr10 < targetMRR) {
      console.log(`\nNote: MRR@10 (${(metrics.overallMetrics.mrr10 * 100).toFixed(1)}%) is below target (${(targetMRR * 100).toFixed(0)}%)`);
    }

  } catch (error) {
    console.error('Evaluation failed:', error);
    process.exit(1);
  }
}

main();
