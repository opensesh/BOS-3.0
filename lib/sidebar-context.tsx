'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type SidebarMode = 'expanded' | 'collapsed' | 'hover';

// Sidebar width constants
export const SIDEBAR_WIDTH_EXPANDED = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 48;

interface SidebarContextType {
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  isSidebarHovered: boolean;
  setIsSidebarHovered: (hovered: boolean) => void;
  isExpanded: boolean; // Computed: true when expanded OR (hover mode AND hovered)
  sidebarWidth: number; // Current width based on mode
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-mode';

function getStoredMode(): SidebarMode {
  if (typeof window === 'undefined') return 'collapsed';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'expanded' || stored === 'collapsed' || stored === 'hover') {
      return stored;
    }
  } catch (error) {
    console.error('Error loading sidebar mode:', error);
  }
  
  return 'collapsed';
}

function saveMode(mode: SidebarMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    console.error('Error saving sidebar mode:', error);
  }
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>('collapsed');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSidebarModeState(getStoredMode());
    setMounted(true);
  }, []);

  const setSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarModeState(mode);
    saveMode(mode);
  }, []);

  // Compute isExpanded based on mode and hover state
  const isExpanded = sidebarMode === 'expanded' || (sidebarMode === 'hover' && isSidebarHovered);

  // Compute sidebar width based on mode
  const sidebarWidth = sidebarMode === 'expanded' ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  // Set CSS variable for fixed-positioned elements to use
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }
  }, [sidebarWidth]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <SidebarContext.Provider 
        value={{ 
          sidebarMode: 'hover', 
          setSidebarMode, 
          isSidebarHovered: false, 
          setIsSidebarHovered,
          isExpanded: false,
          sidebarWidth: SIDEBAR_WIDTH_COLLAPSED
        }}
      >
        {children}
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider 
      value={{ 
        sidebarMode, 
        setSidebarMode, 
        isSidebarHovered, 
        setIsSidebarHovered,
        isExpanded,
        sidebarWidth
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

