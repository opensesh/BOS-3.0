/**
 * Unified Hybrid Search API
 *
 * Provides hybrid search (semantic + keyword) across:
 * - Chat messages (via match_messages)
 * - Brand assets (via hybrid_search_assets)
 * - Brand documents (via hybrid_search_chunks)
 *
 * Search modes:
 * - 'hybrid' (default): Combines semantic (70%) + keyword (30%) using RRF
 * - 'semantic': Pure vector similarity search
 * - 'keyword': Pure PostgreSQL full-text search
 *
 * Re-ranking pipeline:
 * 1. Retrieve 3x candidates from hybrid search
 * 2. Re-rank with Cohere for relevance (if enabled)
 * 3. Apply MMR for diversity (if enabled)
 * 4. Return top K results
 *
 * Uses OpenAI embeddings for query vectorization,
 * PostgreSQL tsvector for keyword matching,
 * Reciprocal Rank Fusion (RRF) for score combination,
 * and Cohere Rerank for final relevance scoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/bos/embedding-service';
import {
  rerankPipeline,
  isCohereAvailable,
  type SearchResult as RerankerSearchResult,
  type RankedResult,
} from '@/lib/bos/reranker';

// ===========================================
// Types
// ===========================================

type SearchMode = 'hybrid' | 'semantic' | 'keyword';

interface SearchRequest {
  query: string;
  types?: ('chats' | 'assets' | 'documents')[];
  limit?: number;
  threshold?: number;
  searchMode?: SearchMode;
  semanticWeight?: number; // 0-1, default 0.7 (70% semantic, 30% keyword)
  // Re-ranking options
  rerank?: boolean; // Enable Cohere re-ranking (default: true if available)
  rerankModel?: 'rerank-v3.5' | 'rerank-english-v3.0' | 'rerank-multilingual-v3.0';
  diversity?: boolean; // Enable MMR diversity (default: true when reranking)
  diversityLambda?: number; // 0-1, balance relevance vs diversity (default: 0.7)
  // Metadata filtering options
  filters?: {
    categories?: string[];        // Filter by categories (OR logic)
    variants?: string[];          // Filter by asset variants (OR logic)
    dateFrom?: string;            // ISO date string - filter by date range start
    dateTo?: string;              // ISO date string - filter by date range end
    excludeIds?: string[];        // Exclude specific result IDs
    documentIds?: string[];       // Filter to specific documents
  };
  // Special operations
  similarTo?: string; // Chunk ID to find similar content to
  includeFacets?: boolean; // Include facet counts in response
}

interface ChatSearchResult {
  id: string;
  type: 'chat';
  chatId: string;
  title: string;
  content: string;
  role: string;
  similarity: number;
  updatedAt: string;
}

interface AssetSearchResult {
  id: string;
  type: 'asset';
  name: string;
  filename: string;
  description: string;
  category: string;
  variant: string | null;
  storagePath: string;
  similarity: number;
  matchType?: 'semantic' | 'keyword' | 'both';
  keywordRank?: number;
  rrfScore?: number;
}

interface DocumentSearchResult {
  id: string;
  type: 'document';
  documentId: string;
  title: string;
  category: string;
  slug: string;
  content: string;
  headingHierarchy: string[];
  similarity: number;
  matchType?: 'semantic' | 'keyword' | 'both';
  keywordRank?: number;
  rrfScore?: number;
  // Re-ranking fields
  relevanceScore?: number;
  diversityScore?: number;
  originalRank?: number;
}

// Base search result with optional reranking fields
interface BaseSearchResult {
  id: string;
  similarity: number;
  relevanceScore?: number;
  diversityScore?: number;
  originalRank?: number;
}

type SearchResult = (ChatSearchResult | AssetSearchResult | DocumentSearchResult) & Partial<BaseSearchResult>;

interface SearchResponse {
  results: SearchResult[];
  query: string;
  timing: {
    embedding: number;
    search: number;
    rerank?: number;
    total: number;
  };
  meta?: {
    reranked: boolean;
    diversityApplied: boolean;
    candidatesRetrieved: number;
  };
  facets?: {
    documents: Facet[];
    assets: Facet[];
  };
}

// ===========================================
// Supabase Admin Client
// ===========================================

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

// ===========================================
// Search Functions
// ===========================================

async function searchChats(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  queryEmbedding: number[],
  threshold: number,
  limit: number
): Promise<ChatSearchResult[]> {
  const { data, error } = await supabase.rpc('match_messages', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('Chat search error:', error);
    return [];
  }

  return (data || []).map((item: {
    id: string;
    chat_id: string;
    chat_title: string;
    content: string;
    role: string;
    similarity: number;
    chat_updated_at: string;
  }) => ({
    id: item.id,
    type: 'chat' as const,
    chatId: item.chat_id,
    title: item.chat_title,
    content: item.content,
    role: item.role,
    similarity: item.similarity,
    updatedAt: item.chat_updated_at,
  }));
}

interface AssetSearchFilters {
  categories?: string[];
  variants?: string[];
  dateFrom?: string;
  dateTo?: string;
  excludeIds?: string[];
}

async function searchAssets(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandId: string,
  query: string,
  queryEmbedding: number[],
  threshold: number,
  limit: number,
  searchMode: SearchMode = 'hybrid',
  semanticWeight: number = 0.7,
  filters?: AssetSearchFilters
): Promise<AssetSearchResult[]> {
  const hasFilters = filters && (
    filters.categories?.length ||
    filters.variants?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.excludeIds?.length
  );

  // Use filtered hybrid search when filters are provided
  if (searchMode === 'hybrid') {
    const rpcFunction = hasFilters ? 'hybrid_search_assets_filtered' : 'hybrid_search_assets';

    const rpcParams: Record<string, unknown> = {
      p_query: query,
      query_embedding: queryEmbedding,
      p_brand_id: brandId,
      match_threshold: threshold,
      match_count: limit,
      semantic_weight: semanticWeight,
      rrf_k: 60,
    };

    // Add filter parameters for filtered function
    if (hasFilters && filters) {
      rpcParams.p_categories = filters.categories?.length ? filters.categories : null;
      rpcParams.p_variants = filters.variants?.length ? filters.variants : null;
      rpcParams.p_date_from = filters.dateFrom || null;
      rpcParams.p_date_to = filters.dateTo || null;
      rpcParams.p_exclude_ids = filters.excludeIds?.length ? filters.excludeIds : null;
    } else {
      // Original function uses p_category (singular)
      rpcParams.p_category = null;
    }

    const { data, error } = await supabase.rpc(rpcFunction, rpcParams);

    if (error) {
      console.error('Hybrid asset search error:', error);
      // Fallback to semantic search
      return searchAssets(supabase, brandId, query, queryEmbedding, threshold, limit, 'semantic', semanticWeight, filters);
    }

    return (data || []).map((item: {
      id: string;
      name: string;
      filename: string;
      description: string;
      category: string;
      variant: string | null;
      storage_path: string;
      semantic_similarity: number;
      keyword_rank: number;
      rrf_score: number;
      match_type: string;
    }) => ({
      id: item.id,
      type: 'asset' as const,
      name: item.name,
      filename: item.filename,
      description: item.description,
      category: item.category,
      variant: item.variant,
      storagePath: item.storage_path,
      similarity: item.semantic_similarity || item.rrf_score,
      matchType: item.match_type as 'semantic' | 'keyword' | 'both',
      keywordRank: item.keyword_rank,
      rrfScore: item.rrf_score,
    }));
  }

  // Fallback to original semantic-only search
  const { data, error } = await supabase.rpc('match_assets', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    p_category: null,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('Asset search error:', error);
    return [];
  }

  return (data || []).map((item: {
    id: string;
    name: string;
    filename: string;
    description: string;
    category: string;
    variant: string | null;
    storage_path: string;
    similarity: number;
  }) => ({
    id: item.id,
    type: 'asset' as const,
    name: item.name,
    filename: item.filename,
    description: item.description,
    category: item.category,
    variant: item.variant,
    storagePath: item.storage_path,
    similarity: item.similarity,
  }));
}

interface DocumentSearchFilters {
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  excludeIds?: string[];
  documentIds?: string[];
}

async function searchDocuments(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandId: string,
  query: string,
  queryEmbedding: number[],
  threshold: number,
  limit: number,
  searchMode: SearchMode = 'hybrid',
  semanticWeight: number = 0.7,
  filters?: DocumentSearchFilters
): Promise<DocumentSearchResult[]> {
  const hasFilters = filters && (
    filters.categories?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.excludeIds?.length ||
    filters.documentIds?.length
  );

  // Use filtered hybrid search when filters are provided
  if (searchMode === 'hybrid') {
    const rpcFunction = hasFilters ? 'hybrid_search_chunks_filtered' : 'hybrid_search_chunks';

    const rpcParams: Record<string, unknown> = {
      p_query: query,
      query_embedding: queryEmbedding,
      p_brand_id: brandId,
      match_threshold: threshold,
      match_count: limit,
      semantic_weight: semanticWeight,
      rrf_k: 60,
    };

    // Add filter parameters for filtered function
    if (hasFilters && filters) {
      rpcParams.p_categories = filters.categories?.length ? filters.categories : null;
      rpcParams.p_date_from = filters.dateFrom || null;
      rpcParams.p_date_to = filters.dateTo || null;
      rpcParams.p_exclude_ids = filters.excludeIds?.length ? filters.excludeIds : null;
      rpcParams.p_document_ids = filters.documentIds?.length ? filters.documentIds : null;
    }

    const { data, error } = await supabase.rpc(rpcFunction, rpcParams);

    if (error) {
      console.error('Hybrid document search error:', error);
      // Fallback to semantic search
      return searchDocuments(supabase, brandId, query, queryEmbedding, threshold, limit, 'semantic', semanticWeight, filters);
    }

    return (data || []).map((item: {
      id: string;
      document_id: string;
      document_title: string;
      document_category: string;
      document_slug: string;
      content: string;
      heading_hierarchy: string[];
      semantic_similarity: number;
      keyword_rank: number;
      rrf_score: number;
      match_type: string;
    }) => ({
      id: item.id,
      type: 'document' as const,
      documentId: item.document_id,
      title: item.document_title,
      category: item.document_category,
      slug: item.document_slug,
      content: item.content,
      headingHierarchy: item.heading_hierarchy || [],
      similarity: item.semantic_similarity || item.rrf_score,
      matchType: item.match_type as 'semantic' | 'keyword' | 'both',
      keywordRank: item.keyword_rank,
      rrfScore: item.rrf_score,
    }));
  }

  // Fallback to original semantic-only search
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('Document search error:', error);
    return [];
  }

  return (data || []).map((item: {
    id: string;
    document_id: string;
    document_title: string;
    document_category: string;
    document_slug: string;
    content: string;
    heading_hierarchy: string[];
    similarity: number;
  }) => ({
    id: item.id,
    type: 'document' as const,
    documentId: item.document_id,
    title: item.document_title,
    category: item.document_category,
    slug: item.document_slug,
    content: item.content,
    headingHierarchy: item.heading_hierarchy || [],
    similarity: item.similarity,
  }));
}

async function getDefaultBrandId(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', 'open-session')
    .single();

  if (error || !data) {
    throw new Error('Default brand not found');
  }

  return data.id;
}

// ===========================================
// Faceted Search Support
// ===========================================

interface Facet {
  type: string;
  value: string;
  count: number;
}

async function getDocumentFacets(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandId: string
): Promise<Facet[]> {
  const { data, error } = await supabase.rpc('get_document_search_facets', {
    p_brand_id: brandId,
  });

  if (error) {
    console.error('Document facets error:', error);
    return [];
  }

  return (data || []).map((item: { facet_type: string; facet_value: string; count: number }) => ({
    type: item.facet_type,
    value: item.facet_value,
    count: Number(item.count),
  }));
}

async function getAssetFacets(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandId: string
): Promise<Facet[]> {
  const { data, error } = await supabase.rpc('get_asset_search_facets', {
    p_brand_id: brandId,
  });

  if (error) {
    console.error('Asset facets error:', error);
    return [];
  }

  return (data || []).map((item: { facet_type: string; facet_value: string; count: number }) => ({
    type: item.facet_type,
    value: item.facet_value,
    count: Number(item.count),
  }));
}

// ===========================================
// "More Like This" Search
// ===========================================

interface SimilarChunkResult {
  id: string;
  type: 'document';
  documentId: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

async function findSimilarChunks(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  chunkId: string,
  brandId: string,
  limit: number = 5,
  excludeSameDocument: boolean = true
): Promise<SimilarChunkResult[]> {
  const { data, error } = await supabase.rpc('find_similar_chunks', {
    p_chunk_id: chunkId,
    p_brand_id: brandId,
    match_count: limit,
    p_exclude_same_document: excludeSameDocument,
  });

  if (error) {
    console.error('Similar chunks error:', error);
    return [];
  }

  return (data || []).map((item: {
    id: string;
    document_id: string;
    content: string;
    similarity: number;
    document_title: string;
    document_category: string;
  }) => ({
    id: item.id,
    type: 'document' as const,
    documentId: item.document_id,
    title: item.document_title,
    category: item.document_category,
    content: item.content,
    similarity: item.similarity,
  }));
}

// ===========================================
// API Route Handler
// ===========================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SearchRequest = await req.json();
    const {
      query,
      types = ['chats', 'assets', 'documents'],
      limit = 10,
      threshold = 0.3, // Lowered for text-embedding-3-large compatibility
      searchMode = 'hybrid',
      semanticWeight = 0.7,
      // Re-ranking options - default to enabled if Cohere is available
      rerank = isCohereAvailable(),
      rerankModel = 'rerank-v3.5',
      diversity = true,
      diversityLambda = 0.7,
      // Metadata filtering
      filters,
      similarTo,
      includeFacets = false,
    } = body;

    // Determine candidate multiplier for re-ranking
    const candidateMultiplier = rerank ? 3 : 1;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // Short queries (< 3 chars) don't benefit much from semantic search
    if (trimmedQuery.length < 3 && !similarTo) {
      return NextResponse.json({
        results: [],
        query: trimmedQuery,
        timing: { embedding: 0, search: 0, total: Date.now() - startTime },
      });
    }

    // Handle "similar to" requests (no embedding needed)
    if (similarTo) {
      const supabase = getSupabaseAdmin();
      let brandId: string;
      try {
        brandId = await getDefaultBrandId(supabase);
      } catch {
        return NextResponse.json({ error: 'Failed to find brand' }, { status: 500 });
      }

      const searchStart = Date.now();
      const similarResults = await findSimilarChunks(supabase, similarTo, brandId, limit);
      const searchTime = Date.now() - searchStart;

      return NextResponse.json({
        results: similarResults,
        query: `similar:${similarTo}`,
        timing: {
          embedding: 0,
          search: searchTime,
          total: Date.now() - startTime,
        },
      });
    }

    // Generate embedding for query
    const embeddingStart = Date.now();
    let queryEmbedding: number[];
    
    try {
      queryEmbedding = await generateEmbedding(trimmedQuery);
    } catch (error) {
      console.error('Embedding generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate query embedding' },
        { status: 500 }
      );
    }
    
    const embeddingTime = Date.now() - embeddingStart;

    // Initialize Supabase client
    const supabase = getSupabaseAdmin();
    
    // Get brand ID for asset/document searches
    let brandId: string;
    try {
      brandId = await getDefaultBrandId(supabase);
    } catch (error) {
      console.error('Brand lookup error:', error);
      return NextResponse.json(
        { error: 'Failed to find brand' },
        { status: 500 }
      );
    }

    // Run searches in parallel - retrieve more candidates if re-ranking
    const searchStart = Date.now();
    const candidateLimit = limit * candidateMultiplier;
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (types.includes('chats')) {
      searchPromises.push(searchChats(supabase, queryEmbedding, threshold, candidateLimit));
    }
    if (types.includes('assets')) {
      const assetFilters: AssetSearchFilters | undefined = filters ? {
        categories: filters.categories,
        variants: filters.variants,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        excludeIds: filters.excludeIds,
      } : undefined;
      searchPromises.push(searchAssets(supabase, brandId, trimmedQuery, queryEmbedding, threshold, candidateLimit, searchMode, semanticWeight, assetFilters));
    }
    if (types.includes('documents')) {
      const docFilters: DocumentSearchFilters | undefined = filters ? {
        categories: filters.categories,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        excludeIds: filters.excludeIds,
        documentIds: filters.documentIds,
      } : undefined;
      searchPromises.push(searchDocuments(supabase, brandId, trimmedQuery, queryEmbedding, threshold, candidateLimit, searchMode, semanticWeight, docFilters));
    }

    const searchResults = await Promise.all(searchPromises);
    const searchTime = Date.now() - searchStart;

    // Combine initial results
    let allResults = searchResults
      .flat()
      .sort((a, b) => b.similarity - a.similarity);

    const candidatesRetrieved = allResults.length;
    let rerankTime = 0;
    let wasReranked = false;
    let diversityApplied = false;

    // Apply re-ranking pipeline if enabled and we have results
    if (rerank && allResults.length > 0) {
      const rerankStart = Date.now();

      // Convert to reranker format
      const candidates: RerankerSearchResult[] = allResults.map((r) => ({
        id: r.id,
        content: 'content' in r ? r.content : ('description' in r ? r.description : ''),
        similarity: r.similarity,
        rrfScore: 'rrfScore' in r ? r.rrfScore : undefined,
        matchType: 'matchType' in r ? r.matchType : undefined,
        // Preserve all original fields
        ...r,
      }));

      try {
        const rankedResults = await rerankPipeline(trimmedQuery, candidates, {
          topK: limit,
          model: rerankModel,
          applyDiversity: diversity,
          diversityLambda,
        });

        // Map ranked results back to search result format with relevance scores
        allResults = rankedResults.map((ranked) => {
          // Find original result and merge with ranking info
          const original = allResults.find((r) => r.id === ranked.id);
          if (original) {
            return {
              ...original,
              similarity: ranked.relevanceScore, // Use Cohere relevance as primary score
              relevanceScore: ranked.relevanceScore,
              diversityScore: ranked.diversityScore,
              originalRank: ranked.originalRank,
            } as SearchResult;
          }
          return original as SearchResult;
        }).filter(Boolean);

        wasReranked = true;
        diversityApplied = diversity;
      } catch (error) {
        console.error('Re-ranking failed, using original results:', error);
        // Fall back to original sorted results
        allResults = allResults.slice(0, limit);
      }

      rerankTime = Date.now() - rerankStart;
    } else {
      // No re-ranking, just take top results
      allResults = allResults.slice(0, limit * 2); // Return more for client-side grouping
    }

    // Optionally fetch facets
    let facets: { documents: Facet[]; assets: Facet[] } | undefined;
    if (includeFacets) {
      const [docFacets, assetFacets] = await Promise.all([
        types.includes('documents') ? getDocumentFacets(supabase, brandId) : Promise.resolve([]),
        types.includes('assets') ? getAssetFacets(supabase, brandId) : Promise.resolve([]),
      ]);
      facets = {
        documents: docFacets,
        assets: assetFacets,
      };
    }

    const response: SearchResponse = {
      results: allResults,
      query: trimmedQuery,
      timing: {
        embedding: embeddingTime,
        search: searchTime,
        ...(rerankTime > 0 && { rerank: rerankTime }),
        total: Date.now() - startTime,
      },
      meta: {
        reranked: wasReranked,
        diversityApplied,
        candidatesRetrieved,
      },
      ...(facets && { facets }),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for simple queries
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const types = searchParams.get('types')?.split(',') as ('chats' | 'assets' | 'documents')[] | undefined;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const threshold = parseFloat(searchParams.get('threshold') || '0.5');

  // Create a POST request with the same parameters
  const postReq = new NextRequest(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, types, limit, threshold }),
  });

  return POST(postReq);
}

