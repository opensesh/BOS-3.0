'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSidebar } from '@/lib/sidebar-context';
import { useCanvasContextOptional } from '@/lib/canvas-context';

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * MainContent wrapper that automatically adjusts left padding
 * based on the current sidebar mode (expanded, collapsed, hover).
 * Also adjusts width when canvas panel is open.
 * 
 * On mobile (< lg), no sidebar padding is applied.
 * On desktop (lg+), padding adjusts based on sidebar mode.
 */
export function MainContent({ children, className = '' }: MainContentProps) {
  const { sidebarWidth } = useSidebar();
  const canvasContext = useCanvasContextOptional();
  const [isDesktop, setIsDesktop] = useState(false);

  // Get canvas state if available
  const isCanvasOpen = canvasContext?.isCanvasOpen ?? false;
  const canvasPanelMode = canvasContext?.panelMode ?? 'half';

  useEffect(() => {
    // Check if we're on desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Calculate width based on canvas state
  // When canvas is open in half mode, main content takes left 50%
  // When canvas is full screen, main content is hidden
  const getWidth = () => {
    if (!isCanvasOpen) return '100%';
    if (canvasPanelMode === 'full') return '0%';
    return '50%';
  };

  // Calculate right padding/offset for canvas
  const getPaddingRight = () => {
    if (!isCanvasOpen || !isDesktop) return 0;
    if (canvasPanelMode === 'full') return '100%';
    return '50%';
  };

  return (
    <main 
      className={`flex-1 flex flex-col pt-14 lg:pt-14 transition-all duration-300 ease-out ${className}`}
      style={{ 
        paddingLeft: isDesktop ? `${sidebarWidth}px` : 0,
        width: getWidth(),
        paddingRight: getPaddingRight(),
        opacity: canvasPanelMode === 'full' && isCanvasOpen ? 0 : 1,
        pointerEvents: canvasPanelMode === 'full' && isCanvasOpen ? 'none' : 'auto',
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

