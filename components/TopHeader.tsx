'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { Brandmark } from './Brandmark';
import { SearchModal } from './SearchModal';
import { HelpDropdown } from './HelpDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileDropdown } from './ProfileDropdown';

interface TopHeaderProps {
  children?: React.ReactNode; // For breadcrumbs
}

export function TopHeader({ children }: TopHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationsTriggerRef = useRef<HTMLButtonElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  // Close all dropdowns when one opens
  const closeAllDropdowns = () => {
    setIsHelpOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
  };

  // Keyboard shortcut for search (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHelpClick = () => {
    closeAllDropdowns();
    setIsHelpOpen(!isHelpOpen);
  };

  const handleNotificationsClick = () => {
    closeAllDropdowns();
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleProfileClick = () => {
    closeAllDropdowns();
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-bg-secondary border-b border-border-secondary">
        <div className="flex items-center justify-between h-full px-2">
          {/* Left Section: Brand Icon + Breadcrumbs */}
          <div className="flex items-center gap-0">
            <Link
              href="/"
              className="
                flex items-center justify-center
                p-1.5
                rounded-md
                hover:bg-bg-tertiary
                transition-all duration-150
              "
              title="Home"
            >
              <Brandmark size={18} />
            </Link>
            
            {/* Breadcrumbs slot */}
            {children && (
              <div className="flex items-center">
                {children}
              </div>
            )}
          </div>

          {/* Right Section: Utility Actions */}
          <div className="flex items-center gap-0.5">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="
                flex items-center justify-center gap-1.5
                px-2 py-1
                rounded-md
                text-fg-tertiary hover:text-fg-primary
                hover:bg-bg-tertiary
                transition-all duration-150
                text-xs
              "
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-fg-quaternary">⌘K</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                ref={notificationsTriggerRef}
                onClick={handleNotificationsClick}
                className={`
                  relative flex items-center justify-center
                  p-1.5
                  rounded-md
                  text-fg-tertiary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-all duration-150
                  ${isNotificationsOpen ? 'bg-bg-tertiary text-fg-primary' : ''}
                `}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              <NotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                triggerRef={notificationsTriggerRef}
              />
            </div>

            {/* Help Center */}
            <div className="relative">
              <button
                ref={helpTriggerRef}
                onClick={handleHelpClick}
                className={`
                  flex items-center justify-center
                  p-1.5
                  rounded-md
                  text-fg-tertiary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-all duration-150
                  ${isHelpOpen ? 'bg-bg-tertiary text-fg-primary' : ''}
                `}
                title="Help"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <HelpDropdown
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                triggerRef={helpTriggerRef}
              />
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                ref={profileTriggerRef}
                onClick={handleProfileClick}
                className={`
                  flex items-center justify-center
                  p-1.5
                  rounded-md
                  hover:bg-bg-tertiary
                  transition-all duration-150
                  ${isProfileOpen ? 'bg-bg-tertiary' : ''}
                `}
                title="Profile"
              >
                <div className="w-5 h-5 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-border-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-mono">A</span>
                </div>
              </button>
              <ProfileDropdown
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                triggerRef={profileTriggerRef}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
