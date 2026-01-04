#!/usr/bin/env npx tsx
/**
 * Embedding Verification Script
 * 
 * Tests semantic search functionality after ingestion:
 * - Runs test queries against documents and assets
 * - Displays results with similarity scores
 * - Validates the embedding pipeline is working
 * 
 * Usage: npx tsx scripts/verify-embeddings.ts [brand-slug]
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

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../lib/bos/embedding-service';
import { getEmbeddingStatus } from '../lib/bos/document-ingestion';
import { getAssetEmbeddingStatus } from '../lib/bos/asset-ingestion';

// Test queries for different search scenarios
const TEST_QUERIES = {
  documents: [
    'What colors does Open Session use?',
    'How should I write for Instagram?',
    'What is the brand mission?',
    'Typography and fonts for headings',
    'How to use AI in design work',
  ],
  assets: [
    'logo for dark background',
    'brandmark icon',
    'display font bold',
    'illustration shapes',
    'texture pattern',
  ],
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

interface ChunkSearchResult {
  id: string;
  document_id: string;
  heading_hierarchy: string[];
  content: string;
  token_count: number;
  similarity: number;
  document_title: string;
  document_category: string;
}

interface AssetSearchResult {
  id: string;
  name: string;
  filename: string;
  description: string;
  category: string;
  variant: string | null;
  similarity: number;
}

async function searchDocumentChunks(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  query: string,
  limit: number = 3
): Promise<ChunkSearchResult[]> {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: embedding,
    p_brand_id: brandId,
    match_threshold: 0.5,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Search error: ${error.message}`);
  }

  return data || [];
}

async function searchAssets(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  query: string,
  limit: number = 3
): Promise<AssetSearchResult[]> {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_assets', {
    query_embedding: embedding,
    p_brand_id: brandId,
    p_category: null,
    match_threshold: 0.5,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Search error: ${error.message}`);
  }

  return data || [];
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

async function main() {
  const brandSlug = process.argv[2] || 'open-session';
  
  console.log('═'.repeat(70));
  console.log('🔍 Embedding Verification & Semantic Search Test');
  console.log('═'.repeat(70));
  console.log(`Brand: ${brandSlug}`);
  console.log('');

  const supabase = getSupabaseAdmin();
  const brandId = await getBrandId(supabase, brandSlug);

  // 1. Display current status
  console.log('📊 Current Embedding Status');
  console.log('─'.repeat(70));
  
  const docStatus = await getEmbeddingStatus(brandSlug);
  console.log(`Documents: ${docStatus.documentsWithEmbeddings}/${docStatus.totalDocuments} with embeddings`);
  console.log(`Chunks: ${docStatus.chunksWithEmbeddings}/${docStatus.totalChunks} with embeddings`);
  
  const assetStatus = await getAssetEmbeddingStatus(brandSlug);
  console.log(`Assets: ${assetStatus.assetsWithEmbeddings}/${assetStatus.totalAssets} with embeddings`);
  console.log('');

  // 2. Test document chunk search
  if (docStatus.chunksWithEmbeddings > 0) {
    console.log('📄 Document Chunk Search Tests');
    console.log('─'.repeat(70));

    for (const query of TEST_QUERIES.documents) {
      console.log(`\n🔎 Query: "${query}"`);
      
      try {
        const results = await searchDocumentChunks(supabase, brandId, query, 3);
        
        if (results.length === 0) {
          console.log('   No results found');
        } else {
          for (const result of results) {
            const similarity = (result.similarity * 100).toFixed(1);
            const hierarchy = result.heading_hierarchy.join(' > ') || 'Root';
            console.log(`   [${similarity}%] ${result.document_title} > ${hierarchy}`);
            console.log(`           ${truncate(result.content.replace(/\n/g, ' '), 80)}`);
          }
        }
      } catch (error) {
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log('');
  } else {
    console.log('⚠️  No document chunks with embeddings - skipping document search tests');
    console.log('   Run: npx tsx scripts/ingest-brand-documents.ts');
    console.log('');
  }

  // 3. Test asset search
  if (assetStatus.assetsWithEmbeddings > 0) {
    console.log('🖼️  Asset Search Tests');
    console.log('─'.repeat(70));

    for (const query of TEST_QUERIES.assets) {
      console.log(`\n🔎 Query: "${query}"`);
      
      try {
        const results = await searchAssets(supabase, brandId, query, 3);
        
        if (results.length === 0) {
          console.log('   No results found');
        } else {
          for (const result of results) {
            const similarity = (result.similarity * 100).toFixed(1);
            console.log(`   [${similarity}%] ${result.name} (${result.category})`);
            console.log(`           ${truncate(result.description, 70)}`);
          }
        }
      } catch (error) {
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log('');
  } else {
    console.log('⚠️  No assets with embeddings - skipping asset search tests');
    console.log('   Run: npx tsx scripts/ingest-brand-assets.ts');
    console.log('');
  }

  // 4. Summary
  console.log('═'.repeat(70));
  console.log('✅ Verification Complete');
  console.log('═'.repeat(70));
  
  const hasDocEmbeddings = docStatus.chunksWithEmbeddings > 0;
  const hasAssetEmbeddings = assetStatus.assetsWithEmbeddings > 0;
  
  if (hasDocEmbeddings && hasAssetEmbeddings) {
    console.log('All embedding pipelines are operational!');
    console.log('');
    console.log('You can now use these search functions in your app:');
    console.log('  - match_document_chunks() for brand knowledge search');
    console.log('  - match_assets() for asset search');
    console.log('  - match_documents() for document-level search');
  } else {
    console.log('Some embedding pipelines need to be run:');
    if (!hasDocEmbeddings) {
      console.log('  ⚠️  Documents: npx tsx scripts/ingest-brand-documents.ts');
    }
    if (!hasAssetEmbeddings) {
      console.log('  ⚠️  Assets: npx tsx scripts/ingest-brand-assets.ts');
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

