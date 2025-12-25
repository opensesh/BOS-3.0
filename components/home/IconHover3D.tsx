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
      className="group relative w-full h-full rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-3 cursor-pointer text-left transition-colors duration-300 hover:border-[var(--border-brand)]"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col">
        {/* Icon Container - same size as folder (40x40) */}
        <div className="relative mb-2">
          <motion.div
            className="w-10 h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center"
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
              className="w-5 h-5 transition-colors duration-300"
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
    </motion.button>
  );
}

