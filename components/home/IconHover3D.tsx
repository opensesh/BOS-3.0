'use client';

import { useState, useRef, type FC, type SVGProps } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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
  const cardRef = useRef<HTMLButtonElement>(null);

  // Mouse position for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the tilt
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative w-full rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 cursor-pointer text-left transition-colors duration-300 hover:border-[var(--border-brand)]"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="flex items-start gap-4"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 3D Icon Container */}
        <div className="relative flex-shrink-0">
          {/* Icon with 3D rotation effect */}
          <motion.div
            className="w-16 h-16 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden"
            animate={{
              rotateY: isHovered ? 15 : 0,
              rotateX: isHovered ? -5 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Icon with animated stroke/fill */}
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
            >
              <Icon 
                className="w-8 h-8 transition-colors duration-300"
                style={{
                  stroke: isHovered ? 'var(--color-brand-500)' : 'var(--fg-tertiary)',
                  strokeWidth: 1.5,
                  fill: 'none',
                }}
              />
            </motion.div>

            {/* Shine effect on hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, transparent 100%)',
              }}
              animate={{
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>

          {/* Glow effect */}
          <motion.div
            className="absolute -inset-1 rounded-xl blur-md -z-10"
            style={{
              background: 'var(--color-brand-500)',
            }}
            animate={{
              opacity: isHovered ? 0.2 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Title with fill effect */}
          <div className="relative overflow-hidden mb-1">
            <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
              {title}
            </h3>
            {/* Animated underline */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-[var(--color-brand-500)]"
              initial={{ width: '0%' }}
              animate={{ width: isHovered ? '100%' : '0%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-[var(--fg-tertiary)] line-clamp-2">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <motion.div
          className="flex-shrink-0 self-center"
          animate={{
            x: isHovered ? 4 : 0,
            opacity: isHovered ? 1 : 0.5,
          }}
          transition={{ duration: 0.2 }}
        >
          <svg 
            className="w-5 h-5 text-[var(--fg-tertiary)]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}

