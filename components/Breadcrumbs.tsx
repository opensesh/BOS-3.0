'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronRight, Plus, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import { Brand } from '@/types';

// Default brands - shared with BrandSelector
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
  const { resolvedTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(DEFAULT_BRANDS[0].id);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedBrand = brands.find(b => b.id === selectedBrandId) || brands[0];

  useEffect(() => {
    setMounted(true);
    setBrands(getStoredBrands());
    setSelectedBrandId(getSelectedBrandId());
  }, []);

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSelectBrand = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
    saveSelectedBrand(brandId);
    setIsDropdownOpen(false);
    // Optionally trigger a page reload or context update
  }, []);

  return (
    <nav className="flex items-center text-sm" aria-label="Breadcrumb">
      {/* Separator after brand icon */}
      <ChevronRight className="w-4 h-4 mx-1 text-fg-quaternary" />
      
      {/* Brand/Organization Selector - First breadcrumb */}
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="
            flex items-center gap-1.5
            px-2 py-1
            rounded-md
            text-fg-secondary hover:text-fg-primary
            hover:bg-bg-tertiary
            transition-all duration-150
          "
        >
          <span className="font-medium">{selectedBrand.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="
              absolute top-full left-0 mt-1
              w-56 bg-bg-secondary
              rounded-lg border border-border-secondary
              shadow-lg z-[100]
              py-1
            "
          >
            {/* Search field placeholder */}
            <div className="px-3 py-2 border-b border-border-secondary">
              <input
                type="text"
                placeholder="Find organization..."
                className="
                  w-full px-2 py-1.5
                  text-sm
                  bg-bg-tertiary border border-border-secondary
                  rounded-md
                  text-fg-primary
                  placeholder:text-fg-tertiary
                  focus:outline-none focus:ring-1 focus:ring-border-brand
                "
              />
            </div>
            
            {/* Brand list */}
            <div className="py-1">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand.id)}
                  className={`
                    w-full flex items-center justify-between
                    px-3 py-2
                    text-sm text-left
                    hover:bg-bg-tertiary
                    transition-colors duration-150
                    ${selectedBrandId === brand.id ? 'bg-bg-tertiary' : ''}
                  `}
                >
                  <span className="text-fg-primary">{brand.name}</span>
                  {selectedBrandId === brand.id && (
                    <Check className="w-4 h-4 text-fg-brand-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* All Organizations link */}
            <div className="border-t border-border-secondary py-1">
              <button
                className="
                  w-full flex items-center
                  px-3 py-2
                  text-sm text-fg-secondary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-colors duration-150
                "
              >
                All Organizations
              </button>
            </div>

            {/* Add new brand */}
            <div className="border-t border-border-secondary py-1">
              <button
                className="
                  w-full flex items-center gap-2
                  px-3 py-2
                  text-sm text-fg-secondary hover:text-fg-primary
                  hover:bg-bg-tertiary
                  transition-colors duration-150
                "
              >
                <Plus className="w-4 h-4" />
                <span>New organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Page breadcrumbs */}
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-1 text-fg-quaternary" />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="
                px-2 py-1
                rounded-md
                text-fg-secondary hover:text-fg-primary
                hover:bg-bg-tertiary
                transition-all duration-150
              "
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="px-2 py-1 text-fg-primary font-medium">
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

