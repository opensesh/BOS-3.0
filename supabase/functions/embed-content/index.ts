/**
 * Supabase Edge Function: embed-content
 * 
 * Processes the embedding queue, generating OpenAI embeddings for:
 * - brand_documents (with chunking)
 * - brand_assets
 * 
 * Triggered by:
 * - Direct HTTP call with queue_id
 * - Cron job for batch processing
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================
// Configuration
// ============================================

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-ada-002";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_CHUNK_TOKENS = 500;
const BATCH_SIZE = 10;

// ============================================
// Types
// ============================================

interface QueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: string;
  priority: number;
  attempts: number;
}

interface MarkdownChunk {
  heading: string;
  heading_hierarchy: string;
  content: string;
  token_count: number;
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ============================================
// Markdown Chunking (simplified for Edge)
// ============================================

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

function chunkMarkdown(content: string): MarkdownChunk[] {
  const lines = content.split('\n');
  const chunks: MarkdownChunk[] = [];
  
  let currentHeadings: string[] = [];
  let currentContent: string[] = [];
  let currentHeading = '';
  
  const flushChunk = () => {
    const text = currentContent.join('\n').trim();
    if (text.length > 0) {
      const hierarchy = currentHeadings.length > 0 
        ? currentHeadings.join(' > ')
        : '(intro)';
      
      chunks.push({
        heading: currentHeading || '(intro)',
        heading_hierarchy: hierarchy,
        content: text,
        token_count: estimateTokens(text),
      });
    }
    currentContent = [];
  };
  
  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    const h4Match = line.match(/^#### (.+)$/);
    
    if (h1Match) {
      flushChunk();
      currentHeadings = [h1Match[1]];
      currentHeading = h1Match[1];
    } else if (h2Match) {
      flushChunk();
      currentHeadings = currentHeadings.slice(0, 1).concat(h2Match[1]);
      currentHeading = h2Match[1];
    } else if (h3Match) {
      flushChunk();
      currentHeadings = currentHeadings.slice(0, 2).concat(h3Match[1]);
      currentHeading = h3Match[1];
    } else if (h4Match) {
      flushChunk();
      currentHeadings = currentHeadings.slice(0, 3).concat(h4Match[1]);
      currentHeading = h4Match[1];
    } else {
      currentContent.push(line);
      
      // Check if chunk is getting too large
      const currentText = currentContent.join('\n');
      if (estimateTokens(currentText) > MAX_CHUNK_TOKENS) {
        // Split at last paragraph break
        const lastBreak = currentText.lastIndexOf('\n\n');
        if (lastBreak > 0) {
          const firstPart = currentText.substring(0, lastBreak);
          const secondPart = currentText.substring(lastBreak + 2);
          
          currentContent = [firstPart];
          flushChunk();
          currentContent = [secondPart];
        }
      }
    }
  }
  
  flushChunk();
  return chunks;
}

// ============================================
// OpenAI Embedding
// ============================================

async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  
  const data: OpenAIEmbeddingResponse = await response.json();
  
  // Sort by index to maintain order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function generateSingleEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const embeddings = await generateEmbeddings([text], apiKey);
  return embeddings[0];
}

// ============================================
// Document Processing
// ============================================

async function processDocument(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  openaiKey: string
): Promise<{ chunks: number; tokens: number }> {
  // Fetch the document
  const { data: document, error: docError } = await supabase
    .from("brand_documents")
    .select("id, brand_id, content, title, category")
    .eq("id", documentId)
    .single();
  
  if (docError || !document) {
    throw new Error(`Document not found: ${documentId}`);
  }
  
  if (!document.content || document.content.trim().length === 0) {
    console.log(`Document ${documentId} has no content, skipping`);
    return { chunks: 0, tokens: 0 };
  }
  
  // Delete existing chunks for this document
  await supabase
    .from("brand_document_chunks")
    .delete()
    .eq("document_id", documentId);
  
  // Chunk the content
  const chunks = chunkMarkdown(document.content);
  
  if (chunks.length === 0) {
    console.log(`Document ${documentId} produced no chunks`);
    return { chunks: 0, tokens: 0 };
  }
  
  // Prepare texts for embedding
  const chunkTexts = chunks.map((chunk) => 
    `${chunk.heading_hierarchy}\n\n${chunk.content}`
  );
  
  // Generate embeddings in batches
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
    const batch = chunkTexts.slice(i, i + BATCH_SIZE);
    const embeddings = await generateEmbeddings(batch, openaiKey);
    allEmbeddings.push(...embeddings);
  }
  
  // Insert chunks with embeddings
  const chunkRecords = chunks.map((chunk, index) => ({
    document_id: documentId,
    brand_id: document.brand_id,
    heading_hierarchy: chunk.heading_hierarchy,
    chunk_index: index,
    content: chunk.content,
    embedding: JSON.stringify(allEmbeddings[index]),
    token_count: chunk.token_count,
  }));
  
  const { error: insertError } = await supabase
    .from("brand_document_chunks")
    .insert(chunkRecords);
  
  if (insertError) {
    throw new Error(`Failed to insert chunks: ${insertError.message}`);
  }
  
  // Generate document-level embedding (first 8000 chars)
  const docSummary = document.content.substring(0, 8000);
  const docEmbedding = await generateSingleEmbedding(docSummary, openaiKey);
  
  // Update document with embedding
  const { error: updateError } = await supabase
    .from("brand_documents")
    .update({ embedding: JSON.stringify(docEmbedding) })
    .eq("id", documentId);
  
  if (updateError) {
    throw new Error(`Failed to update document embedding: ${updateError.message}`);
  }
  
  const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);
  return { chunks: chunks.length, tokens: totalTokens };
}

// ============================================
// Asset Processing
// ============================================

async function processAsset(
  supabase: ReturnType<typeof createClient>,
  assetId: string,
  openaiKey: string
): Promise<void> {
  // Fetch the asset
  const { data: asset, error: assetError } = await supabase
    .from("brand_assets")
    .select("id, name, description, category, variant")
    .eq("id", assetId)
    .single();
  
  if (assetError || !asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }
  
  // Build searchable text from asset metadata
  const searchableText = [
    asset.name,
    asset.description || "",
    asset.category || "",
    asset.variant || "",
  ]
    .filter(Boolean)
    .join(" - ");
  
  // Generate embedding
  const embedding = await generateSingleEmbedding(searchableText, openaiKey);
  
  // Update asset with embedding
  const { error: updateError } = await supabase
    .from("brand_assets")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", assetId);
  
  if (updateError) {
    throw new Error(`Failed to update asset embedding: ${updateError.message}`);
  }
}

// ============================================
// Queue Processing
// ============================================

async function processQueueItem(
  supabase: ReturnType<typeof createClient>,
  item: QueueItem,
  openaiKey: string
): Promise<void> {
  console.log(`Processing ${item.table_name}:${item.record_id} (${item.operation})`);
  
  try {
    if (item.table_name === "brand_documents") {
      const result = await processDocument(supabase, item.record_id, openaiKey);
      console.log(`  Created ${result.chunks} chunks (${result.tokens} tokens)`);
    } else if (item.table_name === "brand_assets") {
      await processAsset(supabase, item.record_id, openaiKey);
      console.log(`  Generated embedding for asset`);
    } else {
      throw new Error(`Unknown table: ${item.table_name}`);
    }
    
    // Mark as processed
    await supabase.rpc("mark_embedding_processed", { p_queue_id: item.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  Error: ${errorMessage}`);
    
    // Mark as failed
    await supabase.rpc("mark_embedding_failed", {
      p_queue_id: item.id,
      p_error: errorMessage,
    });
    
    throw error;
  }
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    
    // Clean the API key (handle Vercel export format with quotes)
    const cleanOpenaiKey = openaiKey.replace(/^["']|["'],?$/g, "").trim();
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    
    let processed = 0;
    let errors = 0;
    
    if (body.queue_id) {
      // Process specific queue item
      const { data: item } = await supabase
        .from("embedding_queue")
        .select("*")
        .eq("id", body.queue_id)
        .single();
      
      if (item) {
        try {
          await processQueueItem(supabase, item as QueueItem, cleanOpenaiKey);
          processed = 1;
        } catch {
          errors = 1;
        }
      }
    } else if (body.process_queue || body.table_name) {
      // Process pending items from queue
      const limit = body.limit || 10;
      
      const { data: items } = await supabase.rpc("get_pending_embeddings", {
        p_limit: limit,
      });
      
      if (items && items.length > 0) {
        for (const item of items as QueueItem[]) {
          try {
            await processQueueItem(supabase, item, cleanOpenaiKey);
            processed++;
          } catch {
            errors++;
          }
        }
      }
    } else {
      // Default: process up to 10 pending items
      const { data: items } = await supabase.rpc("get_pending_embeddings", {
        p_limit: 10,
      });
      
      if (items && items.length > 0) {
        for (const item of items as QueueItem[]) {
          try {
            await processQueueItem(supabase, item, cleanOpenaiKey);
            processed++;
          } catch {
            errors++;
          }
        }
      }
    }
    
    // Get queue stats
    const { data: stats } = await supabase.rpc("get_embedding_queue_stats");
    
    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        queue_stats: stats?.[0] || null,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

