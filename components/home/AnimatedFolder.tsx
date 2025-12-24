'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AnimatedFolderProps {
  title: string;
  subtitle?: string;
  href: string;
  previewImages?: string[];
  color?: 'aperol' | 'blue' | 'green' | 'purple';
}

const colorVariants = {
  aperol: {
    main: 'var(--color-brand-500)',
    light: 'var(--color-brand-400)',
    dark: 'var(--color-brand-600)',
  },
  blue: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  green: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  purple: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
  },
};

export function AnimatedFolder({
  title,
  subtitle,
  href,
  previewImages = [],
  color = 'aperol',
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
      className="group relative w-full rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 cursor-pointer text-left transition-all duration-300 hover:border-[var(--border-brand)] hover:shadow-lg"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Folder Container */}
      <div className="flex flex-col items-center">
        {/* 3D Folder */}
        <div 
          className="relative w-32 h-24 mb-4"
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
            className="absolute -top-2 left-4 w-12 h-4 rounded-t-md"
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

          {/* Preview Images that pop out */}
          <AnimatePresence>
            {isHovered && previewImages.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 overflow-visible">
                {previewImages.slice(0, 3).map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0, scale: 0.8 }}
                    animate={{ 
                      y: -10 - (index * 5), 
                      opacity: 1, 
                      scale: 1,
                      rotate: (index - 1) * 5,
                    }}
                    exit={{ y: 20, opacity: 0, scale: 0.8 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="w-8 h-8 rounded-md shadow-lg overflow-hidden border border-white/20"
                    style={{
                      zIndex: 10 + index,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Fallback icons when no images */}
          <AnimatePresence>
            {isHovered && previewImages.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 overflow-visible">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0, scale: 0.8 }}
                    animate={{ 
                      y: -10 - (index * 5), 
                      opacity: 1, 
                      scale: 1,
                      rotate: (index - 1) * 8,
                    }}
                    exit={{ y: 20, opacity: 0, scale: 0.8 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="w-7 h-7 rounded-md shadow-lg bg-white/90 flex items-center justify-center"
                    style={{
                      zIndex: 10 + index,
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ background: colors.main }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-[var(--fg-tertiary)]">
            {subtitle}
          </p>
        )}

        {/* Hover hint */}
        <motion.p 
          className="text-xs text-[var(--fg-quaternary)] mt-2"
          animate={{ opacity: isHovered ? 0 : 0.7 }}
        >
          Hover to explore
        </motion.p>
      </div>
    </motion.button>
  );
}

