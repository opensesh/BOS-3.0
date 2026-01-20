/**
 * Deep Research API Route
 *
 * Handles research requests and streams events back to the client
 * as the research pipeline progresses through classification,
 * planning, searching, and synthesis phases.
 */

import { executeResearch, type StreamController, type ResearchStreamEvent } from '@/lib/ai/research';
import type { QueryComplexity } from '@/lib/ai/research/types';

export const maxDuration = 120; // Allow up to 2 minutes for deep research

// ============================================
// REQUEST TYPES
// ============================================

interface ResearchRequest {
  query: string;
  options?: {
    useLLMClassification?: boolean;
    forceComplexity?: QueryComplexity;
    skipRound2?: boolean;
    maxCost?: number;
  };
}

// ============================================
// SSE HELPERS
// ============================================

function createSSEEncoder() {
  const encoder = new TextEncoder();
  return {
    encode: (event: ResearchStreamEvent) =>
      encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
    encodeDone: () => encoder.encode('data: [DONE]\n\n'),
  };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(req: Request) {
  console.log('=== Research API called ===');

  try {
    const body = await req.json() as ResearchRequest;
    const { query, options = {} } = body;

    // Validate request
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a non-empty string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate query length (prevent abuse)
    if (query.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Query must be less than 2000 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate API keys are available
    const perplexityKey = process.env.PERPLEXITY_API_KEY?.trim();
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!perplexityKey) {
      return new Response(
        JSON.stringify({ error: 'PERPLEXITY_API_KEY is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Research API] Starting research for query:', query.slice(0, 100));
    console.log('[Research API] Options:', options);

    const sse = createSSEEncoder();

    // Create the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const streamController: StreamController = {
          enqueue: (event: ResearchStreamEvent) => {
            try {
              controller.enqueue(sse.encode(event));
            } catch (error) {
              console.error('[Research API] Error enqueueing event:', error);
            }
          },
          close: () => {
            try {
              controller.enqueue(sse.encodeDone());
              controller.close();
            } catch (error) {
              console.error('[Research API] Error closing stream:', error);
            }
          },
        };

        // Execute the research pipeline
        await executeResearch(query.trim(), streamController, {
          useLLMClassification: options.useLLMClassification,
          forceComplexity: options.forceComplexity,
          skipRound2: options.skipRound2,
          maxCost: options.maxCost,
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Research API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const isAuthError =
      errorMessage.includes('api-key') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('401');

    return new Response(
      JSON.stringify({
        error: isAuthError
          ? 'API authentication failed. Please check your API keys.'
          : errorMessage,
      }),
      {
        status: isAuthError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============================================
// GET HANDLER (for health check)
// ============================================

export async function GET() {
  const perplexityConfigured = !!process.env.PERPLEXITY_API_KEY?.trim();
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY?.trim();

  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'deep-research',
      perplexityConfigured,
      anthropicConfigured,
      ready: perplexityConfigured && anthropicConfigured,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
