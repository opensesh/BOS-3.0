'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setPageTitle: (title: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

// Route-to-label mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '': 'Home',
  'brand-hub': 'Brand Hub',
  'brain': 'Brain',
  'spaces': 'Spaces',
  'demo': 'Demo',
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

  // Reset custom breadcrumbs when pathname changes
  useEffect(() => {
    setCustomBreadcrumbs(null);
  }, [pathname]);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs, setPageTitle }}>
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


