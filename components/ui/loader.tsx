'use client';

import { motion, AnimatePresence } from 'framer-motion';

export type LoaderVariant = 'terminal' | 'text-blink' | 'loading-dots';

interface LoaderProps {
  variant?: LoaderVariant;
  text?: string;
  className?: string;
}

/**
 * Loader component with multiple variants for loading states
 * Ported from motion-primitives (21st.dev)
 */
export function Loader({ 
  variant = 'loading-dots', 
  text = 'Thinking',
  className = '' 
}: LoaderProps) {
  if (variant === 'terminal') {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <motion.span
          className="inline-block w-[2px] h-4 bg-current"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </span>
    );
  }

  if (variant === 'text-blink') {
    return (
      <motion.span
        className={`inline-block ${className}`}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.span>
    );
  }

  // loading-dots variant (default)
  return (
    <span className={`inline-flex items-center gap-0 ${className}`}>
      <span>{text}</span>
      <span className="inline-flex ml-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          >
            .
          </motion.span>
        ))}
      </span>
    </span>
  );
}

export default Loader;

