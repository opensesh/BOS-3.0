'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnswerView, parseContentToSections, extractResourceCards, parseCanvasResponse, parseAssetTags, SourceInfo } from './AnswerView';
import { AssetCarousel } from './AssetCarousel';
import { StreamingSourcesCounter } from './InlineStreamingDisplay';
import { ResponseActions } from './ResponseActions';
import { RelatedQuestions } from './RelatedQuestions';
import { CanvasPreviewBubble } from '@/components/canvas';
import { useCanvasContextOptional } from '@/lib/canvas-context';
import { canvasService, type Canvas } from '@/lib/supabase/canvas-service';
import type { QuickActionMetadata } from '@/hooks/useChat';

// Message attachment interface
interface MessageAttachment {
  id: string;
  type: 'image';
  data: string;
  mimeType: string;
  name?: string;
}

interface ChatContentProps {
  query: string;
  content: string;
  sources?: SourceInfo[];
  isStreaming?: boolean;
  modelUsed?: string;
  onFollowUpClick: (question: string) => void;
  onRegenerate?: () => void;
  isLastResponse?: boolean;
  /** Claude's thinking/reasoning content during extended thinking */
  thinking?: string;
  /** Unique message ID for feedback tracking */
  messageId?: string;
  /** Chat/session ID for feedback context */
  chatId?: string;
  /** Attached images from user message */
  attachments?: MessageAttachment[];
  /** Quick action metadata for form-based submissions */
  quickAction?: QuickActionMetadata;
}

export function ChatContent({
  query,
  content,
  sources = [],
  isStreaming = false,
  modelUsed,
  onFollowUpClick,
  onRegenerate,
  isLastResponse = true,
  thinking,
  messageId,
  chatId,
  attachments,
  quickAction,
}: ChatContentProps) {
  // Canvas context for opening canvas panel
  const canvasContext = useCanvasContextOptional();
  
  // Persisted canvas from Supabase (for version tracking, etc.)
  const [persistedCanvas, setPersistedCanvas] = useState<Canvas | null>(null);
  const canvasSavedRef = useRef(false);
  
  // Check if we should show citations (only for Perplexity models)
  const showCitations = modelUsed?.includes('sonar') || modelUsed?.includes('perplexity');

  // Parse canvas from content - this extracts <canvas> tags
  // Now handles both complete and streaming/partial canvas tags
  const { canvas: canvasResponse, cleanContent, preamble } = React.useMemo(() => {
    return parseCanvasResponse(content);
  }, [content]);

  // Track if we're in a canvas streaming state
  const isCanvasStreaming = canvasResponse?.isStreaming ?? false;

  // Create a local canvas object for immediate display (no Supabase dependency)
  // This shows immediately when canvas tag is detected, even during streaming
  const localCanvas: Canvas | null = React.useMemo(() => {
    if (!canvasResponse) return null;
    
    // If we have a persisted canvas, use that
    if (persistedCanvas) return persistedCanvas;
    
    // Otherwise create a temporary local canvas for display
    return {
      id: `temp-${Date.now()}`,
      title: canvasResponse.title,
      content: canvasResponse.content,
      contentType: 'markdown' as const,
      version: 1,
      lastEditedBy: 'assistant' as const,
      isArchived: false,
      themeConfig: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [canvasResponse, persistedCanvas]);

  // Persist canvas to Supabase when streaming completes
  // Only persist when both the AI stream AND canvas content are complete
  useEffect(() => {
    if (!canvasResponse || isStreaming || isCanvasStreaming || canvasSavedRef.current) return;
    
    const persistCanvas = async () => {
      try {
        const newCanvas = await canvasService.createCanvas({
          title: canvasResponse.title,
          content: canvasResponse.content,
          chat_id: chatId || null,
          last_edited_by: 'assistant',
        });
        
        if (newCanvas) {
          setPersistedCanvas(newCanvas);
          canvasSavedRef.current = true;
        }
      } catch (error) {
        console.error('Error persisting canvas:', error);
        // Canvas still displays via localCanvas even if persistence fails
      }
    };
    
    persistCanvas();
  }, [canvasResponse, isStreaming, isCanvasStreaming, chatId]);

  // Handle opening the canvas panel (works during streaming too)
  const handleOpenCanvas = useCallback((canvas: Canvas) => {
    if (canvasContext) {
      // Set streaming state if we're still streaming
      if (isStreaming || isCanvasStreaming) {
        canvasContext.setIsStreaming(true);
      }
      canvasContext.openCanvas(canvas);
    }
  }, [canvasContext, isStreaming, isCanvasStreaming]);

  // Sync streaming content to canvas panel if it's open
  useEffect(() => {
    if (!canvasContext || !canvasContext.isCanvasOpen || !canvasResponse) return;
    
    // Update canvas panel content during streaming
    if (isStreaming || isCanvasStreaming) {
      canvasContext.setLocalContent(canvasResponse.content);
    }
    
    // When streaming completes, turn off streaming indicator
    if (!isStreaming && !isCanvasStreaming && canvasContext.isStreaming) {
      canvasContext.setIsStreaming(false);
    }
  }, [canvasContext, canvasResponse?.content, isStreaming, isCanvasStreaming]);

  // Parse asset tags from content (before canvas parsing removes them)
  // This extracts <asset type="logos" /> tags and returns the types + clean content
  const { assetTypes, cleanContent: contentWithoutAssets } = React.useMemo(() => {
    // Use cleanContent (canvas already extracted) as the base
    return parseAssetTags(cleanContent);
  }, [cleanContent]);

  // Parse content into sections
  // For canvas responses, only show the preamble (acknowledgment text before canvas)
  // For asset responses, use content with asset tags removed
  const sections = React.useMemo(() => {
    if (canvasResponse) {
      // Show preamble as acknowledgment text, if any
      if (preamble) {
        return parseContentToSections(preamble, sources);
      }
      return [];
    }
    // Use content without asset tags for clean display
    return parseContentToSections(contentWithoutAssets, sources);
  }, [contentWithoutAssets, preamble, sources, canvasResponse]);

  // Extract resource cards from content (without asset tags)
  const resourceCards = React.useMemo(() => {
    return extractResourceCards(contentWithoutAssets);
  }, [contentWithoutAssets]);

  const hasLinks = sources.length > 0;
  const hasCanvas = !!canvasResponse;
  const hasAssets = assetTypes.length > 0;

  return (
    <div className="py-6">
      <AnswerView
        query={query}
        sections={sections}
        sources={sources}
        isStreaming={isStreaming && !hasCanvas && !hasAssets}
        showCitations={showCitations}
        resourceCards={resourceCards}
        thinking={thinking}
        attachments={attachments}
        quickAction={quickAction}
        // Don't show sources in AnswerView when we have a canvas - we show them below
        hideSourcesCounter={hasCanvas}
      />

      {/* Asset Carousels - Render after text, one carousel per asset type */}
      {/* Multiple carousels can co-exist (e.g., logos and fonts) */}
      {hasAssets && !isStreaming && (
        <div className="mt-4 space-y-4">
          {assetTypes.map((type) => (
            <AssetCarousel key={type} type={type} />
          ))}
        </div>
      )}

      {/* Canvas Preview Bubble - Shows immediately when canvas tag is detected */}
      {/* Displays during streaming with a delightful open animation */}
      {localCanvas && (
        <div className="mt-4">
          <CanvasPreviewBubble
            canvas={localCanvas}
            isStreaming={isStreaming || isCanvasStreaming}
            onOpenCanvas={handleOpenCanvas}
            defaultCollapsed={false}
          />
        </div>
      )}

      {/* Sources Counter - Shows after canvas bubble during streaming */}
      {hasCanvas && (
        <StreamingSourcesCounter
          isStreaming={isStreaming || isCanvasStreaming}
          sourcesCount={sources.length}
        />
      )}

      {/* Response actions - shown for all completed responses */}
      {!isStreaming && (contentWithoutAssets || hasCanvas) && (
        <ResponseActions
          sources={sources}
          resourceCards={resourceCards}
          content={contentWithoutAssets}
          query={query}
          messageId={messageId}
          chatId={chatId}
          onRegenerate={onRegenerate}
          showSources={hasLinks}
          modelUsed={modelUsed}
        />
      )}

      {/* Related questions - only on last response, not for canvas responses */}
      {!isStreaming && contentWithoutAssets && isLastResponse && !hasCanvas && (
        <RelatedQuestions
          responseContent={contentWithoutAssets}
          originalQuery={query}
          onQuestionClick={onFollowUpClick}
          modelUsed={modelUsed}
        />
      )}
    </div>
  );
}
