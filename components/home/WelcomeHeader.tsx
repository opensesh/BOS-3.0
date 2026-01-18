'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Rotating questions for the second line
const rotatingQuestions = [
  "How can I help you today?",
  "What are we building?",
  "What are we making?",
  "What's the plan?",
  "What are we working on?",
  "Where should we start?",
];

export function WelcomeHeader() {
  const [questionIndex, setQuestionIndex] = useState(0);

  // Rotate questions every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuestionIndex((prev) => (prev + 1) % rotatingQuestions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentQuestion = rotatingQuestions[questionIndex];

  return (
    <div className="w-full px-4">
      <div className="space-y-1">
        <h1
          className="text-2xl sm:text-3xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-brand-500) 50%, var(--color-brand-600) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Hello, user
        </h1>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuestion}
            className="text-xl sm:text-2xl text-[var(--fg-secondary)] font-medium"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentQuestion}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
