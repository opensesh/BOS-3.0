'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackgroundContextOptional, type AnimationPhase } from '@/lib/background-context';

interface BackgroundGradientProps {
  fadeOut?: boolean;
}

// Animation easing curves
const EASING = {
  smooth: [0.16, 1, 0.3, 1],
  expo: [0.22, 1, 0.36, 1],
  easeIn: [0.4, 0, 1, 1],
};

export function BackgroundGradient({ fadeOut = false }: BackgroundGradientProps) {
  const { resolvedTheme } = useTheme();
  const backgroundContext = useBackgroundContextOptional();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const animationPhase = backgroundContext?.animationPhase ?? 'idle';

  // Derive gradient position and opacity based on animation phase
  const gradientState = useMemo(() => {
    switch (animationPhase) {
      case 'idle':
      case 'reversing':
        return { y: 0, opacity: 1 };
      case 'separating':
        return { y: -30, opacity: 1 }; // Rise slightly
      case 'settled':
        return { y: -50, opacity: 1 }; // Hold higher position
      case 'converging':
        return { y: -20, opacity: 0.8 }; // Start descending
      case 'washing':
        return { y: 50, opacity: 0.5 }; // Slide down
      case 'fading':
        return { y: 100, opacity: 0 }; // Exit bottom
      case 'hidden':
        return { y: 150, opacity: 0 };
      default:
        return { y: 0, opacity: 1 };
    }
  }, [animationPhase]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Fully hidden state
  if (animationPhase === 'hidden' || fadeOut) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 lg:left-[var(--sidebar-width)] z-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Plus pattern - sits BEHIND the gradient (rendered first) */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            maskImage: 'linear-gradient(to bottom, transparent, black, transparent)',
          }}
        />

        {/* Radial Gradient - U-shape emanating from bottom */}
        <motion.div
          className="absolute inset-x-0 h-[80vh]"
          style={{ bottom: 0 }}
          initial={false}
          animate={{
            y: gradientState.y,
            opacity: gradientState.opacity,
          }}
          transition={{
            duration: 0.8,
            ease: EASING.smooth,
          }}
        >
          <div
            className="w-full h-full"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(254, 81, 2, 0.10) 0%, rgba(254, 81, 2, 0.03) 45%, transparent 70%)'
                : 'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(254, 81, 2, 0.15) 0%, rgba(254, 81, 2, 0.05) 45%, transparent 70%)',
            }}
          />
        </motion.div>

        {/* Vignette Effect - soft edge fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at center, transparent 40%, rgba(25,25,25,0.3) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(250,248,245,0.3) 100%)',
          }}
        />

        {/* Phase-based fade overlay for smooth exits */}
        <motion.div
          className="absolute inset-0 bg-[var(--bg-primary)]"
          initial={{ opacity: 0 }}
          animate={{
            opacity: animationPhase === 'fading' ? 1 : 0,
          }}
          transition={{
            duration: 0.5,
            ease: EASING.easeIn,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
