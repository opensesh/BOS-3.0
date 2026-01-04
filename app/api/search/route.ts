/**
 * Unified Semantic Search API
 * 
 * Provides semantic search across:
 * - Chat messages (via match_messages)
 * - Brand assets (via match_assets)  
 * - Brand documents (via match_document_chunks)
 * 
 * Uses OpenAI embeddings for query vectorization and
 * Supabase pgvector for similarity search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/bos/embedding-service';

// ===========================================
// Types
// ===========================================

interface SearchRequest {
  query: string;
  types?: ('chats' | 'assets' | 'documents')[];
  limit?: number;
  threshold?: number;
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
}

type SearchResult = ChatSearchResult | AssetSearchResult | DocumentSearchResult;

interface SearchResponse {
  results: SearchResult[];
  query: string;
  timing: {
    embedding: number;
    search: number;
    total: number;
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

async function searchAssets(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandId: string,
  queryEmbedding: number[],
  threshold: number,
  limit: number
): Promise<AssetSearchResult[]> {
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

async function searchDocuments(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandId: string,
  queryEmbedding: number[],
  threshold: number,
  limit: number
): Promise<DocumentSearchResult[]> {
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
      threshold = 0.5 
    } = body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // Short queries (< 3 chars) don't benefit much from semantic search
    if (trimmedQuery.length < 3) {
      return NextResponse.json({
        results: [],
        query: trimmedQuery,
        timing: { embedding: 0, search: 0, total: Date.now() - startTime },
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

    // Run searches in parallel
    const searchStart = Date.now();
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (types.includes('chats')) {
      searchPromises.push(searchChats(supabase, queryEmbedding, threshold, limit));
    }
    if (types.includes('assets')) {
      searchPromises.push(searchAssets(supabase, brandId, queryEmbedding, threshold, limit));
    }
    if (types.includes('documents')) {
      searchPromises.push(searchDocuments(supabase, brandId, queryEmbedding, threshold, limit));
    }

    const searchResults = await Promise.all(searchPromises);
    const searchTime = Date.now() - searchStart;

    // Combine and sort results by similarity
    const allResults = searchResults
      .flat()
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit * 2); // Return more results for client-side grouping

    const response: SearchResponse = {
      results: allResults,
      query: trimmedQuery,
      timing: {
        embedding: embeddingTime,
        search: searchTime,
        total: Date.now() - startTime,
      },
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

