'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnswerView, parseContentToSections, extractResourceCards, parseCanvasResponse, SourceInfo } from './AnswerView';
import { ResponseActions } from './ResponseActions';
import { RelatedQuestions } from './RelatedQuestions';
import { useCanvasContextOptional } from '@/lib/canvas-context';
import { canvasService } from '@/lib/supabase/canvas-service';
import type { Canvas } from '@/lib/supabase/canvas-service';

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
  
  // Track canvas state
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isCanvasCreating, setIsCanvasCreating] = useState(false);
  const canvasCreatedRef = useRef(false);
  const lastCanvasContentRef = useRef<string>('');
  
  // Check if we should show citations (only for Perplexity models)
  const showCitations = modelUsed?.includes('sonar') || modelUsed?.includes('perplexity');

  // Parse canvas from content
  const { canvas: canvasResponse, cleanContent } = React.useMemo(() => {
    return parseCanvasResponse(content);
  }, [content]);

  // Create or update canvas when response contains canvas tags
  useEffect(() => {
    if (!canvasResponse || isStreaming) return;
    
    // Prevent duplicate canvas creation
    if (canvasCreatedRef.current && lastCanvasContentRef.current === canvasResponse.content) {
      return;
    }
    
    const handleCanvas = async () => {
      setIsCanvasCreating(true);
      
      try {
        if (canvasResponse.action === 'create' || !canvas) {
          // Create new canvas
          const newCanvas = await canvasService.createCanvas({
            title: canvasResponse.title,
            content: canvasResponse.content,
            chat_id: chatId || null,
            last_edited_by: 'assistant',
          });
          
          if (newCanvas) {
            setCanvas(newCanvas);
            canvasCreatedRef.current = true;
            lastCanvasContentRef.current = canvasResponse.content;
            
            // Auto-open the canvas panel
            if (canvasContext) {
              canvasContext.openCanvas(newCanvas);
            }
          }
        } else if (canvasResponse.action === 'update' && canvas) {
          // Update existing canvas
          const updated = await canvasService.updateCanvasContent(
            canvas.id,
            canvasResponse.content,
            'assistant',
            'AI update'
          );
          
          if (updated) {
            setCanvas(updated);
            lastCanvasContentRef.current = canvasResponse.content;
            
            // Refresh canvas in panel
            if (canvasContext) {
              canvasContext.openCanvas(updated);
            }
          }
        }
      } catch (error) {
        console.error('Error handling canvas:', error);
      } finally {
        setIsCanvasCreating(false);
      }
    };
    
    handleCanvas();
  }, [canvasResponse, isStreaming, canvas, chatId, canvasContext]);

  // Parse content into sections (using cleaned content without canvas tags)
  const sections = React.useMemo(() => {
    return parseContentToSections(cleanContent, sources);
  }, [cleanContent, sources]);

  // Extract resource cards from content
  const resourceCards = React.useMemo(() => {
    return extractResourceCards(cleanContent);
  }, [cleanContent]);

  const hasLinks = sources.length > 0;

  return (
    <div className="py-6">
      <AnswerView
        query={query}
        sections={sections}
        sources={sources}
        isStreaming={isStreaming}
        showCitations={showCitations}
        resourceCards={resourceCards}
        thinking={thinking}
        canvas={canvas}
        isCanvasStreaming={isStreaming && !!canvasResponse}
      />

      {/* Response actions - shown for all completed responses */}
      {!isStreaming && cleanContent && (
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

      {/* Related questions - only on last response */}
      {!isStreaming && cleanContent && isLastResponse && (
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

