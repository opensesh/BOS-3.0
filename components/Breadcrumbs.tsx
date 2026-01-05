'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, Check, Search } from 'lucide-react';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
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

export function Breadcrumbs() {
  const { breadcrumbs } = useBreadcrumbs();
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

  return (
    <nav className="flex items-center text-xs" aria-label="Breadcrumb">
      {/* Separator after brand icon */}
      <span className="mx-1.5 text-fg-quaternary">/</span>
      
      {/* Brand/Organization Selector */}
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            flex items-center gap-1
            px-1.5 py-0.5
            rounded
            text-fg-primary hover:text-fg-primary
            hover:bg-bg-tertiary
            transition-all duration-150
            ${isDropdownOpen ? 'bg-bg-tertiary' : ''}
          `}
        >
          <span className="font-medium text-xs">{selectedBrand.name}</span>
          <ChevronDown className={`w-3 h-3 text-fg-tertiary transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                    w-full pl-7 pr-2 py-1.5
                    text-xs
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
                    px-3 py-1.5
                    text-xs text-left
                    hover:bg-bg-tertiary
                    transition-colors duration-100
                    ${selectedBrandId === brand.id ? 'bg-bg-tertiary' : ''}
                  `}
                >
                  <span className="text-fg-primary">{brand.name}</span>
                  {selectedBrandId === brand.id && (
                    <Check className="w-3.5 h-3.5 text-fg-brand-primary" />
                  )}
                </button>
              ))}
              {filteredBrands.length === 0 && (
                <div className="px-3 py-2 text-xs text-fg-tertiary">
                  No organizations found
                </div>
              )}
            </div>

            {/* All Organizations link */}
            <div className="border-t border-border-secondary">
              <button
                className="
                  w-full flex items-center
                  px-3 py-1.5
                  text-xs text-fg-secondary hover:text-fg-primary
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
                  w-full flex items-center gap-1.5
                  px-3 py-1.5
                  text-xs text-fg-secondary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-colors duration-100
                "
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Page breadcrumbs */}
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <span className="mx-1.5 text-fg-quaternary">/</span>
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="
                px-1.5 py-0.5
                rounded
                text-fg-secondary hover:text-fg-primary
                hover:bg-bg-tertiary
                transition-all duration-150
              "
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="px-1.5 py-0.5 text-fg-primary">
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
