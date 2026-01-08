'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { QuickActionType } from '@/lib/quick-actions';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setPageTitle: (title: string) => void;
  // Quick action support
  quickActionType: QuickActionType | null;
  setQuickAction: (type: QuickActionType | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

// Route-to-label mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '': 'Home',
  'brand-hub': 'Brand Hub',
  'brain': 'Brain',
  'spaces': 'Spaces',
  'chats': 'Chats',
  'demo': 'Demo',
  'account': 'Settings',
  // Brand Hub subpages
  'logo': 'Logo',
  'colors': 'Colors',
  'fonts': 'Typography',
  'art-direction': 'Art Direction',
  'design-tokens': 'Tokens',
  'guidelines': 'Guidelines',
  // Brain subpages
  'architecture': 'Architecture',
  'brand-identity': 'Brand Identity',
  'writing-styles': 'Writing Styles',
  'skills': 'Skills',
  'components': 'Components',
};

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);
  const [quickActionType, setQuickActionType] = useState<QuickActionType | null>(null);

  // Auto-generate breadcrumbs from pathname
  const generateBreadcrumbs = useCallback((path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      return [{ label: 'Home', href: '/' }];
    }

    const items: BreadcrumbItem[] = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      items.push({
        label,
        href: index < segments.length - 1 ? currentPath : undefined, // Last item has no href
      });
    });

    return items;
  }, []);

  const breadcrumbs = customBreadcrumbs || generateBreadcrumbs(pathname);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setCustomBreadcrumbs(items);
  }, []);

  const setPageTitle = useCallback((title: string) => {
    // Update just the last breadcrumb item's label
    setCustomBreadcrumbs(prev => {
      const current = prev || generateBreadcrumbs(pathname);
      if (current.length === 0) return current;
      
      const updated = [...current];
      updated[updated.length - 1] = { ...updated[updated.length - 1], label: title };
      return updated;
    });
  }, [pathname, generateBreadcrumbs]);

  const setQuickAction = useCallback((type: QuickActionType | null) => {
    setQuickActionType(type);
  }, []);

  // Reset custom breadcrumbs and quick action when pathname changes
  // BUT don't reset when navigating to the home page (/) since the chat interface
  // will set its own breadcrumbs and quick action type
  useEffect(() => {
    // Skip reset for home page - ChatInterface manages its own breadcrumbs
    if (pathname === '/') return;
    
    setCustomBreadcrumbs(null);
    setQuickActionType(null);
  }, [pathname]);

  return (
    <BreadcrumbContext.Provider value={{ 
      breadcrumbs, 
      setBreadcrumbs, 
      setPageTitle,
      quickActionType,
      setQuickAction,
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
}
