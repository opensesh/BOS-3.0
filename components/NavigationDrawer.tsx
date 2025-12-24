'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FolderPlus,
  LayoutGrid,
  Fingerprint,
  Palette,
  Type,
  ImageIcon,
  History,
  Code,
  PenTool,
  MessageSquare,
  Zap,
  Layers,
  Shapes,
} from 'lucide-react';
import { useChatContext } from '@/lib/chat-context';
import { useSpaces } from '@/hooks/useSpaces';
import { slideFromLeft, staggerContainerFast, fadeInUp } from '@/lib/motion';

interface NavigationDrawerProps {
  isOpen: boolean;
  item: string | null;
  onClose: () => void;
  railRef: React.RefObject<HTMLElement | null>;
}

const brandHubNavItems = [
  { label: 'Logo', href: '/brand-hub/logo', icon: Fingerprint },
  { label: 'Colors', href: '/brand-hub/colors', icon: Palette },
  { label: 'Typography', href: '/brand-hub/fonts', icon: Type },
  { label: 'Art Direction', href: '/brand-hub/art-direction', icon: ImageIcon },
  { label: 'Tokens', href: '/brand-hub/design-tokens', icon: Shapes },
  { label: 'Guidelines', href: '/brand-hub/guidelines', icon: FileText },
];

export function NavigationDrawer({ isOpen, item, onClose, railRef }: NavigationDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);
  const { chatHistory } = useChatContext();
  const { spaces: userSpaces, isLoaded: spacesLoaded } = useSpaces();

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

  const renderContent = () => {
    switch (item) {
      case 'Spaces':
        return (
          <motion.div 
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {/* Header - vertically centered with plus icon (py-3 outer + pt-[14px] inner) */}
            <div className="px-2 mb-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] px-2 pt-[14px] pb-2">Spaces</h3>
              </motion.div>
              
              <motion.button 
                variants={fadeInUp}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors mb-1 text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Templates</span>
              </motion.button>
              
              <motion.button 
                variants={fadeInUp}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors mb-3 text-sm"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create new Space</span>
              </motion.button>

              <motion.div variants={fadeInUp} className="border-t border-[var(--border-secondary)] pt-2">
                <div className="px-3 py-1 text-xs text-[var(--fg-tertiary)] mb-2">My Spaces</div>
                {!spacesLoaded ? (
                  <div className="px-3 py-2 text-xs text-[var(--fg-quaternary)]">
                    Loading...
                  </div>
                ) : userSpaces.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--fg-quaternary)]">
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
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1
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
                            <div className="text-sm font-medium truncate">{space.title}</div>
                            {space.description && (
                              <div className="text-xs text-[var(--fg-tertiary)] truncate">
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
            {/* Header - vertically centered with plus icon (py-3 outer + pt-[14px] inner) */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] px-2 pt-[14px] pb-2">Home</h3>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="mb-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h4 className="text-[10px] font-medium text-[var(--fg-tertiary)] uppercase tracking-wide">Recent Chats</h4>
                  <button className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
                    <History className="w-3 h-3 text-[var(--fg-tertiary)]" />
                  </button>
                </div>
                <div className="space-y-1">
                  {chatHistory.length > 0 ? (
                    chatHistory.map((chat, index) => (
                      <motion.button
                        key={chat.id}
                        variants={fadeInUp}
                        custom={index}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </motion.button>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--fg-quaternary)] px-3 py-2">
                      No recent chats yet
                    </p>
                  )}
                </div>
                {chatHistory.length > 0 && (
                  <button className="mt-2 text-xs text-[var(--fg-brand-primary)] hover:underline px-3">
                    View All
                  </button>
                )}
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
            {/* Header - vertically centered with plus icon (py-3 outer + pt-[14px] inner) */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] px-2 pt-[14px] pb-2">Brand</h3>
              </motion.div>
              
              <div className="space-y-1">
                {brandHubNavItems.map((navItem, index) => {
                  const Icon = navItem.icon;
                  const isActive = pathname === navItem.href;
                  return (
                    <motion.div key={navItem.href} variants={fadeInUp} custom={index}>
                      <Link
                        href={navItem.href}
                        className={`
                          w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                          transition-colors text-sm
                          ${
                            isActive
                              ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                              : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
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
                    className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-sm"
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
          { label: 'Architecture', href: '/brain/architecture', icon: Code },
          { label: 'Brand Identity', href: '/brain/brand-identity', icon: FileText },
          { label: 'Writing Styles', href: '/brain/writing-styles', icon: PenTool },
          { label: 'Skills', href: '/brain/skills', icon: Zap },
          { label: 'Components', href: '/brain/components', icon: Layers },
        ];
        const isOnBrainSubpage = pathname.startsWith('/brain/');
        
        return (
          <motion.div 
            className="py-3"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {/* Header - vertically centered with plus icon (py-3 outer + pt-[14px] inner) */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] px-2 pt-[14px] pb-2">Brain</h3>
              </motion.div>
              
              <div className="space-y-1">
                {brainNavItems.map((navItem, index) => {
                  const Icon = navItem.icon;
                  const isActive = pathname === navItem.href;
                  return (
                    <motion.div key={navItem.href} variants={fadeInUp} custom={index}>
                      <Link
                        href={navItem.href}
                        className={`
                          w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                          transition-colors text-sm
                          ${
                            isActive
                              ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                              : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--fg-brand-primary)]' : ''}`} />
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
                    className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-colors text-sm"
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
            {/* Header - vertically centered with plus icon (py-3 outer + pt-[14px] inner) */}
            <div className="px-2">
              <motion.div variants={fadeInUp} className="mb-2">
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] px-2 pt-[14px] pb-2">Resources</h3>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="text-sm text-[var(--fg-tertiary)] p-2">
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
          className="hidden lg:block fixed z-40 w-[220px] bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] shadow-[var(--shadow-lg)] overflow-y-auto"
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
