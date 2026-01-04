/**
 * Embedding Service
 * 
 * Handles OpenAI embeddings and LLM-based text enrichment.
 * Uses text-embedding-ada-002 (1536 dimensions) to match pgvector schema.
 */

import { getAnthropicClient } from '../ai/providers';

// OpenAI embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 100; // OpenAI allows up to 2048, but 100 is safer
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get the OpenAI API key from environment
 * Handles Vercel CLI export format which may include quotes
 */
function getOpenAIApiKey(): string {
  let apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  // Strip quotes and trailing commas (Vercel CLI export format)
  apiKey = apiKey.replace(/^["']|["'],?$/g, '').trim();
  return apiKey;
}

/**
 * Generate embedding for a single text
 * 
 * @param text - Text to embed
 * @returns 1536-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

/**
 * Generate embeddings for multiple texts (batched)
 * 
 * @param texts - Array of texts to embed
 * @returns Array of 1536-dimensional embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const apiKey = getOpenAIApiKey();
  const allEmbeddings: number[][] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    
    // Clean and truncate texts (OpenAI has token limits)
    const cleanedBatch = batch.map(text => 
      text
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000) // Rough character limit to stay under token limit
    );

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: cleanedBatch,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data: OpenAIEmbeddingResponse = await response.json();
    
    // Sort by index to maintain order
    const sortedData = data.data.sort((a, b) => a.index - b.index);
    const batchEmbeddings = sortedData.map(d => d.embedding);
    
    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}

/**
 * Generate a 2-3 sentence summary of content using Claude
 * 
 * @param content - Content to summarize
 * @returns Brief summary string
 */
export async function generateSummary(content: string): Promise<string> {
  const client = await getAnthropicClient();
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Summarize the following content in 2-3 sentences. Be concise and capture the key points:

${content.slice(0, 4000)}`,
      },
    ],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text || '';
}

/**
 * Enrich an asset description using LLM for better semantic search
 * 
 * @param asset - Asset information to enrich
 * @returns Enriched description optimized for embedding
 */
export async function enrichAssetDescription(asset: {
  name: string;
  filename: string;
  description: string;
  category: string;
  variant?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const client = await getAnthropicClient();
  
  // Build context from available asset info
  const context = [
    `Asset Name: ${asset.name}`,
    `Category: ${asset.category}`,
    `Filename: ${asset.filename}`,
    asset.variant ? `Variant: ${asset.variant}` : null,
    `Current Description: ${asset.description}`,
    asset.metadata ? `Metadata: ${JSON.stringify(asset.metadata)}` : null,
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are helping create searchable descriptions for brand assets. Based on the following asset information, write a rich, descriptive paragraph (2-4 sentences) that would help someone find this asset through semantic search.

Include:
- What the asset is and what it looks like
- When/where it should be used
- Any variants or special characteristics
- Related search terms someone might use

Asset Information:
${context}

Write ONLY the enriched description, no preamble:`,
      },
    ],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text || asset.description;
}

/**
 * Check if embeddings are properly configured
 */
export async function validateEmbeddingSetup(): Promise<{
  valid: boolean;
  openaiConfigured: boolean;
  anthropicConfigured: boolean;
  error?: string;
}> {
  const result = {
    valid: false,
    openaiConfigured: false,
    anthropicConfigured: false,
    error: undefined as string | undefined,
  };

  // Check OpenAI
  try {
    getOpenAIApiKey();
    result.openaiConfigured = true;
  } catch {
    result.error = 'OPENAI_API_KEY not configured';
    return result;
  }

  // Check Anthropic
  try {
    await getAnthropicClient();
    result.anthropicConfigured = true;
  } catch {
    result.error = 'ANTHROPIC_API_KEY not configured';
    return result;
  }

  result.valid = true;
  return result;
}

// Export constants for reference
export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
  maxBatchSize: MAX_BATCH_SIZE,
};

