'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CHAT_TIMEOUTS, CHAT_LIMITS } from '@/lib/constants/chat';
import {
  ChatError,
  InputValidationError,
  StreamStallError,
  TimeoutError,
  RateLimitError,
  toChatError,
  isRetryable,
} from '@/lib/utils/chat-errors';

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

// Quick action metadata for form-based submissions
export interface QuickActionMetadata {
  /** The type of quick action (e.g., 'create-post-copy') */
  type: string;
  /** The form data submitted by the user */
  formData: {
    channelId: string;
    channelLabel: string;
    channelIcon?: string;
    contentFormat: string;
    contentFormatLabel: string;
    contentSubtypeLabels: string[];
    goalLabel: string;
    keyMessage: string;
    outputPreferences?: {
      variations: number;
      hashtags: string;
      captionLength: string;
      includeCta: string;
    };
  };
  /** Brand voice context (if retrieved) */
  brandVoice?: {
    hasVoiceContext: boolean;
  };
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
  // Quick action metadata (for form-based submissions)
  quickAction?: QuickActionMetadata;
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
  /** Quick action metadata to attach to the message */
  quickAction?: QuickActionMetadata;
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
// INPUT VALIDATION
// ============================================

/**
 * Validate message content and attachments before sending
 * @throws InputValidationError if validation fails
 */
function validateInput(
  content: string,
  attachments?: Array<{ type: string; data: string; mimeType: string }>
): void {
  // Validate message length
  if (content.length > CHAT_LIMITS.MAX_MESSAGE_LENGTH) {
    throw new InputValidationError(
      `Message exceeds maximum length of ${CHAT_LIMITS.MAX_MESSAGE_LENGTH} characters`,
      'INPUT_TOO_LARGE',
      {
        field: 'content',
        maxValue: CHAT_LIMITS.MAX_MESSAGE_LENGTH,
        actualValue: content.length,
      }
    );
  }

  // Validate attachment count
  if (attachments && attachments.length > CHAT_LIMITS.MAX_ATTACHMENTS) {
    throw new InputValidationError(
      `Too many attachments. Maximum is ${CHAT_LIMITS.MAX_ATTACHMENTS}`,
      'TOO_MANY_ATTACHMENTS',
      {
        field: 'attachments',
        maxValue: CHAT_LIMITS.MAX_ATTACHMENTS,
        actualValue: attachments.length,
      }
    );
  }

  // Validate total attachment size
  if (attachments && attachments.length > 0) {
    const totalSize = attachments.reduce((sum, att) => {
      // Base64 data URLs have overhead, estimate actual size
      const base64Data = att.data.split(',')[1] || att.data;
      return sum + Math.ceil(base64Data.length * 0.75); // Base64 to bytes approximation
    }, 0);

    if (totalSize > CHAT_LIMITS.MAX_ATTACHMENT_SIZE) {
      throw new InputValidationError(
        `Total attachment size exceeds ${Math.round(CHAT_LIMITS.MAX_ATTACHMENT_SIZE / 1024 / 1024)}MB limit`,
        'ATTACHMENTS_TOO_LARGE',
        {
          field: 'attachments',
          maxValue: CHAT_LIMITS.MAX_ATTACHMENT_SIZE,
          actualValue: totalSize,
        }
      );
    }
  }
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
    timeout = CHAT_TIMEOUTS.REQUEST_TIMEOUT,
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
    // Validate input before proceeding
    try {
      validateInput(message.text, message.files);
    } catch (validationError) {
      const chatError = validationError instanceof ChatError
        ? validationError
        : toChatError(validationError);
      setError(chatError);
      setStatus('error');
      if (onError) {
        onError(chatError);
      }
      return;
    }

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
      quickAction: sendOptions?.quickAction,
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
        console.warn('[useChat] Request timeout - aborting after', timeout, 'ms');
        timeoutOccurredRef.current = true;
        abortControllerRef.current.abort();
        const timeoutError = new TimeoutError(
          'Request timed out. Please try again.',
          'TIMEOUT',
          timeout
        );
        setError(timeoutError);
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
        if (onError) {
          onError(timeoutError);
        }
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
      const streamStartTime = Date.now();

      // Stall detection - detects both:
      // 1. Sources received but no text (web search completed but continuation failed)
      // 2. Stream started but no content for extended period (text-only stall)
      const stallCheckInterval = setInterval(() => {
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        const streamDuration = Date.now() - streamStartTime;

        // Stall detection conditions:
        // 1. Sources received but no text (existing case)
        const sourcesWithoutText = hasReceivedSources && !hasReceivedText;

        // 2. Stream started but no content for STALL_TIMEOUT (new: text-only stall detection)
        //    Only check after minimum stream duration to avoid false positives during initial connection
        const noContentStall =
          streamDuration > CHAT_TIMEOUTS.MIN_STREAM_DURATION_FOR_STALL_CHECK &&
          !hasReceivedText &&
          timeSinceLastChunk > CHAT_TIMEOUTS.STREAM_STALL_TIMEOUT;

        if ((sourcesWithoutText || noContentStall) && timeSinceLastChunk > CHAT_TIMEOUTS.STREAM_STALL_TIMEOUT) {
          console.warn('[useChat] Stream stalled:', {
            hasReceivedSources,
            hasReceivedText,
            timeSinceLastChunk,
            streamDuration,
            sourcesWithoutText,
            noContentStall,
          });

          if (abortControllerRef.current) {
            const stallError = new StreamStallError(
              sourcesWithoutText
                ? 'Response generation stalled after gathering sources. Please try again.'
                : 'Response generation stalled. Please try again.',
              'STREAM_STALL',
              {
                stallDurationMs: timeSinceLastChunk,
                hadReceivedText: hasReceivedText,
                hadReceivedSources: hasReceivedSources,
              }
            );
            setError(stallError);
            setStatus('error');
            abortControllerRef.current.abort();
            if (onError) {
              onError(stallError);
            }
          }
        }
      }, CHAT_TIMEOUTS.STALL_CHECK_INTERVAL);

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

      const rawError = err as Error;

      // Handle abort errors (timeout or manual cancellation)
      if (rawError.name === 'AbortError') {
        // If timeout occurred, the timeout handler already processed the state
        if (timeoutOccurredRef.current) {
          return;
        }
        // Otherwise it was a manual cancel, just reset to ready
        setStatus('ready');
        return;
      }

      // Convert to typed ChatError for consistent handling
      const chatError = toChatError(err);
      console.error('[useChat] Error during message send:', {
        code: chatError instanceof ChatError ? chatError.code : 'UNKNOWN',
        message: chatError.message,
        retryable: isRetryable(chatError),
      });

      setError(chatError);
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
        onError(chatError);
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



