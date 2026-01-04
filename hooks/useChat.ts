'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// TYPE DEFINITIONS
// ============================================

// Source info for citations
export interface SourceInfo {
  id: string;
  name: string;
  url: string;
  title?: string;
  snippet?: string;
  favicon?: string;
  type?: 'external' | 'brand-doc' | 'asset' | 'discover';
}

// Image attachment for messages
export interface MessageAttachment {
  id: string;
  type: 'image';
  data: string; // Base64 data URL
  mimeType: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Array<{ type: string; text?: string }>;
  createdAt?: Date;
  // Extended features
  thinking?: string;
  toolCalls?: ToolCall[];
  sources?: SourceInfo[];
  // Attachments (images, files)
  attachments?: MessageAttachment[];
}

export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface SendMessageOptions {
  body?: Record<string, unknown>;
}

export interface UseChatOptions {
  api?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
  initialMessages?: ChatMessage[];
  /** Timeout in milliseconds for API requests. Default: 120000 (2 minutes) */
  timeout?: number;
}

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

// Default timeout for API requests (2 minutes for extended thinking)
const DEFAULT_TIMEOUT = 120000;

// Stall timeout - if no new data received for this long during streaming, consider it stalled
// This catches cases where sources are streamed but the continuation hangs
const STREAM_STALL_TIMEOUT = 45000; // 45 seconds

// Stream chunk types from our API
interface StreamChunk {
  type: 'thinking' | 'text' | 'tool_use' | 'tool_result' | 'sources' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  error?: string;
  sources?: SourceInfo[];
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useChat(options: UseChatOptions = {}) {
  const {
    api = '/api/chat',
    onError,
    onFinish,
    initialMessages = [],
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantMessageRef = useRef<ChatMessage | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutOccurredRef = useRef(false);
  
  // Use ref to always have access to the latest messages for the API call
  // This prevents stale closure issues when extended thinking is toggled mid-conversation
  const messagesRef = useRef<ChatMessage[]>(initialMessages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Helper to safely clear timeout
  const clearTimeoutSafe = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Helper to reset state on completion/error
  const resetRequestState = useCallback(() => {
    clearTimeoutSafe();
    abortControllerRef.current = null;
    currentAssistantMessageRef.current = null;
  }, [clearTimeoutSafe]);

  // Generate unique ID for messages
  const generateId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Parse SSE data from stream
  const parseSSEData = useCallback((data: string): StreamChunk | null => {
    if (data === '[DONE]') {
      return { type: 'done' };
    }
    try {
      return JSON.parse(data) as StreamChunk;
    } catch {
      return null;
    }
  }, []);

  // Send a message and stream the response
  const sendMessage = useCallback(async (
    message: { text: string; files?: Array<{ type: string; data: string; mimeType: string }> },
    sendOptions?: SendMessageOptions
  ) => {
    // Process file attachments for state storage
    const messageAttachments: MessageAttachment[] = message.files?.map((file, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      type: 'image' as const,
      data: file.data,
      mimeType: file.mimeType,
    })) || [];

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message.text,
      createdAt: new Date(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    setStatus('submitted');
    setError(null);

    // Clear any existing timeout/abort controller
    clearTimeoutSafe();
    timeoutOccurredRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Set up timeout to prevent hung requests
    // Extended thinking can take longer, so use a generous timeout
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        console.warn('[useChat] Request timeout - aborting');
        timeoutOccurredRef.current = true;
        abortControllerRef.current.abort();
        setError(new Error('Request timed out. Please try again.'));
        setStatus('error');
        // Remove the empty assistant message on timeout
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === 'assistant' && 
              !newMessages[newMessages.length - 1]?.content) {
            newMessages.pop();
          }
          return newMessages;
        });
        resetRequestState();
      }
    }, timeout);

    // Prepare assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    };
    currentAssistantMessageRef.current = assistantMessage;

    // Add empty assistant message to state
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Use the ref to get the latest messages, avoiding stale closure issues
      // This is critical for when extended thinking is toggled mid-conversation
      const currentMessages = messagesRef.current;
      
      // Prepare request body with properly formatted messages
      const apiMessages = [...currentMessages, userMessage].map(m => {
        const baseMessage: Record<string, unknown> = {
          role: m.role,
          content: m.content,
        };
        
        // Include parts if present
        if (m.parts) {
          baseMessage.parts = m.parts;
        }
        
        // Include attachments for API (convert to expected format)
        if (m.attachments && m.attachments.length > 0) {
          baseMessage.experimental_attachments = m.attachments.map(att => ({
            type: 'image',
            data: att.data,
            mimeType: att.mimeType,
          }));
        }
        
        return baseMessage;
      });

      const body: Record<string, unknown> = {
        messages: apiMessages,
        ...sendOptions?.body,
      };

      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      // Clear timeout once we start receiving the response
      clearTimeoutSafe();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      setStatus('streaming');

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Track streaming state for stall detection
      let hasReceivedText = false;
      let hasReceivedSources = false;
      let lastChunkTime = Date.now();
      
      // Stall detection - if we receive sources but no text for too long, something's wrong
      // This catches the case where web search completes but the continuation fails
      const stallCheckInterval = setInterval(() => {
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        
        // If we have sources but no text and stream has stalled, abort
        if (hasReceivedSources && !hasReceivedText && timeSinceLastChunk > STREAM_STALL_TIMEOUT) {
          console.warn('[useChat] Stream stalled: sources received but no text for', STREAM_STALL_TIMEOUT, 'ms');
          if (abortControllerRef.current) {
            // Set error state with a helpful message
            setError(new Error('Response generation stalled after gathering sources. Please try again.'));
            setStatus('error');
            abortControllerRef.current.abort();
          }
        }
      }, 5000); // Check every 5 seconds

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          // Update last chunk time for stall detection
          lastChunkTime = Date.now();
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              const chunk = parseSSEData(data);
              
              if (!chunk) continue;

              if (chunk.type === 'text' && chunk.content) {
                hasReceivedText = true;
                // Append text to assistant message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant') {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: newMessages[lastIndex].content + chunk.content,
                    };
                  }
                  return newMessages;
                });
              } else if (chunk.type === 'thinking') {
                // Handle thinking chunks - including empty ones that signal "thinking started"
                // This ensures the thinking bubble appears immediately when extended thinking begins
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant') {
                    // For empty thinking chunks, initialize with empty string if not already set
                    // For non-empty chunks, append the content
                    const currentThinking = newMessages[lastIndex].thinking || '';
                    const newThinking = chunk.content ? currentThinking + chunk.content : currentThinking || '';
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      thinking: newThinking,
                    };
                  }
                  return newMessages;
                });
              } else if (chunk.type === 'tool_use') {
                // Add tool call to assistant message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant') {
                    const toolCalls = newMessages[lastIndex].toolCalls || [];
                    toolCalls.push({
                      id: generateId(),
                      name: chunk.toolName || 'unknown',
                      input: chunk.toolInput,
                      status: 'running',
                    });
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      toolCalls,
                    };
                  }
                  return newMessages;
                });
              } else if (chunk.type === 'tool_result') {
                // Update tool call with result
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant' && newMessages[lastIndex].toolCalls) {
                    const toolCalls = [...newMessages[lastIndex].toolCalls!];
                    const lastToolIndex = toolCalls.length - 1;
                    if (lastToolIndex >= 0) {
                      toolCalls[lastToolIndex] = {
                        ...toolCalls[lastToolIndex],
                        result: chunk.toolResult,
                        status: 'completed',
                      };
                      newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        toolCalls,
                      };
                    }
                  }
                  return newMessages;
                });
              } else if (chunk.type === 'sources' && chunk.sources) {
                hasReceivedSources = true;
                // Add sources/citations to assistant message (with deduplication)
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant') {
                    const existingSources = newMessages[lastIndex].sources || [];
                    const existingIds = new Set(existingSources.map(s => s.id));
                    const existingUrls = new Set(existingSources.map(s => s.url));
                    // Filter out duplicates by ID or URL
                    const newSources = chunk.sources!.filter(
                      s => !existingIds.has(s.id) && !existingUrls.has(s.url)
                    );
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      sources: [...existingSources, ...newSources],
                    };
                  }
                  return newMessages;
                });
              } else if (chunk.type === 'error') {
                throw new Error(chunk.error || 'Unknown streaming error');
              } else if (chunk.type === 'done') {
                // Stream completed - check if we have a valid response
                // If we have sources but no text, something went wrong
                if (hasReceivedSources && !hasReceivedText) {
                  console.warn('[useChat] Stream ended with sources but no text content');
                  // Don't throw - the server should have sent a fallback message
                  // If it didn't, the message will appear empty which is still better than an error
                }
                break;
              }
            }
          }
        }
      } finally {
        // Always clear the stall check interval
        clearInterval(stallCheckInterval);
      }

      setStatus('ready');
      
      // Call onFinish callback
      if (onFinish) {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === 'assistant') {
            onFinish(lastMessage);
          }
          return prev;
        });
      }

    } catch (err) {
      // Clear timeout on any error
      clearTimeoutSafe();
      
      if ((err as Error).name === 'AbortError') {
        // Request was cancelled - check if it was due to timeout
        // If timeout occurred, the timeout handler already processed the state
        if (timeoutOccurredRef.current) {
          return;
        }
        // Otherwise it was a manual cancel, just reset to ready
        setStatus('ready');
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useChat] Error during message send:', error.message);
      setError(error);
      setStatus('error');
      
      // Remove the empty assistant message on error
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant' && 
            !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop();
        }
        return newMessages;
      });

      if (onError) {
        onError(error);
      }
    } finally {
      resetRequestState();
    }
  // Note: We intentionally don't include `messages` in deps - we use messagesRef instead
  // This prevents stale closure issues when toggling settings mid-conversation
  }, [api, generateId, parseSSEData, onError, onFinish, timeout, clearTimeoutSafe, resetRequestState]);

  // Stop the current streaming request
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus('ready');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeoutSafe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearTimeoutSafe]);

  return {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    stop,
    clearMessages,
    // Alias for backwards compatibility
    isLoading: status === 'submitted' || status === 'streaming',
  };
}

export default useChat;



