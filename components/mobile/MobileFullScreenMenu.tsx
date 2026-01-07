'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  LayoutGrid,
  ScanFace,
  BrainCog,
  HelpCircle,
  History,
  ChevronRight,
  Folder,
  ExternalLink,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { useChatContext } from '@/lib/chat-context';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

// Simple navigation items - no sub-items for mobile
const navItems = [
  { label: 'Brand', href: '/brand-hub', icon: ScanFace },
  { label: 'Brain', href: '/brain', icon: BrainCog },
  { label: 'Spaces', href: '/spaces', icon: LayoutGrid },
];

// Animation variants - smooth slide and fade
const menuVariants = {
  hidden: { 
    opacity: 0,
    y: -8,
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.25, 
      ease: [0.32, 0.72, 0, 1] // Custom ease for smooth deceleration
    }
  },
  exit: { 
    opacity: 0,
    y: -8,
    transition: { 
      duration: 0.2, 
      ease: [0.32, 0, 0.67, 0] // Custom ease for smooth acceleration out
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.15,
      delay: 0.05,
      staggerChildren: 0.04
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
  const { triggerChatReset, chatHistory, projects } = useChatContext();

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
          className="fixed inset-x-0 top-14 bottom-0 z-[45] bg-[var(--bg-primary)] lg:hidden flex flex-col"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Scrollable Content - Menu slides in below header */}
          <motion.div 
            className="flex-1 overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Navigation Section */}
            <motion.div variants={itemVariants} className="px-4 py-4">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-3 px-1">
                Navigate
              </p>
              <nav className="space-y-1">
                {/* New Chat - Primary Action */}
                <button
                  onClick={handleNewChat}
                  className="
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                    bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)]
                    active:bg-[var(--bg-quaternary)]
                    text-[var(--fg-primary)] font-medium 
                    border border-[var(--border-secondary)]
                    transition-all
                  "
                >
                  <Plus className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                  <span>New Chat</span>
                </button>

                {/* Main Nav Items */}
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

                {/* Divider */}
                <div className="my-2 border-t border-[var(--border-secondary)]" />

                {/* Projects */}
                <Link
                  href="/projects"
                  onClick={handleNavClick}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-xl
                    transition-colors
                    ${isItemActive('/projects')
                      ? 'bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)]' 
                      : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                    }
                  `}
                >
                  <Folder className={`w-5 h-5 flex-shrink-0 ${isItemActive('/projects') ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                  <span className="font-medium">Projects</span>
                  {projects.length > 0 && (
                    <span className="text-[var(--fg-quaternary)] text-sm">({projects.length})</span>
                  )}
                </Link>

                {/* Recent Chats */}
                <Link
                  href="/chats"
                  onClick={handleNavClick}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-xl
                    transition-colors
                    ${isItemActive('/chats')
                      ? 'bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)]' 
                      : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                    }
                  `}
                >
                  <History className={`w-5 h-5 flex-shrink-0 ${isItemActive('/chats') ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                  <span className="font-medium">Recent Chats</span>
                  {chatHistory.length > 0 && (
                    <span className="text-[var(--fg-quaternary)] text-sm">({chatHistory.length})</span>
                  )}
                </Link>
              </nav>
            </motion.div>

            {/* Settings Section */}
            <motion.div variants={itemVariants} className="px-4 py-4 border-t border-[var(--border-secondary)]">
              <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-3 px-1">
                Settings
              </p>
              <div className="space-y-1">
                {/* Account - First */}
                <button 
                  onClick={() => openPanel('account')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-[var(--border-secondary)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[8px] font-mono">A</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Account</p>
                      <p className="text-[var(--fg-tertiary)] text-xs">Manage settings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)]" />
                </button>

                {/* Help - Second */}
                <button 
                  onClick={() => openPanel('help')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Help</p>
                      <p className="text-[var(--fg-tertiary)] text-xs">Get support & resources</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--fg-quaternary)]" />
                </button>

                {/* Language Selector */}
                <LanguageSelector variant="mobile" />
              </div>
            </motion.div>

            {/* Footer Links */}
            <motion.div variants={itemVariants} className="px-4 py-4 border-t border-[var(--border-secondary)] mt-auto">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <a 
                  href="https://opensession.co/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
                >
                  Privacy Policy
                </a>
                <span className="text-[var(--fg-quaternary)]">·</span>
                <a 
                  href="https://opensession.co/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
                >
                  Terms & Conditions
                </a>
                <span className="text-[var(--fg-quaternary)]">·</span>
                <a 
                  href="https://opensession.co" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors inline-flex items-center gap-1"
                >
                  opensession.co
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
