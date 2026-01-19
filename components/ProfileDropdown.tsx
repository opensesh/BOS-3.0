'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Settings,
  Rss,
  LogOut,
} from 'lucide-react';
import { ThemeCompactToggle } from '@/components/ui/ThemeCompactToggle';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function ProfileDropdown({ isOpen, onClose, triggerRef }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations('profileDropdown');

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mock user data - in real app, this would come from auth context
  const user = {
    name: 'opensesh',
    email: 'hello@opensession.co',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay - covers main content area only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="
              fixed inset-0
              top-14 left-14
              backdrop-blur-sm
              bg-black/5
              z-[150]
              pointer-events-none
            "
            aria-hidden="true"
          />
          
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="
              absolute top-full right-0 mt-5
              w-56
              bg-[var(--bg-secondary)]
              rounded-lg
              border border-[var(--border-secondary)]
              shadow-lg
              z-[200]
              overflow-hidden
            "
          >
            {/* User Info */}
            <div className="px-4 min-h-[52px] flex flex-col justify-center border-b border-[var(--border-secondary)]">
              <p className="text-base font-medium text-[var(--fg-primary)]">
                {user.name}
              </p>
              <p className="text-xs text-[var(--fg-tertiary)] mt-0.5">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1 border-b border-[var(--border-secondary)]">
              <button
                onClick={() => {
                  router.push('/account');
                  onClose();
                }}
                className="
                  w-full flex items-center gap-3
                  px-4 py-2
                  text-left
                  hover:bg-[var(--bg-tertiary)]
                  transition-colors
                "
              >
                <Settings className="w-4 h-4 text-[var(--fg-tertiary)]" />
                <span className="text-base text-[var(--fg-secondary)]">{t('settings')}</span>
              </button>
              <button
                onClick={() => {
                  // Navigate to updates page (external documentation)
                  window.open('https://opensession.co/updates', '_blank');
                  onClose();
                }}
                className="
                  w-full flex items-center gap-3
                  px-4 py-2
                  text-left
                  hover:bg-[var(--bg-tertiary)]
                  transition-colors
                "
              >
                <Rss className="w-4 h-4 text-[var(--fg-tertiary)]" />
                <span className="text-base text-[var(--fg-secondary)]">{t('updates')}</span>
              </button>
            </div>

            {/* Language Section */}
            <div className="border-b border-[var(--border-secondary)]">
              <LanguageSelector variant="dropdown" />
            </div>

            {/* Theme Section - Compact single row */}
            <div className="px-4 py-2.5 border-b border-[var(--border-secondary)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--fg-tertiary)]">{t('theme')}</span>
                <ThemeCompactToggle />
              </div>
            </div>

            {/* Log Out */}
            <div className="py-1">
              <button
                onClick={() => {
                  // Handle logout - in real app, call auth signOut
                  onClose();
                }}
                className="
                  w-full flex items-center gap-3
                  px-4 py-2
                  text-left
                  hover:bg-[var(--bg-tertiary)]
                  transition-colors
                "
              >
                <LogOut className="w-4 h-4 text-[var(--fg-tertiary)]" />
                <span className="text-base text-[var(--fg-secondary)]">{t('logOut')}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
