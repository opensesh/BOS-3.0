'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { GrainGradient, type GrainGradientProps } from '@paper-design/shaders-react';
import { useBackgroundContextOptional, type BackgroundState } from '@/lib/background-context';

interface BackgroundGradientProps {
  fadeOut?: boolean;
}

// State configurations per theme
type StateConfig = {
  colors: string[];
  colorBack: string;
  softness: number;
  intensity: number;
  speed: number;
  shape: 'blob' | 'wave' | 'ripple';
  scale: number;
  rotation: number;
  noise: number;
};

const stateConfigs: Record<BackgroundState, { light: StateConfig; dark: StateConfig }> = {
  default: {
    light: {
      colors: ['hsl(14, 100%, 85%)', 'hsl(45, 80%, 90%)'],
      colorBack: '#FAF8F5',
      softness: 0.85,
      intensity: 0.25,
      speed: 0.5,
      shape: 'blob',
      scale: 1.2,
      rotation: 0,
      noise: 0.15,
    },
    dark: {
      colors: ['#FE5102', 'hsl(25, 100%, 35%)'],
      colorBack: '#191919',
      softness: 0.8,
      intensity: 0.3,
      speed: 0.5,
      shape: 'blob',
      scale: 1.2,
      rotation: 0,
      noise: 0.2,
    },
  },
  engage: {
    light: {
      colors: ['#FF7A38', '#FE5102'],
      colorBack: '#FAF8F5',
      softness: 0.6,
      intensity: 0.4,
      speed: 0.3,
      shape: 'wave',
      scale: 1.5,
      rotation: 90,
      noise: 0.1,
    },
    dark: {
      colors: ['#FE5102', 'hsl(20, 100%, 45%)'],
      colorBack: '#191919',
      softness: 0.5,
      intensity: 0.5,
      speed: 0.3,
      shape: 'wave',
      scale: 1.5,
      rotation: 90,
      noise: 0.15,
    },
  },
  transition: {
    light: {
      colors: ['#FE5102', '#FF7A38'],
      colorBack: '#FAF8F5',
      softness: 0.4,
      intensity: 0.5,
      speed: 2,
      shape: 'ripple',
      scale: 1.2,
      rotation: 0,
      noise: 0.05,
    },
    dark: {
      colors: ['#FE5102', 'hsl(25, 100%, 50%)'],
      colorBack: '#191919',
      softness: 0.4,
      intensity: 0.55,
      speed: 2,
      shape: 'ripple',
      scale: 1.2,
      rotation: 0,
      noise: 0.08,
    },
  },
};

// CSS Fallback gradient for when WebGL is unavailable
function CSSFallbackGradient({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 50% 50%, rgba(254,81,2,0.13), transparent 60%)'
          : 'radial-gradient(ellipse at 50% 50%, rgba(254,81,2,0.1), #FAF8F5 80%)',
      }}
    />
  );
}

export function BackgroundGradient({ fadeOut = false }: BackgroundGradientProps) {
  const { resolvedTheme } = useTheme();
  const backgroundContext = useBackgroundContextOptional();
  const [mounted, setMounted] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  // Check WebGL availability on mount
  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      setWebGLAvailable(!!gl);
    } catch {
      setWebGLAvailable(false);
    }
  }, []);

  const isDark = resolvedTheme === 'dark';
  const backgroundState = backgroundContext?.backgroundState ?? 'default';
  const isTransitioning = backgroundContext?.isTransitioning ?? false;

  // Get current config based on state and theme
  const config = useMemo(() => {
    const themeKey = isDark ? 'dark' : 'light';
    return stateConfigs[backgroundState][themeKey];
  }, [backgroundState, isDark]);

  // Shader props with smooth transitions via CSS
  const shaderProps: Partial<GrainGradientProps> = useMemo(() => ({
    colors: config.colors,
    colorBack: config.colorBack,
    softness: config.softness,
    intensity: config.intensity,
    speed: config.speed,
    shape: config.shape,
    scale: config.scale,
    rotation: config.rotation,
    noise: config.noise,
    style: {
      width: '100%',
      height: '100%',
    },
  }), [config]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          className="fixed inset-0 lg:left-[var(--sidebar-width)] z-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Shader Container with pulse animation for transition state */}
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: isTransitioning ? [1, 1.15, 1] : 1,
            }}
            transition={{
              duration: 0.4,
              ease: 'easeInOut',
            }}
          >
            {webGLAvailable ? (
              <GrainGradient {...shaderProps} />
            ) : (
              <CSSFallbackGradient isDark={isDark} />
            )}
          </motion.div>

          {/* Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              maskImage: 'linear-gradient(to bottom, transparent, black, transparent)',
            }}
          />

          {/* Vignette Effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, transparent 40%, rgba(25,25,25,0.4) 100%)'
                : 'radial-gradient(ellipse at center, transparent 40%, rgba(250,248,245,0.3) 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
