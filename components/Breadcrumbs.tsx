'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, Check, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import { getQuickActionConfig } from '@/lib/quick-actions';
import { Brand } from '@/types';

// Default brands
const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'open-session',
    name: 'Open Session',
    logoPath: '',
    isDefault: true,
  },
];

const STORAGE_KEY = 'selected-brand';
const BRANDS_STORAGE_KEY = 'custom-brands';

function getStoredBrands(): Brand[] {
  if (typeof window === 'undefined') return DEFAULT_BRANDS;
  
  try {
    const stored = localStorage.getItem(BRANDS_STORAGE_KEY);
    if (stored && stored.trim() !== '') {
      const customBrands = JSON.parse(stored);
      return [...DEFAULT_BRANDS, ...customBrands];
    }
  } catch (error) {
    console.error('Error loading stored brands:', error);
  }
  
  return DEFAULT_BRANDS;
}

function getSelectedBrandId(): string {
  if (typeof window === 'undefined') return DEFAULT_BRANDS[0].id;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim() !== '') {
      const brandId = JSON.parse(stored);
      const allBrands = getStoredBrands();
      if (allBrands.find(b => b.id === brandId)) {
        return brandId;
      }
    }
  } catch (error) {
    console.error('Error loading selected brand:', error);
  }
  
  return DEFAULT_BRANDS[0].id;
}

function saveSelectedBrand(brandId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brandId));
  } catch (error) {
    console.error('Error saving selected brand:', error);
  }
}

/**
 * Quick Action Badge - Gray chip with lightning bolt for guided chat mode
 */
function QuickActionBadge({ type }: { type: string }) {
  const config = getQuickActionConfig(type as any);
  if (!config) return null;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-lg
        text-xs font-medium
        bg-[var(--bg-tertiary)] text-[var(--fg-primary)]
        border border-[var(--border-secondary)]
      "
    >
      <Zap className="w-3 h-3" />
      {config.title}
    </motion.span>
  );
}

export function Breadcrumbs() {
  const { breadcrumbs, quickActionType } = useBreadcrumbs();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(DEFAULT_BRANDS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedBrand = brands.find(b => b.id === selectedBrandId) || brands[0];
  
  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setBrands(getStoredBrands());
    setSelectedBrandId(getSelectedBrandId());
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSelectBrand = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
    saveSelectedBrand(brandId);
    setIsDropdownOpen(false);
    setSearchQuery('');
  }, []);

  // Separate breadcrumbs into path items (with href) and the final title (without href)
  // Items with href are always path items, only the last item without href is the title
  const lastItem = breadcrumbs[breadcrumbs.length - 1];
  const hasTitle = lastItem && !lastItem.href;
  const pathBreadcrumbs = hasTitle ? breadcrumbs.slice(0, -1) : breadcrumbs;
  const titleBreadcrumb = hasTitle ? lastItem : null;

  return (
    <nav className="flex items-center text-sm" aria-label="Breadcrumb">
      {/* Separator after brand icon */}
      <span className="mx-2 text-fg-quaternary">/</span>

      {/* Brand/Organization Selector */}
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            flex items-center gap-1.5
            px-2 py-1
            rounded
            text-fg-primary hover:text-fg-primary
            hover:bg-bg-tertiary
            transition-all duration-150
            ${isDropdownOpen ? 'bg-bg-tertiary' : ''}
          `}
        >
          <span className="font-medium">{selectedBrand.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-fg-tertiary transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="
              absolute top-full left-0 mt-1
              w-52 bg-bg-secondary
              rounded-md border border-border-secondary
              shadow-lg z-[200]
              overflow-hidden
            "
          >
            {/* Search field */}
            <div className="p-2 border-b border-border-secondary">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-quaternary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find organization..."
                  className="
                    w-full pl-8 pr-3 py-2
                    text-sm
                    bg-bg-tertiary border border-border-secondary
                    rounded
                    text-fg-primary
                    placeholder:text-fg-quaternary
                    focus:outline-none focus:border-border-brand
                  "
                />
              </div>
            </div>
            
            {/* Brand list */}
            <div className="py-1 max-h-48 overflow-y-auto">
              {filteredBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand.id)}
                  className={`
                    w-full flex items-center justify-between
                    px-3.5 py-2
                    text-sm text-left
                    hover:bg-bg-tertiary
                    transition-colors duration-100
                    ${selectedBrandId === brand.id ? 'bg-bg-tertiary' : ''}
                  `}
                >
                  <span className="text-fg-primary">{brand.name}</span>
                  {selectedBrandId === brand.id && (
                    <Check className="w-4 h-4 text-fg-brand-primary" />
                  )}
                </button>
              ))}
              {filteredBrands.length === 0 && (
                <div className="px-3.5 py-2 text-sm text-fg-tertiary">
                  No organizations found
                </div>
              )}
            </div>

            {/* All Organizations link */}
            <div className="border-t border-border-secondary">
              <button
                className="
                  w-full flex items-center
                  px-3.5 py-2
                  text-sm text-fg-secondary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-colors duration-100
                "
              >
                All Organizations
              </button>
            </div>

            {/* Add new brand */}
            <div className="border-t border-border-secondary">
              <button
                className="
                  w-full flex items-center gap-2
                  px-3.5 py-2
                  text-sm text-fg-secondary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-colors duration-100
                "
              >
                <Plus className="w-4 h-4" />
                <span>New organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Path breadcrumbs (everything except the final title) */}
      {pathBreadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <span className="mx-2 text-fg-quaternary">/</span>
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="
                px-2 py-1
                rounded
                text-fg-secondary hover:text-fg-primary
                hover:bg-bg-tertiary
                transition-all duration-150
              "
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="px-2 py-1 text-fg-primary">
              {crumb.label}
            </span>
          )}
        </div>
      ))}

      {/* Title breadcrumb (final item) - animated when it appears */}
      {/* Shows lightning bolt icon for quick action chats */}
      {titleBreadcrumb && (
        <div className="flex items-center">
          <span className="mx-2 text-fg-quaternary">/</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={titleBreadcrumb.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center gap-1.5 px-2 py-1 text-fg-primary"
            >
              {titleBreadcrumb.isQuickAction && (
                <Zap className="w-3 h-3 text-[var(--fg-tertiary)]" />
              )}
              {titleBreadcrumb.label}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </nav>
  );
}
