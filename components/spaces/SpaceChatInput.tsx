'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mic, Send } from 'lucide-react';
import { ModelId } from '@/lib/ai/providers';
import { useAttachments } from '@/hooks/useAttachments';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useChatContext } from '@/lib/chat-context';
import { AttachmentPreview, DragOverlay } from '@/components/chat/AttachmentPreview';
import { PlusMenu } from '@/components/ui/plus-menu';
import { ExtendedThinkingToggle } from '@/components/ui/extended-thinking-toggle';
import { DataSourcesDropdown } from '@/components/ui/data-sources-dropdown';
import { ModelSelector } from '@/components/ui/model-selector';
import { ActiveSettingsIndicators } from '@/components/ui/active-settings-indicators';

interface SpaceChatInputProps {
  spaceSlug: string;
  spaceId: string;
  spaceTitle: string;
  spaceIcon?: string;
  placeholder?: string;
  onStartChat?: (query: string, discussionId: string) => void;
}

/**
 * Chat input for space pages - matches the home page style
 * Fixed at bottom of the page
 */
export function SpaceChatInput({
  spaceSlug,
  spaceId,
  spaceTitle,
  spaceIcon,
  placeholder,
  onStartChat,
}: SpaceChatInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('auto');
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get shared settings from chat context
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    currentWritingStyle,
    setCurrentWritingStyle,
    extendedThinkingEnabled,
    setExtendedThinkingEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    brandSearchEnabled,
    setBrandSearchEnabled,
  } = useChatContext();

  // Voice recognition
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
  
  // Update input with live transcript
  useEffect(() => {
    if (isListening && transcript) {
      // IMPORTANT: Capture the previous transcript BEFORE setQuery (refs are sync, setState is async)
      const prevTranscript = prevTranscriptRef.current;
      // Update ref immediately for the next effect run
      prevTranscriptRef.current = transcript;
      
      setQuery((prev) => {
        // Remove the PREVIOUS transcript from input
        let base = prev;
        if (prevTranscript && prev.endsWith(prevTranscript)) {
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && attachments.length === 0) return;

    // Generate a new discussion ID
    const discussionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // If callback provided, use it
    if (onStartChat) {
      onStartChat(query.trim(), discussionId);
      setQuery('');
      clearAttachments();
      return;
    }

    // Navigate to the space chat page with the query
    const searchParams = new URLSearchParams({
      q: query.trim(),
      spaceId,
      spaceTitle,
      ...(spaceIcon && { spaceIcon }),
      isNew: 'true',
    });

    clearAttachments();
    router.push(`/spaces/${spaceSlug}/chat/${discussionId}?${searchParams.toString()}`);
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

  const defaultPlaceholder = `Ask anything about ${spaceTitle}...`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:pl-[56px]">
      {/* Solid background with gradient fade at top */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 md:px-12 pb-4 pt-2">
        <form onSubmit={handleSubmit}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                addFiles(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          <div
            className={`
              relative bg-[var(--bg-secondary)] backdrop-blur-xl rounded-xl
              border transition-all duration-200 shadow-sm
              ${
                isDragging || isFocused || isListening
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
              compact
            />

            {/* Input area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onPaste={handlePaste}
                placeholder={attachments.length > 0 ? "Add a message or send with images..." : (placeholder || defaultPlaceholder)}
                className="w-full px-4 py-4 bg-transparent text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)] resize-none focus:outline-none min-h-[60px] max-h-[150px]"
                rows={1}
                aria-label="Space chat input"
              />
            </div>

            {/* Footer toolbar - matching homepage layout */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] gap-2 sm:gap-4">
              {/* Left side - Plus menu, Extended thinking, Active settings */}
              <div className="flex items-center gap-1 sm:gap-2">
                <PlusMenu
                  onAddFiles={openFilePicker}
                  onProjectSelect={setCurrentProject}
                  onStyleSelect={setCurrentWritingStyle}
                  currentProject={currentProject}
                  currentStyle={currentWritingStyle}
                  projects={projects}
                  onCreateProject={createProject}
                  disabled={false}
                />

                <ExtendedThinkingToggle
                  enabled={extendedThinkingEnabled}
                  onToggle={setExtendedThinkingEnabled}
                  disabled={false}
                />
                
                {/* Active settings indicators - shown as removable chips */}
                <ActiveSettingsIndicators
                  currentProject={currentProject}
                  currentWritingStyle={currentWritingStyle}
                  onRemoveProject={() => setCurrentProject(null)}
                  onRemoveWritingStyle={() => setCurrentWritingStyle(null)}
                  disabled={false}
                />
              </div>

              {/* Right side - action buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Model Selector */}
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={false}
                />

                <div className="hidden sm:block w-px h-5 bg-[var(--border-primary)]" />

                {/* Data Sources */}
                <DataSourcesDropdown
                  webEnabled={webSearchEnabled}
                  brandEnabled={brandSearchEnabled}
                  onWebToggle={setWebSearchEnabled}
                  onBrandToggle={setBrandSearchEnabled}
                  disabled={false}
                />

                {/* Voice input with animation */}
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!query.trim() && attachments.length === 0}
                  className={`p-2 rounded-lg transition-all ${
                    (query.trim() || attachments.length > 0)
                      ? 'bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid)]/90'
                      : 'text-[var(--fg-tertiary)]/50 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                  title="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
