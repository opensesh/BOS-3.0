'use client';

import { motion } from 'framer-motion';

export function WelcomeHeader() {
  return (
    <div className="w-full px-4">
      {/* Left-aligned greeting with unified styling */}
      <div className="space-y-1">
        <motion.h1 
          className="text-2xl sm:text-3xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Hello, user
        </motion.h1>
        <motion.p 
          className="text-xl sm:text-2xl text-[var(--fg-secondary)] font-medium"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          How can I help you today?
        </motion.p>
      </div>
    </div>
  );
}
