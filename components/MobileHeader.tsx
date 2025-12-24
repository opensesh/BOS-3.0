'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { Brandmark } from './Brandmark';
import { SearchModal } from './SearchModal';
import { HelpDropdown } from './HelpDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileDropdown } from './ProfileDropdown';

interface MobileHeaderProps {
  onBrandClick?: () => void;
}

export function MobileHeader({ onBrandClick }: MobileHeaderProps) {
  const { isMobileMenuOpen, toggleMobileMenu } = useMobileMenu();
  const [isHovered, setIsHovered] = useState(false);
  
  // Dropdown states
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--bg-secondary)] backdrop-blur-sm border-b border-[var(--border-secondary)]">
        <div className="flex items-center justify-between h-full px-3">
          {/* Left: Brand Logo Link */}
          <Link
            href="/"
            onClick={onBrandClick}
            className="flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
            title="Home"
          >
            <Brandmark size={26} />
          </Link>

          {/* Right: Utility Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="
                flex items-center justify-center
                p-2.5
                rounded-md
                text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-all duration-150
                min-w-[44px] min-h-[44px]
              "
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications - hidden on small mobile */}
            <div className="relative hidden sm:block">
              <button
                ref={notificationsTriggerRef}
                onClick={handleNotificationsClick}
                className={`
                  flex items-center justify-center
                  p-2.5
                  rounded-md
                  text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                  hover:bg-[var(--bg-tertiary)]
                  transition-all duration-150
                  min-w-[44px] min-h-[44px]
                  ${isNotificationsOpen ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' : ''}
                `}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <NotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                triggerRef={notificationsTriggerRef}
              />
            </div>

            {/* Help - hidden on small mobile */}
            <div className="relative hidden sm:block">
              <button
                ref={helpTriggerRef}
                onClick={handleHelpClick}
                className={`
                  flex items-center justify-center
                  p-2.5
                  rounded-md
                  text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                  hover:bg-[var(--bg-tertiary)]
                  transition-all duration-150
                  min-w-[44px] min-h-[44px]
                  ${isHelpOpen ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' : ''}
                `}
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
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
                  p-2
                  rounded-md
                  hover:bg-[var(--bg-tertiary)]
                  transition-all duration-150
                  min-w-[44px] min-h-[44px]
                  ${isProfileOpen ? 'bg-[var(--bg-tertiary)]' : ''}
                `}
                title="Profile"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-[var(--border-secondary)] rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-mono">A</span>
                </div>
              </button>
              <ProfileDropdown
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                triggerRef={profileTriggerRef}
              />
            </div>

            {/* Menu Toggle */}
            <motion.button
              onClick={toggleMobileMenu}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              animate={isHovered && !isMobileMenuOpen ? { rotate: [0, -3, 3, -3, 0] } : { rotate: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="p-2 ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 relative flex items-center justify-center">
                {/* Top bar */}
                <motion.span
                  className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 0 : -6,
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                />
                {/* Middle bar */}
                <motion.span
                  className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
                  animate={{
                    opacity: isMobileMenuOpen ? 0 : 1,
                    scaleX: isMobileMenuOpen ? 0 : 1,
                  }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                />
                {/* Bottom bar */}
                <motion.span
                  className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? 0 : 6,
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                />
              </div>
            </motion.button>
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
