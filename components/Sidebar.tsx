'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronRight,
  Sidebar as SidebarIcon,
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
  ArrowRight,
} from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { TopHeader } from './TopHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { useChatContext } from '@/lib/chat-context';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { useSidebar, SidebarMode, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/lib/sidebar-context';
import { useSpaces } from '@/hooks/useSpaces';
import { overlayFade, slideFromRight, staggerContainerFast, fadeInUp } from '@/lib/motion';
import { NavigationDrawer } from './NavigationDrawer';

// Navigation structure with subitems
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

// Helper to determine which section should be expanded based on pathname
function getActiveSectionFromPathname(pathname: string): string | null {
  if (pathname.startsWith('/brand-hub')) return 'Brand';
  if (pathname.startsWith('/brain')) return 'Brain';
  if (pathname.startsWith('/spaces')) return 'Spaces';
  if (pathname === '/') return 'Home';
  return null;
}

// Sidebar control component (Supabase-style)
function SidebarControl({ isExpanded }: { isExpanded: boolean }) {
  const { sidebarMode, setSidebarMode } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (controlRef.current && !controlRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: { mode: SidebarMode; label: string; description: string }[] = [
    { mode: 'expanded', label: 'Expanded', description: 'Full sidebar with labels' },
    { mode: 'collapsed', label: 'Collapsed', description: 'Icons only' },
    { mode: 'hover', label: 'Expand on hover', description: 'Opens drawer on hover' },
  ];

  return (
    <div ref={controlRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-2
          px-2 py-2
          text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
          hover:bg-[var(--bg-tertiary)]
          transition-colors duration-150
          rounded-md
          ${isExpanded ? 'justify-start' : 'justify-center'}
        `}
        title="Sidebar control"
        aria-label="Sidebar control"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <SidebarIcon className="w-4 h-4 flex-shrink-0" />
        {isExpanded && (
          <span className="text-xs whitespace-nowrap">Sidebar</span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute bottom-full mb-1
              w-48 bg-[var(--bg-secondary)]
              rounded-lg border border-[var(--border-secondary)]
              shadow-lg z-[100]
              overflow-hidden
              ${isExpanded ? 'left-0' : 'left-full ml-2'}
            `}
            role="menu"
            aria-label="Sidebar mode options"
          >
            <div className="px-3 py-2 border-b border-[var(--border-secondary)]">
              <span className="text-xs text-[var(--fg-tertiary)]">Sidebar mode</span>
            </div>
            <div className="py-1">
              {options.map((option) => {
                const isSelected = sidebarMode === option.mode;
                return (
                  <button
                    key={option.mode}
                    onClick={() => {
                      setSidebarMode(option.mode);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2
                      px-3 py-2
                      text-left
                      hover:bg-[var(--bg-tertiary)]
                      transition-colors duration-100
                      ${isSelected ? 'text-[var(--fg-primary)]' : 'text-[var(--fg-secondary)]'}
                    `}
                    role="menuitem"
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-brand-primary)]" />
                    )}
                    {!isSelected && <span className="w-1.5 h-1.5" />}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{option.label}</span>
                      <span className="text-[10px] text-[var(--fg-quaternary)]">{option.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Flyout drawer for collapsed mode (small tooltip-style flyout on hover)
function CollapsedFlyout({ 
  item, 
  isOpen, 
  anchorRect,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: { 
  item: typeof navItems[0] | null;
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const { spaces: userSpaces } = useSpaces();
  const { chatHistory, loadSession } = useChatContext();

  if (!item || !anchorRect) return null;

  const top = anchorRect.top;
  
  // Special content for Home
  if (item.label === 'Home') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[60] w-[220px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
            style={{
              left: SIDEBAR_WIDTH_COLLAPSED + 8,
              top: Math.max(top - 8, 60),
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="menu"
            aria-label="Home menu"
          >
            <Link 
              href="/"
              className="px-3 py-2.5 border-b border-[var(--border-secondary)] flex items-center justify-between group hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <span className="text-sm font-medium text-[var(--fg-primary)]">Home</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
            </Link>
            <div className="py-2 max-h-[300px] overflow-y-auto">
              <div className="px-3 py-1 text-[10px] text-[var(--fg-quaternary)] uppercase tracking-wider font-medium">Recent chats</div>
              {chatHistory.length > 0 ? (
                chatHistory.slice(0, 5).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      loadSession(chat.id);
                      if (pathname !== '/') {
                        router.push('/');
                      }
                      onClose();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-left"
                    role="menuitem"
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[var(--fg-quaternary)]" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-[var(--fg-quaternary)]">No recent chats</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Special content for Spaces
  if (item.label === 'Spaces') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[60] w-[220px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
            style={{
              left: SIDEBAR_WIDTH_COLLAPSED + 8,
              top: Math.max(top - 8, 60),
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="menu"
            aria-label="Spaces menu"
          >
            <Link 
              href="/spaces"
              className="px-3 py-2.5 border-b border-[var(--border-secondary)] flex items-center justify-between group hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <span className="text-sm font-medium text-[var(--fg-primary)]">Spaces</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
            </Link>
            <div className="py-2 max-h-[300px] overflow-y-auto">
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors">
                <FolderPlus className="w-3.5 h-3.5 text-[var(--fg-quaternary)]" />
                <span>Create new Space</span>
              </button>
              {userSpaces.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-secondary)]">
                  <div className="px-3 py-1 text-[10px] text-[var(--fg-quaternary)] uppercase tracking-wider font-medium">My Spaces</div>
                  {userSpaces.map((space) => (
                    <Link
                      key={space.id}
                      href={`/spaces/${space.slug}`}
                      onClick={onClose}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
                        ${pathname === `/spaces/${space.slug}` 
                          ? 'text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]' 
                          : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                        }
                      `}
                      role="menuitem"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{space.title}</span>
                    </Link>
                  ))}
                </div>
              )}
              {userSpaces.length === 0 && (
                <p className="px-3 py-2 text-xs text-[var(--fg-quaternary)]">No spaces yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Standard subItems flyout for Brand/Brain
  if (item.subItems && item.subItems.length > 0) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[60] w-[220px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
            style={{
              left: SIDEBAR_WIDTH_COLLAPSED + 8,
              top: Math.max(top - 8, 60),
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="menu"
            aria-label={`${item.label} menu`}
          >
            <Link 
              href={item.href}
              onClick={onClose}
              className="px-3 py-2.5 border-b border-[var(--border-secondary)] flex items-center justify-between group hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <span className="text-sm font-medium text-[var(--fg-primary)]">{item.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
            </Link>
            <div className="py-2">
              {item.subItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isActive = pathname === subItem.href;
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={onClose}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
                      ${isActive 
                        ? 'text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]' 
                        : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                      }
                    `}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const { sidebarMode, setIsSidebarHovered, sidebarWidth } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<typeof navItems[0] | null>(null);
  const [hoveredAnchorRect, setHoveredAnchorRect] = useState<DOMRect | null>(null);
  const [isChatsExpanded, setIsChatsExpanded] = useState(false);
  const [isFlyoutHovered, setIsFlyoutHovered] = useState(false);
  // For hover mode - NavigationDrawer
  const [drawerItem, setDrawerItem] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const railRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { chatHistory, triggerChatReset, loadSession } = useChatContext();
  const router = useRouter();
  const { spaces: userSpaces, isLoaded: spacesLoaded } = useSpaces();

  // For expanded mode: only expand the section containing the current page
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const activeSection = getActiveSectionFromPathname(pathname);
    return activeSection ? [activeSection] : [];
  });

  // Update expanded sections when pathname changes
  useEffect(() => {
    const activeSection = getActiveSectionFromPathname(pathname);
    if (activeSection && !expandedSections.includes(activeSection)) {
      setExpandedSections([activeSection]);
    }
  }, [pathname]);

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

  const toggleSection = (label: string) => {
    setExpandedSections(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  // Collapsed mode uses small flyout, hover mode uses full NavigationDrawer
  const shouldShowFlyout = sidebarMode === 'collapsed';
  const shouldShowDrawer = sidebarMode === 'hover';

  const handleMouseEnterItem = (item: typeof navItems[0], event: React.MouseEvent) => {
    // For collapsed mode - use flyout
    if (shouldShowFlyout) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setHoveredAnchorRect(rect);
      setHoveredItem(item);
    }
    
    // For hover mode - use NavigationDrawer
    if (shouldShowDrawer) {
      setDrawerItem(item.label);
      setIsDrawerOpen(true);
    }
  };

  const handleMouseLeaveItem = () => {
    if (shouldShowFlyout) {
      // Longer delay for better accessibility - allows time to move to flyout
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isFlyoutHovered) {
          setHoveredItem(null);
          setHoveredAnchorRect(null);
        }
      }, 300);
    }
    // Note: NavigationDrawer handles its own mouse leave behavior
  };

  const handleFlyoutMouseEnter = () => {
    setIsFlyoutHovered(true);
    // Cancel any pending close
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    setIsFlyoutHovered(false);
    // Close flyout after delay
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setHoveredAnchorRect(null);
    }, 150);
  };

  const handleFlyoutClose = () => {
    setHoveredItem(null);
    setHoveredAnchorRect(null);
    setIsFlyoutHovered(false);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setDrawerItem(null);
  };

  // Determine if expanded mode
  const isExpandedMode = sidebarMode === 'expanded';

  // Check if any nav item or its subitems are active
  const isItemActive = (item: typeof navItems[0]) => {
    if (pathname === item.href) return true;
    if (item.href !== '/' && pathname.startsWith(item.href)) return true;
    return item.subItems?.some(sub => pathname === sub.href);
  };

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

      {/* Desktop Navigation Sidebar */}
      <aside
        ref={railRef}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => {
          setIsSidebarHovered(false);
          if (shouldShowFlyout && !isFlyoutHovered) {
            handleMouseLeaveItem();
          }
        }}
        className="hidden lg:flex fixed top-12 left-0 z-40 bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] flex-col h-[calc(100vh-48px)] transition-all duration-200 ease-out"
        style={{ width: sidebarWidth }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* New Chat Button */}
        <div className={`flex py-3 ${isExpandedMode ? 'px-3' : 'justify-center'}`}>
          <Link
            href="/"
            onClick={handleNewChat}
            className={`
              flex items-center gap-2
              transition-colors duration-150
              group
              text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
              ${isExpandedMode 
                ? 'w-full py-2 px-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] rounded-md border border-[var(--border-secondary)]' 
                : 'p-2'
              }
            `}
            title="New Chat"
            aria-label="Start new chat"
          >
            <div className={`
              flex items-center justify-center rounded-md transition-all duration-150
              ${isExpandedMode 
                ? '' 
                : 'w-8 h-8 bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-quaternary)] border border-[var(--border-secondary)]'
              }
            `}>
              <Plus className={`text-[var(--fg-brand-primary)] ${isExpandedMode ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            {isExpandedMode && (
              <span className="text-sm font-medium">New Chat</span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className={`flex flex-col gap-0.5 ${isExpandedMode ? 'px-2' : 'items-center px-1'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSectionExpanded = expandedSections.includes(item.label);
            const isOnMainPage = pathname === item.href;
            
            return (
              <div key={item.href} className="w-full">
                {/* Main nav item */}
                <div
                  className="relative"
                  onMouseEnter={(e) => handleMouseEnterItem(item, e)}
                  onMouseLeave={handleMouseLeaveItem}
                >
                  {isExpandedMode ? (
                    // Expanded mode - split control: icon+label link to page, chevron toggles
                    <div className="flex flex-col">
                      <div className={`
                        flex items-center rounded-md transition-colors duration-150
                        ${isActive 
                          ? 'text-[var(--fg-brand-primary)]' 
                          : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'
                        }
                      `}>
                        {/* Main link to the page */}
                        <Link
                          href={item.href}
                          onClick={item.href === '/' ? handleHomeClick : closeMobileMenu}
                          className={`
                            flex-1 flex items-center gap-2 px-2 py-2 rounded-l-md
                            transition-colors duration-150
                            ${isOnMainPage 
                              ? 'bg-[var(--bg-brand-primary)]' 
                              : 'hover:bg-[var(--bg-tertiary)]'
                            }
                          `}
                          aria-current={isOnMainPage ? 'page' : undefined}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                        
                        {/* Toggle button for sections with sub-items */}
                        {(hasSubItems || item.label === 'Spaces' || item.label === 'Home') && (
                          <button
                            onClick={() => toggleSection(item.label)}
                            className={`
                              p-2 rounded-r-md transition-colors duration-150
                              hover:bg-[var(--bg-tertiary)]
                            `}
                            aria-expanded={isSectionExpanded}
                            aria-label={`${isSectionExpanded ? 'Collapse' : 'Expand'} ${item.label} section`}
                          >
                            <motion.div
                              animate={{ rotate: isSectionExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-3 h-3 text-[var(--fg-tertiary)]" />
                            </motion.div>
                          </button>
                        )}
                      </div>
                      
                      {/* Sub-items for expanded mode */}
                      <AnimatePresence>
                        {isSectionExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 py-1 space-y-0.5">
                              {/* Home - show recent chats */}
                              {item.label === 'Home' && (
                                <>
                                  {chatHistory.slice(0, 3).map((chat) => (
                                    <button
                                      key={chat.id}
                                      onClick={() => {
                                        loadSession(chat.id);
                                        if (pathname !== '/') {
                                          router.push('/');
                                        }
                                      }}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="truncate">{chat.title}</span>
                                    </button>
                                  ))}
                                  {chatHistory.length === 0 && (
                                    <p className="px-2 py-1.5 text-xs text-[var(--fg-quaternary)]">No recent chats</p>
                                  )}
                                </>
                              )}
                              
                              {/* Spaces - show user spaces */}
                              {item.label === 'Spaces' && (
                                <>
                                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                    <FolderPlus className="w-3.5 h-3.5" />
                                    <span>Create new Space</span>
                                  </button>
                                  {spacesLoaded && userSpaces.map((space) => (
                                    <Link
                                      key={space.id}
                                      href={`/spaces/${space.slug}`}
                                      className={`
                                        w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors
                                        ${pathname === `/spaces/${space.slug}` 
                                          ? 'text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]' 
                                          : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                                        }
                                      `}
                                    >
                                      <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="truncate">{space.title}</span>
                                    </Link>
                                  ))}
                                  {spacesLoaded && userSpaces.length === 0 && (
                                    <p className="px-2 py-1.5 text-xs text-[var(--fg-quaternary)]">No spaces yet</p>
                                  )}
                                </>
                              )}
                              
                              {/* Regular sub-items */}
                              {item.subItems?.map((subItem) => {
                                const SubIcon = subItem.icon;
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    className={`
                                      w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors
                                      ${isSubActive 
                                        ? 'text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]' 
                                        : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                                      }
                                    `}
                                    aria-current={isSubActive ? 'page' : undefined}
                                  >
                                    <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{subItem.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    // Collapsed/Hover mode - icons with label for active item
                    (() => {
                      const isDrawerActive = shouldShowDrawer && isDrawerOpen && drawerItem === item.label;
                      const showHighlight = isActive || isDrawerActive;
                      
                      return (
                        <Link
                          data-nav-item={item.label}
                          href={item.href}
                          onClick={item.href === '/' ? handleHomeClick : closeMobileMenu}
                          className={`
                            flex flex-col items-center justify-center
                            w-full py-1.5 mx-auto rounded-md
                            transition-colors duration-150
                            ${showHighlight 
                              ? 'text-[var(--fg-brand-primary)]' 
                              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                            }
                          `}
                          title={item.label}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150
                            ${showHighlight ? 'bg-[var(--bg-brand-primary)]' : ''}
                          `}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {(isActive || isDrawerActive) && (
                            <span className="text-[10px] mt-0.5 font-medium truncate max-w-[40px]">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      );
                    })()
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Bottom Section */}
        <div className={`flex flex-col border-t border-[var(--border-secondary)] py-2 ${isExpandedMode ? 'px-2' : 'items-center px-1'}`}>
          <SidebarControl isExpanded={isExpandedMode} />
        </div>
      </aside>

      {/* Collapsed mode flyout */}
      {shouldShowFlyout && (
        <CollapsedFlyout 
          item={hoveredItem} 
          isOpen={hoveredItem !== null} 
          anchorRect={hoveredAnchorRect}
          onClose={handleFlyoutClose}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
        />
      )}

      {/* Hover mode - full NavigationDrawer */}
      {shouldShowDrawer && (
        <NavigationDrawer
          isOpen={isDrawerOpen}
          item={drawerItem}
          onClose={handleDrawerClose}
          railRef={railRef}
        />
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            className="fixed lg:hidden top-14 bottom-0 right-0 z-40 w-80 max-w-[85vw] bg-[var(--bg-secondary)] border-l border-[var(--border-secondary)] flex flex-col"
            variants={slideFromRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Mobile navigation"
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
                          onClick={() => {
                            loadSession(chat.id);
                            if (pathname !== '/') {
                              router.push('/');
                            }
                            closeMobileMenu();
                          }}
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
                    (item.href !== '/' && pathname.startsWith(item.href));
                  
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
    </>
  );
}
