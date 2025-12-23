'use client';

import Link from 'next/link';
import { Search, Bell, HelpCircle, Sparkles, User } from 'lucide-react';
import { Brandmark } from './Brandmark';
import { Tooltip, TooltipTrigger } from '@/components/ui/base/tooltip/tooltip';

interface TopHeaderProps {
  children?: React.ReactNode; // For breadcrumbs
}

export function TopHeader({ children }: TopHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-bg-secondary border-b border-border-secondary">
      <div className="flex items-center justify-between h-full px-3">
        {/* Left Section: Brand Icon */}
        <div className="flex items-center gap-3">
          <Tooltip title="Home" placement="bottom" delay={300}>
            <TooltipTrigger>
              <Link
                href="/"
                className="
                  flex items-center justify-center
                  p-1.5
                  rounded-lg
                  hover:bg-bg-tertiary
                  transition-all duration-200
                "
              >
                <Brandmark size={20} />
              </Link>
            </TooltipTrigger>
          </Tooltip>
          
          {/* Breadcrumbs slot */}
          {children && (
            <div className="flex items-center">
              {children}
            </div>
          )}
        </div>

        {/* Right Section: Utility Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <Tooltip title="Search" description="⌘K" placement="bottom" delay={300}>
            <TooltipTrigger>
              <button
                className="
                  flex items-center justify-center
                  p-2
                  rounded-lg
                  text-fg-tertiary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-all duration-200
                "
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications" placement="bottom" delay={300}>
            <TooltipTrigger>
              <button
                className="
                  relative flex items-center justify-center
                  p-2
                  rounded-lg
                  text-fg-tertiary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-all duration-200
                "
              >
                <Bell className="w-[18px] h-[18px]" />
                {/* Notification badge - can be conditionally rendered */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-aperol)] rounded-full" />
              </button>
            </TooltipTrigger>
          </Tooltip>

          {/* Help Center */}
          <Tooltip title="Help" placement="bottom" delay={300}>
            <TooltipTrigger>
              <button
                className="
                  flex items-center justify-center
                  p-2
                  rounded-lg
                  text-fg-tertiary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-all duration-200
                "
              >
                <HelpCircle className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
          </Tooltip>

          {/* AI Assistant */}
          <Tooltip title="AI Assistant" placement="bottom" delay={300}>
            <TooltipTrigger>
              <button
                className="
                  flex items-center justify-center
                  p-2
                  rounded-lg
                  text-fg-tertiary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-all duration-200
                "
              >
                <Sparkles className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Profile" placement="bottom" delay={300}>
            <TooltipTrigger>
              <button
                className="
                  flex items-center justify-center
                  p-2
                  rounded-lg
                  hover:bg-bg-tertiary
                  transition-all duration-200
                "
              >
                <div className="w-6 h-6 bg-gradient-to-br from-[var(--color-charcoal)] to-black border border-border-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-mono">A</span>
                </div>
              </button>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

