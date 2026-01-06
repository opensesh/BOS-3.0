'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChatTabNav, ChatTab } from './ChatTabNav';
import { AnswerView, parseContentToSections, extractResourceCards, parseCanvasResponse, parseAssetTags, SourceInfo } from './AnswerView';
import { LinksView } from './LinksView';
import { ImagesView, ImageResult } from './ImagesView';
import { ResponseActions } from './ResponseActions';
import { RelatedQuestions } from './RelatedQuestions';
import { ChatTitleDropdown } from './ChatTitleDropdown';
import { ShareButton } from './ShareModal';
import { useCanvasContextOptional } from '@/lib/canvas-context';
import { canvasService } from '@/lib/supabase/canvas-service';
import type { Canvas } from '@/lib/supabase/canvas-service';

interface ChatResponseProps {
  query: string;
  content: string;
  sources?: SourceInfo[];
  images?: ImageResult[];
  isStreaming?: boolean;
  modelUsed?: string;
  onFollowUpClick: (question: string) => void;
  onRegenerate?: () => void;
  /** Unique message ID for feedback tracking */
  messageId?: string;
  /** Chat/session ID for feedback context */
  chatId?: string;
}

export function ChatResponse({
  query,
  content,
  sources = [],
  images = [],
  isStreaming = false,
  modelUsed,
  onFollowUpClick,
  onRegenerate,
  messageId,
  chatId,
}: ChatResponseProps) {
  const [activeTab, setActiveTab] = useState<ChatTab>('answer');
  
  // Canvas context for opening canvas panel
  const canvasContext = useCanvasContextOptional();
  
  // Track canvas state
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const canvasCreatedRef = useRef(false);
  const lastCanvasContentRef = useRef<string>('');

  // Check if we should show citations (only for Perplexity models)
  const showCitations = useMemo(() => {
    return modelUsed?.includes('sonar') || modelUsed?.includes('perplexity');
  }, [modelUsed]);

  // Parse canvas from content - includes preamble for acknowledgment text
  const { canvas: canvasResponse, cleanContent, preamble } = useMemo(() => {
    return parseCanvasResponse(content);
  }, [content]);

  // Track if canvas is streaming (has opening tag but no closing tag yet)
  const isCanvasStreaming = canvasResponse?.isStreaming ?? false;

  // Create or update canvas when response contains canvas tags (only when complete)
  useEffect(() => {
    if (!canvasResponse || isStreaming || isCanvasStreaming) return;
    
    // Prevent duplicate canvas creation
    if (canvasCreatedRef.current && lastCanvasContentRef.current === canvasResponse.content) {
      return;
    }
    
    const handleCanvas = async () => {
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
      }
    };
    
    handleCanvas();
  }, [canvasResponse, isStreaming, isCanvasStreaming, canvas, chatId, canvasContext]);

  // Parse content into sections
  // For canvas responses, show preamble (acknowledgment) text only
  const sections = useMemo(() => {
    if (canvasResponse && preamble) {
      return parseContentToSections(preamble, sources);
    }
    if (canvasResponse) {
      return [];
    }
    return parseContentToSections(cleanContent, sources);
  }, [cleanContent, preamble, sources, canvasResponse]);

  // Extract resource cards from content
  const resourceCards = useMemo(() => {
    return extractResourceCards(cleanContent);
  }, [cleanContent]);

  // Parse asset tags from content for LinksView
  const { assetTypes } = useMemo(() => {
    return parseAssetTags(cleanContent);
  }, [cleanContent]);

  const hasResources = sources.length > 0 || images.length > 0 || assetTypes.length > 0;
  const resourcesCount = sources.length + images.length + assetTypes.length;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header with tabs and actions */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-primary)]/50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <ChatTabNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hasResources={hasResources}
              resourcesCount={resourcesCount}
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              <ChatTitleDropdown title={query.slice(0, 50) || 'Chat'} />
              <ShareButton />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {activeTab === 'answer' && (
            <>
              <AnswerView
                query={query}
                sections={sections}
                sources={sources}
                isStreaming={isStreaming && !canvasResponse}
                showCitations={showCitations}
                resourceCards={resourceCards}
              />

              {/* Response actions */}
              {!isStreaming && cleanContent && (
                <ResponseActions
                  sources={sources}
                  resourceCards={resourceCards}
                  content={cleanContent}
                  query={query}
                  messageId={messageId}
                  chatId={chatId}
                  onRegenerate={onRegenerate}
                  showSources={showCitations && hasResources}
                  modelUsed={modelUsed}
                />
              )}

              {/* Related questions */}
              {!isStreaming && cleanContent && (
                <RelatedQuestions
                  responseContent={cleanContent}
                  originalQuery={query}
                  onQuestionClick={onFollowUpClick}
                  modelUsed={modelUsed}
                />
              )}
            </>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-8">
              {(sources.length > 0 || assetTypes.length > 0) && (
                <LinksView query={query} sources={sources} assetTypes={assetTypes} />
              )}
              {images.length > 0 && (
                <ImagesView query={query} images={images} />
              )}
              {sources.length === 0 && images.length === 0 && assetTypes.length === 0 && (
                <p className="text-[var(--fg-tertiary)] text-sm">No resources available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
