'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

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

// Typewriter effect for brand name
function useTypewriter(text: string, speed: number = 80) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (isComplete) return;
    
    const timer = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isComplete]);

  return { displayText, isComplete };
}

export function WelcomeHeader() {
  const [mounted, setMounted] = useState(false);
  const [brandName, setBrandName] = useState('Open Session');
  const { displayText, isComplete } = useTypewriter(brandName, 80);

  useEffect(() => {
    setMounted(true);
    const brand = getSelectedBrand();
    setBrandName(brand.name);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full max-w-3xl px-4 mb-3">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <div className="h-8 mb-0.5" />
            <div className="h-6" />
          </div>
          <div className="h-4" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-3xl px-4 mb-3"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* Main content row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        {/* Left side - greeting */}
        <div>
          {/* Greeting with gradient */}
          <h1 
            className="text-2xl md:text-3xl font-semibold mb-0.5 tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Hello, user
          </h1>

          {/* Secondary question - neutral color */}
          <p className="text-lg md:text-xl text-[var(--fg-secondary)] font-medium">
            How can I help you today?
          </p>
        </div>

        {/* Right side - brand context (right-aligned on desktop) */}
        <p className="text-xs text-[var(--fg-tertiary)] md:text-right">
          Brand Operating System for{' '}
          <span 
            className="font-medium text-[var(--fg-secondary)]"
            style={{ fontFamily: 'Offbit, monospace' }}
          >
            {displayText}
            {!isComplete && <span className="animate-pulse">|</span>}
          </span>
        </p>
      </div>
    </motion.div>
  );
}

