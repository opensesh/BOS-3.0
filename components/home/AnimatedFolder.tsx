'use client';

import { useState, type FC, type SVGProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';

interface AnimatedFolderProps {
  title: string;
  subtitle?: string;
  href: string;
  icon?: FC<SVGProps<SVGSVGElement>>;
}

// Aperol color only
const colors = {
  main: 'var(--color-brand-500)',
  light: 'var(--color-brand-400)',
  dark: 'var(--color-brand-600)',
  hex: '#fe5102',
};

export function AnimatedFolder({
  title,
  subtitle,
  href,
  icon: Icon = Download,
}: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full h-full rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-3 cursor-pointer text-left transition-all duration-300 hover:border-[var(--border-brand)]"
      whileTap={{ scale: 0.98 }}
    >
      {/* Folder Container */}
      <div className="flex flex-col">
        {/* 3D Folder - shorter height to match icon containers */}
        <div 
          className="relative w-10 h-8 mb-2"
          style={{ perspective: '1000px' }}
        >
          {/* Back Panel */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: colors.dark,
              transformStyle: 'preserve-3d',
            }}
          />

          {/* Folder Tab */}
          <motion.div
            className="absolute -top-1 left-1 w-4 h-1.5 rounded-t-sm"
            style={{
              background: colors.main,
            }}
          />

          {/* Front Panel (opens on hover) */}
          <motion.div
            className="absolute inset-0 rounded-lg origin-bottom"
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
              className="absolute inset-0 rounded-lg opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
              }}
            />
          </motion.div>

          {/* Single icon that pops out on hover */}
          <AnimatePresence>
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                <motion.div
                  initial={{ y: 10, opacity: 0, scale: 0.8 }}
                  animate={{ y: -8, opacity: 1, scale: 1 }}
                  exit={{ y: 10, opacity: 0, scale: 0.8 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="w-5 h-5 rounded-sm shadow-lg bg-white flex items-center justify-center p-0.5"
                  style={{ zIndex: 10 }}
                >
                  <Icon 
                    className="w-full h-full"
                    style={{ color: colors.hex, strokeWidth: 1.5 }}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Title - vanilla by default, orange on hover */}
        <h3 
          className="text-sm font-semibold mb-0.5 transition-colors duration-300"
          style={{ color: isHovered ? colors.hex : 'var(--fg-primary)' }}
        >
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-[var(--fg-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>
    </motion.button>
  );
}

