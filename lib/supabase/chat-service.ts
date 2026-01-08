'use client';

import { createClient } from './client';
import type { ChatSession, ChatMessage, DbChat, DbMessage, ChatInsert, MessageInsert, MessageMetadata, StoredSourceInfo, StoredAttachment } from './types';

// Track if tables are available (to avoid repeated error logs)
let tablesChecked = false;
let tablesAvailable = true;

/**
 * Queue message embeddings asynchronously (fire and forget)
 * This doesn't block the UI - embeddings are generated in the background
 */
async function queueMessageEmbeddings(
  messages: Array<{ id: string; content: string; role: 'user' | 'assistant' }>
): Promise<void> {
  // Fire and forget - don't await
  fetch('/api/embed-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({
        messageId: m.id,
        content: m.content,
        role: m.role,
      })),
    }),
  }).catch(err => {
    // Log but don't throw - embedding is non-critical
    console.warn('Background embedding failed:', err);
  });
}

/**
 * Check if Supabase tables are available
 * Returns false if tables don't exist (gracefully degrades)
 */
async function checkTablesAvailable(): Promise<boolean> {
  if (tablesChecked) return tablesAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('chats')
      .select('id')
      .limit(1);

    tablesChecked = true;

    if (!error) {
      tablesAvailable = true;
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTableMissing =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorCode === '42P01' ||
      errorCode === 'PGRST116';

    tablesAvailable = false;

    if (isTableMissing) {
      console.info('Chat history: Supabase tables not available. Chat history disabled.');
    }

    return false;
  } catch {
    tablesChecked = true;
    tablesAvailable = false;
    return false;
  }
}

/**
 * Convert database message to app message format
 */
function dbMessageToAppMessage(msg: DbMessage): ChatMessage {
  // Extract sources from metadata if present
  const metadata = msg.metadata as MessageMetadata | null;
  const sources = metadata?.sources?.map((s: StoredSourceInfo) => ({
    title: s.title || s.name,
    url: s.url,
    snippet: s.snippet,
    // Include full source info for proper display
    id: s.id,
    name: s.name,
    favicon: s.favicon,
    type: s.type,
    category: s.category,
    publishedAt: s.publishedAt,
  }));

  // Extract attachments from metadata if present
  const attachments = metadata?.attachments?.map((a: StoredAttachment) => ({
    id: a.id,
    type: a.type,
    data: a.data,
    mimeType: a.mimeType,
    name: a.name,
    storagePath: a.storagePath,
  }));

  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    model: msg.model || undefined,
    timestamp: msg.created_at,
    sources: sources && sources.length > 0 ? sources : undefined,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
  };
}

/**
 * Build metadata object for a message, including sources and attachments
 */
function buildMessageMetadata(m: ChatMessage): MessageMetadata | undefined {
  const hasSources = m.sources && m.sources.length > 0;
  const hasAttachments = m.attachments && m.attachments.length > 0;
  
  if (!hasSources && !hasAttachments) {
    return undefined;
  }
  
  const metadata: MessageMetadata = {};
  
  if (hasSources && m.sources) {
    metadata.sources = m.sources.map(s => ({
      id: (s as StoredSourceInfo).id || s.url,
      name: (s as StoredSourceInfo).name || s.title || '',
      url: s.url,
      title: s.title,
      snippet: s.snippet,
      favicon: (s as StoredSourceInfo).favicon,
      type: (s as StoredSourceInfo).type,
      category: (s as StoredSourceInfo).category,
      publishedAt: (s as StoredSourceInfo).publishedAt,
    }));
  }
  
  if (hasAttachments && m.attachments) {
    metadata.attachments = m.attachments.map(a => ({
      id: a.id,
      type: a.type,
      data: a.data,
      mimeType: a.mimeType,
      name: a.name,
      storagePath: a.storagePath,
    }));
  }
  
  return metadata;
}

/**
 * Chat History Service
 * Uses existing `chats` and `messages` tables in Supabase
 */
export const chatService = {
  /**
   * Save a new chat session or update existing one
   * @param title - The chat title
   * @param messages - Array of chat messages
   * @param existingId - ID of existing chat to update
   * @param projectId - Optional project ID to associate this chat with
   * @param quickActionType - Optional quick action type that initiated this chat
   */
  async saveSession(
    title: string,
    messages: ChatMessage[],
    existingId?: string,
    projectId?: string | null,
    quickActionType?: string | null
  ): Promise<ChatSession | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();
    const preview = messages.find(m => m.role === 'assistant')?.content.slice(0, 150) || null;

    try {
      if (existingId) {
        // Update existing chat title (and project_id if provided)
        const updateData: { title: string; updated_at: string; project_id?: string | null } = {
          title,
          updated_at: new Date().toISOString(),
        };
        // Only update project_id if explicitly provided (including null to unassign)
        if (projectId !== undefined) {
          updateData.project_id = projectId;
        }
        const { error: updateError } = await supabase
          .from('chats')
          .update(updateData)
          .eq('id', existingId);

        if (updateError) {
          console.error('Error updating chat:', updateError);
          return null;
        }

        // Get existing messages to find new ones
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', existingId);

        const existingIds = new Set((existingMessages || []).map(m => m.id));

        // Insert only new messages
        const newMessages = messages.filter(m => !existingIds.has(m.id));

        if (newMessages.length > 0) {
          const messagesToInsert: MessageInsert[] = newMessages.map(m => ({
            chat_id: existingId,
            role: m.role,
            content: m.content,
            model: m.model,
            metadata: buildMessageMetadata(m),
          }));

          const { data: insertedMessages, error: msgError } = await supabase
            .from('messages')
            .insert(messagesToInsert)
            .select('id, content, role');

          if (msgError) {
            console.error('Error inserting messages:', msgError);
          } else if (insertedMessages && insertedMessages.length > 0) {
            // Queue embeddings for the new messages (async, non-blocking)
            queueMessageEmbeddings(
              insertedMessages.map(m => ({
                id: m.id,
                content: m.content,
                role: m.role as 'user' | 'assistant',
              }))
            );
          }
        }

        return {
          id: existingId,
          title,
          preview,
          messages,
          project_id: projectId,
          quick_action_type: quickActionType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Create new chat (user_id is null for anonymous/demo users)
      const chatInsert: ChatInsert = { 
        title, 
        user_id: null, 
        project_id: projectId ?? null,
        quick_action_type: quickActionType ?? null,
      };

      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert(chatInsert)
        .select()
        .single();

      if (chatError || !chat) {
        console.error('Error creating chat:', chatError);
        return null;
      }

      // Insert all messages
      if (messages.length > 0) {
        const messagesToInsert: MessageInsert[] = messages.map(m => ({
          chat_id: chat.id,
          role: m.role,
          content: m.content,
          model: m.model,
          metadata: buildMessageMetadata(m),
        }));

        const { data: insertedMessages, error: msgError } = await supabase
          .from('messages')
          .insert(messagesToInsert)
          .select('id, content, role');

        if (msgError) {
          console.error('Error inserting messages:', msgError);
        } else if (insertedMessages && insertedMessages.length > 0) {
          // Queue embeddings for the new messages (async, non-blocking)
          queueMessageEmbeddings(
            insertedMessages.map(m => ({
              id: m.id,
              content: m.content,
              role: m.role as 'user' | 'assistant',
            }))
          );
        }
      }

      return {
        id: chat.id,
        title: chat.title,
        preview,
        messages,
        project_id: chat.project_id,
        quick_action_type: chat.quick_action_type,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
      };
    } catch (error) {
      console.error('Error in saveSession:', error);
      return null;
    }
  },

  /**
   * Get all chat sessions (most recent first)
   * Returns ALL sessions globally for demo visibility
   */
  async getSessions(limit = 50): Promise<ChatSession[]> {
    if (!(await checkTablesAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      // Fetch chats ordered by most recent
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (chatsError || !chats) {
        if (chatsError?.message && !chatsError.message.includes('does not exist')) {
          console.error('Error fetching chats:', chatsError.message);
        }
        return [];
      }

      // Fetch messages for all chats
      const chatIds = chats.map(c => c.id);

      const { data: allMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
      }

      // Group messages by chat_id
      const messagesByChat: Record<string, DbMessage[]> = {};
      for (const msg of allMessages || []) {
        if (!messagesByChat[msg.chat_id]) {
          messagesByChat[msg.chat_id] = [];
        }
        messagesByChat[msg.chat_id].push(msg);
      }

      // Transform to ChatSession format
      return chats.map((chat: DbChat) => {
        const chatMessages = (messagesByChat[chat.id] || []).map(dbMessageToAppMessage);
        const preview = chatMessages.find(m => m.role === 'assistant')?.content.slice(0, 150) || null;

        return {
          id: chat.id,
          title: chat.title,
          preview,
          messages: chatMessages,
          project_id: chat.project_id,
          quick_action_type: chat.quick_action_type,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
        };
      });
    } catch (error) {
      console.error('Error in getSessions:', error);
      return [];
    }
  },

  /**
   * Get a single session by ID with all messages
   */
  async getSession(id: string): Promise<ChatSession | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      // Fetch chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', id)
        .single();

      if (chatError || !chat) {
        console.error('Error fetching chat:', chatError);
        return null;
      }

      // Fetch messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
      }

      const chatMessages = (messages || []).map(dbMessageToAppMessage);
      const preview = chatMessages.find(m => m.role === 'assistant')?.content.slice(0, 150) || null;

      return {
        id: chat.id,
        title: chat.title,
        preview,
        messages: chatMessages,
        project_id: chat.project_id,
        quick_action_type: chat.quick_action_type,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
      };
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  },

  /**
   * Delete a chat session and its messages
   */
  async deleteSession(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      // Delete messages first (foreign key constraint)
      await supabase
        .from('messages')
        .delete()
        .eq('chat_id', id);

      // Delete chat
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting chat:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  },

  /**
   * Log a search query (stub - implement if search_history table exists)
   */
  async logSearch(_query: string, _mode: 'search' | 'research' = 'search'): Promise<void> {
    // Search history logging disabled - table may not exist
  },

  /**
   * Get recent search history (stub)
   */
  async getSearchHistory(_limit = 20): Promise<Array<{ query: string; mode: string; created_at: string }>> {
    return [];
  },

  /**
   * Get trending searches (stub)
   */
  async getTrendingSearches(_limit = 10): Promise<Array<{ query: string; count: number }>> {
    return [];
  },

  /**
   * Search queries for autocomplete (stub)
   */
  async searchQueries(_partialQuery: string, _limit = 5): Promise<string[]> {
    return [];
  },

  /**
   * Update a chat title
   * Used when user manually renames a conversation
   */
  async updateChatTitle(id: string, newTitle: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating chat title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateChatTitle:', error);
      return false;
    }
  },
};

export type { ChatSession, ChatMessage };
