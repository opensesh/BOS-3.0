/**
 * Feedback Service for storing message likes/dislikes
 * 
 * Stores user feedback on AI responses to help improve quality over time.
 */

import { createClient } from './client';

export type FeedbackType = 'like' | 'dislike';

export interface MessageFeedback {
  id: string;
  messageId: string;
  chatId?: string;
  feedbackType: FeedbackType;
  userId?: string;
  sessionId?: string;
  query?: string;
  responseContent?: string;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackInsert {
  messageId: string;
  chatId?: string;
  feedbackType: FeedbackType;
  userId?: string;
  sessionId?: string;
  query?: string;
  responseContent?: string;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
}

interface DbMessageFeedback {
  id: string;
  message_id: string;
  chat_id: string | null;
  feedback_type: string;
  user_id: string | null;
  session_id: string | null;
  query: string | null;
  response_content: string | null;
  model_used: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to application type
 */
function dbFeedbackToApp(db: DbMessageFeedback): MessageFeedback {
  return {
    id: db.id,
    messageId: db.message_id,
    chatId: db.chat_id || undefined,
    feedbackType: db.feedback_type as FeedbackType,
    userId: db.user_id || undefined,
    sessionId: db.session_id || undefined,
    query: db.query || undefined,
    responseContent: db.response_content || undefined,
    modelUsed: db.model_used || undefined,
    metadata: db.metadata || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Get or create a session ID for anonymous users
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('bos_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('bos_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Submit feedback for a message (like or dislike)
 * This will upsert - if feedback already exists for this message/session, it updates it
 */
export async function submitFeedback(feedback: FeedbackInsert): Promise<MessageFeedback | null> {
  const supabase = createClient();
  const sessionId = feedback.sessionId || getSessionId();
  
  try {
    // First, check if feedback already exists
    const { data: existing } = await supabase
      .from('message_feedback')
      .select('id')
      .eq('message_id', feedback.messageId)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('message_feedback')
        .update({
          feedback_type: feedback.feedbackType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return dbFeedbackToApp(data as DbMessageFeedback);
    } else {
      // Insert new feedback
      const { data, error } = await supabase
        .from('message_feedback')
        .insert({
          message_id: feedback.messageId,
          chat_id: feedback.chatId || null,
          feedback_type: feedback.feedbackType,
          user_id: feedback.userId || null,
          session_id: sessionId,
          query: feedback.query || null,
          response_content: feedback.responseContent || null,
          model_used: feedback.modelUsed || null,
          metadata: feedback.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return dbFeedbackToApp(data as DbMessageFeedback);
    }
  } catch (err) {
    console.error('Failed to submit feedback:', err);
    return null;
  }
}

/**
 * Remove feedback for a message (toggle off)
 */
export async function removeFeedback(messageId: string): Promise<boolean> {
  const supabase = createClient();
  const sessionId = getSessionId();
  
  try {
    const { error } = await supabase
      .from('message_feedback')
      .delete()
      .eq('message_id', messageId)
      .eq('session_id', sessionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to remove feedback:', err);
    return false;
  }
}

/**
 * Get existing feedback for a message (if any)
 */
export async function getFeedback(messageId: string): Promise<FeedbackType | null> {
  const supabase = createClient();
  const sessionId = getSessionId();
  
  try {
    const { data, error } = await supabase
      .from('message_feedback')
      .select('feedback_type')
      .eq('message_id', messageId)
      .eq('session_id', sessionId)
      .single();

    // PGRST116 = no rows returned - this is normal, not an error
    if (error && error.code !== 'PGRST116') throw error;
    return data ? (data.feedback_type as FeedbackType) : null;
  } catch (err) {
    // Only log actual errors, not missing feedback (which is expected)
    // Check for Supabase error structure: must have 'code' property that isn't empty
    const isSupabaseError = err && typeof err === 'object' && 'code' in err;
    const errorCode = isSupabaseError ? (err as { code?: string }).code : null;
    
    // PGRST116 = "no rows returned" - this is expected when no feedback exists
    // Empty error objects ({}) or errors without codes should be silently ignored
    if (errorCode && errorCode !== 'PGRST116') {
      console.error('Failed to get feedback:', err);
    }
    return null;
  }
}

