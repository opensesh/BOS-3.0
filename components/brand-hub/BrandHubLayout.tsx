'use client';

import React, { useEffect, useState } from 'react';
import { PageTransition, MotionItem } from '@/lib/motion';
import { useSidebar } from '@/lib/sidebar-context';

interface BrandHubLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function BrandHubLayout({
  children,
  title,
  description,
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
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
            {title}
          </h1>
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
