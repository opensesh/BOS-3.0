/**
 * MCP Tools for Brand Operating System
 *
 * These tools provide access to brand knowledge, colors, assets, guidelines,
 * design tokens, voice/tone, and typography for external AI clients
 * via the Model Context Protocol.
 */

import { createClient } from '@supabase/supabase-js';
import tokens from '@/lib/brand-styles/tokens.json';
import {
  getBaseUrl,
  getAppUrls,
  getBundleUrl,
  getDesignTokenFileUrls,
} from './constants';

// ============================================
// Types
// ============================================

export interface BrandContext {
  brandId: string;
  configId: string;
}

/** Standard MCP tool response format with summary and usage hints */
export interface McpToolResponse<T = unknown> {
  summary: string;
  data: T;
  usage_hint?: string;
  related_tools?: string[];
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
// Helpers
// ============================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Storage not configured');
  }

  return createClient(url, serviceKey);
}

/**
 * Generate a branded download URL for an asset (hides Supabase infrastructure).
 * If the storage path is already a full URL (e.g., legacy uploadthing URLs),
 * return it directly to maintain backwards compatibility.
 */
function getBrandedAssetUrl(storagePath: string, bucket: 'brand-assets' | 'brand-guidelines' = 'brand-assets'): string {
  // If it's already a full URL, return it directly (legacy uploadthing support)
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  const base = getBaseUrl();
  const bucketParam = bucket === 'brand-guidelines' ? '?bucket=brand-guidelines' : '';
  return `${base}/api/brand/assets/download/${storagePath}${bucketParam}`;
}

/**
 * Sanitize error messages to hide internal details from consumers.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Strip Supabase/Postgres internals
    if (msg.includes('supabase') || msg.includes('postgres') || msg.includes('relation')) {
      return 'A database error occurred. Please try again.';
    }
    // Strip OpenAI internals
    if (msg.includes('openai') || msg.includes('api.openai')) {
      return 'Search service temporarily unavailable. Please try again.';
    }
    // Strip config errors
    if (msg.includes('configuration') || msg.includes('API key')) {
      return 'Service configuration error. Please contact the brand administrator.';
    }
    // Return safe subset of message (strip anything after a colon that might be SQL/internal)
    const safePart = msg.split(':')[0];
    return safePart.length > 100 ? safePart.slice(0, 100) + '...' : safePart;
  }
  return 'An unexpected error occurred. Please try again.';
}

// ============================================
// Embedding Helper
// ============================================

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('Search service not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate query embedding');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ============================================
// Existing Tool Implementations (Enhanced)
// ============================================

/**
 * Search brand knowledge base using semantic similarity
 */
export async function searchBrandKnowledge(
  brandId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<McpToolResponse> {
  const { query, category = 'all', limit = 5 } = params;
  const effectiveLimit = Math.min(limit, 20);

  const supabase = getSupabaseAdmin();
  const queryEmbedding = await generateQueryEmbedding(query);

  const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    match_threshold: 0.5,
    match_count: effectiveLimit,
  });

  if (error) {
    throw new Error(`Search failed`);
  }

  let results = (chunks || []) as DocumentChunk[];
  if (category !== 'all') {
    results = results.filter((c) => c.document_category === category);
  }

  const mappedResults = results.map((chunk) => ({
    content: chunk.content,
    document: chunk.document_title,
    category: chunk.document_category,
    section: chunk.heading_hierarchy?.join(' > ') || '',
    relevance: Math.round(chunk.similarity * 100) / 100,
  }));

  const topDocs = [...new Set(mappedResults.slice(0, 3).map(r => r.document))];

  return {
    summary: `Found ${mappedResults.length} result(s) for "${query}"${category !== 'all' ? ` in ${category}` : ''}. Top sources: ${topDocs.join(', ') || 'none'}.`,
    data: {
      query,
      results: mappedResults,
      total: mappedResults.length,
    },
    appUrls: getAppUrls(['brandHub', 'guidelines']),
    usage_hint: 'Use these excerpts as context when writing content or answering brand questions. The content field contains the most relevant passage. Visit appUrls.brandHub for full brand documentation.',
    related_tools: ['get_brand_voice', 'get_brand_context'],
  };
}

/**
 * Get brand color palette with optional filtering
 */
export async function getBrandColors(
  brandId: string,
  params: { group?: string; include_guidelines?: boolean }
): Promise<McpToolResponse> {
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
    throw new Error('Failed to fetch colors');
  }

  const mappedColors = ((colors || []) as BrandColor[]).map((color) => ({
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
  }));

  const brandColors = mappedColors.filter(c => c.group === 'brand');
  const colorSummary = brandColors.map(c => `${c.name} (${c.hex})`).join(', ');

  return {
    summary: `${mappedColors.length} color(s) retrieved${group !== 'all' ? ` from ${group} group` : ''}. Core brand palette: ${colorSummary || 'see data'}.`,
    data: {
      colors: mappedColors,
      total: mappedColors.length,
    },
    appUrls: getAppUrls(['colors', 'designTokens', 'brandHub']),
    usage_hint: 'Charcoal (#191919) for dark backgrounds/text. Vanilla (#FFFAEE) for light backgrounds. Aperol (#FE5102) ONLY for CTAs and badges — max 10% of any composition. Never use Aperol for borders. Visit appUrls.colors to see colors in the BOS interface.',
    related_tools: ['get_design_tokens', 'get_brand_context'],
  };
}

/**
 * Get brand assets with optional filtering
 */
export async function getBrandAssets(
  brandId: string,
  params: { category?: string; variant?: string; limit?: number }
): Promise<McpToolResponse> {
  const { category = 'all', variant, limit = 20 } = params;
  const effectiveLimit = Math.min(limit, 100);
  const supabase = getSupabaseAdmin();

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
    throw new Error('Failed to fetch assets');
  }

  const mappedAssets = ((assets || []) as BrandAsset[]).map((asset) => ({
    id: asset.id,
    name: asset.name,
    filename: asset.filename,
    description: asset.description,
    category: asset.category,
    variant: asset.variant,
    url: getBrandedAssetUrl(asset.storage_path),
    mimeType: asset.mime_type,
    metadata: asset.metadata,
  }));

  const categories = [...new Set(mappedAssets.map(a => a.category))];

  return {
    summary: `${mappedAssets.length} asset(s) found${category !== 'all' ? ` in ${category}` : ''} (categories: ${categories.join(', ')}).`,
    data: {
      assets: mappedAssets,
      total: mappedAssets.length,
    },
    appUrls: getAppUrls(['logos', 'brandHub', 'artDirection']),
    usage_hint: 'URLs are direct download links from the Brand Operating System. Use the variant field to choose appropriate versions (light/dark/mono/glass). Visit appUrls.logos to manage logo assets in BOS.',
    related_tools: ['search_brand_assets', 'get_brand_guidelines'],
  };
}

/**
 * Get brand guidelines with optional filtering
 */
export async function getBrandGuidelines(
  brandId: string,
  params: { slug?: string; category?: string }
): Promise<McpToolResponse> {
  const { slug, category } = params;
  const supabase = getSupabaseAdmin();

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
    throw new Error('Failed to fetch guidelines');
  }

  const mappedGuidelines = ((guidelines || []) as BrandGuideline[]).map((guide) => ({
    id: guide.id,
    title: guide.title,
    slug: guide.slug,
    type: guide.guideline_type,
    // Proxy URL takes precedence if storage_path exists (hides infrastructure)
    url: guide.storage_path
      ? getBrandedAssetUrl(guide.storage_path, 'brand-guidelines')
      : guide.url || null,
    embedUrl: guide.embed_url,
    description: guide.description,
    category: guide.category,
    thumbnail: guide.thumbnail_url,
    isPrimary: guide.is_primary,
  }));

  const titles = mappedGuidelines.map(g => g.title).join(', ');

  return {
    summary: `${mappedGuidelines.length} guideline(s) found: ${titles || 'none'}.`,
    data: {
      guidelines: mappedGuidelines,
      total: mappedGuidelines.length,
    },
    appUrls: getAppUrls(['guidelines', 'brandHub', 'artDirection']),
    usage_hint: 'Guidelines provide comprehensive reference documents. Use search_brand_knowledge for quick answers, or these for deep dives into specific topics. Visit appUrls.guidelines to browse all guidelines in BOS.',
    related_tools: ['search_brand_knowledge', 'get_brand_context'],
  };
}

/**
 * Semantic search for brand assets
 */
export async function searchBrandAssets(
  brandId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<McpToolResponse> {
  const { query, category, limit = 10 } = params;
  const effectiveLimit = Math.min(limit, 50);
  const supabase = getSupabaseAdmin();

  const queryEmbedding = await generateQueryEmbedding(query);

  const { data: assets, error } = await supabase.rpc('match_assets', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    p_category: category || null,
    match_threshold: 0.5,
    match_count: effectiveLimit,
  });

  if (error) {
    throw new Error('Asset search failed');
  }

  const mappedResults = ((assets || []) as BrandAsset[]).map((asset) => ({
    id: asset.id,
    name: asset.name,
    filename: asset.filename,
    description: asset.description,
    category: asset.category,
    variant: asset.variant,
    url: getBrandedAssetUrl(asset.storage_path),
    mimeType: asset.mime_type,
    relevance: Math.round((asset.similarity || 0) * 100) / 100,
  }));

  const topResult = mappedResults[0];

  return {
    summary: `${mappedResults.length} asset(s) matched "${query}". ${topResult ? `Best match: ${topResult.name} (${Math.round(topResult.relevance * 100)}% relevance).` : 'No strong matches.'}`,
    data: {
      query,
      results: mappedResults,
      total: mappedResults.length,
    },
    appUrls: getAppUrls(['logos', 'brandHub', 'artDirection']),
    usage_hint: 'Results are ranked by visual/semantic relevance. Higher relevance scores indicate stronger matches to your description. Visit appUrls.logos to browse all assets in BOS.',
    related_tools: ['get_brand_assets', 'get_brand_guidelines'],
  };
}

// ============================================
// New Tool Implementations
// ============================================

/**
 * Get brand context primer for LLM warm-start
 */
export async function getBrandContext(
  brandId: string
): Promise<McpToolResponse> {
  const supabase = getSupabaseAdmin();

  // Fetch core brand colors
  const { data: colors } = await supabase
    .from('brand_colors')
    .select('name, hex_value, color_role, usage_guidelines')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .eq('color_group', 'brand')
    .order('sort_order');

  const brandColors = (colors || []) as Array<{ name: string; hex_value: string; color_role: string; usage_guidelines: string }>;

  // Fetch a voice-related knowledge chunk for quick brand personality
  let voiceTraits: string[] = [];
  try {
    const queryEmbedding = await generateQueryEmbedding('brand voice personality tone traits');
    const { data: chunks } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      p_brand_id: brandId,
      match_threshold: 0.5,
      match_count: 1,
    });
    if (chunks && chunks.length > 0) {
      // Extract key adjectives from voice content
      const content = (chunks[0] as DocumentChunk).content;
      voiceTraits = extractVoiceTraits(content);
    }
  } catch {
    // Voice traits are optional — continue without them
  }

  const colorInfo = brandColors.map(c => ({
    name: c.name,
    hex: c.hex_value,
    role: c.color_role,
    usage: c.usage_guidelines,
  }));

  const context = {
    brand: {
      name: 'Open Session',
      tagline: 'Your brand, amplified by intelligence',
      mission: 'AI-powered brand management that makes every touchpoint consistent, intentional, and on-brand.',
    },
    voice: {
      traits: voiceTraits.length > 0 ? voiceTraits : ['smart', 'warm', 'confident', 'technical', 'accessible', 'humble'],
      anti_traits: ['smug', 'clinical', 'corporate', 'generic', 'over-enthusiastic'],
      posture: 'Steward, not advisor — use "we" and "our" when discussing brand decisions.',
    },
    colors: colorInfo,
    rules: [
      'Aperol (#FE5102) for CTAs and badges ONLY — max 10% of any composition.',
      'Never use brand colors for borders.',
      'Avoid pure #000 or #FFF — use warm neutrals (Charcoal/Vanilla).',
      'Never use the Sparkles icon (hard ban, no exceptions).',
      'Offbit (accent font) — max 2 instances per viewport.',
    ],
    typography: {
      display: tokens.typography.fontFamilies.display.value,
      body: tokens.typography.fontFamilies.sans.value,
      accent: tokens.typography.fontFamilies.mono.value,
    },
  };

  return {
    summary: `Brand primer for Open Session: ${brandColors.length} core colors (${brandColors.map(c => c.name).join(', ')}), voice is ${context.voice.traits.slice(0, 4).join(', ')}. Key rule: Aperol accent max 10%, warm neutrals only.`,
    data: context,
    appUrls: getAppUrls(['brandHub', 'colors', 'guidelines', 'voice']),
    usage_hint: 'Use this as your brand personality card. Embody the voice traits in all content. Reference colors and rules when making design decisions. Visit appUrls.brandHub for the full brand experience.',
    related_tools: ['get_brand_voice', 'get_brand_colors', 'get_design_tokens'],
  };
}

/**
 * Get design tokens in specified format
 */
export async function getDesignTokens(
  _brandId: string,
  params: { format?: string; scope?: string }
): Promise<McpToolResponse> {
  const { format = 'json', scope = 'all' } = params;

  // Build scoped token data
  const scopes = scope === 'all'
    ? ['colors', 'typography', 'spacing', 'shadows', 'animations', 'borderRadius']
    : scope.split(',').map(s => s.trim());

  const scopedData: Record<string, unknown> = {};

  if (scopes.includes('colors')) {
    scopedData.colors = tokens.colors;
  }
  if (scopes.includes('typography')) {
    scopedData.typography = tokens.typography;
  }
  if (scopes.includes('spacing')) {
    scopedData.spacing = tokens.spacing;
  }
  if (scopes.includes('shadows')) {
    scopedData.shadows = tokens.shadows;
  }
  if (scopes.includes('animations')) {
    scopedData.animations = tokens.animations;
  }
  if (scopes.includes('borderRadius')) {
    scopedData.borderRadius = tokens.borderRadius;
  }
  if (scopes.includes('breakpoints')) {
    scopedData.breakpoints = tokens.breakpoints;
  }
  if (scopes.includes('accessibility')) {
    scopedData.accessibility = tokens.accessibility;
  }

  // Format output
  let formatted: string | Record<string, unknown>;
  switch (format) {
    case 'css':
      formatted = formatTokensAsCss(scopedData);
      break;
    case 'scss':
      formatted = formatTokensAsScss(scopedData);
      break;
    case 'tailwind':
      formatted = formatTokensAsTailwind(scopedData);
      break;
    default:
      formatted = scopedData;
  }

  return {
    summary: `Design tokens exported as ${format} (scopes: ${scopes.join(', ')}). Includes ${Object.keys(scopedData).length} token categories. Download the complete bundle at bundleUrl.`,
    data: {
      format,
      scopes,
      tokens: formatted,
      bundleUrl: getBundleUrl(),
      bundleUrlWithFonts: getBundleUrl(true),
      individualFiles: getDesignTokenFileUrls(),
    },
    appUrls: getAppUrls(['designTokens', 'colors', 'fonts', 'brandHub']),
    usage_hint: format === 'json'
      ? 'Use these tokens directly in your design system configuration. Colors use hex values, spacing uses rem units. Download bundleUrl for all files as a ZIP, or use individualFiles for specific downloads.'
      : `Copy this ${format.toUpperCase()} output directly into your project. All values are production-ready. Download bundleUrl for the complete package including CSS and Tailwind config.`,
    related_tools: ['get_brand_colors', 'get_typography_system', 'get_brand_context'],
  };
}

/**
 * Get structured voice and tone guidance
 */
export async function getBrandVoice(
  brandId: string,
  params: { platform?: string; content_type?: string }
): Promise<McpToolResponse> {
  const { platform, content_type } = params;

  // Search for voice-specific content
  const searchQuery = [
    'brand voice tone personality',
    platform && `${platform} platform`,
    content_type && `${content_type} writing`,
  ].filter(Boolean).join(' ');

  const supabase = getSupabaseAdmin();
  const queryEmbedding = await generateQueryEmbedding(searchQuery);

  const { data: chunks } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    match_threshold: 0.45,
    match_count: 5,
  });

  const results = (chunks || []) as DocumentChunk[];

  // Build structured voice guidance
  const voiceContent = results.map(c => c.content).join('\n\n');
  const traits = extractVoiceTraits(voiceContent);

  const voice = {
    traits: traits.length > 0 ? traits : ['smart', 'warm', 'confident', 'technical', 'accessible'],
    anti_traits: ['smug', 'clinical', 'corporate', 'generic', 'salesy', 'over-enthusiastic'],
    posture: 'Steward, not advisor — speak as part of the brand, not about it.',
    principles: [
      'Use "we" and "our" naturally when discussing brand decisions.',
      'Be helpful and informative while embodying brand personality.',
      'Smart but not smug, technical but accessible, confident but humble.',
      'Integrate brand knowledge seamlessly — no clinical prefixes like "According to guidelines...".',
    ],
    ...(platform && {
      platform_notes: getPlatformGuidance(platform),
    }),
    ...(content_type && {
      content_type_notes: getContentTypeGuidance(content_type),
    }),
    source_excerpts: results.slice(0, 3).map(r => ({
      content: r.content.slice(0, 300),
      source: r.document_title,
      section: r.heading_hierarchy?.join(' > ') || '',
    })),
  };

  return {
    summary: `Brand voice guidance${platform ? ` for ${platform}` : ''}${content_type ? ` (${content_type} content)` : ''}: ${traits.slice(0, 4).join(', ')}. Posture: steward, not advisor.`,
    data: voice,
    appUrls: getAppUrls(['voice', 'brandHub', 'guidelines']),
    usage_hint: 'Apply these voice traits to all content you create. Use the principles as a checklist before finalizing copy. Source excerpts provide additional context from brand documentation. Visit appUrls.voice for full voice guidance.',
    related_tools: ['get_writing_style', 'search_brand_knowledge', 'get_brand_context'],
  };
}

/**
 * Get writing style guidance for specific content formats
 */
export async function getWritingStyle(
  brandId: string,
  params: { style_type?: string }
): Promise<McpToolResponse> {
  const { style_type = 'general' } = params;

  const searchQuery = `writing style guide ${style_type} format structure`;
  const supabase = getSupabaseAdmin();
  const queryEmbedding = await generateQueryEmbedding(searchQuery);

  const { data: chunks } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    match_threshold: 0.45,
    match_count: 8,
  });

  const results = (chunks || []) as DocumentChunk[];

  // Filter to writing-style documents when available
  const writingResults = results.filter(r =>
    r.document_category === 'writing-styles' ||
    r.document_title.toLowerCase().includes('writing') ||
    r.document_title.toLowerCase().includes(style_type.toLowerCase())
  );

  const finalResults = writingResults.length > 0 ? writingResults : results;

  const styleGuide = {
    style_type,
    excerpts: finalResults.map(r => ({
      content: r.content,
      source: r.document_title,
      section: r.heading_hierarchy?.join(' > ') || '',
      relevance: Math.round(r.similarity * 100) / 100,
    })),
    general_rules: {
      oxford_comma: true,
      sentence_case: 'Use sentence case for headings',
      contractions: 'Allowed — keeps tone conversational',
      numbers: 'Spell out one through nine, use digits for 10+',
      em_dashes: 'Use freely for parenthetical emphasis',
    },
    total_excerpts: finalResults.length,
  };

  return {
    summary: `Writing style guidance for "${style_type}": ${finalResults.length} relevant excerpt(s) from brand documentation.`,
    data: styleGuide,
    appUrls: getAppUrls(['voice', 'brandHub', 'guidelines']),
    usage_hint: 'Use the excerpts as reference when crafting content. The general_rules apply to all written content regardless of format. Visit appUrls.voice for full voice and style guidance.',
    related_tools: ['get_brand_voice', 'search_brand_knowledge'],
  };
}

/**
 * Get typography system with font families, weights, and hierarchy
 */
export async function getTypographySystem(
  _brandId: string,
  params: { include_font_files?: boolean }
): Promise<McpToolResponse> {
  const { include_font_files = false } = params;

  const typography = {
    fontFamilies: {
      display: {
        family: tokens.typography.fontFamilies.display.value,
        fallback: tokens.typography.fontFamilies.display.fallback,
        usage: tokens.typography.fontFamilies.display.description,
      },
      body: {
        family: tokens.typography.fontFamilies.sans.value,
        fallback: tokens.typography.fontFamilies.sans.fallback,
        usage: tokens.typography.fontFamilies.sans.description,
      },
      accent: {
        family: tokens.typography.fontFamilies.mono.value,
        fallback: tokens.typography.fontFamilies.mono.fallback,
        usage: tokens.typography.fontFamilies.mono.description,
        constraint: 'Maximum 2 instances per viewport',
      },
    },
    fontWeights: tokens.typography.fontWeights,
    hierarchy: tokens.typography.hierarchy,
    ...(include_font_files && {
      fontFiles: Object.entries(tokens.typography.fontFiles).map(([key, file]) => ({
        key,
        family: file.family,
        weight: file.weight,
        style: file.style,
        url: getBrandedAssetUrl(file.file),
      })),
    }),
    rules: [
      'Display font (Neue Haas Grotesk Display Pro) for all headings h1-h4.',
      'Body font (Neue Haas Grotesk Display Pro) for paragraphs and UI text.',
      'Accent font (Offbit) only for h5, h6, and special elements — max 2 per viewport.',
      'No separate code/monospace font — we use Neue Haas Grotesk consistently.',
      'Font weights: 400 (regular), 500 (medium), 700 (bold) only.',
    ],
  };

  return {
    summary: `Typography system: ${tokens.typography.fontFamilies.display.value} (display/body), ${tokens.typography.fontFamilies.mono.value} (accent, max 2/viewport). 3 weights: 400, 500, 700.`,
    data: typography,
    appUrls: getAppUrls(['fonts', 'designTokens', 'brandHub']),
    usage_hint: 'Apply the hierarchy directly to your heading elements. Use the font stack with fallbacks for CSS. Remember: Offbit accent font is strictly limited to 2 instances per viewport. Visit appUrls.fonts for typography documentation.',
    related_tools: ['get_design_tokens', 'get_brand_context'],
  };
}

// ============================================
// Helper Functions
// ============================================

function extractVoiceTraits(content: string): string[] {
  const traitPatterns = [
    'smart', 'warm', 'confident', 'technical', 'accessible',
    'humble', 'direct', 'intentional', 'clear', 'conversational',
    'authentic', 'thoughtful', 'precise', 'human', 'approachable',
  ];
  return traitPatterns.filter(trait =>
    content.toLowerCase().includes(trait)
  );
}

function getPlatformGuidance(platform: string): string {
  const guidance: Record<string, string> = {
    linkedin: 'Professional but not stiff. Lead with insight, not promotion. Use short paragraphs. End with a thought-provoking question or clear CTA.',
    twitter: 'Concise and punchy. One idea per post. Use threads for depth. Avoid hashtag spam — 1-2 max.',
    instagram: 'Visual-first. Captions should complement, not compete with imagery. Use line breaks for readability.',
    email: 'Clear subject lines. Front-load value. Keep paragraphs to 2-3 sentences. One CTA per email.',
    blog: 'Depth and nuance welcome. Use headers for scannability. Include actionable takeaways.',
    website: 'Scannable, benefit-focused. Progressive disclosure — headline → subhead → detail. Every word earns its place.',
  };
  return guidance[platform.toLowerCase()] || `Apply core voice traits to ${platform} content with platform-appropriate length and format.`;
}

function getContentTypeGuidance(contentType: string): string {
  const guidance: Record<string, string> = {
    announcement: 'Lead with what matters to the audience, not to us. Be excited but grounded. Show impact.',
    tutorial: 'Step-by-step clarity. Anticipate questions. Use "you" language. Include expected outcomes.',
    thought_leadership: 'Take a stance. Support with evidence. Be opinionated but open to dialogue.',
    product: 'Benefits over features. Show the transformation. Use specifics, not superlatives.',
    internal: 'Be transparent and direct. Acknowledge context. Clear next steps.',
    creative: 'More expressive latitude. Play with rhythm and structure. Stay authentic to voice.',
  };
  return guidance[contentType.toLowerCase()] || `Apply core voice traits to ${contentType} content with appropriate formality and depth.`;
}

function formatTokensAsCss(data: Record<string, unknown>): string {
  const lines: string[] = [':root {'];

  if (data.colors && typeof data.colors === 'object') {
    const colors = data.colors as Record<string, Record<string, { value: string }>>;
    lines.push('  /* Brand Colors */');
    for (const [group, groupColors] of Object.entries(colors)) {
      for (const [name, color] of Object.entries(groupColors)) {
        if (typeof color === 'object' && 'value' in color) {
          lines.push(`  --color-${group}-${name}: ${color.value};`);
        }
      }
    }
  }

  if (data.spacing && typeof data.spacing === 'object') {
    const spacing = data.spacing as { scale: Record<string, string> };
    lines.push('  /* Spacing */');
    for (const [key, value] of Object.entries(spacing.scale || {})) {
      lines.push(`  --space-${key}: ${value};`);
    }
  }

  if (data.borderRadius && typeof data.borderRadius === 'object') {
    lines.push('  /* Border Radius */');
    for (const [key, value] of Object.entries(data.borderRadius as Record<string, string>)) {
      lines.push(`  --radius-${key}: ${value};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function formatTokensAsScss(data: Record<string, unknown>): string {
  const lines: string[] = [];

  if (data.colors && typeof data.colors === 'object') {
    const colors = data.colors as Record<string, Record<string, { value: string }>>;
    lines.push('// Brand Colors');
    for (const [group, groupColors] of Object.entries(colors)) {
      for (const [name, color] of Object.entries(groupColors)) {
        if (typeof color === 'object' && 'value' in color) {
          lines.push(`$color-${group}-${name}: ${color.value};`);
        }
      }
    }
  }

  if (data.spacing && typeof data.spacing === 'object') {
    const spacing = data.spacing as { scale: Record<string, string> };
    lines.push('// Spacing');
    for (const [key, value] of Object.entries(spacing.scale || {})) {
      lines.push(`$space-${key}: ${value};`);
    }
  }

  return lines.join('\n');
}

function formatTokensAsTailwind(data: Record<string, unknown>): string {
  const config: Record<string, unknown> = {};

  if (data.colors && typeof data.colors === 'object') {
    const colors = data.colors as Record<string, Record<string, { value: string }>>;
    const tailwindColors: Record<string, string> = {};
    for (const [group, groupColors] of Object.entries(colors)) {
      for (const [name, color] of Object.entries(groupColors)) {
        if (typeof color === 'object' && 'value' in color) {
          tailwindColors[`${group}-${name}`] = color.value;
        }
      }
    }
    config.colors = tailwindColors;
  }

  if (data.typography && typeof data.typography === 'object') {
    const typo = data.typography as { fontFamilies: Record<string, { value: string; fallback: string[] }> };
    const fontFamily: Record<string, string[]> = {};
    for (const [key, font] of Object.entries(typo.fontFamilies || {})) {
      fontFamily[key] = [font.value, ...(font.fallback || [])];
    }
    config.fontFamily = fontFamily;
  }

  if (data.spacing && typeof data.spacing === 'object') {
    const spacing = data.spacing as { scale: Record<string, string> };
    config.spacing = spacing.scale;
  }

  if (data.borderRadius && typeof data.borderRadius === 'object') {
    config.borderRadius = data.borderRadius;
  }

  return `// tailwind.config.js theme extension
module.exports = {
  theme: {
    extend: ${JSON.stringify(config, null, 6).replace(/^/gm, '    ').trim()},
  },
};`;
}
