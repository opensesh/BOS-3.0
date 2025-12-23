'use client';

import Link from 'next/link';
import { Search, Bell, HelpCircle, Sparkles } from 'lucide-react';
import { Brandmark } from './Brandmark';

interface TopHeaderProps {
  children?: React.ReactNode; // For breadcrumbs
}

export function TopHeader({ children }: TopHeaderProps) {
  return (
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
          <button
            className="
              relative flex items-center justify-center
              p-1.5
              rounded-md
              text-fg-tertiary hover:text-fg-primary
              hover:bg-bg-tertiary
              transition-all duration-150
            "
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Help Center */}
          <button
            className="
              flex items-center justify-center
              p-1.5
              rounded-md
              text-fg-tertiary hover:text-fg-primary
              hover:bg-bg-tertiary
              transition-all duration-150
            "
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* AI Assistant */}
          <button
            className="
              flex items-center justify-center
              p-1.5
              rounded-md
              text-fg-tertiary hover:text-fg-primary
              hover:bg-bg-tertiary
              transition-all duration-150
            "
            title="AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Profile */}
          <button
            className="
              flex items-center justify-center
              p-1.5
              rounded-md
              hover:bg-bg-tertiary
              transition-all duration-150
            "
            title="Profile"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-border-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-[8px] font-mono">A</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
