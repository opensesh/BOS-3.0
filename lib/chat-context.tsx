'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { chatService, type ChatSession, type ChatMessage } from '@/lib/supabase/chat-service';
import { projectsService, type Project } from '@/lib/supabase/projects-service';
import type { WritingStyle } from '@/components/ui/writing-style-selector';

export interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages?: ChatMessage[];
  projectId?: string | null;
  spaceSlug?: string | null;
}

export interface SpaceOption {
  id: string;
  slug: string;
  title: string;
  icon?: string;
}

interface ChatContextValue {
  chatHistory: ChatHistoryItem[];
  addToHistory: (title: string, preview: string, messages?: ChatMessage[]) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  renameChat: (id: string, newTitle: string) => Promise<boolean>;
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
  // Projects
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  assignChatToProject: (chatId: string, projectId: string | null) => Promise<void>;
  isLoadingProjects: boolean;
  // Spaces
  spaces: SpaceOption[];
  currentSpace: SpaceOption | null;
  setCurrentSpace: (space: SpaceOption | null) => void;
  loadSpaces: () => void;
  createSpace: (title: string) => SpaceOption | null;
  assignChatToSpace: (chatId: string, spaceSlug: string | null) => Promise<void>;
  // Writing style
  currentWritingStyle: WritingStyle | null;
  setCurrentWritingStyle: (style: WritingStyle | null) => void;
  // Extended thinking
  extendedThinkingEnabled: boolean;
  setExtendedThinkingEnabled: (enabled: boolean) => void;
  // Data connectors (web search, brand search)
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  brandSearchEnabled: boolean;
  setBrandSearchEnabled: (enabled: boolean) => void;
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
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [hasLoadedProjects, setHasLoadedProjects] = useState(false);
  // Spaces state
  const [spaces, setSpaces] = useState<SpaceOption[]>([]);
  const [currentSpace, setCurrentSpace] = useState<SpaceOption | null>(null);
  const [hasLoadedSpaces, setHasLoadedSpaces] = useState(false);
  // Writing style state
  const [currentWritingStyle, setCurrentWritingStyle] = useState<WritingStyle | null>(null);
  // Extended thinking state (per conversation)
  const [extendedThinkingEnabled, setExtendedThinkingEnabled] = useState(false);
  // Data connector settings (persist across conversation)
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [brandSearchEnabled, setBrandSearchEnabled] = useState(true);

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
      // #region agent log
      historyItems.forEach((item, i) => { if (!item.id || item.id === '') fetch('http://127.0.0.1:7242/ingest/3e9d966b-9057-4dd8-8a82-1447a767070c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-context.tsx:loadHistory',message:'Empty chat history ID detected',data:{index:i,id:item.id,title:item.title},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{}); });
      // #endregion
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

  // Load projects
  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const loadedProjects = await projectsService.getProjects();
      // #region agent log
      loadedProjects.forEach((p, i) => { if (!p.id || p.id === '') fetch('http://127.0.0.1:7242/ingest/3e9d966b-9057-4dd8-8a82-1447a767070c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-context.tsx:loadProjects',message:'Empty project ID detected',data:{index:i,id:p.id,name:p.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{}); });
      // #endregion
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Load projects on initial mount
  useEffect(() => {
    if (!hasLoadedProjects) {
      loadProjects();
      setHasLoadedProjects(true);
    }
  }, [hasLoadedProjects, loadProjects]);

  // Create a new project
  const createProject = useCallback(async (name: string): Promise<Project | null> => {
    try {
      const project = await projectsService.createProject({ name });
      if (project) {
        setProjects(prev => [project, ...prev]);
        return project;
      }
      return null;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }, []);

  // Assign a chat to a project
  const assignChatToProject = useCallback(async (chatId: string, projectId: string | null) => {
    try {
      const success = await projectsService.assignChatToProject(chatId, projectId);
      if (success) {
        // Update local chat history state
        setChatHistory(prev =>
          prev.map(item =>
            item.id === chatId ? { ...item, projectId } : item
          )
        );
      }
    } catch (error) {
      console.error('Error assigning chat to project:', error);
    }
  }, []);

  // Load spaces from localStorage (since spaces use localStorage currently)
  const loadSpaces = useCallback(() => {
    try {
      const stored = localStorage.getItem('bos-spaces');
      if (stored) {
        const parsedSpaces = JSON.parse(stored);
        const spaceOptions: SpaceOption[] = parsedSpaces.map((s: { id: string; slug: string; title: string; icon?: string }) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          icon: s.icon,
        }));
        setSpaces(spaceOptions);
      }
    } catch (error) {
      console.error('Error loading spaces:', error);
    }
  }, []);

  // Load spaces on initial mount
  useEffect(() => {
    if (!hasLoadedSpaces) {
      loadSpaces();
      setHasLoadedSpaces(true);
    }
  }, [hasLoadedSpaces, loadSpaces]);

  // Create a new space
  const createSpace = useCallback((title: string): SpaceOption | null => {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const newSpace: SpaceOption = {
        id,
        slug,
        title,
      };
      
      // Update local state
      setSpaces(prev => [...prev, newSpace]);
      
      // Save to localStorage
      const stored = localStorage.getItem('bos-spaces');
      const existingSpaces = stored ? JSON.parse(stored) : [];
      const fullSpace = {
        id,
        slug,
        title,
        isPrivate: true,
        lastModified: 'Just now',
        createdAt: new Date().toISOString(),
        threadCount: 0,
        files: [],
        links: [],
        instructions: '',
        tasks: [],
      };
      localStorage.setItem('bos-spaces', JSON.stringify([...existingSpaces, fullSpace]));
      
      return newSpace;
    } catch (error) {
      console.error('Error creating space:', error);
      return null;
    }
  }, []);

  // Assign a chat to a space (for now, just updates local state - can be extended to Supabase later)
  const assignChatToSpace = useCallback(async (chatId: string, spaceSlug: string | null) => {
    try {
      // Update local chat history state
      setChatHistory(prev =>
        prev.map(item =>
          item.id === chatId ? { ...item, spaceSlug } : item
        )
      );
      
      // TODO: When spaces are in Supabase, also update there
      // For now, this just tracks the assignment locally
    } catch (error) {
      console.error('Error assigning chat to space:', error);
    }
  }, []);

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

  const renameChat = useCallback(async (id: string, newTitle: string): Promise<boolean> => {
    try {
      const success = await chatService.updateChatTitle(id, newTitle);
      if (success) {
        // Update local state
        setChatHistory(prev =>
          prev.map(item =>
            item.id === id ? { ...item, title: newTitle } : item
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error renaming chat:', error);
      return false;
    }
  }, []);

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
      renameChat,
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
      // Projects
      projects,
      currentProject,
      setCurrentProject,
      loadProjects,
      createProject,
      assignChatToProject,
      isLoadingProjects,
      // Spaces
      spaces,
      currentSpace,
      setCurrentSpace,
      loadSpaces,
      createSpace,
      assignChatToSpace,
      // Writing style
      currentWritingStyle,
      setCurrentWritingStyle,
      // Extended thinking
      extendedThinkingEnabled,
      setExtendedThinkingEnabled,
      // Data connectors
      webSearchEnabled,
      setWebSearchEnabled,
      brandSearchEnabled,
      setBrandSearchEnabled,
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

