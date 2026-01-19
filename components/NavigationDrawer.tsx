'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FolderPlus,
  Folder,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { useChatContext } from '@/lib/chat-context';
import { useSpaces } from '@/hooks/useSpaces';
import { slideFromLeft, staggerContainerFast, fadeInUp } from '@/lib/motion';
import type { QuickActionType } from '@/lib/quick-actions';

// Quick action IDs that trigger forms instead of text prompts
const QUICK_ACTION_FORM_IDS: Record<string, QuickActionType> = {
  'social-post': 'create-post-copy',
};

interface NavigationDrawerProps {
  isOpen: boolean;
  item: string | null;
  onClose: () => void;
  railRef: React.RefObject<HTMLElement | null>;
}

// Brand and Brain nav items - text-only for cleaner drawer look
const brandHubNavItems = [
  { label: 'Logo', href: '/brand-hub/logo' },
  { label: 'Colors', href: '/brand-hub/colors' },
  { label: 'Typography', href: '/brand-hub/fonts' },
  { label: 'Art Direction', href: '/brand-hub/art-direction' },
  { label: 'Textures', href: '/brand-hub/textures' },
  { label: 'Tokens', href: '/brand-hub/design-tokens' },
  { label: 'Guidelines', href: '/brand-hub/guidelines' },
];

// Quick actions that trigger chat prompts
const quickActions = [
  {
    id: 'social-post',
    title: 'Create post',
    description: 'Social media copy',
    prompt: 'Help me create a social media post. I want to announce [topic/product] and need engaging copy that fits my brand voice.',
  },
  {
    id: 'brand-review',
    title: 'Brand Review',
    description: 'Brand fit review',
    prompt: 'Review this and tell me if it matches my brand guidelines. Suggest improvements to make it more on-brand: [paste your content]',
  },
  {
    id: 'reverse-engineer',
    title: 'Reverse Engineer',
    description: 'Creative concepts',
    prompt: 'Help me brainstorm creative ideas for [campaign/project]. I want fresh concepts that align with my brand values.',
  },
  {
    id: 'product-copy',
    title: 'Product Copy',
    description: 'Content strategy',
    prompt: 'Help me plan a content campaign for [goal/product]. I need ideas for posts, timing, and messaging that align with my brand.',
  },
];

export function NavigationDrawer({ isOpen, item, onClose, railRef }: NavigationDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);
  const { chatHistory, loadSession, projects, triggerChatReset } = useChatContext();
  const { spaces: userSpaces, isLoaded: spacesLoaded } = useSpaces();

  // Handle clicking on a recent chat - load the session and navigate to home
  const handleChatClick = useCallback((chatId: string) => {
    loadSession(chatId);
    if (pathname !== '/') {
      router.push('/');
    }
    onClose();
  }, [loadSession, pathname, router, onClose]);

  // Handle quick action click - navigate with action param or use prompt
  const handleQuickAction = useCallback((actionId: string, prompt: string) => {
    const formType = QUICK_ACTION_FORM_IDS[actionId];
    
    if (formType) {
      // Navigate to home with action param - this will trigger the form in a new chat
      triggerChatReset();
      router.push(`/?action=${formType}`);
    } else {
      // Fall back to the traditional prompt approach
      triggerChatReset();
      router.push(`/?q=${encodeURIComponent(prompt)}`);
    }
    onClose();
  }, [triggerChatReset, router, onClose]);

  // Keep onClose ref up to date without triggering re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen && railRef.current && item) {
      const itemElement = railRef.current.querySelector(`[data-nav-item="${item}"]`);
      
      if (itemElement && railRef.current) {
        const railRect = railRef.current.getBoundingClientRect();
        setPosition({
          top: railRect.top,
          left: railRect.right, // Align to outer edge of rail
          height: railRect.height, // Full height of rail
        });
      }
    }
  }, [isOpen, item, railRef]);

  // Handle hover behavior - keep drawer open when hovering over rail item or drawer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isOpen || !drawerRef.current || !railRef.current) return;

      const target = e.target as Node;
      const isOverDrawer = drawerRef.current.contains(target);
      const isOverRail = railRef.current.contains(target);
      
      // Check if we're hovering over the specific nav item or its parent wrapper
      const navItem = railRef.current.querySelector(`[data-nav-item="${item}"]`);
      const navItemParent = navItem?.closest('div');
      const isOverNavItem = navItem && (
        navItem.contains(target) || 
        navItem === target ||
        (navItemParent && navItemParent.contains(target))
      );

      // Clear any existing timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      // Keep drawer open if over drawer, rail, or the specific nav item
      if (isOverDrawer || isOverRail || isOverNavItem) {
        return; // Keep drawer open
      }

      // If not over any of these, schedule close with delay
      closeTimeoutRef.current = setTimeout(() => {
        // Double-check before closing
        if (typeof document === 'undefined') return;
        const stillOverDrawer = drawerRef.current?.contains(document.elementFromPoint(e.clientX, e.clientY));
        const stillOverRail = railRef.current?.contains(document.elementFromPoint(e.clientX, e.clientY));
        if (!stillOverDrawer && !stillOverRail) {
          onCloseRef.current();
        }
      }, 200); // Delay to allow movement between rail and drawer
    };

    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }
  }, [isOpen, item, railRef]); // Removed onClose from dependencies

  // Handle click outside to close drawer immediately
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen || !drawerRef.current || !railRef.current) return;

      const target = e.target as Node;
      const isInsideDrawer = drawerRef.current.contains(target);
      const isInsideRail = railRef.current.contains(target);

      if (!isInsideDrawer && !isInsideRail) {
        onCloseRef.current();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, railRef]);

  const renderContent = () => {
    switch (item) {
      case 'RecentChats':
        return (
          <motion.div
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            <div className="px-3">
              <motion.div variants={fadeInUp} className="mb-2">
                <div className="flex items-center justify-between px-2 pt-3 pb-2">
                  <h3 className="text-base font-semibold text-[var(--fg-primary)]">Chats</h3>
                  <Link
                    href="/chats"
                    onClick={onClose}
                    className="text-sm text-[var(--fg-brand-primary)] hover:underline flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>

              <div className="space-y-1">
                {chatHistory.length > 0 ? (
                  chatHistory.slice(0, 8).map((chat, index) => (
                    <motion.button
                      key={chat.id}
                      variants={fadeInUp}
                      custom={index}
                      onClick={() => handleChatClick(chat.id)}
                      className="w-full text-left px-3.5 py-3 rounded-lg text-base text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2"
                    >
                      <span className="truncate">{chat.title}</span>
                    </motion.button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--fg-quaternary)] px-3 py-2">
                    No recent chats yet
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'Projects':
        return (
          <motion.div
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            <div className="px-3">
              <motion.div variants={fadeInUp} className="mb-2">
                <div className="flex items-center justify-between px-2 pt-3 pb-2">
                  <h3 className="text-base font-semibold text-[var(--fg-primary)]">Projects</h3>
                  <Link
                    href="/projects"
                    onClick={onClose}
                    className="text-sm text-[var(--fg-brand-primary)] hover:underline flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>

              <div className="space-y-1">
                {projects.length > 0 ? (
                  projects.slice(0, 8).map((project, index) => (
                    <motion.div key={project.id} variants={fadeInUp} custom={index}>
                      <Link
                        href={`/projects/${project.id}`}
                        onClick={onClose}
                        className="w-full flex items-center gap-2 px-3.5 py-3 rounded-lg text-base text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--fg-quaternary)] px-3 py-2">
                    No projects yet
                  </p>
                )}
              </div>

              {/* Create new project button */}
              <motion.div variants={fadeInUp} className="mt-3 pt-3 border-t border-[var(--border-secondary)]">
                <Link
                  href="/projects"
                  onClick={onClose}
                  className="w-full flex items-center gap-2 px-3.5 py-3 rounded-lg text-base text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  <FolderPlus className="w-5 h-5" />
                  <span>Create new project</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        );

      case 'Spaces':
        return (
          <motion.div 
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {/* Header - vertically centered with plus icon (py-3 outer + pt-3 inner) */}
            <div className="px-2 mb-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-base font-semibold text-[var(--fg-primary)] px-2 pt-3 pb-2">Spaces</h3>
              </motion.div>

              <motion.button
                variants={fadeInUp}
                className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors mb-1 text-base"
              >
                <FileText className="w-5 h-5" />
                <span>Templates</span>
              </motion.button>

              <motion.button
                variants={fadeInUp}
                className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors mb-3 text-base"
              >
                <FolderPlus className="w-5 h-5" />
                <span>Create new Space</span>
              </motion.button>

              <motion.div variants={fadeInUp} className="border-t border-[var(--border-secondary)] pt-2">
                <div className="px-3 py-1 text-xs text-[var(--fg-tertiary)] mb-2">My Spaces</div>
                {!spacesLoaded ? (
                  <div className="px-3 py-2 text-sm text-[var(--fg-quaternary)]">
                    Loading...
                  </div>
                ) : userSpaces.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-[var(--fg-quaternary)]">
                    No spaces yet. Create one above!
                  </div>
                ) : (
                  userSpaces.map((space, index) => {
                    const isSpaceActive = pathname === `/spaces/${space.slug}`;
                    return (
                      <motion.div
                        key={space.id}
                        variants={fadeInUp}
                        custom={index}
                      >
                        <Link
                          href={`/spaces/${space.slug}`}
                          className={`
                            w-full flex items-center gap-3 px-3.5 py-3 rounded-lg mb-1
                            transition-colors
                            ${
                              isSpaceActive
                                ? 'bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)]'
                                : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                            }
                          `}
                        >
                          <LayoutGrid className={`w-5 h-5 ${isSpaceActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium truncate">{space.title}</div>
                            {space.description && (
                              <div className="text-sm text-[var(--fg-tertiary)] truncate">
                                {space.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </div>
          </motion.div>
        );
      
      case 'Home':
        return (
          <motion.div
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            <div className="px-3">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-base font-semibold text-[var(--fg-primary)] px-2 pt-3 pb-2">Home</h3>
              </motion.div>

              {/* Quick Actions section - First */}
              <motion.div variants={fadeInUp} className="mb-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h4 className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wide">Quick actions</h4>
                </div>
                <div className="space-y-0.5">
                  {quickActions.map((action, index) => {
                    return (
                      <motion.button
                        key={action.id}
                        variants={fadeInUp}
                        custom={index}
                        onClick={() => handleQuickAction(action.id, action.prompt)}
                        className="w-full text-left px-3.5 py-2.5 rounded-md text-base text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2 group"
                      >
                        <span className="truncate">{action.title}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Projects section */}
              <motion.div variants={fadeInUp} className="mb-4 pt-3 border-t border-[var(--border-secondary)]">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h4 className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wide">Projects</h4>
                  <Link
                    href="/projects"
                    onClick={onClose}
                    className="text-xs text-[var(--fg-brand-primary)] hover:underline flex items-center gap-0.5"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1">
                  {projects.length > 0 ? (
                    projects.slice(0, 5).map((project, index) => (
                      <motion.div key={project.id} variants={fadeInUp} custom={index}>
                        <Link
                          href={`/projects/${project.id}`}
                          onClick={onClose}
                          className="w-full flex items-center gap-2 px-3.5 py-3 rounded-lg text-base text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                        >
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--fg-quaternary)] px-3 py-1">
                      No projects yet
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Recent chats section */}
              <motion.div variants={fadeInUp} className="pt-3 border-t border-[var(--border-secondary)]">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h4 className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wide">Chats</h4>
                  <Link
                    href="/chats"
                    onClick={onClose}
                    className="text-xs text-[var(--fg-brand-primary)] hover:underline flex items-center gap-0.5"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1">
                  {chatHistory.length > 0 ? (
                    chatHistory.slice(0, 5).map((chat, index) => (
                      <motion.button
                        key={chat.id}
                        variants={fadeInUp}
                        custom={index}
                        onClick={() => handleChatClick(chat.id)}
                        className="w-full text-left px-3.5 py-3 rounded-lg text-base text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2"
                      >
                        <span className="truncate">{chat.title}</span>
                      </motion.button>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--fg-quaternary)] px-3 py-1">
                      No recent chats yet
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      case 'Brand':
        // Only show "View All Assets" when on a subpage, not on main /brand-hub
        const isOnSubpage = pathname.startsWith('/brand-hub/');

        return (
          <motion.div
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {/* Header - vertically centered with plus icon (py-3 outer + pt-3 inner) */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-base font-semibold text-[var(--fg-primary)] px-2 pt-3 pb-2">Brand</h3>
              </motion.div>

              <div className="space-y-1">
                {brandHubNavItems.map((navItem, index) => {
                  const isActive = pathname === navItem.href;
                  return (
                    <motion.div key={navItem.href} variants={fadeInUp} custom={index}>
                      <Link
                        href={navItem.href}
                        className={`
                          w-full flex items-center px-2.5 py-2.5 rounded-md
                          transition-colors text-base
                          ${
                            isActive
                              ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                              : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                          }
                        `}
                      >
                        <span>{navItem.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Only show View All Assets when on a subpage */}
              {isOnSubpage && (
                <motion.div variants={fadeInUp} className="mt-3 pt-3 border-t border-[var(--border-secondary)]">
                  <Link
                    href="/brand-hub"
                    className="w-full flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-base"
                  >
                    View All Assets
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 'Brain':
        const brainNavItems = [
          { label: 'Architecture', href: '/brain/architecture' },
          { label: 'Brand Identity', href: '/brain/brand-identity' },
          { label: 'Writing Styles', href: '/brain/writing-styles' },
          { label: 'Skills', href: '/brain/skills' },
          { label: 'Plugins', href: '/brain/plugins' },
          { label: 'Agents', href: '/brain/agents' },
        ];
        const isOnBrainSubpage = pathname.startsWith('/brain/');

        return (
          <motion.div
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-base font-semibold text-[var(--fg-primary)] px-2 pt-3 pb-2">Brain</h3>
              </motion.div>

              <div className="space-y-1">
                {brainNavItems.map((navItem, index) => {
                  const isActive = pathname === navItem.href;
                  return (
                    <motion.div key={navItem.href} variants={fadeInUp} custom={index}>
                      <Link
                        href={navItem.href}
                        className={`
                          w-full flex items-center px-2.5 py-2.5 rounded-md
                          transition-colors text-base
                          ${
                            isActive
                              ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                              : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                          }
                        `}
                      >
                        <span>{navItem.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Only show View Brain Overview when on a subpage */}
              {isOnBrainSubpage && (
                <motion.div variants={fadeInUp} className="mt-3 pt-3 border-t border-[var(--border-secondary)]">
                  <Link
                    href="/brain"
                    className="w-full flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-base"
                  >
                    View Brain Overview
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 'Resources':
        return (
          <motion.div
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {/* Header - vertically centered with plus icon (py-3 outer + pt-3 inner) */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-base font-semibold text-[var(--fg-primary)] px-2 pt-3 pb-2">Resources</h3>
              </motion.div>

              <motion.div variants={fadeInUp} className="text-base text-[var(--fg-tertiary)] p-2">
                Resources and documentation coming soon
              </motion.div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          ref={drawerRef}
          data-navigation-drawer
          className="hidden lg:block fixed z-[175] w-[256px] bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] shadow-[var(--shadow-lg)] overflow-y-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            height: `${position.height}px`,
          }}
          variants={slideFromLeft}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseEnter={() => {
            // Clear any pending close when entering drawer
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
          }}
        >
          {renderContent()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
