'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  FolderOpen,
  Fingerprint,
  Palette,
  Type,
  ImageIcon,
  Shapes,
  FileText,
  ArrowUpRight,
  ChevronDown,
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
    title: 'Create Post',
    prompt: 'Help me create a social media post. I want to announce [topic/product] and need engaging copy that fits my brand voice.',
  },
  {
    id: 'brand-review',
    title: 'Brand Review',
    prompt: 'Review this and tell me if it matches my brand guidelines. Suggest improvements to make it more on-brand: [paste your content]',
  },
  {
    id: 'reverse-engineer',
    title: 'Reverse Engineer',
    prompt: 'Help me brainstorm creative ideas for [campaign/project]. I want fresh concepts that align with my brand values.',
  },
  {
    id: 'product-copy',
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

// Typewriter hook for staggered character reveal
function useTypewriter(text: string, delay: number = 0, speed: number = 50) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    const startTyping = () => {
      timeout = setTimeout(() => {
        const type = () => {
          if (charIndex < text.length) {
            setDisplayText(text.substring(0, charIndex + 1));
            charIndex++;
            timeout = setTimeout(type, speed);
          } else {
            setIsComplete(true);
          }
        };
        type();
      }, delay);
    };

    startTyping();

    return () => clearTimeout(timeout);
  }, [text, delay, speed]);

  return { displayText, isComplete };
}

// Hook to detect if we're on mobile viewport
function useIsMobile() {
  // Start as null to indicate "unknown" state during SSR
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function QuickAccessPanels({ onPromptSubmit }: QuickAccessPanelsProps) {
  const router = useRouter();
  const { triggerChatReset } = useChatContext();
  const isMobile = useIsMobile();

  // After hydration, JS takes over
  const isHydrated = isMobile !== null;
  const isActuallyMobile = isMobile === true;

  // Accordion state - expanded on desktop by default, collapsed on mobile
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [brandExpanded, setBrandExpanded] = useState(true);

  // Initialize to collapsed on mobile after hydration
  useEffect(() => {
    if (isHydrated && isActuallyMobile) {
      setActionsExpanded(false);
      setBrandExpanded(false);
    }
  }, [isHydrated, isActuallyMobile]);

  // Content visibility - now controlled by expanded state on all viewports
  const showActionsContent = actionsExpanded;
  const showBrandContent = brandExpanded;

  // Typewriter effects for titles - staggered timing
  const actionsTitle = useTypewriter('Actions', 200, 60);
  const brandTitle = useTypewriter('Brand', 400, 60);

  // Handle action click
  const handleActionClick = useCallback((action: typeof quickActions[0]) => {
    const quickActionType = QUICK_ACTION_IDS[action.id];
    if (quickActionType) {
      triggerChatReset();
      router.push(`/?action=${quickActionType}`);
    } else {
      onPromptSubmit(action.prompt);
    }
  }, [triggerChatReset, router, onPromptSubmit]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Asymmetric grid on desktop - Actions wider to fit text, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* Actions Panel - takes 7 columns for wider buttons */}
        <motion.div
          className="sm:col-span-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors duration-200 hover:border-[var(--fg-tertiary)] overflow-hidden">
            {/* Header - always clickable */}
            <button
              onClick={() => setActionsExpanded(!actionsExpanded)}
              className="flex items-start gap-3 w-full text-left cursor-pointer p-4 sm:p-5"
            >
              <motion.div
                className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Zap className="w-4 h-4 text-[var(--fg-tertiary)]" strokeWidth={2} />
              </motion.div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3
                  className="text-lg font-bold text-[var(--fg-primary)] tracking-tight leading-tight relative"
                  style={{ fontFamily: 'Offbit, sans-serif' }}
                >
                  {/* Invisible placeholder to reserve full title width */}
                  <span className="invisible">Actions</span>
                  {/* Actual typewriter text positioned absolutely */}
                  <span className="absolute left-0 top-0">
                    {actionsTitle.displayText}
                    {!actionsTitle.isComplete && (
                      <span className="inline-block w-0.5 h-5 bg-[var(--fg-tertiary)] ml-0.5 animate-pulse align-middle" />
                    )}
                  </span>
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-[var(--fg-quaternary)] font-medium mt-0.5">
                  Quick start
                </span>
              </div>
              {/* Chevron - visible on all viewports */}
              <motion.div
                className="flex-shrink-0 mt-2"
                animate={{ rotate: actionsExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-[var(--fg-quaternary)]" />
              </motion.div>
            </button>

            {/* Divider - visible when expanded */}
            <AnimatePresence>
              {showActionsContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="border-t border-[var(--border-primary)]"
                />
              )}
            </AnimatePresence>

            {/* Content - collapsible on all viewports */}
            <AnimatePresence initial={false}>
              {showActionsContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden flex-1 flex flex-col"
                >
                  {/* Action buttons - 2x2 grid */}
                  <div className="grid grid-cols-2 gap-2 flex-1 content-start p-4 sm:p-5 pt-4">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="group/btn flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-150 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)]/80 border border-[var(--border-secondary)] hover:border-[var(--fg-tertiary)]"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.25 }}
                      >
                        <span className="text-[13px] text-[var(--fg-secondary)] group-hover/btn:text-[var(--fg-primary)] transition-colors whitespace-nowrap">
                          {action.title}
                        </span>

                        {/* Arrow - simple opacity transition */}
                        <ArrowUpRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover/btn:text-[var(--fg-primary)] transition-all duration-150 opacity-0 group-hover/btn:opacity-100" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Brand Panel - takes 5 columns, more compact */}
        <motion.div
          className="sm:col-span-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors duration-200 hover:border-[var(--fg-tertiary)] overflow-hidden">
            {/* Header - always clickable */}
            <button
              onClick={() => setBrandExpanded(!brandExpanded)}
              className="flex items-start gap-3 w-full text-left cursor-pointer p-4 sm:p-5"
            >
              <motion.div
                className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <FolderOpen className="w-4 h-4 text-[var(--fg-tertiary)]" />
              </motion.div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3
                  className="text-lg font-bold text-[var(--fg-primary)] tracking-tight leading-tight relative"
                  style={{ fontFamily: 'Offbit, sans-serif' }}
                >
                  {/* Invisible placeholder to reserve full title width */}
                  <span className="invisible">Brand</span>
                  {/* Actual typewriter text positioned absolutely */}
                  <span className="absolute left-0 top-0">
                    {brandTitle.displayText}
                    {!brandTitle.isComplete && (
                      <span className="inline-block w-0.5 h-5 bg-[var(--fg-tertiary)] ml-0.5 animate-pulse align-middle" />
                    )}
                  </span>
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-[var(--fg-quaternary)] font-medium mt-0.5">
                  Directory
                </span>
              </div>
              {/* Chevron - visible on all viewports */}
              <motion.div
                className="flex-shrink-0 mt-2"
                animate={{ rotate: brandExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-[var(--fg-quaternary)]" />
              </motion.div>
            </button>

            {/* Divider - visible when expanded */}
            <AnimatePresence>
              {showBrandContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="border-t border-[var(--border-primary)]"
                />
              )}
            </AnimatePresence>

            {/* Content - collapsible on all viewports */}
            <AnimatePresence initial={false}>
              {showBrandContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden flex-1 flex flex-col"
                >
                  {/* Brand links - 2-column grid */}
                  <div className="grid grid-cols-2 gap-2 flex-1 content-start p-4 sm:p-5 pt-4">
                    {brandLinks.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.04, duration: 0.25 }}
                        >
                          <Link
                            href={link.href}
                            className="group/link flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-150 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)]/80 border border-[var(--border-secondary)] hover:border-[var(--fg-tertiary)]"
                          >
                            <Icon className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover/link:text-[var(--fg-tertiary)] transition-colors flex-shrink-0" />
                            <span className="text-[13px] text-[var(--fg-secondary)] group-hover/link:text-[var(--fg-primary)] transition-colors truncate">
                              {link.label}
                            </span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
