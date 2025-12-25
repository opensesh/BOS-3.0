'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { fadeInUp } from '@/lib/motion';
import { Tooltip, TooltipTrigger } from '@/components/ui/base/tooltip/tooltip';

// Storage keys matching BrandSelector
const STORAGE_KEY = 'selected-brand';
const BRANDS_STORAGE_KEY = 'custom-brands';

interface Brand {
  id: string;
  name: string;
  logoPath: string;
  isDefault?: boolean;
}

const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'open-session',
    name: 'Open Session',
    logoPath: '',
    isDefault: true,
  },
];

// Random greeting messages for a personal touch
const GREETINGS = [
  "What's new",
  "How's it going",
  "What's up",
  "Ready to build",
  "Hey there",
  "Good to see you",
  "What are we making",
  "Let's create something",
];

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

function getSelectedBrand(): Brand {
  if (typeof window === 'undefined') return DEFAULT_BRANDS[0];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim() !== '') {
      const brandId = JSON.parse(stored);
      const allBrands = getStoredBrands();
      const found = allBrands.find(b => b.id === brandId);
      if (found) return found;
    }
  } catch (error) {
    console.error('Error loading selected brand:', error);
  }
  
  return DEFAULT_BRANDS[0];
}

// BOS Logo SVG component
function BOSLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 384 151" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M318.486 1C328.886 1.00003 338.219 2.40022 346.486 5.2002C354.753 8.00019 361.686 12.7998 367.286 19.5996C372.886 26.2662 375.753 34.5998 375.886 44.5996H334.486C333.153 36.0666 327.086 31.7998 316.286 31.7998C311.753 31.7998 308.019 32.733 305.086 34.5996C302.153 36.4663 300.686 38.8666 300.686 41.7998C300.686 42.7331 300.819 43.6004 301.086 44.4004C301.353 45.067 301.819 45.7338 302.486 46.4004C303.153 47.0669 303.819 47.667 304.486 48.2002C305.286 48.7334 306.353 49.2666 307.686 49.7998C309.019 50.1998 310.219 50.6 311.286 51C312.486 51.4 314.086 51.8671 316.086 52.4004C318.086 52.8004 319.819 53.1996 321.286 53.5996C322.886 53.9996 324.953 54.4667 327.486 55C330.019 55.5333 332.286 56.0663 334.286 56.5996C341.219 58.3329 347.153 60.2002 352.086 62.2002C357.019 64.0669 361.953 66.7335 366.886 70.2002C371.953 73.5335 375.753 77.9337 378.286 83.4004C380.953 88.7336 382.286 95.0004 382.286 102.2C382.286 117.267 376.418 129 364.686 137.4C353.086 145.8 338.418 150 320.686 150C301.219 150 285.419 145.8 273.286 137.4C265.109 131.739 259.627 124.382 256.84 115.33C254.016 120.312 250.575 124.936 246.514 129.2C233.181 143.067 215.581 150 193.714 150C171.847 150 154.314 143.067 141.114 129.2C135.617 123.369 131.265 116.867 128.057 109.695C126.706 121.681 121.355 130.983 112 137.6C103.333 143.6 91.8002 146.6 77.4004 146.6H2V3.59961H76C89.3332 3.59961 100 6.66656 108 12.7998C117.067 19.7331 121.6 29.1333 121.6 41C121.6 54.0667 115.667 63.2004 103.8 68.4004V69C111.345 71.4718 117.24 75.6583 121.485 81.5576C121.371 79.6051 121.314 77.6189 121.314 75.5996C121.315 53.8665 127.914 35.9999 141.114 22C154.314 8.00012 171.847 1.00003 193.714 1C215.581 1 233.181 8.00011 246.514 22C252.048 27.8111 256.433 34.2891 259.67 41.4326C260.703 28.3693 266.108 18.5583 275.886 12C286.819 4.6667 301.019 1 318.486 1ZM266.214 67.8066C266.413 70.3466 266.514 72.9442 266.514 75.5996C266.514 84.7519 265.331 93.219 262.967 101H297.486C298.819 112.2 306.819 117.8 321.486 117.8C326.286 117.8 330.486 116.867 334.086 115C337.819 113 339.686 110 339.686 106C339.686 101.6 336.553 98.1998 330.286 95.7998C327.486 94.7328 321.553 93.0668 312.486 90.7998C306.353 89.3331 301.353 87.9998 297.486 86.7998C293.619 85.5998 289.019 83.8004 283.686 81.4004C278.353 78.8671 274.086 76.2003 270.886 73.4004C269.208 71.7957 267.652 69.9301 266.214 67.8066ZM224.108 76.4219C224.021 76.4997 223.915 76.5612 223.788 76.5928C209.766 80.0358 200.723 94.2061 196.282 116.52C204.866 115.943 211.545 112.172 216.314 105.2C221.396 97.7725 223.993 88.1795 224.108 76.4219ZM163.72 76.457C163.84 88.1987 166.437 97.7799 171.514 105.2C176.142 111.965 182.568 115.716 190.788 116.459C186.64 94.1963 178.17 80.2536 164.009 76.6025C163.896 76.5737 163.801 76.5218 163.72 76.457ZM43 113.8H72.7998C77.3331 113.8 80.9998 112.533 83.7998 110C86.5998 107.467 88 104.067 88 99.7998C88 95.3999 86.5329 91.9996 83.5996 89.5996C80.7997 87.1999 77.1327 86 72.5996 86H43V113.8ZM196.183 34.4756C200.555 56.9755 209.485 71.1169 223.76 74.8447C223.901 74.8823 224.016 74.9514 224.11 75.0381C224.031 63.1618 221.434 53.4823 216.314 46C211.526 38.8789 204.815 35.0393 196.183 34.4756ZM191.731 34.4697C183.058 35.0135 176.318 38.8552 171.514 46C166.395 53.4809 163.798 63.1581 163.718 75.0312C163.806 74.9588 163.912 74.9022 164.037 74.8721C178.315 71.532 187.382 57.3754 191.731 34.4697ZM43 59.2002H69C73.1331 59.2002 76.3998 58.2669 78.7998 56.4004C81.1998 54.4004 82.4004 51.5331 82.4004 47.7998C82.4003 44.1999 81.1329 41.3335 78.5996 39.2002C76.0663 37.067 72.7997 36 68.7998 36H43V59.2002Z" 
        fill="currentColor"
      />
    </svg>
  );
}

export function WelcomeHeader() {
  const [mounted, setMounted] = useState(false);
  const [brandName, setBrandName] = useState('Open Session');
  
  // Pick a random greeting on mount (only once)
  const greeting = useMemo(() => {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }, []);

  useEffect(() => {
    setMounted(true);
    const brand = getSelectedBrand();
    setBrandName(brand.name);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full max-w-3xl px-4 mb-6">
        <div className="flex flex-col items-center text-center gap-1">
          <div className="h-10 mb-1" />
          <div className="h-6" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-3xl px-4 mb-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* Centered content */}
      <div className="flex flex-col items-center text-center gap-1">
        {/* Main greeting with brand gradient */}
        <h1 
          className="text-3xl md:text-4xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {greeting}?
        </h1>

        {/* "ask the BOS" with info tooltip */}
        <div className="flex items-center gap-2 text-[var(--fg-secondary)]">
          <span className="text-base md:text-lg">ask the</span>
          <BOSLogo className="h-5 md:h-6 w-auto text-[var(--fg-primary)]" />
          <Tooltip 
            title={`Brand Operating System for ${brandName}`}
            placement="right"
            delay={100}
          >
            <TooltipTrigger>
              <Info className="w-4 h-4 text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors cursor-help" />
            </TooltipTrigger>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}
