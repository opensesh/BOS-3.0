'use client';

import { motion } from 'framer-motion';

export function WelcomeHeader() {
  return (
    <motion.div 
      className="w-full px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left-aligned greeting */}
      <div>
        <h1 
          className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Hello, user
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-[var(--fg-tertiary)] font-medium mt-0.5">
          How can I help you today?
        </p>
      </div>
    </motion.div>
  );
}
