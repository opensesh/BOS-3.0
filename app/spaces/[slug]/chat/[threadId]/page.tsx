'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { SpaceReferenceCard } from '@/components/spaces/SpaceReferenceCard';
import { useSpaces } from '@/hooks/useSpaces';
import { useSpaceDiscussions, useDiscussionMessages } from '@/hooks/useSpaceDiscussions';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import { ModelId } from '@/lib/ai/providers';
import type { PageContext } from '@/lib/brand-knowledge';
import {
  FollowUpInput,
  ChatHeader,
  ChatContent,
  type FollowUpAttachment,
} from '@/components/chat';

// Message attachment interface
interface MessageAttachment {
  id: string;
  type: 'image';
  data: string;
  mimeType: string;
  name?: string;
}

interface ParsedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  attachments?: MessageAttachment[];
}

export default function SpaceChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug as string;
  const threadId = params.threadId as string;

  // URL params for new chat
  const initialQuery = searchParams.get('q');
  const isNew = searchParams.get('isNew') === 'true';
  const hasAttachments = searchParams.get('hasAttachments') === 'true';

  const [selectedModel, setSelectedModel] = useState<ModelId>('auto');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'answer' | 'resources'>('answer');
  const [hasSubmittedInitial, setHasSubmittedInitial] = useState(false);
  const [initialAttachments, setInitialAttachments] = useState<MessageAttachment[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track saved message IDs to prevent duplicate saves
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  // Track user scroll behavior
  const userHasScrolledUpRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const lastManualScrollTimeRef = useRef<number>(0);

  // Retrieve attachments from sessionStorage on mount
  useEffect(() => {
    if (hasAttachments && threadId) {
      try {
        const stored = sessionStorage.getItem(`space-chat-attachments-${threadId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as MessageAttachment[];
          setInitialAttachments(parsed);
          // Clean up after retrieval
          sessionStorage.removeItem(`space-chat-attachments-${threadId}`);
        }
      } catch (err) {
        console.error('Failed to retrieve attachments:', err);
      }
    }
  }, [hasAttachments, threadId]);

  // Get space data
  const { getSpace, isLoaded: spacesLoaded } = useSpaces();
  const space = getSpace(slug);

  // Get discussion data
  const {
    discussions,
    createDiscussion,
    updateDiscussion,
    getDiscussion,
  } = useSpaceDiscussions(slug);

  const {
    messages: storedMessages,
    isLoading: isLoadingStoredMessages,
    addMessage,
    setMessages: setStoredMessages,
  } = useDiscussionMessages(threadId);

  // Current discussion
  const discussion = getDiscussion(threadId);

  // Breadcrumb context
  const { setBreadcrumbs } = useBreadcrumbs();

  // Custom useChat hook for native SDK streaming
  const { messages, sendMessage, status, error, setMessages } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Chat error:', err);
      setSubmitError(err.message || 'An error occurred while sending your message');
    },
  });

  // Helper to get message content
  const getMessageContent = useCallback(
    (message: { content?: string; parts?: Array<{ type: string; text?: string }> }): string => {
      if (typeof message.content === 'string') return message.content;
      if (Array.isArray(message.parts)) {
        return message.parts
          .filter(
            (part): part is { type: string; text: string } =>
              part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string'
          )
          .map((part) => part.text)
          .join('');
      }
      return '';
    },
    []
  );

  // Set breadcrumbs for this chat page
  useEffect(() => {
    // Determine the chat title
    const chatTitle = discussion?.title 
      || initialQuery?.slice(0, 40) 
      || 'New Chat';
    
    // Truncate if too long
    const displayTitle = chatTitle.length > 40 
      ? chatTitle.slice(0, 40) + '...' 
      : chatTitle;

    setBreadcrumbs([
      { label: 'Spaces', href: '/spaces' },
      { label: space?.title || slug, href: `/spaces/${slug}` },
      { label: displayTitle }, // No href = current page
    ]);
  }, [space, slug, discussion, initialQuery, setBreadcrumbs]);

  // Load stored messages on mount
  useEffect(() => {
    if (storedMessages.length > 0 && messages.length === 0) {
      // Convert stored messages to UI message format (AI SDK 5.x)
      const chatMessages = storedMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.createdAt),
        parts: [{ type: 'text' as const, text: m.content }],
      }));
      
      // Mark these messages as already saved so we don't re-save them
      storedMessages.forEach((m) => savedMessageIdsRef.current.add(m.id));
      
      setMessages(chatMessages as unknown as Parameters<typeof setMessages>[0]);
    }
  }, [storedMessages, messages.length, setMessages]);

  // Build space context for API calls
  const spaceContext = useMemo((): PageContext | undefined => {
    if (!space) return undefined;
    return {
      type: 'space',
      space: {
        id: space.id,
        title: space.title,
        instructions: space.instructions,
        fileCount: space.files?.length || 0,
        linkCount: space.links?.length || 0,
        taskCount: space.tasks?.length || 0,
        fileNames: space.files?.map(f => f.name),
        linkTitles: space.links?.map(l => l.title || l.url),
      },
    };
  }, [space]);

  // Handle initial query from URL (new chat)
  useEffect(() => {
    // Wait for attachments to be loaded if expected
    const attachmentsReady = !hasAttachments || initialAttachments !== null;
    
    if (isNew && initialQuery && !hasSubmittedInitial && space && spaceContext && attachmentsReady) {
      setHasSubmittedInitial(true);

      // Create the discussion first
      const initChat = async () => {
        // Create discussion in Supabase/localStorage with the threadId from the URL
        await createDiscussion(initialQuery.slice(0, 50), space.id, threadId);

        // Clear URL params
        router.replace(`/spaces/${slug}/chat/${threadId}`, { scroll: false });

        // Prepare files if we have attachments
        if (initialAttachments && initialAttachments.length > 0) {
          const files = initialAttachments.map((att) => ({
            type: 'image' as const,
            data: att.data,
            mimeType: att.mimeType,
          }));

          // Send the message with attachments and space context
          await sendMessage(
            { 
              text: initialQuery || 'What do you see in this image?', 
              files: files as unknown as FileList 
            },
            { body: { model: selectedModel, context: spaceContext } }
          );
        } else {
          // Send the message with space context (no attachments)
          await sendMessage(
            { text: initialQuery },
            { body: { model: selectedModel, context: spaceContext } }
          );
        }
      };

      initChat();
    }
  }, [
    isNew,
    initialQuery,
    hasSubmittedInitial,
    hasAttachments,
    initialAttachments,
    space,
    spaceContext,
    slug,
    threadId,
    selectedModel,
    sendMessage,
    router,
    createDiscussion,
  ]);

  // Save messages to storage when they change
  // User messages are saved immediately, assistant messages are saved when streaming completes
  // NOTE: We don't require `discussion` to be truthy for saving messages because
  // addMessage already has the threadId from useDiscussionMessages(threadId).
  // The discussion state may not be updated yet due to React's async state batching.
  useEffect(() => {
    if (messages.length === 0) return;

    // Process each message
    for (const message of messages) {
      // Skip if already saved
      if (savedMessageIdsRef.current.has(message.id)) continue;
      
      const content = getMessageContent(message);
      
      // For user messages: save immediately (they don't change)
      if (message.role === 'user' && content) {
        savedMessageIdsRef.current.add(message.id);
        addMessage('user', content);
      }
      
      // For assistant messages: only save when streaming is complete (status is ready)
      // Also check that there's actual content to save
      if (message.role === 'assistant' && status === 'ready' && content) {
        savedMessageIdsRef.current.add(message.id);
        addMessage('assistant', content);
      }
    }
  }, [messages, status, addMessage, getMessageContent]);

  // Update discussion preview and count separately (requires discussion to be loaded)
  useEffect(() => {
    if (!discussion || messages.length === 0 || status !== 'ready') return;
    
    // Find the last assistant message to use as preview
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage) {
      const content = getMessageContent(lastAssistantMessage);
      if (content) {
        updateDiscussion(discussion.id, {
          preview: content.slice(0, 100),
          messageCount: messages.length,
        });
      }
    }
  }, [discussion, messages, status, updateDiscussion, getMessageContent]);

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
  const handleManualScroll = useCallback(() => {
    // Mark that user is manually scrolling
    lastManualScrollTimeRef.current = Date.now();
    userHasScrolledUpRef.current = true;
  }, []);
  
  // Attach scroll listeners
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
  }, [handleScroll, handleManualScroll]);

  // Smart auto-scroll: only scroll to bottom if user hasn't scrolled up
  // This respects the user's position when they're reviewing earlier content
  useEffect(() => {
    // Skip if user has intentionally scrolled up to review content
    if (userHasScrolledUpRef.current) return;
    
    // Skip if user manually scrolled in the last 1 second (prevents interference during streaming)
    const timeSinceManualScroll = Date.now() - lastManualScrollTimeRef.current;
    if (timeSinceManualScroll < 1000) return;
    
    // Only auto-scroll if near bottom
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Parse messages
  const parsedMessages: ParsedMessage[] = useMemo(() => {
    return messages.map((message) => {
      // Extract attachments from the message
      const msgAttachments = (message as { attachments?: MessageAttachment[] }).attachments;
      
      return {
        id: message.id,
        role: message.role as 'user' | 'assistant',
        content: getMessageContent(message),
        modelUsed,
        attachments: msgAttachments?.map(a => ({
          id: a.id,
          type: a.type as 'image',
          data: a.data,
          mimeType: a.mimeType,
          name: a.name,
        })),
      };
    });
  }, [messages, modelUsed, getMessageContent]);

  // Thread title
  const threadTitle = useMemo(() => {
    const firstUserMessage = parsedMessages.find((m) => m.role === 'user');
    return firstUserMessage?.content.slice(0, 50) || discussion?.title || 'New Discussion';
  }, [parsedMessages, discussion]);

  // Handle follow-up submit
  const handleFollowUpSubmit = async (query: string, followUpAttachments?: FollowUpAttachment[]) => {
    if (!query.trim() && (!followUpAttachments || followUpAttachments.length === 0)) return;
    if (isLoading) return;

    try {
      if (followUpAttachments && followUpAttachments.length > 0) {
        const files = followUpAttachments.map((att) => ({
          type: 'file' as const,
          data: att.data,
          mimeType: att.mimeType,
        }));

        await sendMessage(
          { text: query.trim() || 'What do you see in this image?', files: files as unknown as FileList },
          { body: { model: selectedModel, context: spaceContext } }
        );
      } else {
        await sendMessage({ text: query.trim() }, { body: { model: selectedModel, context: spaceContext } });
      }
    } catch (err) {
      console.error('Failed to send follow-up:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/spaces/${slug}`);
  };

  // Loading state
  if (!spacesLoaded) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-aperol border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-os-text-secondary-dark">Loading...</p>
        </div>
      </div>
    );
  }

  // Space not found
  if (!space) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold mb-4">Space Not Found</h1>
          <p className="text-os-text-secondary-dark mb-6">
            The space you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-aperol text-white rounded-lg hover:bg-brand-aperol/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Spaces
          </Link>
        </div>
      </div>
    );
  }

  const hasMessages = messages.length > 0;
  
  // Show loading state when loading stored messages for an existing chat (not a new chat)
  const showLoadingStoredMessages = isLoadingStoredMessages && !isNew && !hasSubmittedInitial && messages.length === 0;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans overflow-hidden">
      <Sidebar />

      <MainContent className="overflow-hidden">
        {/* Chat Header */}
        <ChatHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasResources={false}
          resourcesCount={0}
          threadTitle={threadTitle}
          onBack={handleBack}
        />

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4">
            {activeTab === 'answer' && (
              <>
                {/* Loading state for existing chats */}
                {showLoadingStoredMessages && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-[var(--border-brand-solid)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[var(--fg-tertiary)] text-sm">Loading conversation...</p>
                    </div>
                  </div>
                )}
                
                {/* Space Reference Card */}
                {hasMessages && (
                  <div className="pt-6">
                    <SpaceReferenceCard
                      spaceTitle={space.title}
                      spaceSlug={space.slug}
                      spaceIcon={space.icon}
                    />
                  </div>
                )}

                {/* Messages */}
                {parsedMessages.map((message, idx) => {
                  if (message.role === 'user') {
                    const nextMessage = parsedMessages[idx + 1];
                    if (nextMessage?.role === 'assistant') {
                      return (
                        <ChatContent
                          key={message.id}
                          query={message.content}
                          content={nextMessage.content}
                          isStreaming={isLoading && idx === parsedMessages.length - 2}
                          modelUsed={nextMessage.modelUsed}
                          onFollowUpClick={handleFollowUpSubmit}
                          onRegenerate={() => handleFollowUpSubmit(message.content)}
                          isLastResponse={idx === parsedMessages.length - 2}
                          messageId={nextMessage.id}
                          attachments={message.attachments}
                        />
                      );
                    }
                    if (!nextMessage && isLoading) {
                      return (
                        <ChatContent
                          key={message.id}
                          query={message.content}
                          content=""
                          isStreaming={true}
                          onFollowUpClick={handleFollowUpSubmit}
                          isLastResponse={true}
                          attachments={message.attachments}
                        />
                      );
                    }
                  }
                  return null;
                })}

                {/* Error display */}
                {(error || submitError) &&
                  !parsedMessages.some((m) => m.role === 'assistant' && m.content.length > 50) && (
                    <div className="py-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Error</p>
                          <p className="mt-1">{error?.message || submitError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </>
            )}

            {activeTab === 'resources' && (
              <div className="py-6">
                <p className="text-[var(--fg-secondary)] text-sm">No resources available</p>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up input */}
        <div className="relative">
          <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
          <div className="bg-[var(--bg-primary)] px-4 py-4">
            <FollowUpInput
              onSubmit={handleFollowUpSubmit}
              isLoading={isLoading}
              placeholder="Ask a follow-up about this space"
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </div>
      </MainContent>
    </div>
  );
}
