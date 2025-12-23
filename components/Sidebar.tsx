'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutGrid,
  ScanFace,
  BrainCog,
  Bell,
  MessageSquare,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { NavigationDrawer } from './NavigationDrawer';
import { MobileHeader } from './MobileHeader';
import { TopHeader } from './TopHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from './ThemeToggle';
import { useChatContext } from '@/lib/chat-context';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { overlayFade, slideFromRight, staggerContainerFast, fadeInUp } from '@/lib/motion';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Brand', href: '/brand-hub', icon: ScanFace },
  { label: 'Brain', href: '/brain', icon: BrainCog },
  { label: 'Spaces', href: '/spaces', icon: LayoutGrid },
];

const VISIBLE_CHAT_COUNT = 3;

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isChatsExpanded, setIsChatsExpanded] = useState(false);
  const railRef = useRef<HTMLElement>(null);
  const { chatHistory, triggerChatReset } = useChatContext();

  const handleDrawerClose = useCallback(() => {
    setHoveredItem(null);
  }, []);

  const handleNewChat = useCallback(() => {
    triggerChatReset();
    closeMobileMenu();
  }, [triggerChatReset, closeMobileMenu]);

  const handleHomeClick = useCallback(() => {
    if (pathname === '/') {
      triggerChatReset();
    }
    closeMobileMenu();
  }, [pathname, triggerChatReset, closeMobileMenu]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setIsChatsExpanded(false);
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Desktop Top Header */}
      <div className="hidden lg:block">
        <TopHeader>
          <Breadcrumbs />
        </TopHeader>
      </div>

      {/* Mobile Header */}
      <MobileHeader onBrandClick={handleHomeClick} />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 top-14 bg-[var(--bg-overlay)] z-40 lg:hidden"
            onClick={closeMobileMenu}
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Desktop Navigation Rail */}
      <aside
        ref={railRef}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className="
          hidden lg:flex
          fixed top-10 left-0 z-40
          w-[48px]
          bg-bg-secondary border-r border-border-secondary
          flex-col
          h-[calc(100vh-40px)]
        "
      >
        {/* New Chat Button */}
        <div className="flex justify-center py-2">
          <Link
            href="/"
            onClick={handleNewChat}
            className="
              flex flex-col items-center justify-center
              py-1 px-1.5
              transition-colors duration-150
              group
              text-fg-tertiary hover:text-fg-primary
            "
            title="New Chat"
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-md bg-bg-tertiary group-hover:bg-bg-quaternary border border-border-secondary transition-all duration-150">
              <Plus className="w-4 h-4 text-fg-brand-primary" />
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === '/spaces' && pathname.startsWith('/spaces')) ||
              (item.href === '/brand-hub' && pathname.startsWith('/brand-hub')) ||
              (item.href === '/brain' && pathname.startsWith('/brain'));
            
            return (
              <div
                key={item.href}
                className="relative w-full flex justify-center"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => {}}
              >
                <Link
                  data-nav-item={item.label}
                  href={item.href}
                  onClick={item.href === '/' ? handleHomeClick : closeMobileMenu}
                  className={`
                    flex flex-col items-center
                    py-1.5 px-1.5 min-h-[44px]
                    transition-colors duration-150
                    group relative
                    ${isActive ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'}
                  `}
                >
                  <div className="relative">
                    <div className={`
                      absolute -left-1.5 top-1/2 -translate-y-1/2 w-[2px] rounded-r-full
                      transition-all duration-150
                      ${isActive ? 'h-4 bg-[var(--bg-brand-solid)]' : 'h-0 bg-transparent'}
                    `} />
                    
                    <div className={`
                      w-7 h-7 flex items-center justify-center rounded-md
                      transition-all duration-150
                      ${isActive 
                        ? 'bg-[var(--bg-brand-primary)]' 
                        : 'group-hover:bg-[var(--bg-tertiary)]'
                      }
                    `}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                    </div>
                  </div>
                  
                  <span 
                    className={`
                      text-[9px] font-medium text-center leading-tight mt-0.5
                      transition-all duration-200 ease-out
                      ${isActive ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]'}
                    `}
                    style={{
                      opacity: isActive || isSidebarHovered ? 1 : 0,
                      transform: isActive || isSidebarHovered ? 'translateY(0)' : 'translateY(-2px)',
                      transitionDelay: isSidebarHovered ? `${index * 25}ms` : '0ms',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center border-t border-[var(--border-secondary)] py-1.5">
          {/* Theme Toggle */}
          <ThemeToggle isCollapsed={!isSidebarHovered} />
          
          <button
            className="
              flex flex-col items-center justify-center
              py-1.5 px-1.5 min-h-[44px]
              text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
              transition-colors duration-150 group
            "
            title="Notifications"
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-md group-hover:bg-[var(--bg-tertiary)] transition-colors duration-150">
              <Bell className="w-4 h-4" />
            </div>
            <span 
              className="text-[9px] font-medium text-center mt-0.5 transition-all duration-200 ease-out"
              style={{
                opacity: isSidebarHovered ? 1 : 0,
                transform: isSidebarHovered ? 'translateY(0)' : 'translateY(-2px)',
                transitionDelay: isSidebarHovered ? '100ms' : '0ms',
              }}
            >
              Alerts
            </span>
          </button>

          <button
            className="
              flex flex-col items-center justify-center
              py-1.5 px-1.5 min-h-[44px]
              text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
              transition-colors duration-150 group
            "
            title="Account"
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-md group-hover:bg-[var(--bg-tertiary)] transition-colors duration-150">
              <div className="w-[18px] h-[18px] bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-[var(--border-secondary)] rounded-full flex items-center justify-center">
                <span className="text-white text-[7px] font-mono">A</span>
              </div>
            </div>
            <span 
              className="text-[9px] font-medium text-center mt-0.5 transition-all duration-200 ease-out"
              style={{
                opacity: isSidebarHovered ? 1 : 0,
                transform: isSidebarHovered ? 'translateY(0)' : 'translateY(-2px)',
                transitionDelay: isSidebarHovered ? '125ms' : '0ms',
              }}
            >
              Account
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            className="fixed lg:hidden top-14 bottom-0 right-0 z-40 w-80 max-w-[85vw] bg-[var(--bg-secondary)] border-l border-[var(--border-secondary)] flex flex-col"
            variants={slideFromRight}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex-1 overflow-y-auto"
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
            >
              {/* New Chat Button */}
              <motion.div variants={fadeInUp} className="p-4">
                <Link
                  href="/"
                  onClick={handleNewChat}
                  className="
                    w-full flex items-center space-x-3
                    py-3 px-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] 
                    text-[var(--fg-primary)] rounded-lg font-medium border border-[var(--border-secondary)]
                    transition-all hover:shadow-lg
                  "
                >
                  <Plus className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                  <span>New Chat</span>
                </Link>
              </motion.div>

              {/* Recent Chats */}
              {chatHistory.length > 0 && (
                <motion.div variants={fadeInUp} className="px-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                      Recent
                    </p>
                    {chatHistory.length > VISIBLE_CHAT_COUNT && (
                      <button
                        onClick={() => setIsChatsExpanded(!isChatsExpanded)}
                        className="text-xs text-[var(--fg-brand-primary)] hover:text-[var(--fg-brand-secondary)] transition-colors flex items-center gap-1"
                      >
                        {isChatsExpanded ? 'Show less' : `+${chatHistory.length - VISIBLE_CHAT_COUNT} more`}
                        <motion.div
                          animate={{ rotate: isChatsExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </motion.div>
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <AnimatePresence initial={false}>
                      {(isChatsExpanded ? chatHistory : chatHistory.slice(0, VISIBLE_CHAT_COUNT)).map((chat, index) => (
                        <motion.button
                          key={chat.id}
                          initial={index >= VISIBLE_CHAT_COUNT ? { opacity: 0, height: 0 } : false}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{chat.title}</span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Navigation Items */}
              <nav className="px-3 space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href === '/spaces' && pathname.startsWith('/spaces'));
                  
                  return (
                    <motion.div key={item.href} variants={fadeInUp} custom={index}>
                      <Link
                        href={item.href}
                        onClick={item.href === '/' ? handleHomeClick : closeMobileMenu}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg
                          transition-all duration-200
                          ${isActive
                            ? 'bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)]'
                            : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div variants={fadeInUp} className="border-t border-[var(--border-secondary)] my-4" />

              <motion.div variants={fadeInUp} className="px-3 space-y-1">
                {/* Theme Toggle for Mobile - drawer variant */}
                <ThemeToggle variant="drawer" />
                
                <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notifications</span>
                </button>

                <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-[var(--border-secondary)] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-mono">A</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--fg-primary)] font-medium text-sm">Account</p>
                    <p className="text-[var(--fg-tertiary)] text-xs">Manage settings</p>
                  </div>
                </button>
              </motion.div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Navigation Drawer - Desktop Only */}
      <NavigationDrawer
        isOpen={hoveredItem !== null}
        item={hoveredItem}
        onClose={handleDrawerClose}
        railRef={railRef}
      />
    </>
  );
}
