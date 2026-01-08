'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChat } from '@/hooks/useChat';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mic,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { BackgroundGradient } from './BackgroundGradient';
import { WelcomeHeader, QuickAccessPanels } from './home';
import { PlusMenu } from './ui/plus-menu';
import { ExtendedThinkingToggle } from './ui/extended-thinking-toggle';
import { DataSourcesDropdown } from './ui/data-sources-dropdown';
import { ModelSelector } from './ui/model-selector';
import { ActiveSettingsIndicators } from './ui/active-settings-indicators';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useAttachments } from '@/hooks/useAttachments';
import { ModelId } from '@/lib/ai/providers';
import { useChatContext } from '@/lib/chat-context';
import { useCanvasContextOptional } from '@/lib/canvas-context';
import { AnimatePresence } from 'framer-motion';
import type { PageContext } from '@/lib/brand-knowledge';
import {
  FollowUpInput,
  SourceInfo,
  ImageResult,
  ChatHeader,
  ChatContent,
  AttachmentPreview,
  DragOverlay,
  LinksView,
  extractResourceCards,
  AddToProjectModal,
  AddToSpaceModal,
  CreatePostCopyForm,
  QuickActionFieldEditor,
  type FollowUpAttachment,
  type FieldType,
  type EditorMode,
} from './chat';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import type { 
  PostCopyFormData, 
  QuickActionType, 
  Channel, 
  ContentSubtype, 
  Goal, 
  ContentPillar,
  ContentFormat,
} from '@/lib/quick-actions';
import { getQuickActionConfig, QUICK_ACTIONS } from '@/lib/quick-actions';
import { useQuickActionConfig } from '@/hooks/useQuickActionConfig';
import { buildCreatePostCopyPrompt, type PromptContext } from '@/lib/quick-actions/prompt-builder';
// Article reference context (kept for potential future use)
interface ArticleContext {
  title: string;
  slug: string;
  imageUrl?: string;
}

// Ideas reference context from generate ideas
interface IdeaContext {
  title: string;
  category: string;
  slug?: string;
  generationType?: string;
  generationLabel?: string;
}


// Message attachment interface
interface MessageAttachment {
  id: string;
  type: 'image';
  data: string;
  mimeType: string;
  name?: string;
}

// Interface for parsed message with sources
interface ParsedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceInfo[];
  images?: ImageResult[];
  modelUsed?: string;
  /** Claude's thinking/reasoning content during extended thinking */
  thinking?: string;
  /** Attached images/files */
  attachments?: MessageAttachment[];
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0dc0d475-0b32-47b2-8b83-8c353392bebf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:mount',message:'ChatInterface rendered with searchParams',data:{actionParam:searchParams?.get('action'),qParam:searchParams?.get('q'),allParams:searchParams?.toString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const [selectedModel, setSelectedModel] = useState<ModelId>('auto');
  const [localInput, setLocalInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'answer' | 'resources'>('answer');
  const [articleContext, setArticleContext] = useState<ArticleContext | null>(null);
  const [ideaContext, setIdeaContext] = useState<IdeaContext | null>(null);
  const [hasProcessedUrlParams, setHasProcessedUrlParams] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isAddToProjectModalOpen, setIsAddToProjectModalOpen] = useState(false);
  const [isAddToSpaceModalOpen, setIsAddToSpaceModalOpen] = useState(false);
  // Quick action form state
  const [showQuickActionForm, setShowQuickActionForm] = useState(false);
  const [quickActionType, setQuickActionType] = useState<QuickActionType | null>(null);
  const [hasProcessedActionParam, setHasProcessedActionParam] = useState(false);
  // Field editor modal state
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [fieldEditorType, setFieldEditorType] = useState<FieldType>('channel');
  const [fieldEditorMode, setFieldEditorMode] = useState<EditorMode>('add');
  const [fieldEditorItem, setFieldEditorItem] = useState<unknown>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track whether user is near bottom for smart auto-scroll
  // This allows users to scroll up during streaming without being forced back down
  const isNearBottomRef = useRef(true);
  const userHasScrolledUpRef = useRef(false);

  // Breadcrumbs context
  const { setBreadcrumbs, setPageTitle, setQuickAction } = useBreadcrumbs();

  // Chat context for cross-component communication
  const { 
    shouldResetChat, 
    acknowledgeChatReset, 
    addToHistory, 
    setCurrentSessionId,
    currentSessionId,
    sessionToLoad,
    acknowledgeSessionLoad,
    getSessionMessages,
    shouldScrollToBottom,
    acknowledgeShouldScrollToBottom,
    renameChat,
    chatHistory,
    // Projects
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    assignChatToProject,
    // Spaces
    spaces,
    currentSpace,
    setCurrentSpace,
    createSpace,
    assignChatToSpace,
    // Writing style
    currentWritingStyle,
    setCurrentWritingStyle,
    // Extended thinking
    extendedThinkingEnabled,
    setExtendedThinkingEnabled,
    // Data connectors (from context for persistence)
    webSearchEnabled,
    setWebSearchEnabled,
    brandSearchEnabled,
    setBrandSearchEnabled,
    // Quick Actions
    activeQuickAction,
    cancelQuickAction,
    submitQuickAction,
  } = useChatContext();

  // Canvas context for adjusting layout when canvas is open
  const canvasContext = useCanvasContextOptional();
  const isCanvasOpen = canvasContext?.isCanvasOpen ?? false;
  const canvasPanelMode = canvasContext?.panelMode ?? 'half';
  const canvasWidthPercent = canvasContext?.canvasWidthPercent ?? 50;

  // Quick action config from Supabase
  const quickActionConfig = useQuickActionConfig();

  // Custom useChat hook for native SDK streaming
  const { messages, sendMessage, status, error, setMessages } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Chat error:', err);
      setSubmitError(err.message || 'An error occurred while sending your message');
    },
  });

  // Derive hasMessages early so it can be used in effects
  const hasMessages = messages.length > 0;
  
  // Check if there's a real AI response (not just a quick action pre-prompt)
  const hasAssistantResponse = useMemo(() => {
    return messages.some(m => m.role === 'assistant');
  }, [messages]);

  // Helper to get message content (must be defined before callbacks that use it)
  const getMessageContent = useCallback((message: { content?: string; parts?: Array<{ type: string; text?: string }> }): string => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((part): part is { type: string; text: string } => 
          part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string'
        )
        .map((part) => part.text)
        .join('');
    }
    return '';
  }, []);

  // Navigate to Recent Chats (back button handler)
  const handleBackToChats = useCallback(() => {
    // Save current chat to history if there are complete conversations (user + assistant)
    // Don't save abandoned quick actions that only have a user message
    if (messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      const firstAssistantMessage = messages.find(m => m.role === 'assistant');
      // Only save if there's both a user message AND an assistant response
      if (firstUserMessage && firstAssistantMessage) {
        // For quick action chats, use a neutral placeholder until the real title is generated
        // This prevents "Create a post for..." from showing as the title
        const title = generatedTitle || (quickActionType ? 'New conversation' : getMessageContent(firstUserMessage).slice(0, 50)) || 'Untitled Chat';
        const preview = getMessageContent(firstAssistantMessage).slice(0, 100);
        const chatMessages = messages.map(m => {
          const msgSources = (m as { sources?: SourceInfo[] }).sources;
          const msgAttachments = (m as { attachments?: MessageAttachment[] }).attachments;
          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: getMessageContent(m),
            timestamp: new Date().toISOString(),
            sources: msgSources,
            attachments: msgAttachments?.map(a => ({
              id: a.id,
              type: a.type,
              data: a.data,
              mimeType: a.mimeType,
              name: a.name,
            })),
          };
        });
        addToHistory(title, preview, chatMessages, currentProject?.id, quickActionType);
      }
    }
    // Navigate to Recent Chats
    router.push('/chats');
  }, [messages, generatedTitle, getMessageContent, addToHistory, router, currentProject, quickActionType]);

  // Reset chat function
  const resetChat = useCallback(() => {
    setMessages([]);
    setActiveTab('answer');
    setLocalInput('');
    setSubmitError(null);
    setGeneratedTitle(null);
    setIsGeneratingTitle(false);
  }, [setMessages]);


  // Generate a semantic title for the conversation
  const generateTitle = useCallback(async (msgs: typeof messages) => {
    if (isGeneratingTitle || generatedTitle) return;
    
    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map(m => ({
            role: m.role,
            content: getMessageContent(m),
          })),
        }),
      });
      
      if (response.ok) {
        const { title } = await response.json();
        if (title) {
          setGeneratedTitle(title);
          
          // Immediately update the database with the generated title
          // This fixes the issue where chats are saved with fallback titles
          if (currentSessionId) {
            renameChat(currentSessionId, title);
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [isGeneratingTitle, generatedTitle, getMessageContent, currentSessionId, renameChat]);


  // Listen for reset signals from context (e.g., sidebar navigation)
  useEffect(() => {
    if (shouldResetChat) {
      // Save current chat to history if there are complete conversations (user + assistant)
      // Don't save abandoned quick actions that only have a user message
      if (messages.length > 0) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        const firstAssistantMessage = messages.find(m => m.role === 'assistant');
        // Only save if there's both a user message AND an assistant response
        if (firstUserMessage && firstAssistantMessage) {
          // For quick action chats, use a neutral placeholder until the real title is generated
          // This prevents "Create a post for..." from showing as the title
          const title = generatedTitle || (quickActionType ? 'New conversation' : getMessageContent(firstUserMessage).slice(0, 50)) || 'Untitled Chat';
          const preview = getMessageContent(firstAssistantMessage).slice(0, 100);
          // Convert messages to the format expected by chat history
          // Include sources and attachments so they persist when reloading chat sessions
          const chatMessages = messages.map(m => {
            // Extract sources and attachments from the message if available
            const msgSources = (m as { sources?: SourceInfo[] }).sources;
            const msgAttachments = (m as { attachments?: MessageAttachment[] }).attachments;
            return {
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: getMessageContent(m),
              timestamp: new Date().toISOString(),
              sources: msgSources,
              // Include attachments for persistence
              attachments: msgAttachments?.map(a => ({
                id: a.id,
                type: a.type,
                data: a.data,
                mimeType: a.mimeType,
                name: a.name,
              })),
            };
          });
          addToHistory(title, preview, chatMessages, currentProject?.id, quickActionType);
        }
      }
      resetChat();
      setArticleContext(null);
      setIdeaContext(null);
      setCurrentSessionId(null);
      acknowledgeChatReset();
    }
  }, [shouldResetChat, acknowledgeChatReset, resetChat, messages, addToHistory, getMessageContent, setCurrentSessionId, generatedTitle, currentProject, quickActionType]);

  // Listen for session load signals from context (e.g., clicking chat history)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0dc0d475-0b32-47b2-8b83-8c353392bebf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:sessionLoadEffect',message:'Session load effect triggered',data:{sessionToLoad,chatHistoryLength:chatHistory.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (sessionToLoad) {
      const loadSessionMessages = async () => {
        try {
          // Look up the session in chat history to restore title and quickActionType
          const loadedSession = chatHistory.find(chat => chat.id === sessionToLoad);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/0dc0d475-0b32-47b2-8b83-8c353392bebf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:sessionLoadEffect:found',message:'Session found in history',data:{sessionToLoad,foundSession:!!loadedSession,title:loadedSession?.title,quickActionType:loadedSession?.quickActionType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          // Restore the session's title (prevents re-generating title for existing chats)
          if (loadedSession?.title) {
            setGeneratedTitle(loadedSession.title);
          }
          
          // Restore the session's quickActionType (shows Quick Action badge in breadcrumbs)
          if (loadedSession?.quickActionType) {
            setQuickActionType(loadedSession.quickActionType as QuickActionType);
          } else {
            setQuickActionType(null);
          }
          
          const sessionMessages = await getSessionMessages(sessionToLoad);
          if (sessionMessages && sessionMessages.length > 0) {
            // Convert ChatMessage[] to the format expected by useChat
            // Include sources and attachments so they display in the loaded session
            const formattedMessages = sessionMessages.map((msg, idx) => ({
              id: msg.id || `msg-${idx}`,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              sources: msg.sources,
              // Restore attachments for user messages
              attachments: msg.attachments?.map(a => ({
                id: a.id,
                type: a.type as 'image',
                data: a.data,
                mimeType: a.mimeType,
                name: a.name,
              })),
            }));
            setMessages(formattedMessages);
            setActiveTab('answer');
            setLocalInput('');
            setSubmitError(null);
            // Reset scroll tracking for loaded session
            isNearBottomRef.current = true;
            userHasScrolledUpRef.current = false;
          }
        } catch (error) {
          console.error('Error loading session:', error);
        } finally {
          acknowledgeSessionLoad();
        }
      };
      loadSessionMessages();
    }
  }, [sessionToLoad, getSessionMessages, acknowledgeSessionLoad, setMessages, chatHistory]);

  // Auto-save session when streaming completes (status changes from streaming to ready)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    // Only save when transitioning from streaming/submitted to ready with messages
    if (
      (prevStatusRef.current === 'streaming' || prevStatusRef.current === 'submitted') &&
      status === 'ready' &&
      messages.length > 0
    ) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      
      if (firstUserMessage && lastAssistantMessage) {
        // Generate semantic title if we haven't already
        // Only generate after first response (2 messages: user + assistant)
        if (!generatedTitle && messages.length >= 2) {
          generateTitle(messages);
        }
        
        // For quick action chats, use a neutral placeholder until the real title is generated
        // This prevents "Create a post for..." from showing as the title
        const title = generatedTitle || (quickActionType ? 'New conversation' : getMessageContent(firstUserMessage).slice(0, 100)) || 'Untitled Chat';
        const preview = getMessageContent(lastAssistantMessage).slice(0, 150);
        
        // Convert messages to chat history format
        // Include sources and attachments so they persist when reloading chat sessions
        const chatMessages = messages.map(m => {
          // Extract sources and attachments from the message if available
          const msgSources = (m as { sources?: SourceInfo[] }).sources;
          const msgAttachments = (m as { attachments?: MessageAttachment[] }).attachments;
          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: getMessageContent(m),
            timestamp: new Date().toISOString(),
            sources: msgSources,
            // Include attachments for persistence
            attachments: msgAttachments?.map(a => ({
              id: a.id,
              type: a.type,
              data: a.data,
              mimeType: a.mimeType,
              name: a.name,
            })),
          };
        });
        
        // Save to history (this also updates Supabase)
        // Pass the current project ID so chats are associated with projects
        addToHistory(title, preview, chatMessages, currentProject?.id, quickActionType);
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, addToHistory, getMessageContent, generatedTitle, generateTitle, currentProject, quickActionType]);

  // Process URL search params for article follow-up queries or prompt pre-fill
  useEffect(() => {
    if (hasProcessedUrlParams) return;

    const query = searchParams.get('q');
    const articleRef = searchParams.get('articleRef');
    const articleTitle = searchParams.get('articleTitle');
    const articleImage = searchParams.get('articleImage');

    // Handle article context queries (from article pages)
    if (query && articleRef && articleTitle) {
      // Mark as processed immediately to prevent re-runs
      setHasProcessedUrlParams(true);
      
      // Reset existing messages to ensure proper message alternation
      setMessages([]);
      
      // Decode the title (URL params might have encoding issues)
      const decodedTitle = decodeURIComponent(articleTitle).replace(/&amp;/g, '&');
      const decodedImage = articleImage ? decodeURIComponent(articleImage).replace(/&amp;/g, '&') : undefined;
      
      // Try to get full article context from sessionStorage (set by AskFollowUp)
      let storedArticleContext: { 
        title: string; 
        slug: string; 
        summary?: string; 
        sections?: string[];
        sourceCount?: number;
      } | null = null;
      
      try {
        const stored = sessionStorage.getItem('articleContext');
        if (stored && stored.trim() !== '') {
          storedArticleContext = JSON.parse(stored);
          // Clear it after reading
          sessionStorage.removeItem('articleContext');
        }
      } catch (e) {
        console.error('Failed to parse stored article context:', e);
      }
      
      // Set the article context for UI display
      setArticleContext({
        title: decodedTitle,
        slug: articleRef,
        imageUrl: decodedImage,
      });

      // Clear URL params without reload
      router.replace('/', { scroll: false });

      // Auto-submit the query with longer delay to ensure state is fully cleared
      // Using requestAnimationFrame + setTimeout for more reliable timing
      requestAnimationFrame(() => {
        setTimeout(async () => {
          try {
            const decodedQuery = decodeURIComponent(query);
            console.log('Auto-submitting article follow-up:', { 
              query: decodedQuery, 
              model: selectedModel,
              hasStoredContext: !!storedArticleContext,
              summaryLength: storedArticleContext?.summary?.length || 0,
            });
            // Build context for the API with full article content
            const context: PageContext = {
              type: 'article',
              article: {
                title: decodedTitle,
                slug: articleRef,
                summary: storedArticleContext?.summary,
                sections: storedArticleContext?.sections,
                sourceCount: storedArticleContext?.sourceCount,
              },
            };
            // Include current connector settings
            const currentConnectors = {
              web: webSearchEnabled,
              brand: brandSearchEnabled,
              brain: false,
              discover: false,
            };
            await sendMessage({ text: decodedQuery }, { body: { model: selectedModel, context, connectors: currentConnectors, extendedThinking: extendedThinkingEnabled, writingStyle: currentWritingStyle?.id || null } });
          } catch (err) {
            console.error('Failed to send article follow-up:', err);
            setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
          }
        }, 100);
      });
    }
    // Handle standalone query (from ideas prompts / generate ideas)
    else if (query && !articleRef) {
      // Mark as processed immediately to prevent re-runs
      setHasProcessedUrlParams(true);
      
      // Reset existing messages to ensure proper message alternation
      setMessages([]);
      setArticleContext(null);
      
      // Check for idea context in URL params (support both old and new param names)
      const ideaTitle = searchParams.get('ideaTitle') || searchParams.get('inspirationTitle');
      const ideaCategory = searchParams.get('ideaCategory') || searchParams.get('inspirationCategory');
      const ideaSlug = searchParams.get('ideaSlug') || searchParams.get('inspirationSlug');
      const generationType = searchParams.get('generationType');
      const generationLabel = searchParams.get('generationLabel');
      
      if (ideaTitle && ideaCategory) {
        setIdeaContext({
          title: decodeURIComponent(ideaTitle),
          category: decodeURIComponent(ideaCategory),
          slug: ideaSlug ? decodeURIComponent(ideaSlug) : undefined,
          generationType: generationType || undefined,
          generationLabel: generationLabel ? decodeURIComponent(generationLabel) : undefined,
        });
      } else {
        setIdeaContext(null);
      }
      
      // Clear URL params without reload
      router.replace('/', { scroll: false });

      // Auto-submit the query with longer delay to ensure state is fully cleared
      requestAnimationFrame(() => {
        setTimeout(async () => {
          try {
            const decodedQuery = decodeURIComponent(query);
            console.log('Auto-submitting idea query:', { query: decodedQuery, model: selectedModel });
            // Build context for the API if we have idea context
            const context: PageContext | undefined = (ideaTitle && ideaCategory) ? {
              type: 'idea',
              idea: {
                title: decodeURIComponent(ideaTitle),
                category: decodeURIComponent(ideaCategory),
                generationType: generationType || undefined,
                generationLabel: generationLabel ? decodeURIComponent(generationLabel) : undefined,
              },
            } : undefined;
            // Include current connector settings
            const currentConnectors = {
              web: webSearchEnabled,
              brand: brandSearchEnabled,
              brain: false,
              discover: false,
            };
            await sendMessage({ text: decodedQuery }, { body: { model: selectedModel, context, connectors: currentConnectors, extendedThinking: extendedThinkingEnabled, writingStyle: currentWritingStyle?.id || null } });
          } catch (err) {
            console.error('Failed to send idea generation:', err);
            setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
          }
        }, 100);
      });
    }
  }, [searchParams, router, sendMessage, setMessages, hasProcessedUrlParams, selectedModel, setSubmitError, webSearchEnabled, brandSearchEnabled, extendedThinkingEnabled, currentWritingStyle]);

  // Handle quick action URL parameter (e.g., ?action=create-post-copy)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0dc0d475-0b32-47b2-8b83-8c353392bebf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:actionParamEffect',message:'Quick action effect triggered',data:{hasProcessedActionParam,action:searchParams.get('action'),hasMessages:messages.length>0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (hasProcessedActionParam) return;
    
    const action = searchParams.get('action') as QuickActionType | null;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0dc0d475-0b32-47b2-8b83-8c353392bebf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:actionParamEffect:check',message:'Checking action param',data:{action,foundInQuickActions:!!QUICK_ACTIONS.find(a=>a.id===action)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (action && QUICK_ACTIONS.find(a => a.id === action)) {
      setHasProcessedActionParam(true);
      
      // Get the quick action config
      const actionConfig = getQuickActionConfig(action);
      if (!actionConfig) return;
      
      // Reset existing state
      setMessages([]);
      setArticleContext(null);
      setIdeaContext(null);
      
      // Add the pre-prompt as a user message
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: actionConfig.prePrompt,
      };
      setMessages([userMessage]);
      
      // Show the quick action form
      setQuickActionType(action);
      setShowQuickActionForm(true);
      
      // Clear URL params
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router, setMessages, hasProcessedActionParam]);

  // status can be: 'submitted' | 'streaming' | 'ready' | 'error'
  const isLoading = status === 'submitted' || status === 'streaming';
  
  // Show title loading for quick actions from submit until title is ready
  // For quick action chats: loading starts immediately when streaming, continues until title is generated
  // For regular chats: loading only shows during title generation API call
  const isTitleLoading = quickActionType 
    ? (isLoading || isGeneratingTitle) && !generatedTitle
    : isGeneratingTitle;
  
  // Clear submit error when user starts typing
  useEffect(() => {
    if (localInput && submitError) {
      setSubmitError(null);
    }
  }, [localInput, submitError]);
  
  // Use local input for controlled textarea
  const input = localInput;
  const setInput = setLocalInput;


  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceRecognition();

  // Attachment handling
  const {
    attachments,
    isDragging,
    error: attachmentError,
    addFiles,
    removeAttachment,
    clearAttachments,
    clearError: clearAttachmentError,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    fileInputRef,
    openFilePicker,
  } = useAttachments();

  // Track previous transcript to correctly replace old value with new
  const prevTranscriptRef = useRef('');
  
  useEffect(() => {
    if (isListening && transcript) {
      // IMPORTANT: Capture the previous transcript BEFORE setInput (refs are sync, setState is async)
      const prevTranscript = prevTranscriptRef.current;
      // Update ref immediately for the next effect run
      prevTranscriptRef.current = transcript;
      
      setInput((prev) => {
        // Remove the PREVIOUS transcript from input
        let base = prev;
        const endsWithPrev = prevTranscript && prev.endsWith(prevTranscript);
        if (endsWithPrev) {
          base = prev.slice(0, -prevTranscript.length).trim();
        }
        // Append the NEW transcript
        const result = base + (base ? ' ' : '') + transcript;
        return result;
      });
    } else if (!isListening) {
      // Reset when done listening
      prevTranscriptRef.current = '';
    }
  }, [transcript, isListening]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Track manual scroll attempts (wheel/touch events)
  const lastManualScrollTimeRef = useRef<number>(0);
  
  // Handle scroll events to detect if user has scrolled up
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Calculate distance from bottom (threshold: 150px)
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 150;
    
    isNearBottomRef.current = nearBottom;
    
    // If user scrolled up significantly, mark it
    if (!nearBottom) {
      userHasScrolledUpRef.current = true;
    }
    
    // If user scrolled back to bottom, clear the flag
    if (nearBottom && userHasScrolledUpRef.current) {
      userHasScrolledUpRef.current = false;
    }
  }, []);
  
  // Detect manual scroll attempts (wheel/touch) to prevent auto-scroll interference
  const handleManualScroll = useCallback((e: Event) => {
    // Mark that user is manually scrolling
    lastManualScrollTimeRef.current = Date.now();
    userHasScrolledUpRef.current = true;
  }, []);

  // Attach scroll listener to the scroll container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    // Listen for manual scroll attempts (wheel and touch events)
    container.addEventListener('wheel', handleManualScroll, { passive: true });
    container.addEventListener('touchmove', handleManualScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleManualScroll);
      container.removeEventListener('touchmove', handleManualScroll);
    };
  }, [handleScroll, handleManualScroll, hasMessages]);

  // Smart auto-scroll: only scroll to bottom if user hasn't scrolled up
  // This respects the user's position when they're reviewing earlier content
  useEffect(() => {
    // Skip if user has intentionally scrolled up to review content
    if (userHasScrolledUpRef.current) return;
    
    // Skip if user manually scrolled in the last 1 second (prevents interference during streaming)
    const timeSinceManualScroll = Date.now() - lastManualScrollTimeRef.current;
    if (timeSinceManualScroll < 1000) return;
    
    // Only auto-scroll if near bottom or this is a new user message
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset scroll tracking when a new conversation starts (user submits a message)
  const resetScrollTracking = useCallback(() => {
    isNearBottomRef.current = true;
    userHasScrolledUpRef.current = false;
  }, []);

  // Scroll to bottom when loading a chat session from history
  useEffect(() => {
    if (shouldScrollToBottom && messages.length > 0) {
      // Use a small delay to ensure messages are rendered
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        acknowledgeShouldScrollToBottom();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldScrollToBottom, messages.length, acknowledgeShouldScrollToBottom]);

  // Scroll to top when switching tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => ({
      'cmd+k': () => textareaRef.current?.focus(),
      'ctrl+k': () => textareaRef.current?.focus(),
      Escape: () => textareaRef.current?.blur(),
    }),
    []
  );

  useKeyboardShortcuts(shortcuts);

  // Build PageContext from current article/idea context for API calls
  const pageContext = useMemo((): PageContext | undefined => {
    if (articleContext) {
      return {
        type: 'article',
        article: {
          title: articleContext.title,
          slug: articleContext.slug,
          // Note: We don't have full article content here, but the title is sufficient for context
        },
      };
    }
    if (ideaContext) {
      return {
        type: 'idea',
        idea: {
          title: ideaContext.title,
          category: ideaContext.category,
          generationType: ideaContext.generationType,
          generationLabel: ideaContext.generationLabel,
        },
      };
    }
    return undefined;
  }, [articleContext, ideaContext]);

  // Build connector settings object for API calls
  const connectorSettings = useMemo(() => ({
    web: webSearchEnabled,
    brand: brandSearchEnabled,
    brain: false, // Removed - now handled via brand search
    discover: false, // Removed
  }), [webSearchEnabled, brandSearchEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Allow submission with just attachments (no text required)
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading) return;
    
    // Reset scroll tracking - user wants to see the new response
    resetScrollTracking();

    if (typeof sendMessage !== 'function') {
      setSubmitError('Chat is not ready. Please refresh the page and try again.');
      return;
    }

    const userMessage = input.trim();
    const currentAttachments = [...attachments];
    setInput('');
    clearAttachments();

    try {
      // Build message with attachments using FileUIPart format for AI SDK compatibility
      const requestBody = {
        model: selectedModel,
        context: pageContext,
        connectors: connectorSettings,
        extendedThinking: extendedThinkingEnabled,
        writingStyle: currentWritingStyle?.id || null,
      };

      if (currentAttachments.length > 0) {
        // Convert attachments to expected format
        const files = currentAttachments.map(att => ({
          type: 'image' as const,
          data: att.preview, // Base64 data URL
          mimeType: att.file.type,
        }));

        await sendMessage(
          { text: userMessage || 'What do you see in this image?', files },
          { body: requestBody }
        );
      } else {
        await sendMessage({ text: userMessage }, { body: requestBody });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
      setInput(userMessage);
    }
  };

  const handleFollowUpSubmit = async (query: string, followUpAttachments?: FollowUpAttachment[]) => {
    // Allow submission with just attachments (no text required)
    if (!query.trim() && (!followUpAttachments || followUpAttachments.length === 0)) return;
    if (isLoading) return;
    
    // Reset scroll tracking - user wants to see the new response
    resetScrollTracking();

    try {
      const requestBody = {
        model: selectedModel,
        context: pageContext,
        connectors: connectorSettings,
        extendedThinking: extendedThinkingEnabled,
        writingStyle: currentWritingStyle?.id || null,
      };

      // Build message with attachments
      if (followUpAttachments && followUpAttachments.length > 0) {
        // Convert attachments to expected format
        const files = followUpAttachments.map(att => ({
          type: 'image' as const,
          data: att.data, // Base64 data URL
          mimeType: att.mimeType,
        }));

        await sendMessage(
          { text: query.trim() || 'What do you see in this image?', files },
          { body: requestBody }
        );
      } else {
        await sendMessage({ text: query.trim() }, { body: requestBody });
      }
    } catch (err) {
      console.error('Failed to send follow-up:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };


  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalInput(value);
  }, []);

  // Handle project creation from the plus menu
  const handleCreateProject = useCallback(async (name: string) => {
    await createProject(name);
  }, [createProject]);

  // Handle quick action form submission
  const handleQuickActionSubmit = useCallback(async (formData: PostCopyFormData) => {
    // Hide the form
    setShowQuickActionForm(false);
    
    // Build the prompt context from the quick action config
    const channels: Channel[] = quickActionConfig.channels.map(c => ({
      id: c.id,
      label: c.label,
      shortLabel: c.short_label,
      icon: c.icon,
      supportedFormats: c.supported_formats as ContentFormat[],
      isDefault: c.is_default,
      displayOrder: c.display_order,
      userId: c.user_id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
    
    const contentSubtypes: ContentSubtype[] = quickActionConfig.contentSubtypes.map(s => ({
      id: s.id,
      label: s.label,
      format: s.format as ContentFormat,
      channelIds: s.channel_ids,
      isDefault: s.is_default,
      displayOrder: s.display_order,
      userId: s.user_id,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
    
    const goals: Goal[] = quickActionConfig.goals.map(g => ({
      id: g.id,
      label: g.label,
      description: g.description,
      isDefault: g.is_default,
      displayOrder: g.display_order,
      userId: g.user_id,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));
    
    const promptContext: PromptContext = {
      channels,
      contentSubtypes,
      goals,
    };
    
    // Look up display-friendly labels for the quick action metadata
    const selectedChannel = channels.find(c => c.id === formData.channelId);
    const selectedGoal = goals.find(g => g.id === formData.goalId);
    const selectedSubtypes = contentSubtypes.filter(s => formData.contentSubtypeIds.includes(s.id));
    
    // Get content format label
    const formatLabels: Record<ContentFormat, string> = {
      short_form: 'Short-form',
      long_form: 'Long-form',
      written: 'Written',
    };
    
    // Build the structured prompt using the prompt builder
    const prompt = buildCreatePostCopyPrompt({ formData, context: promptContext });

    // Reset scroll tracking
    resetScrollTracking();
    
    try {
      // Build the request body with form data for server-side brand voice retrieval
      const requestBody = {
        model: selectedModel,
        connectors: connectorSettings,
        extendedThinking: extendedThinkingEnabled,
        writingStyle: currentWritingStyle?.id || null,
        // Pass quickActionType at top level for skill injection
        quickActionType: 'create-post-copy',
        // Pass form data for server-side brand voice retrieval
        quickActionFormData: {
          channelId: formData.channelId,
          channelLabel: selectedChannel?.label || 'Unknown',
          goalId: formData.goalId,
          goalLabel: selectedGoal?.label || 'Unknown',
          keyMessage: formData.keyMessage,
          contentFormat: formData.contentFormat,
        },
      };

      // Build quick action metadata for UI display
      const quickActionMetadata = {
        type: 'create-post-copy',
        formData: {
          channelId: formData.channelId,
          channelLabel: selectedChannel?.label || 'Unknown',
          channelIcon: selectedChannel?.icon || undefined,
          contentFormat: formData.contentFormat,
          contentFormatLabel: formatLabels[formData.contentFormat],
          contentSubtypeLabels: selectedSubtypes.map(s => s.label),
          goalLabel: selectedGoal?.label || 'Unknown',
          keyMessage: formData.keyMessage,
          outputPreferences: {
            variations: formData.outputPreferences.variations,
            hashtags: formData.outputPreferences.hashtags.charAt(0).toUpperCase() + formData.outputPreferences.hashtags.slice(1),
            captionLength: formData.outputPreferences.captionLength.charAt(0).toUpperCase() + formData.outputPreferences.captionLength.slice(1),
            includeCta: formData.outputPreferences.includeCta === 'yes' ? 'Yes' : 'No',
          },
        },
        // Brand voice context will be populated by the API response
        brandVoice: undefined,
      };

      await sendMessage({ text: prompt }, { 
        body: requestBody,
        quickAction: quickActionMetadata,
      });
      
      // Clear the quick action form but KEEP the quickActionType
      // The quickActionType should persist for the entire chat session
      // so the badge continues to show in breadcrumbs
      setShowQuickActionForm(false);
      cancelQuickAction();
    } catch (err) {
      console.error('Failed to submit quick action:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate post copy');
      setShowQuickActionForm(false);
      // Only clear quickActionType on error since the chat didn't start successfully
      setQuickActionType(null);
      cancelQuickAction();
    }
  }, [quickActionConfig, cancelQuickAction, selectedModel, connectorSettings, extendedThinkingEnabled, currentWritingStyle, sendMessage, resetScrollTracking]);

  // Handle field editor actions
  const handleEditField = useCallback((fieldType: FieldType, mode: EditorMode, item?: unknown) => {
    setFieldEditorType(fieldType);
    setFieldEditorMode(mode);
    setFieldEditorItem(item);
    setFieldEditorOpen(true);
  }, []);

  const handleFieldEditorSave = useCallback(async (data: { label: string; shortLabel?: string; supportedFormats?: ContentFormat[]; description?: string }) => {
    try {
      if (fieldEditorType === 'channel') {
        if (fieldEditorMode === 'add') {
          await quickActionConfig.addChannel({
            label: data.label,
            short_label: data.shortLabel || data.label.substring(0, 4).toUpperCase(),
            supported_formats: data.supportedFormats || ['written'],
          });
        } else if (fieldEditorMode === 'edit' && fieldEditorItem) {
          const item = fieldEditorItem as { id: string };
          await quickActionConfig.updateChannel(item.id, {
            label: data.label,
            short_label: data.shortLabel,
            supported_formats: data.supportedFormats,
          });
        }
      } else if (fieldEditorType === 'goal') {
        if (fieldEditorMode === 'add') {
          await quickActionConfig.addGoal({
            label: data.label,
            description: data.description,
          });
        } else if (fieldEditorMode === 'edit' && fieldEditorItem) {
          const item = fieldEditorItem as { id: string };
          await quickActionConfig.updateGoal(item.id, {
            label: data.label,
            description: data.description,
          });
        }
      } else if (fieldEditorType === 'pillar') {
        if (fieldEditorMode === 'add') {
          await quickActionConfig.addPillar({ label: data.label });
        } else if (fieldEditorMode === 'edit' && fieldEditorItem) {
          const item = fieldEditorItem as { id: string };
          await quickActionConfig.updatePillar(item.id, { label: data.label });
        }
      }
    } catch (err) {
      console.error('Error saving field:', err);
      throw err;
    }
  }, [fieldEditorType, fieldEditorMode, fieldEditorItem, quickActionConfig]);

  const handleFieldEditorDelete = useCallback(async (id: string) => {
    try {
      if (fieldEditorType === 'channel') {
        await quickActionConfig.deleteChannel(id);
      } else if (fieldEditorType === 'goal') {
        await quickActionConfig.deleteGoal(id);
      } else if (fieldEditorType === 'pillar') {
        await quickActionConfig.deletePillar(id);
      }
    } catch (err) {
      console.error('Error deleting field:', err);
      throw err;
    }
  }, [fieldEditorType, quickActionConfig]);

  // Parse messages into our format with smart deduplication
  // Removes duplicate user messages that appear in the conversation (by content + role)
  const parsedMessages: ParsedMessage[] = useMemo(() => {
    const seenIds = new Set<string>();
    const seenUserQueries = new Set<string>();
    const uniqueMessages: ParsedMessage[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // Skip duplicate IDs
      if (seenIds.has(message.id)) {
        console.log('[ChatInterface] Skipping duplicate ID:', message.id);
        continue;
      }
      
      const content = getMessageContent(message);
      
      // For user messages, check if we've seen this exact query before
      // This prevents duplicate user prompts from appearing multiple times
      if (message.role === 'user') {
        if (seenUserQueries.has(content)) {
          console.log('[ChatInterface] Skipping duplicate user query:', content.substring(0, 50));
          continue;
        }
        seenUserQueries.add(content);
      }
      
      seenIds.add(message.id);
      
      // Extract extended data from the message if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messageAny = message as any;
      const messageSources = messageAny.sources as SourceInfo[] | undefined;
      const messageThinking = messageAny.thinking as string | undefined;
      const messageAttachments = messageAny.attachments as MessageAttachment[] | undefined;
      
      uniqueMessages.push({
        id: message.id,
        role: message.role as 'user' | 'assistant',
        content,
        sources: messageSources || [],
        images: [],
        modelUsed,
        thinking: messageThinking,
        attachments: messageAttachments,
      });
    }
    
    console.log('[ChatInterface] Messages:', messages.length, '→ Unique:', uniqueMessages.length, 
                '| User queries deduplicated:', seenUserQueries.size);
    return uniqueMessages;
  }, [messages, modelUsed, getMessageContent]);

  // Set breadcrumbs on mount and update when title changes
  useEffect(() => {
    // For quick action chats, only use generated title (never show prompt as title)
    // For regular chats, can fallback to first message
    const chatTitle = quickActionType 
      ? generatedTitle 
      : (generatedTitle || (parsedMessages.length > 0 ? parsedMessages[0]?.content.slice(0, 50) : null));
    const displayTitle = chatTitle ? (chatTitle.length > 50 ? chatTitle.slice(0, 50) + '...' : chatTitle) : null;
    
    // Check if current chat belongs to a project
    const currentChat = currentSessionId ? chatHistory.find(chat => chat.id === currentSessionId) : null;
    const chatProjectId = currentChat?.projectId;
    const chatProject = chatProjectId ? projects.find(p => p.id === chatProjectId) : null;
    
    // Only show title in breadcrumbs when we have an actual title to display
    // For quick action chats: require generatedTitle (don't show prompt)
    // For regular chats: show after assistant response with fallback to first message
    const showTitle = hasAssistantResponse && !!displayTitle;
    
    // Set quick action badge in breadcrumbs (shows as Aperol chip)
    // This persists for the entire chat if it was initiated via quick action
    if (quickActionType) {
      setQuickAction(quickActionType);
    } else {
      setQuickAction(null);
    }
    
    if (chatProject) {
      // Chat belongs to a project: Projects / Project Name / Chat Title
      setBreadcrumbs([
        { label: 'Projects', href: '/projects' },
        { label: chatProject.name, href: `/projects/${chatProject.id}` },
        ...(showTitle ? [{ label: displayTitle }] : []),
      ]);
    } else {
      // Chat doesn't belong to a project: Chats / Chat Title
      setBreadcrumbs([
        { label: 'Chats', href: '/chats' },
        ...(showTitle ? [{ label: displayTitle }] : []),
      ]);
    }
  }, [setBreadcrumbs, setQuickAction, generatedTitle, parsedMessages, hasAssistantResponse, currentSessionId, chatHistory, projects, showQuickActionForm, quickActionType]);

  // Get all sources and images from messages
  const allSources = useMemo(() => {
    return parsedMessages.flatMap(m => m.sources || []);
  }, [parsedMessages]);

  const allImages = useMemo(() => {
    return parsedMessages.flatMap(m => m.images || []);
  }, [parsedMessages]);

  // Extract resource cards from all assistant messages
  const allResourceCards = useMemo(() => {
    const cards = parsedMessages
      .filter(m => m.role === 'assistant')
      .flatMap(m => extractResourceCards(m.content));
    // Deduplicate by href
    const seen = new Set<string>();
    return cards.filter(card => {
      if (seen.has(card.href)) return false;
      seen.add(card.href);
      return true;
    });
  }, [parsedMessages]);

  // Get thread title - use generated semantic title if available
  const threadTitle = useMemo(() => {
    if (generatedTitle) {
      return generatedTitle;
    }
    // Fallback to first message (truncated) while generating
    const firstUserMessage = parsedMessages.find(m => m.role === 'user');
    return firstUserMessage?.content.slice(0, 50) || 'New Thread';
  }, [parsedMessages, generatedTitle]);

  // Calculate right position for canvas (only on desktop)
  // Uses canvasWidthPercent from context for resizable divider support
  const chatRightOffset = isCanvasOpen && canvasPanelMode === 'half' ? `${canvasWidthPercent}%` : '0';

  return (
    <>
      <BackgroundGradient fadeOut={hasMessages} />
      {hasMessages && (
        <div 
          className="fixed left-0 bottom-0 top-14 lg:top-12 z-0 bg-[var(--bg-primary)] lg:left-[var(--sidebar-width)] transition-[left,right] duration-300 ease-out"
          style={{ right: chatRightOffset }}
        />
      )}

      <div 
        className={`fixed left-0 bottom-0 top-14 lg:top-12 z-10 flex flex-col lg:left-[var(--sidebar-width)] transition-[left,right] duration-300 ease-out ${hasMessages ? '' : 'items-center'}`}
        style={{ right: chatRightOffset }}
      >
        {/* Chat Mode */}
        {hasMessages && (
          <div className="flex flex-col h-full">
            {/* Single sticky header */}
            <ChatHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hasResources={allSources.length > 0 || allResourceCards.length > 0 || allImages.length > 0}
              resourcesCount={allSources.length + allResourceCards.length + allImages.length}
              threadTitle={threadTitle}
              isTitleLoading={isTitleLoading}
              onBack={handleBackToChats}
              onRenameThread={async (newTitle) => {
                // Update the local generated title immediately for UI responsiveness
                setGeneratedTitle(newTitle);
                
                // Update the breadcrumb to reflect the new title
                const displayTitle = newTitle.length > 50 ? newTitle.slice(0, 50) + '...' : newTitle;
                setPageTitle(displayTitle);
                
                // Update in database if we have a session ID
                if (currentSessionId) {
                  const success = await renameChat(currentSessionId, newTitle);
                  if (!success) {
                    console.error('Failed to update chat title in database');
                  }
                }
              }}
              onAddToProject={() => setIsAddToProjectModalOpen(true)}
              onAddToSpace={() => setIsAddToSpaceModalOpen(true)}
              onDeleteThread={() => {
                // Delete and go back to home
                resetChat();
              }}
              isStreaming={isLoading}
              hideShare={isCanvasOpen}
              hideTitle={showQuickActionForm && !hasAssistantResponse}
            />

            {/* Scrollable content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
              {/* Top gradient - mirrors the bottom gradient for seamless transition */}
              <div className="sticky top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--bg-primary)] to-transparent pointer-events-none z-10" />
              <div className={`max-w-3xl mx-auto px-4 ${showQuickActionForm ? '' : '-mt-8'}`}>
                {activeTab === 'answer' && (
                  <>
                    {parsedMessages.map((message, idx) => {
                      if (message.role === 'user') {
                        const nextMessage = parsedMessages[idx + 1];
                        if (nextMessage?.role === 'assistant') {
                          return (
                            <ChatContent
                              key={message.id}
                              query={message.content}
                              content={nextMessage.content}
                              sources={nextMessage.sources}
                              isStreaming={isLoading && idx === parsedMessages.length - 2}
                              modelUsed={nextMessage.modelUsed}
                              onFollowUpClick={handleFollowUpSubmit}
                              onRegenerate={() => handleFollowUpSubmit(message.content)}
                              isLastResponse={idx === parsedMessages.length - 2}
                              thinking={nextMessage.thinking}
                              messageId={nextMessage.id}
                              chatId={currentSessionId ?? undefined}
                              attachments={message.attachments}
                              quickAction={message.quickAction}
                            />
                          );
                        }
                        if (!nextMessage && isLoading) {
                          // Get streaming data from the last message in the raw messages array
                          const lastRawMessage = messages[messages.length - 1];
                          const streamingThinking = lastRawMessage?.role === 'assistant' 
                            ? (lastRawMessage as { thinking?: string }).thinking 
                            : undefined;
                          return (
                            <ChatContent
                              key={message.id}
                              query={message.content}
                              content=""
                              isStreaming={true}
                              onFollowUpClick={handleFollowUpSubmit}
                              isLastResponse={true}
                              thinking={streamingThinking}
                              chatId={currentSessionId ?? undefined}
                              attachments={message.attachments}
                              quickAction={message.quickAction}
                            />
                          );
                        }
                        // Quick action form: Show form only (no user bubble for cleaner UX)
                        if (!nextMessage && !isLoading && showQuickActionForm && quickActionType === 'create-post-copy') {
                          return (
                            <div key={message.id}>
                              {/* Form rendered directly - no user bubble */}
                              <CreatePostCopyForm
                                initialData={activeQuickAction?.data}
                                onSubmit={handleQuickActionSubmit}
                                onCancel={() => {
                                  setShowQuickActionForm(false);
                                  setQuickActionType(null);
                                  cancelQuickAction();
                                }}
                                isSubmitting={activeQuickAction?.status === 'submitting'}
                                defaultExpanded={true}
                                channels={quickActionConfig.channels.map(c => ({
                                  id: c.id,
                                  label: c.label,
                                  shortLabel: c.short_label,
                                  icon: c.icon,
                                  supportedFormats: c.supported_formats as ContentFormat[],
                                  isDefault: c.is_default,
                                  displayOrder: c.display_order,
                                  userId: c.user_id,
                                  createdAt: c.created_at,
                                  updatedAt: c.updated_at,
                                }))}
                                contentSubtypes={quickActionConfig.contentSubtypes.map(s => ({
                                  id: s.id,
                                  label: s.label,
                                  format: s.format as ContentFormat,
                                  channelIds: s.channel_ids,
                                  isDefault: s.is_default,
                                  displayOrder: s.display_order,
                                  userId: s.user_id,
                                  createdAt: s.created_at,
                                  updatedAt: s.updated_at,
                                }))}
                                goals={quickActionConfig.goals.map(g => ({
                                  id: g.id,
                                  label: g.label,
                                  description: g.description,
                                  isDefault: g.is_default,
                                  displayOrder: g.display_order,
                                  userId: g.user_id,
                                  createdAt: g.created_at,
                                  updatedAt: g.updated_at,
                                }))}
                                onEditField={handleEditField}
                              />
                            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  </>
                )}

                {activeTab === 'resources' && (
                  <div className="py-6 space-y-8">
                    {/* Links section */}
                    {(allSources.length > 0 || allResourceCards.length > 0) && (
                      <LinksView
                        query={threadTitle}
                        sources={allSources}
                        resourceCards={allResourceCards}
                      />
                    )}

                    {/* Images section */}
                    {allImages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-4">
                          Images ({allImages.length})
                        </h3>
                        <p className="text-[var(--fg-tertiary)] text-sm">
                          {allImages.length} images found
                        </p>
                      </div>
                    )}

                    {/* Empty state */}
                    {allSources.length === 0 && allResourceCards.length === 0 && allImages.length === 0 && (
                      <p className="text-[var(--fg-tertiary)] text-sm">
                        No resources available
                      </p>
                    )}
                  </div>
                )}

                {/* Error display - only show if no successful content was generated */}
                {(error || submitError) && !parsedMessages.some(m => m.role === 'assistant' && m.content.length > 50) && (
                  <div className="py-4">
                    <div className="bg-[var(--bg-error-primary)] border border-[var(--border-error)] rounded-xl px-4 py-3 text-[var(--fg-error-primary)] text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p className="mt-1">{error?.message || submitError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Follow-up input */}
            <div className="relative">
              <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
              <div className="bg-[var(--bg-primary)] px-4 py-4">
                <FollowUpInput
                  onSubmit={handleFollowUpSubmit}
                  isLoading={isLoading}
                  placeholder="Ask a follow-up"
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Landing Mode */}
        {!hasMessages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col h-full w-full justify-center"
          >
            {/* Content container - centered for visual balance, relative for absolute children */}
            <div className="w-full max-w-3xl mx-auto flex flex-col relative">
              {/* Welcome Header - fixed position */}
              <div className="mb-8">
                <WelcomeHeader />
              </div>
              
              {/* Chat Input - fixed position */}
              <div className="w-full px-4">
                <form onSubmit={handleSubmit} className="relative">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        addFiles(e.target.files);
                        e.target.value = ''; // Reset to allow same file selection
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    className={`
                      relative rounded-xl
                      border transition-all duration-200
                      bg-[var(--bg-secondary)] shadow-sm
                      ${isDragging || isFocused || isListening
                        ? 'border-[var(--border-brand-solid)] shadow-lg shadow-[var(--bg-brand-solid)]/20 ring-2 ring-[var(--border-brand-solid)]/30'
                        : 'border-[var(--border-primary)] hover:border-[var(--fg-tertiary)]'
                      }
                    `}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {/* Drag overlay */}
                    <DragOverlay isDragging={isDragging} />

                    {/* Attachment preview */}
                    <AttachmentPreview
                      attachments={attachments}
                      onRemove={removeAttachment}
                      error={attachmentError}
                      onClearError={clearAttachmentError}
                    />

                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onPaste={handlePaste}
                        placeholder={attachments.length > 0 ? "Add a message or send with images..." : "Ask anything. Type @ for mentions and / for shortcuts."}
                        className="w-full px-4 py-4 bg-transparent text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)] resize-none focus:outline-none min-h-[60px] max-h-[300px]"
                        rows={1}
                        aria-label="Chat input"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Toolbar - always visible */}
                    <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] gap-2 sm:gap-4">
                      {/* Left side - Plus menu, Active settings indicators, Extended thinking toggle */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <PlusMenu
                          onAddFiles={openFilePicker}
                          onProjectSelect={setCurrentProject}
                          onStyleSelect={setCurrentWritingStyle}
                          onSpaceSelect={setCurrentSpace}
                          currentProject={currentProject}
                          currentStyle={currentWritingStyle}
                          currentSpace={currentSpace}
                          projects={projects}
                          spaces={spaces}
                          onCreateProject={handleCreateProject}
                          onCreateSpace={async (title) => {
                            createSpace(title);
                          }}
                          disabled={isLoading}
                          showSpaceOption={true}
                        />

                        <ExtendedThinkingToggle
                          enabled={extendedThinkingEnabled}
                          onToggle={setExtendedThinkingEnabled}
                          disabled={isLoading}
                        />
                        
                        {/* Active settings indicators - shown as removable chips */}
                        <ActiveSettingsIndicators
                          currentProject={currentProject}
                          currentWritingStyle={currentWritingStyle}
                          currentSpace={currentSpace}
                          onRemoveProject={() => setCurrentProject(null)}
                          onRemoveWritingStyle={() => setCurrentWritingStyle(null)}
                          onRemoveSpace={() => setCurrentSpace(null)}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Right side - action buttons */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <ModelSelector
                          selectedModel={selectedModel}
                          onModelChange={setSelectedModel}
                          disabled={isLoading}
                        />

                        <div className="hidden sm:block w-px h-5 bg-[var(--border-primary)]" />

                        <DataSourcesDropdown
                          webEnabled={webSearchEnabled}
                          brandEnabled={brandSearchEnabled}
                          onWebToggle={setWebSearchEnabled}
                          onBrandToggle={setBrandSearchEnabled}
                          disabled={isLoading}
                        />

                        <div className="relative">
                          {/* Pulsing rings when recording */}
                          {isListening && (
                            <>
                              <motion.div
                                className="absolute inset-0 rounded-lg bg-[var(--bg-brand-solid)]/30"
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{
                                  scale: [1, 1.8, 2.2],
                                  opacity: [0.6, 0.3, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeOut',
                                }}
                              />
                              <motion.div
                                className="absolute inset-0 rounded-lg bg-[var(--bg-brand-solid)]/20"
                                initial={{ scale: 1, opacity: 0.4 }}
                                animate={{
                                  scale: [1, 1.5, 1.8],
                                  opacity: [0.4, 0.2, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeOut',
                                  delay: 0.3,
                                }}
                              />
                            </>
                          )}
                          <motion.button
                            type="button"
                            onClick={handleMicClick}
                            className={`relative p-2 rounded-lg transition-colors ${
                              isListening
                                ? 'bg-[var(--bg-brand-solid)] text-white'
                                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-primary)]'
                            }`}
                            aria-label="Voice input"
                            title={isListening ? 'Stop recording' : 'Start voice input'}
                            whileTap={{ scale: 0.92 }}
                            animate={isListening ? {
                              scale: [1, 1.05, 1],
                            } : { scale: 1 }}
                            transition={isListening ? {
                              duration: 0.8,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            } : { duration: 0.15 }}
                          >
                            <motion.div
                              animate={isListening ? { rotate: [0, -8, 8, -8, 0] } : { rotate: 0 }}
                              transition={isListening ? {
                                duration: 0.5,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: 'easeInOut',
                              } : { duration: 0.15 }}
                            >
                              <Mic className="w-5 h-5" />
                            </motion.div>
                          </motion.button>
                          {voiceError && (
                            <motion.span
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-[var(--fg-error-primary)] whitespace-nowrap bg-[var(--bg-secondary)] px-2 py-1 rounded"
                            >
                              {voiceError}
                            </motion.span>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={(!input.trim() && attachments.length === 0) || isLoading}
                          className={`p-2 rounded-lg transition-all ${
                            (input.trim() || attachments.length > 0) && !isLoading
                              ? 'bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid)]/90'
                              : 'text-[var(--fg-tertiary)]/50 cursor-not-allowed'
                          }`}
                          aria-label="Send message"
                          title="Send message"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Error display */}
              <AnimatePresence>
                {(error || submitError) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full px-4 mt-4"
                  >
                    <div className="bg-[var(--bg-error-primary)] border border-[var(--border-error)] rounded-xl px-4 py-3 text-[var(--fg-error-primary)] text-sm flex items-start gap-3 text-left">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p className="mt-1">{error?.message || submitError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Pre-prompt Cards Grid - below input, fades when typing or form is active */}
              {/* Uses opacity animation without unmounting to prevent layout shift */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 1 }}
                animate={{ 
                  opacity: input.trim() || showQuickActionForm || activeQuickAction ? 0 : 1,
                  pointerEvents: input.trim() || showQuickActionForm || activeQuickAction ? 'none' : 'auto',
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0, 0.2, 1] 
                }}
              >
                <QuickAccessPanels 
                  onPromptSubmit={(prompt) => handleFollowUpSubmit(prompt)}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Add to Project Modal */}
      <AddToProjectModal
        isOpen={isAddToProjectModalOpen}
        onClose={() => setIsAddToProjectModalOpen(false)}
        projects={projects}
        currentProject={currentProject}
        chatId={currentSessionId}
        onSelectProject={setCurrentProject}
        onAssignChatToProject={async (chatId, projectId) => {
          await assignChatToProject(chatId, projectId);
          return true;
        }}
        onCreateProject={async (name) => {
          await createProject(name);
        }}
      />

      {/* Add to Space Modal */}
      <AddToSpaceModal
        isOpen={isAddToSpaceModalOpen}
        onClose={() => setIsAddToSpaceModalOpen(false)}
        chatId={currentSessionId || ''}
        chatTitle={generatedTitle || messages[0]?.content?.slice(0, 50) || 'Chat'}
      />

      {/* Quick Action Field Editor Modal */}
      <QuickActionFieldEditor
        isOpen={fieldEditorOpen}
        onClose={() => setFieldEditorOpen(false)}
        fieldType={fieldEditorType}
        mode={fieldEditorMode}
        item={fieldEditorItem as { id: string; label: string; isDefault: boolean } | undefined}
        onSave={handleFieldEditorSave}
        onDelete={handleFieldEditorDelete}
      />
    </>
  );
}
