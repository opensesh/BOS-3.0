'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  Settings,
  Flag,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Check,
} from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

type ThemeOption = 'dark' | 'light' | 'system';

const themeOptions: { id: ThemeOption; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ProfileDropdown({ isOpen, onClose, triggerRef }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
              top-12 left-12
              backdrop-blur-sm
              bg-black/5
              z-[99]
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
              z-[100]
              overflow-hidden
            "
          >
            {/* User Info */}
            <div className="px-4 min-h-[52px] flex flex-col justify-center border-b border-[var(--border-secondary)]">
            <p className="text-sm font-medium text-[var(--fg-primary)]">
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
                // Navigate to account preferences
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
              <span className="text-sm text-[var(--fg-secondary)]">Account preferences</span>
            </button>
            <button
              onClick={() => {
                // Navigate to feature previews
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
              <Flag className="w-4 h-4 text-[var(--fg-tertiary)]" />
              <span className="text-sm text-[var(--fg-secondary)]">Feature previews</span>
            </button>
          </div>

          {/* Theme Section */}
          <div className="py-2 border-b border-[var(--border-secondary)]">
            <div className="px-4 py-1.5">
              <span className="text-xs text-[var(--fg-tertiary)]">Theme</span>
            </div>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = mounted && theme === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`
                    w-full flex items-center gap-3
                    px-4 py-1.5
                    text-left
                    hover:bg-[var(--bg-tertiary)]
                    transition-colors
                    ${isSelected ? 'bg-[var(--bg-tertiary)]' : ''}
                  `}
                >
                  {isSelected ? (
                    <span className="w-4 h-4 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[var(--fg-brand-primary)]" />
                    </span>
                  ) : (
                    <span className="w-4 h-4" />
                  )}
                  <span className={`text-sm ${isSelected ? 'text-[var(--fg-primary)]' : 'text-[var(--fg-secondary)]'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
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
              <span className="text-sm text-[var(--fg-secondary)]">Log out</span>
            </button>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

