'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

export function WelcomeHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full max-w-3xl px-4 mb-4 sm:mb-6 text-center">
        <div>
          <div className="h-10 mb-1" />
          <div className="h-8" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-3xl px-4 mb-4 sm:mb-6 text-center"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* Centered greeting */}
      <div>
        <h1 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Hello, user
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-[var(--fg-tertiary)] font-medium mt-1">
          How can I help you today?
        </p>
      </div>
    </motion.div>
  );
}
