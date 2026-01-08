'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  FolderOpen,
  Megaphone,
  MessageSquare,
  Lightbulb,
  Target,
  Fingerprint,
  Palette,
  Type,
  ImageIcon,
  Shapes,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useChatContext } from '@/lib/chat-context';
import type { QuickActionType } from '@/lib/quick-actions';

interface QuickAccessPanelsProps {
  onPromptSubmit: (prompt: string) => void;
}

// Quick action IDs that trigger forms instead of text prompts
const QUICK_ACTION_IDS: Record<string, QuickActionType> = {
  'social-post': 'create-post-copy',
};

// Quick actions data
const quickActions = [
  {
    id: 'social-post',
    icon: Megaphone,
    title: 'Create Post',
    prompt: 'Help me create a social media post. I want to announce [topic/product] and need engaging copy that fits my brand voice.',
  },
  {
    id: 'brand-review',
    icon: MessageSquare,
    title: 'Brand Review',
    prompt: 'Review this and tell me if it matches my brand guidelines. Suggest improvements to make it more on-brand: [paste your content]',
  },
  {
    id: 'reverse-engineer',
    icon: Lightbulb,
    title: 'Reverse Engineer',
    prompt: 'Help me brainstorm creative ideas for [campaign/project]. I want fresh concepts that align with my brand values.',
  },
  {
    id: 'product-copy',
    icon: Target,
    title: 'Product Copy',
    prompt: 'Help me plan a content campaign for [goal/product]. I need ideas for posts, timing, and messaging that align with my brand.',
  },
];

// Brand hub links
const brandLinks = [
  { id: 'logo', label: 'Logo', href: '/brand-hub/logo', icon: Fingerprint },
  { id: 'colors', label: 'Colors', href: '/brand-hub/colors', icon: Palette },
  { id: 'typography', label: 'Typography', href: '/brand-hub/fonts', icon: Type },
  { id: 'art-direction', label: 'Art Direction', href: '/brand-hub/art-direction', icon: ImageIcon },
  { id: 'tokens', label: 'Tokens', href: '/brand-hub/design-tokens', icon: Shapes },
  { id: 'guidelines', label: 'Guidelines', href: '/brand-hub/guidelines', icon: FileText },
];

export function QuickAccessPanels({ onPromptSubmit }: QuickAccessPanelsProps) {
  const router = useRouter();
  const { triggerChatReset } = useChatContext();

  // Handle action click - either navigate to new chat with action param or submit prompt
  const handleActionClick = useCallback((action: typeof quickActions[0]) => {
    const quickActionType = QUICK_ACTION_IDS[action.id];
    if (quickActionType) {
      // Navigate to home with action param - this will trigger the form in a new chat
      triggerChatReset();
      router.push(`/?action=${quickActionType}`);
    } else {
      // Fall back to regular prompt submission
      onPromptSubmit(action.prompt);
    }
  }, [triggerChatReset, router, onPromptSubmit]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Actions Panel */}
        <motion.div
          className="flex-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[var(--bg-brand-primary)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--fg-brand-primary)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--fg-primary)]">Actions</span>
          </div>

          {/* Action chips - 2x2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-left transition-all duration-150 hover:border-[var(--border-brand)] hover:bg-[var(--bg-quaternary)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors flex-shrink-0" />
                  <span className="text-xs font-medium text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors truncate">
                    {action.title}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Brand Panel */}
        <motion.div
          className="flex-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[var(--bg-brand-primary)] flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-[var(--fg-brand-primary)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--fg-primary)]">Brand</span>
          </div>

          {/* Brand links - 2-column grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {brandLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className="group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-150 hover:bg-[var(--bg-tertiary)]"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-brand-primary)] transition-colors flex-shrink-0" />
                  <span className="text-xs text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

