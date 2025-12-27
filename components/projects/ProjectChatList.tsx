'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, X, Plus } from 'lucide-react';
import { useChatContext } from '@/lib/chat-context';
import type { ProjectChat } from '@/lib/supabase/projects-service';

interface ProjectChatListProps {
  chats: ProjectChat[];
  projectId: string;
  onRemoveChat?: (chatId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProjectChatList({ chats, projectId, onRemoveChat }: ProjectChatListProps) {
  const router = useRouter();
  const { loadSession } = useChatContext();

  const handleChatClick = (chatId: string) => {
    loadSession(chatId);
    router.push('/');
  };

  if (chats.length === 0) {
    return (
      <div className="
        flex flex-col items-center justify-center
        py-12 px-4
        text-center
      ">
        <div className="
          w-12 h-12 mb-3
          rounded-full
          bg-[var(--bg-tertiary)]
          flex items-center justify-center
        ">
          <MessageSquare className="w-6 h-6 text-[var(--fg-quaternary)]" />
        </div>
        <p className="text-sm text-[var(--fg-tertiary)] mb-1">
          No conversations yet
        </p>
        <p className="text-xs text-[var(--fg-quaternary)]">
          Start a new conversation to add it to this project
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border-secondary)]">
      {chats.map((chat, index) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <button
            onClick={() => handleChatClick(chat.id)}
            className="
              w-full
              flex items-start gap-3
              px-4 py-3
              text-left
              hover:bg-[var(--bg-tertiary)]
              transition-colors
              group
            "
          >
            {/* Icon */}
            <div className="
              w-8 h-8 mt-0.5
              rounded-lg
              bg-[var(--bg-tertiary)]
              group-hover:bg-[var(--bg-quaternary)]
              flex items-center justify-center
              flex-shrink-0
              transition-colors
            ">
              <MessageSquare className="w-4 h-4 text-[var(--fg-tertiary)]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[var(--fg-primary)] truncate">
                {chat.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--fg-tertiary)]">
                <Clock className="w-3 h-3" />
                <span>Last message {formatRelativeTime(chat.updated_at)}</span>
              </div>
            </div>

            {/* Remove button - visible on hover */}
            {onRemoveChat && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveChat(chat.id);
                }}
                className="
                  p-1.5 rounded-md
                  text-[var(--fg-quaternary)]
                  hover:text-[var(--fg-error-primary)]
                  hover:bg-[var(--bg-error-primary)]
                  opacity-0 group-hover:opacity-100
                  transition-all
                "
                title="Remove from project"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// Compact input for starting new chat within project
interface ProjectChatInputProps {
  projectId: string;
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

export function ProjectChatInput({ projectId, onSubmit, isLoading }: ProjectChatInputProps) {
  return (
    <div className="p-4 border-b border-[var(--border-secondary)]">
      <div className="
        relative
        bg-[var(--bg-primary)]
        border border-[var(--border-secondary)]
        rounded-xl
        hover:border-[var(--border-primary)]
        focus-within:border-[var(--fg-brand-primary)]
        focus-within:ring-2 focus-within:ring-[var(--fg-brand-primary)]/20
        transition-all
      ">
        <textarea
          placeholder="Reply..."
          rows={1}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              if (target.value.trim()) {
                onSubmit(target.value.trim());
                target.value = '';
              }
            }
          }}
          className="
            w-full px-4 py-3
            bg-transparent
            text-sm text-[var(--fg-primary)]
            placeholder:text-[var(--fg-quaternary)]
            resize-none
            focus:outline-none
            disabled:opacity-50
          "
        />
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border-secondary)]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="
                p-1.5 rounded-md
                text-[var(--fg-quaternary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="Add attachment"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-[var(--fg-quaternary)]">
            Press Enter to send
          </div>
        </div>
      </div>
    </div>
  );
}

