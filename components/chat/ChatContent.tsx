'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnswerView, parseContentToSections, extractResourceCards, parseCanvasResponse, SourceInfo } from './AnswerView';
import { ResponseActions } from './ResponseActions';
import { RelatedQuestions } from './RelatedQuestions';
import { CanvasPreviewBubble } from '@/components/canvas';
import { useCanvasContextOptional } from '@/lib/canvas-context';
import { canvasService, type Canvas } from '@/lib/supabase/canvas-service';

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
}: ChatContentProps) {
  // Canvas context for opening canvas panel
  const canvasContext = useCanvasContextOptional();
  
  // Persisted canvas from Supabase (for version tracking, etc.)
  const [persistedCanvas, setPersistedCanvas] = useState<Canvas | null>(null);
  const canvasSavedRef = useRef(false);
  
  // Check if we should show citations (only for Perplexity models)
  const showCitations = modelUsed?.includes('sonar') || modelUsed?.includes('perplexity');

  // Parse canvas from content - this extracts <canvas> tags
  const { canvas: canvasResponse, cleanContent } = React.useMemo(() => {
    return parseCanvasResponse(content);
  }, [content]);

  // Create a local canvas object for immediate display (no Supabase dependency)
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
  useEffect(() => {
    if (!canvasResponse || isStreaming || canvasSavedRef.current) return;
    
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
  }, [canvasResponse, isStreaming, chatId]);

  // Handle opening the canvas panel
  const handleOpenCanvas = useCallback((canvas: Canvas) => {
    if (canvasContext) {
      canvasContext.openCanvas(canvas);
    }
  }, [canvasContext]);

  // Parse content into sections (using cleaned content without canvas tags)
  const sections = React.useMemo(() => {
    // If there's a canvas, don't show any sections - the canvas IS the content
    if (canvasResponse) return [];
    return parseContentToSections(cleanContent, sources);
  }, [cleanContent, sources, canvasResponse]);

  // Extract resource cards from content
  const resourceCards = React.useMemo(() => {
    return extractResourceCards(cleanContent);
  }, [cleanContent]);

  const hasLinks = sources.length > 0;
  const hasCanvas = !!canvasResponse;

  return (
    <div className="py-6">
      <AnswerView
        query={query}
        sections={sections}
        sources={sources}
        isStreaming={isStreaming && !hasCanvas}
        showCitations={showCitations}
        resourceCards={resourceCards}
        thinking={thinking}
      />

      {/* Canvas Preview Bubble - Shows immediately when canvas is detected */}
      {localCanvas && (
        <div className="mt-4">
          <CanvasPreviewBubble
            canvas={localCanvas}
            isStreaming={isStreaming}
            onOpenCanvas={handleOpenCanvas}
            defaultCollapsed={false}
          />
        </div>
      )}

      {/* Response actions - shown for all completed responses */}
      {!isStreaming && (cleanContent || hasCanvas) && (
        <ResponseActions
          sources={sources}
          resourceCards={resourceCards}
          content={cleanContent}
          query={query}
          messageId={messageId}
          chatId={chatId}
          onRegenerate={onRegenerate}
          showSources={hasLinks}
          modelUsed={modelUsed}
        />
      )}

      {/* Related questions - only on last response, not for canvas responses */}
      {!isStreaming && cleanContent && isLastResponse && !hasCanvas && (
        <RelatedQuestions
          responseContent={cleanContent}
          originalQuery={query}
          onQuestionClick={onFollowUpClick}
          modelUsed={modelUsed}
        />
      )}
    </div>
  );
}
