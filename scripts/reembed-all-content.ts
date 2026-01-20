#!/usr/bin/env npx tsx
/**
 * Re-embed All Content Script
 *
 * Re-generates embeddings for all existing content using the new model.
 * Used when upgrading embedding models (e.g., ada-002 → text-embedding-3-large).
 *
 * Tables affected:
 * - brand_documents (document-level embeddings)
 * - brand_document_chunks (chunk-level embeddings)
 * - brand_assets (asset embeddings)
 *
 * Usage: npx tsx scripts/reembed-all-content.ts [brand-slug] [--dry-run]
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { generateEmbeddings, EMBEDDING_CONFIG } from '../lib/bos/embedding-service';

// Configuration
const BATCH_SIZE = 50; // Process in batches to avoid rate limits
const DELAY_BETWEEN_BATCHES_MS = 1000; // 1 second delay

interface ReembedResult {
  table: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors: string[];
}

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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Re-embed brand_document_chunks
 */
async function reembedDocumentChunks(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  dryRun: boolean
): Promise<ReembedResult> {
  const result: ReembedResult = {
    table: 'brand_document_chunks',
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    errors: [],
  };

  // Get all chunks for this brand
  const { data: chunks, error: fetchError } = await supabase
    .from('brand_document_chunks')
    .select('id, content, brand_documents!inner(brand_id)')
    .eq('brand_documents.brand_id', brandId);

  if (fetchError) {
    result.errors.push(`Failed to fetch chunks: ${fetchError.message}`);
    return result;
  }

  result.totalRecords = chunks?.length || 0;
  console.log(`  Found ${result.totalRecords} chunks to re-embed`);

  if (dryRun) {
    console.log('  [DRY RUN] Would re-embed all chunks');
    return result;
  }

  // Process in batches
  for (let i = 0; i < (chunks?.length || 0); i += BATCH_SIZE) {
    const batch = chunks!.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil((chunks?.length || 0) / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}... `);

    try {
      // Generate embeddings for batch
      const contents = batch.map(c => c.content);
      const embeddings = await generateEmbeddings(contents);

      // Update each chunk
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from('brand_document_chunks')
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id);

        if (updateError) {
          result.failedRecords++;
          result.errors.push(`Chunk ${batch[j].id}: ${updateError.message}`);
        } else {
          result.processedRecords++;
        }
      }

      console.log(`done (${result.processedRecords}/${result.totalRecords})`);
    } catch (error) {
      console.log(`failed`);
      result.errors.push(`Batch ${batchNum}: ${error}`);
      result.failedRecords += batch.length;
    }

    // Rate limiting delay
    if (i + BATCH_SIZE < (chunks?.length || 0)) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return result;
}

/**
 * Re-embed brand_documents (document-level embeddings)
 */
async function reembedDocuments(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  dryRun: boolean
): Promise<ReembedResult> {
  const result: ReembedResult = {
    table: 'brand_documents',
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    errors: [],
  };

  // Get all documents for this brand
  const { data: documents, error: fetchError } = await supabase
    .from('brand_documents')
    .select('id, title, content')
    .eq('brand_id', brandId)
    .not('embedding', 'is', null);

  if (fetchError) {
    result.errors.push(`Failed to fetch documents: ${fetchError.message}`);
    return result;
  }

  result.totalRecords = documents?.length || 0;
  console.log(`  Found ${result.totalRecords} documents to re-embed`);

  if (dryRun) {
    console.log('  [DRY RUN] Would re-embed all documents');
    return result;
  }

  // Process in batches
  for (let i = 0; i < (documents?.length || 0); i += BATCH_SIZE) {
    const batch = documents!.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil((documents?.length || 0) / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}... `);

    try {
      // Generate embeddings - use title + truncated content
      const contents = batch.map(d => `${d.title}\n\n${(d.content || '').slice(0, 6000)}`);
      const embeddings = await generateEmbeddings(contents);

      // Update each document
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from('brand_documents')
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id);

        if (updateError) {
          result.failedRecords++;
          result.errors.push(`Document ${batch[j].id}: ${updateError.message}`);
        } else {
          result.processedRecords++;
        }
      }

      console.log(`done (${result.processedRecords}/${result.totalRecords})`);
    } catch (error) {
      console.log(`failed`);
      result.errors.push(`Batch ${batchNum}: ${error}`);
      result.failedRecords += batch.length;
    }

    if (i + BATCH_SIZE < (documents?.length || 0)) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return result;
}

/**
 * Re-embed brand_assets
 */
async function reembedAssets(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  dryRun: boolean
): Promise<ReembedResult> {
  const result: ReembedResult = {
    table: 'brand_assets',
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    errors: [],
  };

  // Get all assets for this brand
  const { data: assets, error: fetchError } = await supabase
    .from('brand_assets')
    .select('id, name, description')
    .eq('brand_id', brandId)
    .not('embedding', 'is', null);

  if (fetchError) {
    result.errors.push(`Failed to fetch assets: ${fetchError.message}`);
    return result;
  }

  result.totalRecords = assets?.length || 0;
  console.log(`  Found ${result.totalRecords} assets to re-embed`);

  if (dryRun) {
    console.log('  [DRY RUN] Would re-embed all assets');
    return result;
  }

  // Process in batches
  for (let i = 0; i < (assets?.length || 0); i += BATCH_SIZE) {
    const batch = assets!.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil((assets?.length || 0) / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}... `);

    try {
      // Generate embeddings - use name + description
      const contents = batch.map(a => `${a.name}\n\n${a.description || ''}`);
      const embeddings = await generateEmbeddings(contents);

      // Update each asset
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from('brand_assets')
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id);

        if (updateError) {
          result.failedRecords++;
          result.errors.push(`Asset ${batch[j].id}: ${updateError.message}`);
        } else {
          result.processedRecords++;
        }
      }

      console.log(`done (${result.processedRecords}/${result.totalRecords})`);
    } catch (error) {
      console.log(`failed`);
      result.errors.push(`Batch ${batchNum}: ${error}`);
      result.failedRecords += batch.length;
    }

    if (i + BATCH_SIZE < (assets?.length || 0)) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const brandSlug = args.find(a => !a.startsWith('--')) || 'open-session';
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(70));
  console.log('Re-embed All Content - Embedding Model Upgrade');
  console.log('='.repeat(70));
  console.log(`Brand: ${brandSlug}`);
  console.log(`Model: ${EMBEDDING_CONFIG.model}`);
  console.log(`Dimensions: ${EMBEDDING_CONFIG.dimensions}`);
  console.log(`Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log('');

  if (dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***');
    console.log('');
  }

  const supabase = getSupabaseAdmin();
  const brandId = await getBrandId(supabase, brandSlug);

  const startTime = Date.now();
  const results: ReembedResult[] = [];

  // Re-embed document chunks
  console.log('Re-embedding document chunks...');
  results.push(await reembedDocumentChunks(supabase, brandId, dryRun));
  console.log('');

  // Re-embed documents
  console.log('Re-embedding documents...');
  results.push(await reembedDocuments(supabase, brandId, dryRun));
  console.log('');

  // Re-embed assets
  console.log('Re-embedding assets...');
  results.push(await reembedAssets(supabase, brandId, dryRun));
  console.log('');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Duration: ${duration}s`);
  console.log('');

  let totalProcessed = 0;
  let totalFailed = 0;
  let totalErrors: string[] = [];

  for (const result of results) {
    const status = result.failedRecords === 0 ? '✓' : '⚠';
    console.log(`${status} ${result.table}: ${result.processedRecords}/${result.totalRecords} processed`);
    if (result.failedRecords > 0) {
      console.log(`    Failed: ${result.failedRecords}`);
    }
    totalProcessed += result.processedRecords;
    totalFailed += result.failedRecords;
    totalErrors.push(...result.errors);
  }

  console.log('');
  console.log(`Total: ${totalProcessed} records re-embedded, ${totalFailed} failed`);

  if (totalErrors.length > 0 && totalErrors.length <= 10) {
    console.log('');
    console.log('Errors:');
    for (const error of totalErrors) {
      console.log(`  - ${error}`);
    }
  } else if (totalErrors.length > 10) {
    console.log('');
    console.log(`${totalErrors.length} errors occurred (showing first 10):`);
    for (const error of totalErrors.slice(0, 10)) {
      console.log(`  - ${error}`);
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(dryRun ? 'Dry run complete!' : 'Re-embedding complete!');
  console.log('='.repeat(70));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
