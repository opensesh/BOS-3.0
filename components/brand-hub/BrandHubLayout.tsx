'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { PageTransition, MotionItem } from '@/lib/motion';
import { useSidebar } from '@/lib/sidebar-context';

interface BrandHubLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Optional tooltip for the settings button */
  settingsTooltip?: string;
  /** Whether the settings button is loading */
  settingsLoading?: boolean;
  /** Additional header content (appears between title and settings) */
  headerActions?: React.ReactNode;
}

export function BrandHubLayout({
  children,
  title,
  description,
  onSettingsClick,
  settingsTooltip = 'Manage settings',
  settingsLoading = false,
  headerActions,
}: BrandHubLayoutProps) {
  const { sidebarWidth } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <div 
      className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pt-14 lg:pt-12 transition-[padding-left] duration-200 ease-out"
      style={{ paddingLeft: isDesktop ? `${sidebarWidth}px` : 0 }}
    >
      <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
        {/* Page Header */}
        <MotionItem className="flex flex-col gap-2 mb-10">
          {/* Title Row with Settings */}
          <div className="flex items-start justify-between w-full gap-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
              {title}
            </h1>
            
            <div className="flex items-center gap-3 pt-1">
              {/* Custom header actions */}
              {headerActions}
              
              {/* Settings Button */}
              {onSettingsClick && (
                <motion.button
                  onClick={onSettingsClick}
                  disabled={settingsLoading}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title={settingsTooltip}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings 
                    className={`w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors ${
                      settingsLoading ? 'animate-spin' : ''
                    }`} 
                  />
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Description */}
          {description && (
            <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              {description}
            </p>
          )}
        </MotionItem>

        {/* Content */}
        <MotionItem>
          {children}
        </MotionItem>
      </PageTransition>
    </div>
  );
}
