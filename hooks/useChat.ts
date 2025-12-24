'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Array<{ type: string; text?: string }>;
  createdAt?: Date;
  // Extended features
  thinking?: string;
  toolCalls?: ToolCall[];
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
}

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

// Stream chunk types from our API
interface StreamChunk {
  type: 'thinking' | 'text' | 'tool_use' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  error?: string;
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
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantMessageRef = useRef<ChatMessage | null>(null);

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
    message: { text: string; files?: unknown },
    options?: SendMessageOptions
  ) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message.text,
      createdAt: new Date(),
    };

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    setStatus('submitted');
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

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
      // Prepare request body
      const body: Record<string, unknown> = {
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
          ...(m.parts ? { parts: m.parts } : {}),
        })),
        ...options?.body,
      };

      // Handle file attachments
      if (message.files) {
        const lastMessage = body.messages as Array<{ role: string; content: string; experimental_attachments?: unknown[] }>;
        const lastIndex = lastMessage.length - 1;
        lastMessage[lastIndex].experimental_attachments = message.files as unknown[];
      }

      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

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

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

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
            } else if (chunk.type === 'thinking' && chunk.content) {
              // Append thinking to assistant message
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.role === 'assistant') {
                  newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    thinking: (newMessages[lastIndex].thinking || '') + chunk.content,
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
            } else if (chunk.type === 'error') {
              throw new Error(chunk.error || 'Unknown streaming error');
            } else if (chunk.type === 'done') {
              // Stream completed
              break;
            }
          }
        }
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
      if ((err as Error).name === 'AbortError') {
        // Request was cancelled
        setStatus('ready');
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
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
      abortControllerRef.current = null;
      currentAssistantMessageRef.current = null;
    }
  }, [api, messages, generateId, parseSSEData, onError, onFinish]);

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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



