#!/usr/bin/env npx tsx
/**
 * Brand Asset Ingestion Script
 * 
 * Processes all brand assets for a brand:
 * - Enriches descriptions using LLM
 * - Generates embeddings for enriched descriptions
 * - Updates brand_assets table with embeddings
 * 
 * Usage: npx tsx scripts/ingest-brand-assets.ts [brand-slug] [options]
 * 
 * Options:
 *   --categories=logos,images   Only process specific categories
 *   --skip-enrichment           Use existing descriptions (faster)
 *   --only-missing              Only process assets without embeddings
 *   --store-descriptions        Save enriched descriptions to DB
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 * - ANTHROPIC_API_KEY (for LLM enrichment)
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { ingestAllAssets, getAssetEmbeddingStatus } from '../lib/bos/asset-ingestion';
import { validateEmbeddingSetup } from '../lib/bos/embedding-service';

function parseArgs(args: string[]): {
  brandSlug: string;
  categories?: string[];
  skipEnrichment: boolean;
  onlyMissing: boolean;
  storeDescriptions: boolean;
} {
  const brandSlug = args.find(a => !a.startsWith('--')) || 'open-session';
  
  let categories: string[] | undefined;
  const categoriesArg = args.find(a => a.startsWith('--categories='));
  if (categoriesArg) {
    categories = categoriesArg.split('=')[1].split(',').map(c => c.trim());
  }

  return {
    brandSlug,
    categories,
    skipEnrichment: args.includes('--skip-enrichment'),
    onlyMissing: args.includes('--only-missing'),
    storeDescriptions: args.includes('--store-descriptions'),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  console.log('═'.repeat(60));
  console.log('🖼️  Brand Asset Ingestion Pipeline');
  console.log('═'.repeat(60));
  console.log(`Brand: ${args.brandSlug}`);
  console.log(`Categories: ${args.categories?.join(', ') || 'all'}`);
  console.log(`Skip enrichment: ${args.skipEnrichment}`);
  console.log(`Only missing: ${args.onlyMissing}`);
  console.log(`Store enriched descriptions: ${args.storeDescriptions}`);
  console.log('');

  // 1. Validate setup
  console.log('🔍 Validating configuration...');
  const setupStatus = await validateEmbeddingSetup();
  
  if (!setupStatus.valid) {
    console.error(`\n❌ Setup validation failed: ${setupStatus.error}`);
    process.exit(1);
  }
  
  console.log('  ✓ OpenAI API configured');
  console.log('  ✓ Anthropic API configured');
  console.log('  ✓ Supabase configured');
  console.log('');

  // 2. Check current status
  console.log('📊 Current embedding status:');
  try {
    const status = await getAssetEmbeddingStatus(args.brandSlug);
    console.log(`  Total: ${status.assetsWithEmbeddings}/${status.totalAssets} have embeddings`);
    console.log('  By category:');
    for (const [category, counts] of Object.entries(status.byCategory)) {
      console.log(`    ${category}: ${counts.withEmbeddings}/${counts.total}`);
    }
  } catch (error) {
    console.log('  (Unable to fetch current status)');
  }
  console.log('');

  // 3. Run ingestion
  console.log('🚀 Starting asset ingestion...');
  if (!args.skipEnrichment) {
    console.log('   (LLM enrichment enabled - this may take a while)');
  }
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  const result = await ingestAllAssets(args.brandSlug, {
    categories: args.categories,
    skipEnrichment: args.skipEnrichment,
    onlyMissing: args.onlyMissing,
    storeEnrichedDescriptions: args.storeDescriptions,
    batchSize: 10,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. Print results
  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Ingestion Summary');
  console.log('═'.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Assets processed: ${result.assetsProcessed}`);
  console.log(`Assets skipped: ${result.assetsSkipped}`);
  console.log('');

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
    const finalStatus = await getAssetEmbeddingStatus(args.brandSlug);
    console.log(`  Total: ${finalStatus.assetsWithEmbeddings}/${finalStatus.totalAssets} have embeddings`);
    console.log('  By category:');
    for (const [category, counts] of Object.entries(finalStatus.byCategory)) {
      const pct = counts.total > 0 ? Math.round((counts.withEmbeddings / counts.total) * 100) : 0;
      console.log(`    ${category}: ${counts.withEmbeddings}/${counts.total} (${pct}%)`);
    }
  } catch (error) {
    console.log('  (Unable to fetch final status)');
  }

  console.log('');
  if (result.success) {
    console.log('✅ Asset ingestion completed successfully!');
  } else {
    console.log('⚠️  Asset ingestion completed with errors');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

