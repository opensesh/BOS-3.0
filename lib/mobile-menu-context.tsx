'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type MobilePanel = 'none' | 'account' | 'notifications' | 'help';

interface MobileMenuContextValue {
  // Menu state
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  
  // Panel state
  activePanel: MobilePanel;
  openPanel: (panel: MobilePanel) => void;
  closePanel: () => void;
  
  // Helper to close everything
  closeAll: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<MobilePanel>('none');

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setActivePanel('none'); // Reset panel when menu closes
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => {
      if (prev) {
        // Closing menu, also reset panel
        setActivePanel('none');
      }
      return !prev;
    });
  }, []);

  const openPanel = useCallback((panel: MobilePanel) => {
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel('none');
  }, []);

  const closeAll = useCallback(() => {
    setIsMobileMenuOpen(false);
    setActivePanel('none');
  }, []);

  return (
    <MobileMenuContext.Provider value={{
      isMobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      toggleMobileMenu,
      activePanel,
      openPanel,
      closePanel,
      closeAll,
    }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider');
  }
  return context;
}
