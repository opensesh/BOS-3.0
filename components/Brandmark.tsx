'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface BrandmarkProps {
  className?: string;
  size?: number;
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
    ? '/assets/logos/brandmark-vanilla.svg'
    : '/assets/logos/brandmark-charcoal.svg';

  return (
    <div 
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
    >
      <Image
        src={logoSrc}
        alt="Brand Operating System"
        width={size}
        height={size}
        className="object-contain transition-opacity duration-200"
        style={{ width: 'auto', height: 'auto', maxWidth: size, maxHeight: size }}
      />
    </div>
  );
}
