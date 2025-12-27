'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { Brandmark } from './Brandmark';
import { SearchModal } from './SearchModal';

interface MobileHeaderProps {
  onBrandClick?: () => void;
}

export function MobileHeader({ onBrandClick }: MobileHeaderProps) {
  const { isMobileMenuOpen, toggleMobileMenu } = useMobileMenu();
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--bg-secondary)] backdrop-blur-sm border-b border-[var(--border-secondary)]">
        <div className="flex items-center justify-between h-full px-3">
          {/* Left: Brand Logo Link */}
          <Link
            href="/"
            onClick={onBrandClick}
            className="flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
            title="Home"
          >
            <Brandmark size={26} />
          </Link>

          {/* Right: Utility Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="
                flex items-center justify-center
                p-2.5
                rounded-md
                text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-all duration-150
                min-w-[44px] min-h-[44px]
              "
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Menu Toggle - Hamburger to X animation */}
            <motion.button
              onClick={toggleMobileMenu}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              animate={isHovered && !isMobileMenuOpen ? { rotate: [0, -3, 3, -3, 0] } : { rotate: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="p-2 ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-6 h-6 relative flex items-center justify-center">
                {/* Top bar - slides down and rotates to form X */}
                <motion.span
                  className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full origin-center"
                  initial={false}
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 0 : -5,
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: [0.32, 0.72, 0, 1],
                    y: { duration: 0.2 },
                    rotate: { duration: 0.25, delay: isMobileMenuOpen ? 0.1 : 0 }
                  }}
                />
                {/* Middle bar - fades and scales out */}
                <motion.span
                  className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full"
                  initial={false}
                  animate={{
                    opacity: isMobileMenuOpen ? 0 : 1,
                    scaleX: isMobileMenuOpen ? 0.3 : 1,
                  }}
                  transition={{ 
                    duration: 0.2, 
                    ease: 'easeInOut'
                  }}
                />
                {/* Bottom bar - slides up and rotates to form X */}
                <motion.span
                  className="absolute w-5 h-0.5 bg-[var(--fg-primary)] rounded-full origin-center"
                  initial={false}
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? 0 : 5,
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: [0.32, 0.72, 0, 1],
                    y: { duration: 0.2 },
                    rotate: { duration: 0.25, delay: isMobileMenuOpen ? 0.1 : 0 }
                  }}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
