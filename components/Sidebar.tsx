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
  Folder,
  ArrowRight,
  History,
} from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { TopHeader } from './TopHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { useChatContext } from '@/lib/chat-context';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { useSidebar, SidebarMode, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/lib/sidebar-context';
import { useSpaces } from '@/hooks/useSpaces';
import { NavigationDrawer } from './NavigationDrawer';
import { 
  MobileAccountPanel, 
  MobileNotificationsPanel, 
  MobileHelpPanel,
  MobileFullScreenMenu,
} from './mobile';

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
  const [dropdownPosition, setDropdownPosition] = useState({ bottom: 0, left: 0 });
  const controlRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && controlRef.current) {
      const rect = controlRef.current.getBoundingClientRect();
      setDropdownPosition({
        bottom: window.innerHeight - rect.top + 4,
        left: isExpanded ? rect.left : rect.right + 8,
      });
    }
  }, [isOpen, isExpanded]);

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
    { mode: 'hover', label: 'Expand', description: 'Opens drawer on hover' },
    { mode: 'collapsed', label: 'Collapsed', description: 'Icons only, flyout on hover' },
    { mode: 'expanded', label: 'Pinned', description: 'Always show full sidebar' },
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

      {/* Dropdown - using fixed positioning to ensure visibility */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed w-48 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)] shadow-xl z-[9999] overflow-hidden"
            style={{
              bottom: `${dropdownPosition.bottom}px`,
              left: `${dropdownPosition.left}px`,
            }}
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

// Recent Chats flyout for collapsed mode
function RecentChatsFlyout({
  isOpen,
  anchorRect,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { chatHistory, loadSession } = useChatContext();

  if (!anchorRect) return null;

  const iconCenter = anchorRect.top + anchorRect.height / 2;
  const flyoutTop = Math.max(iconCenter - 20, 60);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -4, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
            exit: { duration: 0.3, ease: [0.4, 0, 1, 1] },
          }}
          className="fixed z-[60] w-[240px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
          style={{
            left: SIDEBAR_WIDTH_COLLAPSED + 8,
            top: flyoutTop,
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          role="menu"
          aria-label="Recent chats menu"
        >
          <Link
            href="/chats"
            onClick={onClose}
            className="px-3 py-2.5 border-b border-[var(--border-secondary)] flex items-center justify-between group hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--fg-tertiary)]" />
              <span className="text-sm font-medium text-[var(--fg-primary)]">Recent Chats</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
          </Link>
          <div className="py-2 max-h-[300px] overflow-y-auto">
            {chatHistory.length > 0 ? (
              chatHistory.slice(0, 8).map((chat) => (
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
            {chatHistory.length > 8 && (
              <Link
                href="/chats"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 mt-1 text-xs text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors border-t border-[var(--border-secondary)]"
              >
                View all {chatHistory.length} chats
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Projects flyout for collapsed mode
function ProjectsFlyout({
  isOpen,
  anchorRect,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { projects } = useChatContext();

  if (!anchorRect) return null;

  const iconCenter = anchorRect.top + anchorRect.height / 2;
  const flyoutTop = Math.max(iconCenter - 20, 60);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -4, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
            exit: { duration: 0.3, ease: [0.4, 0, 1, 1] },
          }}
          className="fixed z-[60] w-[240px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
          style={{
            left: SIDEBAR_WIDTH_COLLAPSED + 8,
            top: flyoutTop,
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          role="menu"
          aria-label="Projects menu"
        >
          <Link
            href="/projects"
            onClick={onClose}
            className="px-3 py-2.5 border-b border-[var(--border-secondary)] flex items-center justify-between group hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-[var(--fg-tertiary)]" />
              <span className="text-sm font-medium text-[var(--fg-primary)]">Projects</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
          </Link>
          <div className="py-2 max-h-[300px] overflow-y-auto">
            {projects.length > 0 ? (
              projects.slice(0, 8).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  onClick={onClose}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-left"
                  role="menuitem"
                >
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-[var(--fg-quaternary)]">No projects yet</p>
            )}
            {projects.length > 8 && (
              <Link
                href="/projects"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 mt-1 text-xs text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors border-t border-[var(--border-secondary)]"
              >
                View all {projects.length} projects
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const { chatHistory, loadSession, projects } = useChatContext();

  if (!item || !anchorRect) return null;

  // Calculate flyout position - vertically centered with icon button
  // Icon is 40px tall, flyout title row is ~40px, so align centers
  const iconCenter = anchorRect.top + anchorRect.height / 2;
  const flyoutTop = Math.max(iconCenter - 20, 60); // 20px is half of header height
  
  // Special content for Home
  if (item.label === 'Home') {
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -4, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.4, 0, 0.2, 1],
              exit: { duration: 0.3, ease: [0.4, 0, 1, 1] }
            }}
            className="fixed z-[60] w-[220px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
            style={{
              left: SIDEBAR_WIDTH_COLLAPSED + 8,
              top: flyoutTop,
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
              {/* Projects section */}
              {projects.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[10px] text-[var(--fg-quaternary)] uppercase tracking-wider font-medium">Projects</div>
                  {projects.slice(0, 3).map((project) => (
                    <button
                      key={project.id}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-left"
                      role="menuitem"
                    >
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                  <div className="my-1.5 mx-3 border-t border-[var(--border-secondary)]" />
                </>
              )}
              {/* Recent chats section */}
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
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -4, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.4, 0, 0.2, 1],
              exit: { duration: 0.3, ease: [0.4, 0, 1, 1] }
            }}
            className="fixed z-[60] w-[220px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
            style={{
              left: SIDEBAR_WIDTH_COLLAPSED + 8,
              top: flyoutTop,
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
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -4, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.4, 0, 0.2, 1],
              exit: { duration: 0.3, ease: [0.4, 0, 1, 1] }
            }}
            className="fixed z-[60] w-[220px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl overflow-hidden"
            style={{
              left: SIDEBAR_WIDTH_COLLAPSED + 8,
              top: flyoutTop,
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
  const [isFlyoutHovered, setIsFlyoutHovered] = useState(false);
  // Unified flyout state for collapsed mode - only one flyout open at a time
  type FlyoutType = 'recentChats' | 'projects' | null;
  const [activeFlyout, setActiveFlyout] = useState<FlyoutType>(null);
  const [flyoutAnchorRect, setFlyoutAnchorRect] = useState<DOMRect | null>(null);
  const [isFlyoutContentHovered, setIsFlyoutContentHovered] = useState(false);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // For hover mode - NavigationDrawer
  const [drawerItem, setDrawerItem] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const railRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { chatHistory, triggerChatReset, loadSession, projects } = useChatContext();
  const router = useRouter();
  const { spaces: userSpaces, isLoaded: spacesLoaded } = useSpaces();
  
  // #region agent log
  if (typeof window !== 'undefined') {
    const emptyChats = chatHistory.filter(c => !c.id || c.id === '');
    const emptyProjects = projects.filter(p => !p.id || p.id === '');
    const emptySpaces = userSpaces.filter(s => !s.id || s.id === '');
    if (emptyChats.length > 0 || emptyProjects.length > 0 || emptySpaces.length > 0) {
      fetch('http://127.0.0.1:7242/ingest/3e9d966b-9057-4dd8-8a82-1447a767070c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.tsx:render',message:'Found items with empty IDs',data:{emptyChats:emptyChats.length,emptyProjects:emptyProjects.length,emptySpaces:emptySpaces.length,chatHistoryTotal:chatHistory.length,projectsTotal:projects.length,spacesTotal:userSpaces.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B-C-E'})}).catch(()=>{});
    }
  }
  // #endregion

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
      // Long delay for better accessibility - gives user plenty of time to reach flyout
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isFlyoutHovered) {
          setHoveredItem(null);
          setHoveredAnchorRect(null);
        }
      }, 600);
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
    // Much longer delay for better UX - user can easily re-enter
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setHoveredAnchorRect(null);
    }, 800);
  };

  const handleFlyoutClose = () => {
    setHoveredItem(null);
    setHoveredAnchorRect(null);
    setIsFlyoutHovered(false);
  };

  // Unified flyout handlers for collapsed mode - mutually exclusive
  const openFlyout = (type: FlyoutType, event: React.MouseEvent) => {
    if (!shouldShowFlyout) return;
    
    // Clear any pending timeout
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
      flyoutTimeoutRef.current = null;
    }
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setFlyoutAnchorRect(rect);
    setActiveFlyout(type);
  };

  const handleFlyoutItemMouseLeave = () => {
    if (!shouldShowFlyout) return;
    
    flyoutTimeoutRef.current = setTimeout(() => {
      if (!isFlyoutContentHovered) {
        setActiveFlyout(null);
        setFlyoutAnchorRect(null);
      }
    }, 300);
  };

  const handleFlyoutContentMouseEnter = () => {
    setIsFlyoutContentHovered(true);
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
      flyoutTimeoutRef.current = null;
    }
  };

  const handleFlyoutContentMouseLeave = () => {
    setIsFlyoutContentHovered(false);
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
      setFlyoutAnchorRect(null);
    }, 300);
  };

  const closeFlyout = () => {
    setActiveFlyout(null);
    setFlyoutAnchorRect(null);
    setIsFlyoutContentHovered(false);
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
        className="hidden lg:flex fixed top-12 left-0 z-50 bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] flex-col h-[calc(100vh-48px)] transition-all duration-200 ease-out"
        style={{ width: sidebarWidth }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Chat Actions Group - New Chat + Recent Chats */}
        <div className={`flex flex-col ${isExpandedMode ? 'px-3 pt-3 pb-2 gap-1' : 'items-center pt-3 pb-1 gap-0.5'}`}>
          {/* New Chat Button */}
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

          {/* Recent Chats Link */}
          <div 
            className={`flex flex-col ${isExpandedMode ? '' : 'justify-center'}`}
            onMouseEnter={(e) => !isExpandedMode && openFlyout('recentChats', e)}
            onMouseLeave={() => !isExpandedMode && handleFlyoutItemMouseLeave()}
          >
            {(() => {
              const isRecentChatsActive = pathname === '/chats';
              const isRecentChatsExpanded = expandedSections.includes('RecentChats');
              
              if (isExpandedMode) {
                return (
                  <div className="flex flex-col">
                    <div className={`
                      flex items-center rounded-md transition-colors duration-150
                      ${isRecentChatsActive
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
                        : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                      }
                    `}>
                      <Link
                        href="/chats"
                        className="flex-1 flex items-center gap-2 px-2 py-2"
                      >
                        <History className="w-4 h-4" />
                        <span className="text-sm flex-1">Recent Chats</span>
                        {chatHistory.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-quaternary)] text-[var(--fg-tertiary)]">
                            {chatHistory.length}
                          </span>
                        )}
                      </Link>
                      {chatHistory.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSection('RecentChats');
                          }}
                          className="p-2 rounded-md transition-colors duration-150 hover:bg-[var(--bg-quaternary)]"
                        >
                          <motion.div animate={{ rotate: isRecentChatsExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-3 h-3" />
                          </motion.div>
                        </button>
                      )}
                    </div>
                    
                    {/* Expandable recent chats list */}
                    <AnimatePresence>
                      {isRecentChatsExpanded && chatHistory.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 py-1 space-y-0.5">
                            {chatHistory.slice(0, 5).map((chat) => (
                              <button
                                key={chat.id}
                                onClick={() => {
                                  loadSession(chat.id);
                                  if (pathname !== '/') router.push('/');
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                              >
                                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{chat.title}</span>
                              </button>
                            ))}
                            {chatHistory.length > 5 && (
                              <Link
                                href="/chats"
                                className="w-full flex items-center gap-1 px-2 py-1.5 rounded text-xs text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                              >
                                View all {chatHistory.length}
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              
              // Collapsed mode
              return (
                <Link
                  href="/chats"
                  className={`p-2 ${isRecentChatsActive ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'}`}
                  title="Recent Chats"
                >
                  <div className={`flex items-center justify-center rounded-md transition-all duration-150 w-8 h-8 ${isRecentChatsActive ? 'bg-[var(--bg-brand-primary)]' : 'hover:bg-[var(--bg-tertiary)]'}`}>
                    <History className="w-[18px] h-[18px]" />
                  </div>
                </Link>
              );
            })()}
          </div>

          {/* Projects Link */}
          <div 
            className={`flex flex-col ${isExpandedMode ? '' : 'justify-center'}`}
            onMouseEnter={(e) => !isExpandedMode && openFlyout('projects', e)}
            onMouseLeave={() => !isExpandedMode && handleFlyoutItemMouseLeave()}
          >
            {(() => {
              const isProjectsActive = pathname.startsWith('/projects');
              const isProjectsExpanded = expandedSections.includes('Projects');
              
              if (isExpandedMode) {
                return (
                  <div className="flex flex-col">
                    <div className={`
                      flex items-center rounded-md transition-colors duration-150
                      ${isProjectsActive
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
                        : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                      }
                    `}>
                      <Link
                        href="/projects"
                        className="flex-1 flex items-center gap-2 px-2 py-2"
                      >
                        <Folder className="w-4 h-4" />
                        <span className="text-sm flex-1">Projects</span>
                        {projects.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-quaternary)] text-[var(--fg-tertiary)]">
                            {projects.length}
                          </span>
                        )}
                      </Link>
                      {projects.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSection('Projects');
                          }}
                          className="p-2 rounded-md transition-colors duration-150 hover:bg-[var(--bg-quaternary)]"
                        >
                          <motion.div animate={{ rotate: isProjectsExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-3 h-3" />
                          </motion.div>
                        </button>
                      )}
                    </div>
                    
                    {/* Expandable projects list */}
                    <AnimatePresence>
                      {isProjectsExpanded && projects.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 py-1 space-y-0.5">
                            {projects.slice(0, 5).map((project) => (
                              <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                              >
                                <div
                                  className="w-3 h-3 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="truncate">{project.name}</span>
                              </Link>
                            ))}
                            {projects.length > 5 && (
                              <Link
                                href="/projects"
                                className="w-full flex items-center gap-1 px-2 py-1.5 rounded text-xs text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                              >
                                View all {projects.length}
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              
              // Collapsed mode
              return (
                <Link
                  href="/projects"
                  className={`p-2 ${isProjectsActive ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'}`}
                  title="Projects"
                >
                  <div className={`flex items-center justify-center rounded-md transition-all duration-150 w-8 h-8 ${isProjectsActive ? 'bg-[var(--bg-brand-primary)]' : 'hover:bg-[var(--bg-tertiary)]'}`}>
                    <Folder className="w-[18px] h-[18px]" />
                  </div>
                </Link>
              );
            })()}
          </div>
        </div>

        {/* Separator between Chat Actions and Navigation */}
        <div className={`${isExpandedMode ? 'mx-3 my-2' : 'mx-2 my-1.5'} border-t border-[var(--border-secondary)]`} />

        {/* Navigation Items */}
        <nav className={`flex flex-col ${isExpandedMode ? 'gap-0.5 px-2' : 'gap-1 items-center px-1'}`}>
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
                    // Expanded/Pinned mode - unified row with consistent styling
                    <div className="flex flex-col">
                      <div 
                        className={`
                          flex items-center rounded-md transition-colors duration-150
                          ${isActive || isOnMainPage
                            ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
                            : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                          }
                        `}
                      >
                        {/* Main link to the page - takes most of the row */}
                        <Link
                          href={item.href}
                          onClick={item.href === '/' ? handleHomeClick : closeMobileMenu}
                          className="flex-1 flex items-center gap-2 px-2 py-2"
                          aria-current={isOnMainPage ? 'page' : undefined}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                        
                        {/* Toggle button for sections with sub-items */}
                        {(hasSubItems || item.label === 'Spaces' || item.label === 'Home') && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSection(item.label);
                            }}
                            className="p-2 rounded-md transition-colors duration-150 hover:bg-[var(--bg-quaternary)]"
                            aria-expanded={isSectionExpanded}
                            aria-label={`${isSectionExpanded ? 'Collapse' : 'Expand'} ${item.label} section`}
                          >
                            <motion.div
                              animate={{ rotate: isSectionExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-3 h-3" />
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
                              {/* Home - show projects and recent chats */}
                              {item.label === 'Home' && (
                                <>
                                  {/* Projects */}
                                  {projects.length > 0 && (
                                    <>
                                      <div className="px-2 py-1 text-[10px] text-[var(--fg-quaternary)] uppercase tracking-wider font-medium">Projects</div>
                                      {projects.slice(0, 3).map((project) => (
                                        <button
                                          key={project.id}
                                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                                        >
                                          <div
                                            className="w-3 h-3 rounded-sm flex-shrink-0"
                                            style={{ backgroundColor: project.color }}
                                          />
                                          <span className="truncate">{project.name}</span>
                                        </button>
                                      ))}
                                      <div className="my-1.5 mx-2 border-t border-[var(--border-secondary)]" />
                                    </>
                                  )}
                                  {/* Recent chats */}
                                  <div className="px-2 py-1 text-[10px] text-[var(--fg-quaternary)] uppercase tracking-wider font-medium">Recent chats</div>
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
                    // Collapsed/Hover mode - clean icon buttons
                    (() => {
                      const isDrawerActive = shouldShowDrawer && isDrawerOpen && drawerItem === item.label;
                      const showHighlight = isActive || isDrawerActive;
                      
                      return (
                        <Link
                          data-nav-item={item.label}
                          href={item.href}
                          onClick={item.href === '/' ? handleHomeClick : closeMobileMenu}
                          className={`
                            flex items-center justify-center
                            w-10 h-10 mx-auto rounded-md
                            transition-colors duration-150
                            ${showHighlight 
                              ? 'text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]' 
                              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                            }
                          `}
                          title={item.label}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon className="w-5 h-5" />
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

      {/* Collapsed mode flyouts - mutually exclusive */}
      {shouldShowFlyout && (
        <>
          <CollapsedFlyout 
            item={hoveredItem} 
            isOpen={hoveredItem !== null && activeFlyout === null} 
            anchorRect={hoveredAnchorRect}
            onClose={handleFlyoutClose}
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
          />
          <RecentChatsFlyout
            isOpen={activeFlyout === 'recentChats'}
            anchorRect={flyoutAnchorRect}
            onClose={closeFlyout}
            onMouseEnter={handleFlyoutContentMouseEnter}
            onMouseLeave={handleFlyoutContentMouseLeave}
          />
          <ProjectsFlyout
            isOpen={activeFlyout === 'projects'}
            anchorRect={flyoutAnchorRect}
            onClose={closeFlyout}
            onMouseEnter={handleFlyoutContentMouseEnter}
            onMouseLeave={handleFlyoutContentMouseLeave}
          />
        </>
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

      {/* Mobile Full-Screen Menu */}
      <MobileFullScreenMenu />

      {/* Mobile Full-Screen Panels */}
      <MobileAccountPanel />
      <MobileNotificationsPanel />
      <MobileHelpPanel />
    </>
  );
}
