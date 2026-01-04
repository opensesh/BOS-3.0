/**
 * Embedding Trigger Utility
 * 
 * Triggers the embed-content Edge Function to process any pending
 * embedding queue items. Called automatically after Brand Hub saves.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/embed-content`;

interface EmbeddingProcessResult {
  success: boolean;
  processed: number;
  errors: number;
  queue_stats: {
    pending_count: number;
    failed_count: number;
    processed_today: number;
    oldest_pending: string | null;
  } | null;
}

/**
 * Trigger the embedding processor Edge Function
 * 
 * This is called automatically after Brand Hub saves to process
 * any new or updated content that needs embeddings.
 * 
 * The function is fire-and-forget by default to not block the UI,
 * but can wait for completion if needed.
 */
export async function triggerEmbeddingProcessor(options?: {
  /** Wait for processing to complete (default: false) */
  wait?: boolean;
  /** Maximum items to process (default: 10) */
  limit?: number;
}): Promise<EmbeddingProcessResult | null> {
  const { wait = false, limit = 10 } = options || {};

  if (!SUPABASE_URL) {
    console.warn('SUPABASE_URL not configured, skipping embedding trigger');
    return null;
  }

  const processEmbeddings = async (): Promise<EmbeddingProcessResult | null> => {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          process_queue: true,
          limit,
        }),
      });

      if (!response.ok) {
        console.error('Embedding processor error:', response.status, await response.text());
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to trigger embedding processor:', error);
      return null;
    }
  };

  if (wait) {
    // Wait for completion and return result
    return processEmbeddings();
  } else {
    // Fire and forget - don't block the caller
    processEmbeddings().then(result => {
      if (result) {
        console.log(`[Embeddings] Processed: ${result.processed}, Pending: ${result.queue_stats?.pending_count || 0}`);
      }
    });
    return null;
  }
}

/**
 * Check the embedding queue status
 */
export async function getEmbeddingQueueStatus(): Promise<EmbeddingProcessResult['queue_stats'] | null> {
  if (!SUPABASE_URL) {
    return null;
  }

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 0, // Just get status, don't process
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result: EmbeddingProcessResult = await response.json();
    return result.queue_stats;
  } catch {
    return null;
  }
}

/**
 * Wrapper to trigger embeddings after a save operation
 * Usage: await withEmbeddingTrigger(async () => saveDocument(...))
 */
export async function withEmbeddingTrigger<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();
  
  // Trigger embedding processing in the background
  triggerEmbeddingProcessor();
  
  return result;
}

