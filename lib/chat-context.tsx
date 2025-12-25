'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { chatService, type ChatSession, type ChatMessage } from '@/lib/supabase/chat-service';

export interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages?: ChatMessage[];
}

interface ChatContextValue {
  chatHistory: ChatHistoryItem[];
  addToHistory: (title: string, preview: string, messages?: ChatMessage[]) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  getSessionMessages: (id: string) => Promise<ChatMessage[] | null>;
  shouldResetChat: boolean;
  triggerChatReset: () => void;
  acknowledgeChatReset: () => void;
  isLoadingHistory: boolean;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  // For loading a past session into the chat
  sessionToLoad: string | null;
  loadSession: (id: string) => void;
  acknowledgeSessionLoad: () => void;
  // For scrolling to bottom after session load
  shouldScrollToBottom: boolean;
  acknowledgeShouldScrollToBottom: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [shouldResetChat, setShouldResetChat] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [sessionToLoad, setSessionToLoad] = useState<string | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // Load chat history from Supabase on mount
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const sessions = await chatService.getSessions(20);
      const historyItems: ChatHistoryItem[] = sessions.map((session: ChatSession) => ({
        id: session.id,
        title: session.title,
        preview: session.preview || '',
        timestamp: new Date(session.updated_at),
        messages: session.messages,
      }));
      setChatHistory(historyItems);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Load history on initial mount
  useEffect(() => {
    if (!hasLoadedInitial) {
      loadHistory();
      setHasLoadedInitial(true);
    }
  }, [hasLoadedInitial, loadHistory]);

  const addToHistory = useCallback(async (title: string, preview: string, messages?: ChatMessage[]) => {
    // Save to Supabase
    try {
      const formattedMessages: ChatMessage[] = messages || [];
      const session = await chatService.saveSession(
        title.slice(0, 100),
        formattedMessages,
        currentSessionId || undefined
      );
      
      if (session) {
        // Update local state
        setChatHistory(prev => {
          // If updating existing session, replace it
          if (currentSessionId) {
            return prev.map(item => 
              item.id === currentSessionId 
                ? {
                    id: session.id,
                    title: session.title,
                    preview: session.preview || '',
                    timestamp: new Date(session.updated_at),
                    messages: session.messages,
                  }
                : item
            );
          }
          // Otherwise add new session at the top
          return [{
            id: session.id,
            title: session.title,
            preview: session.preview || '',
            timestamp: new Date(session.updated_at),
            messages: session.messages,
          }, ...prev.slice(0, 19)]; // Keep max 20 items
        });
        
        // Update current session ID for future updates
        setCurrentSessionId(session.id);
      }
    } catch (error) {
      console.error('Error saving to history:', error);
      // Fallback to local-only storage
      const newItem: ChatHistoryItem = {
        id: Date.now().toString(),
        title: title.slice(0, 50),
        preview: preview.slice(0, 100),
        timestamp: new Date(),
        messages,
      };
      setChatHistory(prev => [newItem, ...prev.slice(0, 19)]);
    }
  }, [currentSessionId]);

  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      const success = await chatService.deleteSession(id);
      if (success) {
        setChatHistory(prev => prev.filter(item => item.id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting from history:', error);
    }
  }, [currentSessionId]);

  const getSessionMessages = useCallback(async (id: string): Promise<ChatMessage[] | null> => {
    // First check if we already have the messages in local state
    // This handles cases where sessions were saved locally or already loaded
    const localSession = chatHistory.find(item => item.id === id);
    if (localSession?.messages && localSession.messages.length > 0) {
      return localSession.messages;
    }
    
    // Fall back to fetching from Supabase
    try {
      const session = await chatService.getSession(id);
      return session?.messages || null;
    } catch (error) {
      console.error('Error getting session messages:', error);
      return null;
    }
  }, [chatHistory]);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setCurrentSessionId(null);
  }, []);

  const triggerChatReset = useCallback(() => {
    setShouldResetChat(true);
    setCurrentSessionId(null); // Start a fresh session
  }, []);

  const acknowledgeChatReset = useCallback(() => {
    setShouldResetChat(false);
  }, []);

  const loadSession = useCallback((id: string) => {
    setSessionToLoad(id);
    setCurrentSessionId(id);
    setShouldScrollToBottom(true);
  }, []);

  const acknowledgeSessionLoad = useCallback(() => {
    setSessionToLoad(null);
  }, []);

  const acknowledgeShouldScrollToBottom = useCallback(() => {
    setShouldScrollToBottom(false);
  }, []);

  return (
    <ChatContext.Provider value={{
      chatHistory,
      addToHistory,
      clearHistory,
      loadHistory,
      deleteFromHistory,
      getSessionMessages,
      shouldResetChat,
      triggerChatReset,
      acknowledgeChatReset,
      isLoadingHistory,
      currentSessionId,
      setCurrentSessionId,
      sessionToLoad,
      loadSession,
      acknowledgeSessionLoad,
      shouldScrollToBottom,
      acknowledgeShouldScrollToBottom,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

