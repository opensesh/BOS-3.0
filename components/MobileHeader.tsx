'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { Brandmark } from './Brandmark';

interface MobileHeaderProps {
  onBrandClick?: () => void;
}

export function MobileHeader({ onBrandClick }: MobileHeaderProps) {
  const { isMobileMenuOpen, toggleMobileMenu } = useMobileMenu();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--bg-secondary)] backdrop-blur-sm border-b border-[var(--border-secondary)]">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Simple Brand Logo Link (no dropdown on mobile) */}
        <Link
          href="/"
          onClick={onBrandClick}
          className="flex items-center justify-center p-1"
          title="Home"
        >
          <Brandmark size={24} />
        </Link>

        {/* Right: Hamburger menu with Framer Motion animation */}
        <motion.button
          onClick={toggleMobileMenu}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          animate={isHovered && !isMobileMenuOpen ? { rotate: [0, -3, 3, -3, 0] } : { rotate: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="p-2"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 relative flex items-center justify-center">
            {/* Top bar */}
            <motion.span
              className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
              animate={{
                rotate: isMobileMenuOpen ? 45 : 0,
                y: isMobileMenuOpen ? 0 : -6,
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
            {/* Middle bar */}
            <motion.span
              className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
              animate={{
                opacity: isMobileMenuOpen ? 0 : 1,
                scaleX: isMobileMenuOpen ? 0 : 1,
              }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            />
            {/* Bottom bar */}
            <motion.span
              className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
              animate={{
                rotate: isMobileMenuOpen ? -45 : 0,
                y: isMobileMenuOpen ? 0 : 6,
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
          </div>
        </motion.button>
      </div>
    </header>
  );
}
