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
      className="group relative w-full h-full rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 cursor-pointer text-left transition-all duration-300 hover:border-[var(--border-brand)] hover:shadow-lg hover:shadow-black/10"
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Folder Container - Text on TOP, Icon on BOTTOM */}
      <div className="flex flex-col h-full">
        {/* Text Content - TOP */}
        <div className="mb-3">
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

        {/* Spacer to push folder to bottom */}
        <div className="flex-1" />

        {/* 3D Folder - BOTTOM - square container to match icons */}
        <div 
          className="relative w-10 h-10"
          style={{ perspective: '1000px' }}
        >
          {/* Folder positioned to fit within square including tab */}
          <div className="absolute bottom-0 left-0 right-0 h-8">
            {/* Back Panel */}
            <motion.div
              className="absolute inset-0 rounded-md"
              style={{
                background: colors.dark,
                transformStyle: 'preserve-3d',
              }}
            />

            {/* Folder Tab - positioned above the folder body */}
            <motion.div
              className="absolute -top-1.5 left-1 w-4 h-1.5 rounded-t-sm"
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

            {/* Single icon that pops out on hover */}
            <AnimatePresence>
              {isHovered && (
                <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                  <motion.div
                    initial={{ y: 6, opacity: 0, scale: 0.8 }}
                    animate={{ y: -4, opacity: 1, scale: 1 }}
                    exit={{ y: 6, opacity: 0, scale: 0.8 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="w-4 h-4 rounded-sm shadow-lg bg-white flex items-center justify-center p-0.5"
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
        </div>
      </div>
    </motion.button>
  );
}
