'use client';

import React, { useState, useMemo } from 'react';
import { ChatTabNav, ChatTab } from './ChatTabNav';
import { AnswerView, parseContentToSections, extractResourceCards, SourceInfo } from './AnswerView';
import { LinksView } from './LinksView';
import { ImagesView, ImageResult } from './ImagesView';
import { ResponseActions } from './ResponseActions';
import { RelatedQuestions } from './RelatedQuestions';
import { ChatTitleDropdown } from './ChatTitleDropdown';
import { ShareButton } from './ShareModal';

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

  // Check if we should show citations (only for Perplexity models)
  const showCitations = useMemo(() => {
    return modelUsed?.includes('sonar') || modelUsed?.includes('perplexity');
  }, [modelUsed]);

  // Parse content into sections
  const sections = useMemo(() => {
    return parseContentToSections(content, sources);
  }, [content, sources]);

  // Extract resource cards from content
  const resourceCards = useMemo(() => {
    return extractResourceCards(content);
  }, [content]);

  const hasResources = sources.length > 0 || images.length > 0;
  const resourcesCount = sources.length + images.length;

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
                isStreaming={isStreaming}
                showCitations={showCitations}
                resourceCards={resourceCards}
              />

              {/* Response actions */}
              {!isStreaming && content && (
                <ResponseActions
                  sources={sources}
                  resourceCards={resourceCards}
                  content={content}
                  query={query}
                  messageId={messageId}
                  chatId={chatId}
                  onRegenerate={onRegenerate}
                  showSources={showCitations && hasResources}
                  modelUsed={modelUsed}
                />
              )}

              {/* Related questions */}
              {!isStreaming && content && (
                <RelatedQuestions
                  responseContent={content}
                  originalQuery={query}
                  onQuestionClick={onFollowUpClick}
                  modelUsed={modelUsed}
                />
              )}
            </>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-8">
              {sources.length > 0 && (
                <LinksView query={query} sources={sources} />
              )}
              {images.length > 0 && (
                <ImagesView query={query} images={images} />
              )}
              {sources.length === 0 && images.length === 0 && (
                <p className="text-[var(--fg-tertiary)] text-sm">No resources available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
