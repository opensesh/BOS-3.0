'use client';

import { useState, type FC, type SVGProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Palette, Type, Image, LayoutGrid } from 'lucide-react';

interface AnimatedFolderProps {
  title: string;
  subtitle?: string;
  href: string;
  color?: 'aperol' | 'blue' | 'green' | 'purple';
  variant?: 'icons' | 'squares';
  icons?: FC<SVGProps<SVGSVGElement>>[];
}

const colorVariants = {
  aperol: {
    main: 'var(--color-brand-500)',
    light: 'var(--color-brand-400)',
    dark: 'var(--color-brand-600)',
    hex: '#fe5102',
  },
  blue: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    hex: '#3B82F6',
  },
  green: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    hex: '#10B981',
  },
  purple: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    hex: '#8B5CF6',
  },
};

// Default icons for brand assets
const defaultBrandIcons = [Palette, Type, Image];

export function AnimatedFolder({
  title,
  subtitle,
  href,
  color = 'aperol',
  variant = 'icons',
  icons = defaultBrandIcons,
}: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const colors = colorVariants[color];

  const handleClick = () => {
    router.push(href);
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full h-full rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 cursor-pointer text-left transition-all duration-300 hover:border-[var(--border-brand)]"
      whileTap={{ scale: 0.98 }}
    >
      {/* Folder Container */}
      <div className="flex flex-col">
        {/* 3D Folder */}
        <div 
          className="relative w-20 h-14 mb-3"
          style={{ perspective: '1000px' }}
        >
          {/* Back Panel */}
          <motion.div
            className="absolute inset-0 rounded-md"
            style={{
              background: colors.dark,
              transformStyle: 'preserve-3d',
            }}
          />

          {/* Folder Tab */}
          <motion.div
            className="absolute -top-1.5 left-2 w-8 h-3 rounded-t-sm"
            style={{
              background: colors.main,
            }}
          />

          {/* Front Panel (opens on hover) */}
          <motion.div
            className="absolute inset-0 rounded-md origin-bottom"
            style={{
              background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.main} 100%)`,
              transformStyle: 'preserve-3d',
            }}
            animate={{
              rotateX: isHovered ? -45 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          >
            {/* Shine effect */}
            <div 
              className="absolute inset-0 rounded-md opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
              }}
            />
          </motion.div>

          {/* Icons that pop out */}
          <AnimatePresence>
            {isHovered && variant === 'icons' && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 overflow-visible">
                {icons.slice(0, 3).map((Icon, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 15, opacity: 0, scale: 0.8 }}
                    animate={{ 
                      y: -8 - (index * 3), 
                      opacity: 1, 
                      scale: 1,
                      rotate: (index - 1) * 6,
                    }}
                    exit={{ y: 15, opacity: 0, scale: 0.8 }}
                    transition={{ 
                      delay: index * 0.04,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="w-6 h-6 rounded-sm shadow-lg bg-white flex items-center justify-center p-1"
                    style={{
                      zIndex: 10 + index,
                    }}
                  >
                    <Icon 
                      className="w-full h-full"
                      style={{ color: colors.hex, strokeWidth: 1.5 }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Four squares that pop out */}
          <AnimatePresence>
            {isHovered && variant === 'squares' && (
              <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                <motion.div
                  initial={{ y: 15, opacity: 0, scale: 0.8 }}
                  animate={{ y: -10, opacity: 1, scale: 1 }}
                  exit={{ y: 15, opacity: 0, scale: 0.8 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="w-7 h-7 rounded-sm shadow-lg bg-white flex items-center justify-center p-1"
                  style={{ zIndex: 10 }}
                >
                  <LayoutGrid 
                    className="w-full h-full"
                    style={{ color: colors.hex, strokeWidth: 1.5 }}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Title - colored to match folder */}
        <h3 
          className="text-base font-semibold mb-0.5"
          style={{ color: colors.hex }}
        >
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-[var(--fg-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>
    </motion.button>
  );
}

