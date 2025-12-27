'use client';

import { useCallback } from 'react';
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
  History,
  ChevronRight,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { useChatContext } from '@/lib/chat-context';

// Simple navigation items - no sub-items for mobile
const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Brand', href: '/brand-hub', icon: ScanFace },
  { label: 'Brain', href: '/brain', icon: BrainCog },
  { label: 'Spaces', href: '/spaces', icon: LayoutGrid },
];

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
  const { triggerChatReset, chatHistory } = useChatContext();

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

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!isMobileMenuOpen) return null;

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          className="fixed inset-0 top-0 z-[60] bg-[var(--bg-primary)] lg:hidden flex flex-col"
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
            {/* Navigation Section */}
            <motion.div variants={itemVariants} className="px-4 pb-2">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 px-1">
                Navigate
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`
                        flex items-center gap-3 px-4 py-3.5 rounded-xl
                        transition-colors
                        ${isActive 
                          ? 'bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)]' 
                          : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>

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
              </div>
            </motion.div>

            {/* Chat Actions - New Chat + Recent Chats */}
            <motion.div variants={itemVariants} className="p-4 pt-2 space-y-2 border-t border-[var(--border-secondary)]">
              {/* New Chat - Primary Button */}
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

              {/* Recent Chats - Secondary Outline Button */}
              <Link
                href="/chats"
                onClick={handleNavClick}
                className="
                  w-full flex items-center justify-center gap-2
                  py-3.5 px-4
                  bg-transparent hover:bg-[var(--bg-tertiary)]
                  active:bg-[var(--bg-tertiary)]
                  text-[var(--fg-primary)] 
                  rounded-xl font-medium 
                  border border-[var(--border-secondary)]
                  transition-all
                "
              >
                <History className="w-5 h-5 text-[var(--fg-tertiary)]" />
                <span>Recent Chats</span>
                {chatHistory.length > 0 && (
                  <span className="text-[var(--fg-quaternary)]">({chatHistory.length})</span>
                )}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
