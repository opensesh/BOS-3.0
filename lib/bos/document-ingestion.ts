/**
 * Document Ingestion Service
 * 
 * Orchestrates the full document embedding pipeline:
 * 1. Fetch documents from brand_documents
 * 2. Chunk content using markdown-chunker
 * 3. Generate embeddings for chunks
 * 4. Store in brand_document_chunks
 * 5. Update document-level embeddings
 */

import { createClient } from '@supabase/supabase-js';
import { chunkMarkdown, summarizeChunks, type MarkdownChunk } from './markdown-chunker';
import { generateEmbedding, generateEmbeddings, generateSummary } from './embedding-service';

// Types
export interface IngestOptions {
  /** Brand slug (e.g., 'open-session') */
  brandSlug: string;
  /** Document slug (e.g., 'brand-identity') */
  documentSlug: string;
  /** Document title */
  title: string;
  /** Document category */
  category: 'brand-identity' | 'writing-styles' | 'skills';
  /** Raw markdown content */
  markdownContent: string;
}

export interface IngestResult {
  success: boolean;
  documentId?: string;
  chunksCreated: number;
  totalTokens: number;
  error?: string;
}

export interface BatchIngestResult {
  success: boolean;
  documentsProcessed: number;
  totalChunks: number;
  totalTokens: number;
  errors: string[];
  results: Array<{
    documentId: string;
    title: string;
    chunksCreated: number;
    tokens: number;
  }>;
}

/**
 * Get Supabase client with service role key for admin operations
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Get brand ID from slug
 */
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

/**
 * Ingest a single document with chunking and embeddings
 */
export async function ingestDocument(options: IngestOptions): Promise<IngestResult> {
  const supabase = getSupabaseAdmin();
  
  try {
    // 1. Get brand ID
    const brandId = await getBrandId(supabase, options.brandSlug);

    // 2. Find or verify the document exists
    const { data: existingDoc, error: docError } = await supabase
      .from('brand_documents')
      .select('id')
      .eq('brand_id', brandId)
      .eq('category', options.category)
      .eq('slug', options.documentSlug)
      .single();

    if (docError || !existingDoc) {
      throw new Error(`Document not found: ${options.category}/${options.documentSlug}`);
    }

    const documentId = existingDoc.id;

    // 3. Chunk the markdown content
    const chunks = chunkMarkdown(options.markdownContent, {
      maxTokens: 500,
      minTokens: 20,
      includeHeadingInContent: true,
    });

    if (chunks.length === 0) {
      return {
        success: true,
        documentId,
        chunksCreated: 0,
        totalTokens: 0,
      };
    }

    console.log(`  Chunked into ${chunks.length} pieces`);
    console.log(summarizeChunks(chunks));

    // 4. Generate embeddings for all chunks (batched)
    const chunkContents = chunks.map(c => c.content);
    console.log(`  Generating embeddings for ${chunks.length} chunks...`);
    const chunkEmbeddings = await generateEmbeddings(chunkContents);

    // 5. Generate document-level embedding (from full content, truncated)
    console.log(`  Generating document-level embedding...`);
    const docEmbedding = await generateEmbedding(
      options.markdownContent.slice(0, 8000)
    );

    // 6. Delete existing chunks for this document
    const { error: deleteError } = await supabase
      .from('brand_document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.warn(`Warning: Failed to delete existing chunks: ${deleteError.message}`);
    }

    // 7. Insert new chunks
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      brand_id: brandId,
      heading_hierarchy: chunk.headingHierarchy,
      chunk_index: index,
      content: chunk.content,
      embedding: chunkEmbeddings[index],
      token_count: chunk.tokenCount,
    }));

    const { error: insertError } = await supabase
      .from('brand_document_chunks')
      .insert(chunkRecords);

    if (insertError) {
      throw new Error(`Failed to insert chunks: ${insertError.message}`);
    }

    // 8. Update document with embedding
    const { error: updateError } = await supabase
      .from('brand_documents')
      .update({ embedding: docEmbedding })
      .eq('id', documentId);

    if (updateError) {
      console.warn(`Warning: Failed to update document embedding: ${updateError.message}`);
    }

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);

    return {
      success: true,
      documentId,
      chunksCreated: chunks.length,
      totalTokens,
    };

  } catch (error) {
    return {
      success: false,
      chunksCreated: 0,
      totalTokens: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ingest all documents for a brand
 */
export async function ingestAllDocuments(brandSlug: string): Promise<BatchIngestResult> {
  const supabase = getSupabaseAdmin();
  const result: BatchIngestResult = {
    success: true,
    documentsProcessed: 0,
    totalChunks: 0,
    totalTokens: 0,
    errors: [],
    results: [],
  };

  try {
    // 1. Get brand ID
    const brandId = await getBrandId(supabase, brandSlug);

    // 2. Fetch all documents for this brand
    const { data: documents, error: fetchError } = await supabase
      .from('brand_documents')
      .select('id, category, slug, title, content')
      .eq('brand_id', brandId)
      .eq('is_deleted', false)
      .order('category')
      .order('sort_order');

    if (fetchError) {
      throw new Error(`Failed to fetch documents: ${fetchError.message}`);
    }

    if (!documents || documents.length === 0) {
      console.log('No documents found for brand:', brandSlug);
      return result;
    }

    console.log(`Found ${documents.length} documents to process\n`);

    // 3. Process each document
    for (const doc of documents) {
      if (!doc.content || doc.content.trim().length === 0) {
        console.log(`⊘ Skipping "${doc.title}" - no content`);
        continue;
      }

      console.log(`\n📄 Processing: ${doc.title} (${doc.category}/${doc.slug})`);
      console.log(`   Content length: ${doc.content.length} chars`);

      const ingestResult = await ingestDocument({
        brandSlug,
        documentSlug: doc.slug,
        title: doc.title,
        category: doc.category as 'brand-identity' | 'writing-styles' | 'skills',
        markdownContent: doc.content,
      });

      if (ingestResult.success) {
        result.documentsProcessed++;
        result.totalChunks += ingestResult.chunksCreated;
        result.totalTokens += ingestResult.totalTokens;
        result.results.push({
          documentId: ingestResult.documentId!,
          title: doc.title,
          chunksCreated: ingestResult.chunksCreated,
          tokens: ingestResult.totalTokens,
        });
        console.log(`   ✓ Created ${ingestResult.chunksCreated} chunks (${ingestResult.totalTokens} tokens)`);
      } else {
        result.errors.push(`${doc.title}: ${ingestResult.error}`);
        console.log(`   ✗ Error: ${ingestResult.error}`);
      }
    }

    result.success = result.errors.length === 0;

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Check the current state of document embeddings
 */
export async function getEmbeddingStatus(brandSlug: string): Promise<{
  totalDocuments: number;
  documentsWithEmbeddings: number;
  totalChunks: number;
  chunksWithEmbeddings: number;
}> {
  const supabase = getSupabaseAdmin();
  const brandId = await getBrandId(supabase, brandSlug);

  // Count documents
  const { count: totalDocs } = await supabase
    .from('brand_documents')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('is_deleted', false);

  const { count: docsWithEmbeddings } = await supabase
    .from('brand_documents')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .not('embedding', 'is', null);

  // Count chunks
  const { count: totalChunks } = await supabase
    .from('brand_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId);

  const { count: chunksWithEmbeddings } = await supabase
    .from('brand_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .not('embedding', 'is', null);

  return {
    totalDocuments: totalDocs || 0,
    documentsWithEmbeddings: docsWithEmbeddings || 0,
    totalChunks: totalChunks || 0,
    chunksWithEmbeddings: chunksWithEmbeddings || 0,
  };
}

