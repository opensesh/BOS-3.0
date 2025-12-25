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
      className="group relative w-full h-full rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 cursor-pointer text-left transition-colors duration-300 hover:border-[var(--border-brand)]"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {/* Icon Container */}
        <div className="relative flex-shrink-0">
          <motion.div
            className="w-12 h-12 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center"
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
              className="w-6 h-6 transition-colors duration-300"
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

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-0.5">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-[var(--fg-tertiary)] line-clamp-2">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <motion.div
          className="flex-shrink-0 self-center"
          animate={{
            x: isHovered ? 3 : 0,
            opacity: isHovered ? 1 : 0.4,
          }}
          transition={{ duration: 0.2 }}
        >
          <svg 
            className="w-4 h-4 text-[var(--fg-tertiary)]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </motion.div>
      </div>
    </motion.button>
  );
}

