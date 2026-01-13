'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface BrandmarkProps {
  className?: string;
  size?: number;
}

// Supabase storage URL helper for logos
function getLogoUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/brand-assets/open-session/logos/${filename}`;
}

export function Brandmark({ className = '', size = 24 }: BrandmarkProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for theme to be resolved to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use charcoal logo for light mode, vanilla for dark mode
  const logoSrc = mounted && resolvedTheme === 'dark' 
    ? getLogoUrl('brandmark-vanilla.svg')
    : getLogoUrl('brandmark-charcoal.svg');

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoSrc}
        alt="Brand Operating System"
        fill
        priority
        className="object-contain transition-opacity duration-200"
        sizes={`${size}px`}
      />
    </div>
  );
}
