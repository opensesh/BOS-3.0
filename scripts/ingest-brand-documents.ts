#!/usr/bin/env npx tsx
/**
 * Brand Document Ingestion Script
 * 
 * Processes all brand documents for a brand:
 * - Chunks markdown content by headers
 * - Generates embeddings for chunks and documents
 * - Stores in brand_document_chunks table
 * 
 * Usage: npx tsx scripts/ingest-brand-documents.ts [brand-slug]
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { ingestAllDocuments, getEmbeddingStatus } from '../lib/bos/document-ingestion';
import { validateEmbeddingSetup } from '../lib/bos/embedding-service';

async function main() {
  const brandSlug = process.argv[2] || 'open-session';
  
  console.log('═'.repeat(60));
  console.log('🧠 Brand Document Ingestion Pipeline');
  console.log('═'.repeat(60));
  console.log(`Brand: ${brandSlug}`);
  console.log('');

  // 1. Validate setup
  console.log('🔍 Validating configuration...');
  const setupStatus = await validateEmbeddingSetup();
  
  if (!setupStatus.valid) {
    console.error(`\n❌ Setup validation failed: ${setupStatus.error}`);
    console.error('\nRequired environment variables:');
    console.error('  - OPENAI_API_KEY');
    console.error('  - ANTHROPIC_API_KEY');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log('  ✓ OpenAI API configured');
  console.log('  ✓ Anthropic API configured');
  console.log('  ✓ Supabase configured');
  console.log('');

  // 2. Check current status
  console.log('📊 Current embedding status:');
  try {
    const status = await getEmbeddingStatus(brandSlug);
    console.log(`  Documents: ${status.documentsWithEmbeddings}/${status.totalDocuments} have embeddings`);
    console.log(`  Chunks: ${status.chunksWithEmbeddings}/${status.totalChunks} have embeddings`);
  } catch (error) {
    console.log('  (Unable to fetch current status)');
  }
  console.log('');

  // 3. Run ingestion
  console.log('🚀 Starting document ingestion...');
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  const result = await ingestAllDocuments(brandSlug);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. Print results
  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Ingestion Summary');
  console.log('═'.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Documents processed: ${result.documentsProcessed}`);
  console.log(`Total chunks created: ${result.totalChunks}`);
  console.log(`Total tokens: ${result.totalTokens.toLocaleString()}`);
  console.log('');

  if (result.results.length > 0) {
    console.log('📄 Document Details:');
    for (const doc of result.results) {
      console.log(`  • ${doc.title}: ${doc.chunksCreated} chunks (${doc.tokens} tokens)`);
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    for (const error of result.errors) {
      console.log(`  • ${error}`);
    }
    console.log('');
  }

  // 5. Final status
  console.log('📊 Final embedding status:');
  try {
    const finalStatus = await getEmbeddingStatus(brandSlug);
    console.log(`  Documents: ${finalStatus.documentsWithEmbeddings}/${finalStatus.totalDocuments} have embeddings`);
    console.log(`  Chunks: ${finalStatus.chunksWithEmbeddings}/${finalStatus.totalChunks} have embeddings`);
  } catch (error) {
    console.log('  (Unable to fetch final status)');
  }

  console.log('');
  if (result.success) {
    console.log('✅ Document ingestion completed successfully!');
  } else {
    console.log('⚠️  Document ingestion completed with errors');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

