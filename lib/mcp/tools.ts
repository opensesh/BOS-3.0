/**
 * MCP Tools for Brand Operating System
 * 
 * These tools provide access to brand knowledge, colors, assets, and guidelines
 * for external AI clients via the Model Context Protocol.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface BrandContext {
  brandId: string;
  configId: string;
}

interface BrandColor {
  name: string;
  slug: string;
  hex_value: string;
  rgb_value: string;
  color_group: string;
  color_role: string;
  text_color: string;
  description: string;
  usage_guidelines: string;
  css_variable_name: string;
}

interface BrandAsset {
  id: string;
  name: string;
  filename: string;
  description: string;
  category: string;
  variant: string;
  storage_path: string;
  mime_type: string;
  metadata: Record<string, unknown>;
  similarity?: number;
}

interface BrandGuideline {
  id: string;
  title: string;
  slug: string;
  guideline_type: string;
  url: string;
  embed_url: string;
  storage_path: string;
  description: string;
  category: string;
  thumbnail_url: string;
  is_primary: boolean;
}

interface DocumentChunk {
  content: string;
  document_title: string;
  document_category: string;
  heading_hierarchy: string[];
  similarity: number;
}

// ============================================
// Supabase Client
// ============================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

// ============================================
// Embedding Helper
// ============================================

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured for semantic search');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: query,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate query embedding');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ============================================
// Tool Implementations
// ============================================

/**
 * Search brand knowledge base using semantic similarity
 */
export async function searchBrandKnowledge(
  brandId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<{
  query: string;
  results: Array<{
    content: string;
    document: string;
    category: string;
    section: string;
    relevance: number;
  }>;
  total: number;
}> {
  const { query, category = 'all', limit = 5 } = params;
  const effectiveLimit = Math.min(limit, 20);

  const supabase = getSupabaseAdmin();
  const queryEmbedding = await generateQueryEmbedding(query);

  const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    match_threshold: 0.5, // Lowered for better recall
    match_count: effectiveLimit,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  let results = (chunks || []) as DocumentChunk[];
  if (category !== 'all') {
    results = results.filter((c) => c.document_category === category);
  }

  return {
    query,
    results: results.map((chunk) => ({
      content: chunk.content,
      document: chunk.document_title,
      category: chunk.document_category,
      section: chunk.heading_hierarchy?.join(' > ') || '',
      relevance: Math.round(chunk.similarity * 100) / 100,
    })),
    total: results.length,
  };
}

/**
 * Get brand color palette with optional filtering
 */
export async function getBrandColors(
  brandId: string,
  params: { group?: string; include_guidelines?: boolean }
): Promise<{
  colors: Array<{
    name: string;
    slug: string;
    hex: string;
    rgb: string;
    group: string;
    role: string;
    textColor: string;
    description?: string;
    usage?: string;
    cssVariable: string;
  }>;
  total: number;
}> {
  const { group = 'all', include_guidelines = true } = params;
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('brand_colors')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('sort_order');

  if (group !== 'all') {
    query = query.eq('color_group', group);
  }

  const { data: colors, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch colors: ${error.message}`);
  }

  return {
    colors: ((colors || []) as BrandColor[]).map((color) => ({
      name: color.name,
      slug: color.slug,
      hex: color.hex_value,
      rgb: color.rgb_value,
      group: color.color_group,
      role: color.color_role,
      textColor: color.text_color,
      ...(include_guidelines && {
        description: color.description,
        usage: color.usage_guidelines,
      }),
      cssVariable: color.css_variable_name,
    })),
    total: colors?.length || 0,
  };
}

/**
 * Get brand assets with optional filtering
 */
export async function getBrandAssets(
  brandId: string,
  params: { category?: string; variant?: string; limit?: number }
): Promise<{
  assets: Array<{
    id: string;
    name: string;
    filename: string;
    description: string;
    category: string;
    variant: string;
    url: string;
    mimeType: string;
    metadata: Record<string, unknown>;
  }>;
  total: number;
}> {
  const { category = 'all', variant, limit = 20 } = params;
  const effectiveLimit = Math.min(limit, 100);
  const supabase = getSupabaseAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let query = supabase
    .from('brand_assets')
    .select('id, name, filename, description, category, variant, storage_path, mime_type, metadata')
    .eq('brand_id', brandId)
    .limit(effectiveLimit);

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (variant) {
    query = query.eq('variant', variant);
  }

  const { data: assets, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch assets: ${error.message}`);
  }

  return {
    assets: ((assets || []) as BrandAsset[]).map((asset) => ({
      id: asset.id,
      name: asset.name,
      filename: asset.filename,
      description: asset.description,
      category: asset.category,
      variant: asset.variant,
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.storage_path}`,
      mimeType: asset.mime_type,
      metadata: asset.metadata,
    })),
    total: assets?.length || 0,
  };
}

/**
 * Get brand guidelines with optional filtering
 */
export async function getBrandGuidelines(
  brandId: string,
  params: { slug?: string; category?: string }
): Promise<{
  guidelines: Array<{
    id: string;
    title: string;
    slug: string;
    type: string;
    url: string | null;
    embedUrl: string;
    description: string;
    category: string;
    thumbnail: string;
    isPrimary: boolean;
  }>;
  total: number;
}> {
  const { slug, category } = params;
  const supabase = getSupabaseAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let query = supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('sort_order');

  if (slug) {
    query = query.eq('slug', slug);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: guidelines, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch guidelines: ${error.message}`);
  }

  return {
    guidelines: ((guidelines || []) as BrandGuideline[]).map((guide) => ({
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      type: guide.guideline_type,
      url: guide.url || (guide.storage_path 
        ? `${supabaseUrl}/storage/v1/object/public/brand-guidelines/${guide.storage_path}`
        : null),
      embedUrl: guide.embed_url,
      description: guide.description,
      category: guide.category,
      thumbnail: guide.thumbnail_url,
      isPrimary: guide.is_primary,
    })),
    total: guidelines?.length || 0,
  };
}

/**
 * Semantic search for brand assets
 */
export async function searchBrandAssets(
  brandId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<{
  query: string;
  results: Array<{
    id: string;
    name: string;
    filename: string;
    description: string;
    category: string;
    variant: string;
    url: string;
    mimeType: string;
    relevance: number;
  }>;
  total: number;
}> {
  const { query, category, limit = 10 } = params;
  const effectiveLimit = Math.min(limit, 50);
  const supabase = getSupabaseAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const queryEmbedding = await generateQueryEmbedding(query);

  const { data: assets, error } = await supabase.rpc('match_assets', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    p_category: category || null,
    match_threshold: 0.5, // Lowered for better recall
    match_count: effectiveLimit,
  });

  if (error) {
    throw new Error(`Asset search failed: ${error.message}`);
  }

  return {
    query,
    results: ((assets || []) as BrandAsset[]).map((asset) => ({
      id: asset.id,
      name: asset.name,
      filename: asset.filename,
      description: asset.description,
      category: asset.category,
      variant: asset.variant,
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.storage_path}`,
      mimeType: asset.mime_type,
      relevance: Math.round((asset.similarity || 0) * 100) / 100,
    })),
    total: assets?.length || 0,
  };
}

