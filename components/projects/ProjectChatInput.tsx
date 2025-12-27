'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, Mic, Image, Paperclip } from 'lucide-react';
import { useChatContext } from '@/lib/chat-context';
import { ModelSelector } from '@/components/ui/model-selector';
import { ExtendedThinkingToggle } from '@/components/ui/extended-thinking-toggle';
import { DataSourcesDropdown } from '@/components/ui/data-sources-dropdown';
import { ActiveSettingsIndicators } from '@/components/ui/active-settings-indicators';
import type { ModelId } from '@/lib/ai/providers';
import type { Project } from '@/lib/supabase/projects-service';

interface ProjectChatInputProps {
  project: Project;
}

export function ProjectChatInput({ project }: ProjectChatInputProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('auto');
  
  const {
    setCurrentProject,
    triggerChatReset,
    currentWritingStyle,
    setCurrentWritingStyle,
    extendedThinkingEnabled,
    setExtendedThinkingEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    brandSearchEnabled,
    setBrandSearchEnabled,
  } = useChatContext();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    // Set the current project in context
    setCurrentProject(project);
    
    // Reset any existing chat
    triggerChatReset();
    
    // Navigate to home with the query
    router.push(`/?q=${encodeURIComponent(input.trim())}`);
  }, [input, project, setCurrentProject, triggerChatReset, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          relative rounded-xl
          border transition-all duration-200
          bg-[var(--bg-secondary)] shadow-sm
          ${isFocused
            ? 'border-[var(--border-brand-solid)] shadow-lg shadow-[var(--bg-brand-solid)]/20 ring-2 ring-[var(--border-brand-solid)]/30'
            : 'border-[var(--border-primary)] hover:border-[var(--fg-tertiary)]'
          }
        `}
      >
        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Start a conversation..."
            className="
              w-full px-4 py-4
              bg-transparent
              text-[var(--fg-primary)]
              placeholder:text-[var(--fg-tertiary)]
              resize-none
              focus:outline-none
              min-h-[60px] max-h-[200px]
            "
            rows={1}
            aria-label="Chat input"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] gap-2 sm:gap-4">
          {/* Left side */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ExtendedThinkingToggle
              enabled={extendedThinkingEnabled}
              onToggle={setExtendedThinkingEnabled}
            />
            
            {/* Active settings indicators */}
            <ActiveSettingsIndicators
              currentProject={project}
              currentWritingStyle={currentWritingStyle}
              onRemoveProject={() => {}} // Can't remove project when in project view
              onRemoveWritingStyle={() => setCurrentWritingStyle(null)}
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />

            <div className="hidden sm:block w-px h-5 bg-[var(--border-primary)]" />

            <DataSourcesDropdown
              webEnabled={webSearchEnabled}
              brandEnabled={brandSearchEnabled}
              onWebToggle={setWebSearchEnabled}
              onBrandToggle={setBrandSearchEnabled}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim()}
              className="
                p-2 rounded-lg
                transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-[var(--bg-brand-solid)]
                hover:bg-[var(--bg-brand-solid)]/90
                text-white
              "
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-[var(--fg-quaternary)] mt-2 text-center">
        Press Enter to send • Shift+Enter for new line
      </p>
    </form>
  );
}

