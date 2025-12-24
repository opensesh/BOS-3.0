'use client';

import { useState, useEffect } from 'react';
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

interface WelcomeHeaderProps {
  userName?: string;
}

export function WelcomeHeader({ userName = 'User' }: WelcomeHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [brandName, setBrandName] = useState('Open Session');

  useEffect(() => {
    setMounted(true);
    const brand = getSelectedBrand();
    setBrandName(brand.name);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="text-center mb-10">
        <div className="h-8 mb-2" />
        <div className="h-14 mb-3" />
        <div className="h-6" />
      </div>
    );
  }

  return (
    <motion.div 
      className="text-center mb-10"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* Personalized greeting with gradient */}
      <motion.p 
        className="text-lg md:text-xl font-medium mb-2"
        style={{
          background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Hello, {userName}
      </motion.p>

      {/* Main headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--fg-primary)] mb-3 tracking-tight font-display">
        Ask The Boss
      </h1>

      {/* Session context with emphasized brand name */}
      <p className="text-base md:text-lg text-[var(--fg-tertiary)]">
        Your Brand Operating System for{' '}
        <span 
          className="text-[var(--fg-primary)] font-medium underline decoration-[var(--color-brand-500)] decoration-2 underline-offset-4"
        >
          {brandName}
        </span>
      </p>
    </motion.div>
  );
}

