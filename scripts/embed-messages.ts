#!/usr/bin/env npx tsx
/**
 * Message Embedding Backfill Script
 * 
 * Processes all existing chat messages to generate embeddings
 * for semantic search. This is a one-time backfill script.
 * 
 * Usage: npx tsx scripts/embed-messages.ts [--batch-size=50] [--skip-existing]
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
import { generateEmbeddings, EMBEDDING_CONFIG } from '../lib/bos/embedding-service';

// Configuration
const DEFAULT_BATCH_SIZE = 50;

// Parse CLI arguments
function parseArgs(): { batchSize: number; skipExisting: boolean } {
  const args = process.argv.slice(2);
  let batchSize = DEFAULT_BATCH_SIZE;
  let skipExisting = false;

  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1], 10) || DEFAULT_BATCH_SIZE;
    } else if (arg === '--skip-existing') {
      skipExisting = true;
    }
  }

  return { batchSize, skipExisting };
}

// Get Supabase admin client
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

// Get OpenAI API key
function validateOpenAIKey(): void {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
}

interface Message {
  id: string;
  content: string;
  role: string;
  chat_id: string;
}

interface EmbeddingStats {
  total: number;
  withEmbeddings: number;
  withoutEmbeddings: number;
}

// Get current embedding stats
async function getEmbeddingStats(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<EmbeddingStats> {
  // Get total count
  const { count: totalCount, error: totalError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  if (totalError) throw totalError;

  // Get count with embeddings
  const { count: withEmbeddingsCount, error: embeddingError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  if (embeddingError) throw embeddingError;

  return {
    total: totalCount || 0,
    withEmbeddings: withEmbeddingsCount || 0,
    withoutEmbeddings: (totalCount || 0) - (withEmbeddingsCount || 0),
  };
}

// Fetch messages that need embeddings
async function fetchMessagesWithoutEmbeddings(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  limit: number,
  skipExisting: boolean
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('id, content, role, chat_id')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (skipExisting) {
    query = query.is('embedding', null);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as Message[];
}

// Update message with embedding
async function updateMessageEmbedding(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  messageId: string,
  embedding: number[]
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ embedding })
    .eq('id', messageId);

  if (error) throw error;
}

// Process a batch of messages
async function processBatch(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  messages: Message[]
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Prepare texts for embedding
  const texts = messages.map(m => {
    // Include role context for better embeddings
    const roleContext = m.role === 'user' ? 'User question: ' : 'Assistant response: ';
    return roleContext + m.content;
  });

  try {
    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(texts);

    // Update each message with its embedding
    for (let i = 0; i < messages.length; i++) {
      try {
        await updateMessageEmbedding(supabase, messages[i].id, embeddings[i]);
        processed++;
      } catch (err) {
        failed++;
        errors.push(`Message ${messages[i].id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    // Batch embedding failed, try one by one
    console.log('    Batch failed, falling back to individual processing...');
    
    for (const message of messages) {
      try {
        const [embedding] = await generateEmbeddings([
          (message.role === 'user' ? 'User question: ' : 'Assistant response: ') + message.content
        ]);
        await updateMessageEmbedding(supabase, message.id, embedding);
        processed++;
      } catch (individualErr) {
        failed++;
        errors.push(`Message ${message.id}: ${individualErr instanceof Error ? individualErr.message : String(individualErr)}`);
      }
    }
  }

  return { processed, failed, errors };
}

// Main function
async function main() {
  const { batchSize, skipExisting } = parseArgs();

  console.log('═'.repeat(60));
  console.log('📨 Message Embedding Backfill');
  console.log('═'.repeat(60));
  console.log(`Batch size: ${batchSize}`);
  console.log(`Skip existing: ${skipExisting}`);
  console.log(`Embedding model: ${EMBEDDING_CONFIG.model}`);
  console.log(`Embedding dimensions: ${EMBEDDING_CONFIG.dimensions}`);
  console.log('');

  // 1. Validate setup
  console.log('🔍 Validating configuration...');
  try {
    validateOpenAIKey();
    console.log('  ✓ OpenAI API key configured');
  } catch (err) {
    console.error(`\n❌ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();
  console.log('  ✓ Supabase client configured');
  console.log('');

  // 2. Get current stats
  console.log('📊 Current embedding status:');
  let stats: EmbeddingStats;
  try {
    stats = await getEmbeddingStats(supabase);
    console.log(`  Total messages: ${stats.total}`);
    console.log(`  With embeddings: ${stats.withEmbeddings}`);
    console.log(`  Without embeddings: ${stats.withoutEmbeddings}`);
  } catch (err) {
    console.error('  Failed to fetch stats:', err);
    process.exit(1);
  }
  console.log('');

  if (stats.withoutEmbeddings === 0 && skipExisting) {
    console.log('✅ All messages already have embeddings!');
    return;
  }

  // 3. Process messages in batches
  console.log('🚀 Starting embedding generation...');
  console.log('─'.repeat(60));

  const startTime = Date.now();
  let totalProcessed = 0;
  let totalFailed = 0;
  let batchNumber = 0;
  const allErrors: string[] = [];

  while (true) {
    batchNumber++;
    
    // Fetch next batch
    const messages = await fetchMessagesWithoutEmbeddings(supabase, batchSize, skipExisting);
    
    if (messages.length === 0) {
      break;
    }

    console.log(`\n  Batch ${batchNumber}: Processing ${messages.length} messages...`);

    const result = await processBatch(supabase, messages);
    totalProcessed += result.processed;
    totalFailed += result.failed;
    allErrors.push(...result.errors);

    console.log(`    ✓ Processed: ${result.processed}, Failed: ${result.failed}`);

    // If we processed fewer than batch size, we're done
    if (messages.length < batchSize) {
      break;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. Print summary
  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Embedding Summary');
  console.log('═'.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Total batches: ${batchNumber}`);
  console.log(`Messages processed: ${totalProcessed}`);
  console.log(`Messages failed: ${totalFailed}`);

  if (allErrors.length > 0) {
    console.log('');
    console.log('⚠️  Errors:');
    allErrors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (allErrors.length > 10) {
      console.log(`   ... and ${allErrors.length - 10} more errors`);
    }
  }

  // 5. Final stats
  console.log('');
  console.log('📊 Final embedding status:');
  try {
    const finalStats = await getEmbeddingStats(supabase);
    console.log(`  Total messages: ${finalStats.total}`);
    console.log(`  With embeddings: ${finalStats.withEmbeddings}`);
    console.log(`  Coverage: ${((finalStats.withEmbeddings / finalStats.total) * 100).toFixed(1)}%`);
  } catch {
    console.log('  (Unable to fetch final stats)');
  }

  console.log('');
  console.log(totalFailed === 0 ? '✅ Embedding backfill complete!' : '⚠️  Embedding backfill completed with errors');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

