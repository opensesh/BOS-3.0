'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Home,
  LayoutGrid,
  ScanFace,
  BrainCog,
  Bell,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  Fingerprint,
  Palette,
  Type,
  ImageIcon,
  Shapes,
  Code,
  PenTool,
  Zap,
  Layers,
  FolderPlus,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { useChatContext } from '@/lib/chat-context';
import { useSpaces } from '@/hooks/useSpaces';
import { ThemeSegmentedControl } from './ThemeSegmentedControl';

// Navigation structure matching desktop
const navItems = [
  { 
    label: 'Home', 
    href: '/', 
    icon: Home,
    subItems: []
  },
  { 
    label: 'Brand', 
    href: '/brand-hub', 
    icon: ScanFace,
    subItems: [
      { label: 'Logo', href: '/brand-hub/logo', icon: Fingerprint },
      { label: 'Colors', href: '/brand-hub/colors', icon: Palette },
      { label: 'Typography', href: '/brand-hub/fonts', icon: Type },
      { label: 'Art Direction', href: '/brand-hub/art-direction', icon: ImageIcon },
      { label: 'Tokens', href: '/brand-hub/design-tokens', icon: Shapes },
      { label: 'Guidelines', href: '/brand-hub/guidelines', icon: FileText },
    ]
  },
  { 
    label: 'Brain', 
    href: '/brain', 
    icon: BrainCog,
    subItems: [
      { label: 'Architecture', href: '/brain/architecture', icon: Code },
      { label: 'Brand Identity', href: '/brain/brand-identity', icon: FileText },
      { label: 'Writing Styles', href: '/brain/writing-styles', icon: PenTool },
      { label: 'Skills', href: '/brain/skills', icon: Zap },
      { label: 'Components', href: '/brain/components', icon: Layers },
    ]
  },
  { 
    label: 'Spaces', 
    href: '/spaces', 
    icon: LayoutGrid,
    subItems: [] // Dynamic - populated from useSpaces
  },
];

const VISIBLE_CHAT_COUNT = 3;

// Animation variants
const menuVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.25, 
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.03
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }
};

export function MobileFullScreenMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, closeMobileMenu, openPanel } = useMobileMenu();
  const { chatHistory, triggerChatReset, loadSession } = useChatContext();
  const { spaces: userSpaces, isLoaded: spacesLoaded } = useSpaces();
  
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    // Auto-expand the section containing current page
    if (pathname.startsWith('/brand-hub')) return ['Brand'];
    if (pathname.startsWith('/brain')) return ['Brain'];
    if (pathname.startsWith('/spaces')) return ['Spaces'];
    return [];
  });

  const toggleSection = (label: string) => {
    setExpandedSections(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleNewChat = useCallback(() => {
    triggerChatReset();
    closeMobileMenu();
    if (pathname !== '/') {
      router.push('/');
    }
  }, [triggerChatReset, closeMobileMenu, pathname, router]);

  const handleNavClick = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  const handleChatClick = useCallback((chatId: string) => {
    loadSession(chatId);
    closeMobileMenu();
    if (pathname !== '/') {
      router.push('/');
    }
  }, [loadSession, closeMobileMenu, pathname, router]);

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!isMobileMenuOpen) return null;

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          className="fixed inset-0 top-0 z-50 bg-[var(--bg-primary)] lg:hidden flex flex-col"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
            <span className="text-base font-semibold text-[var(--fg-primary)]">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="
                flex items-center justify-center
                w-10 h-10 -mr-2
                rounded-lg
                text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <motion.div 
            className="flex-1 overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {/* New Chat Button */}
            <motion.div variants={itemVariants} className="p-4">
              <button
                onClick={handleNewChat}
                className="
                  w-full flex items-center justify-center gap-2
                  py-3.5 px-4
                  bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)]
                  active:bg-[var(--bg-quaternary)]
                  text-[var(--fg-primary)] 
                  rounded-xl font-medium 
                  border border-[var(--border-secondary)]
                  transition-all
                "
              >
                <Plus className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                <span>New Chat</span>
              </button>
            </motion.div>

            {/* Navigation Section */}
            <motion.div variants={itemVariants} className="px-4 pb-2">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
                Navigate
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.href);
                  const hasSubItems = item.subItems.length > 0 || item.label === 'Spaces';
                  const isExpanded = expandedSections.includes(item.label);
                  
                  return (
                    <div key={item.href}>
                      {/* Main nav row */}
                      <div 
                        className={`
                          flex items-center rounded-xl transition-colors
                          ${isActive 
                            ? 'bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)]' 
                            : 'text-[var(--fg-secondary)]'
                          }
                        `}
                      >
                        {/* Link area - navigates to page */}
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          className="flex-1 flex items-center gap-3 px-4 py-3.5 min-h-[52px]"
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                        
                        {/* Expand toggle - only for items with sub-items */}
                        {hasSubItems && (
                          <button
                            onClick={() => toggleSection(item.label)}
                            className={`
                              flex items-center justify-center
                              w-12 h-12 mr-1
                              rounded-lg
                              transition-colors
                              ${isActive 
                                ? 'text-[var(--fg-brand-primary)] hover:bg-[var(--bg-quaternary)]' 
                                : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                              }
                            `}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`}
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </button>
                        )}
                      </div>

                      {/* Expanded sub-items */}
                      <AnimatePresence>
                        {isExpanded && hasSubItems && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="pl-6 pr-2 py-1 space-y-0.5">
                              {/* Standard sub-items */}
                              {item.subItems.map((subItem) => {
                                const SubIcon = subItem.icon;
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    onClick={handleNavClick}
                                    className={`
                                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                                      transition-colors
                                      ${isSubActive 
                                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
                                        : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                                      }
                                    `}
                                  >
                                    <SubIcon className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">{subItem.label}</span>
                                  </Link>
                                );
                              })}

                              {/* Spaces - dynamic content */}
                              {item.label === 'Spaces' && (
                                <>
                                  <button 
                                    onClick={handleNavClick}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                                  >
                                    <FolderPlus className="w-4 h-4" />
                                    <span className="text-sm">Create new Space</span>
                                  </button>
                                  {spacesLoaded && userSpaces.length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-[var(--border-secondary)]">
                                      {userSpaces.slice(0, 5).map((space) => {
                                        const isSpaceActive = pathname === `/spaces/${space.slug}`;
                                        return (
                                          <Link
                                            key={space.id}
                                            href={`/spaces/${space.slug}`}
                                            onClick={handleNavClick}
                                            className={`
                                              flex items-center gap-3 px-3 py-2.5 rounded-lg
                                              transition-colors
                                              ${isSpaceActive 
                                                ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
                                                : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                                              }
                                            `}
                                          >
                                            <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-sm truncate">{space.title}</span>
                                          </Link>
                                        );
                                      })}
                                      {userSpaces.length > 5 && (
                                        <Link
                                          href="/spaces"
                                          onClick={handleNavClick}
                                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                        >
                                          <span className="text-sm">View all {userSpaces.length} spaces</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </Link>
                                      )}
                                    </div>
                                  )}
                                  {spacesLoaded && userSpaces.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-[var(--fg-quaternary)]">
                                      No spaces yet
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </motion.div>

            {/* Recent Chats Section */}
            {chatHistory.length > 0 && (
              <motion.div variants={itemVariants} className="px-4 py-4 border-t border-[var(--border-secondary)]">
                <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
                  Recent
                </p>
                <div className="space-y-0.5">
                  {chatHistory.slice(0, VISIBLE_CHAT_COUNT).map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{chat.title}</span>
                    </button>
                  ))}
                  {chatHistory.length > VISIBLE_CHAT_COUNT && (
                    <Link
                      href="/"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <span className="text-sm">View all {chatHistory.length} chats</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {/* Settings Section */}
            <motion.div variants={itemVariants} className="px-4 py-4 border-t border-[var(--border-secondary)]">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
                Settings
              </p>
              <div className="space-y-1">
                {/* Notifications */}
                <button 
                  onClick={() => openPanel('notifications')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)]" />
                </button>

                {/* Help */}
                <button 
                  onClick={() => openPanel('help')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5" />
                    <span className="font-medium">Help</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)]" />
                </button>

                {/* Account */}
                <button 
                  onClick={() => openPanel('account')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-[var(--border-secondary)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-mono">A</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[var(--fg-primary)] font-medium text-sm">Account</p>
                      <p className="text-[var(--fg-tertiary)] text-xs">Manage settings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)]" />
                </button>

                {/* Appearance - at the bottom */}
                <div className="pt-3 mt-2 border-t border-[var(--border-secondary)]">
                  <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
                    Appearance
                  </p>
                  <div className="px-1">
                    <ThemeSegmentedControl />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

