'use client';

import { useState, type FC, type SVGProps } from 'react';
import { motion } from 'framer-motion';

interface IconHover3DProps {
  icon: FC<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  onClick?: () => void;
}

export function IconHover3D({
  icon: Icon,
  title,
  description,
  onClick,
}: IconHover3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full h-full rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 cursor-pointer text-left transition-colors duration-300 hover:border-[var(--border-brand)]"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col h-full">
        {/* Text Content - TOP */}
        <div className="mb-3">
          {/* Title - vanilla by default, orange on hover */}
          <h3 
            className="text-sm font-semibold mb-0.5 transition-colors duration-300"
            style={{ color: isHovered ? 'var(--color-brand-500)' : 'var(--fg-primary)' }}
          >
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs text-[var(--fg-tertiary)] line-clamp-2">
            {description}
          </p>
        </div>

        {/* Spacer to push icon to bottom */}
        <div className="flex-1" />

        {/* Icon Container - BOTTOM - compact size to match folder */}
        <div className="relative">
          <motion.div
            className="w-10 h-8 rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center"
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
          >
            <Icon 
              className="w-4 h-4 transition-colors duration-300"
              style={{
                stroke: isHovered ? 'var(--color-brand-500)' : 'var(--fg-tertiary)',
                strokeWidth: 1.5,
                fill: 'none',
              }}
            />
          </motion.div>

          {/* Glow effect */}
          <motion.div
            className="absolute -inset-1 rounded-lg blur-md -z-10"
            style={{
              background: 'var(--color-brand-500)',
            }}
            animate={{
              opacity: isHovered ? 0.15 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.button>
  );
}
