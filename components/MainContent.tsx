'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSidebar } from '@/lib/sidebar-context';

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * MainContent wrapper that automatically adjusts left padding
 * based on the current sidebar mode (expanded, collapsed, hover).
 * 
 * On mobile (< lg), no sidebar padding is applied.
 * On desktop (lg+), padding adjusts based on sidebar mode.
 */
export function MainContent({ children, className = '' }: MainContentProps) {
  const { sidebarWidth } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if we're on desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <main 
      className={`flex-1 flex flex-col pt-14 lg:pt-12 transition-[padding-left] duration-200 ease-out ${className}`}
      style={{ 
        paddingLeft: isDesktop ? `${sidebarWidth}px` : 0,
      }}
    >
      {children}
    </main>
  );
}

/**
 * Hook to get the current sidebar width for custom layouts
 */
export function useSidebarWidth() {
  const { sidebarWidth } = useSidebar();
  return sidebarWidth;
}

