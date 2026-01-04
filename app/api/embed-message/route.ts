/**
 * Message Embedding API
 * 
 * Generates embeddings for chat messages asynchronously.
 * Called after messages are saved to enable semantic search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/bos/embedding-service';

// Get Supabase admin client
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

interface EmbedMessageRequest {
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
}

interface EmbedBatchRequest {
  messages: EmbedMessageRequest[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Support both single message and batch requests
    const messages: EmbedMessageRequest[] = body.messages || [body];
    
    if (!messages.length) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    // Validate all messages have required fields
    for (const msg of messages) {
      if (!msg.messageId || !msg.content || !msg.role) {
        return NextResponse.json(
          { error: 'Each message must have messageId, content, and role' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdmin();
    const results: { messageId: string; success: boolean; error?: string }[] = [];

    // Process messages - batch embed if possible
    try {
      // Prepare texts with role context
      const texts = messages.map(msg => {
        const roleContext = msg.role === 'user' ? 'User question: ' : 'Assistant response: ';
        return roleContext + msg.content;
      });

      // Generate embeddings in batch
      const embeddings = await generateEmbedding(texts[0]); // For single, use generateEmbedding
      
      // For batch, we'd use generateEmbeddings, but for simplicity let's process one by one
      // This is fine since we're typically embedding 1-2 messages at a time
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        try {
          const roleContext = msg.role === 'user' ? 'User question: ' : 'Assistant response: ';
          const embedding = await generateEmbedding(roleContext + msg.content);
          
          const { error: updateError } = await supabase
            .from('messages')
            .update({ embedding })
            .eq('id', msg.messageId);

          if (updateError) {
            results.push({ 
              messageId: msg.messageId, 
              success: false, 
              error: updateError.message 
            });
          } else {
            results.push({ messageId: msg.messageId, success: true });
          }
        } catch (embedError) {
          results.push({ 
            messageId: msg.messageId, 
            success: false, 
            error: embedError instanceof Error ? embedError.message : 'Embedding failed' 
          });
        }
      }
    } catch (batchError) {
      // If batch fails, return error
      return NextResponse.json(
        { 
          error: 'Embedding generation failed', 
          details: batchError instanceof Error ? batchError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      processed: messages.length,
      success: successCount,
      failed: failCount,
      results,
    });

  } catch (error) {
    console.error('Embed message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

