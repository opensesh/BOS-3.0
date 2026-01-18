'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Page shown when there's an error processing a short link
 */
export default function LinkErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-display font-bold text-[var(--fg-primary)]">
          Something Went Wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--fg-tertiary)] max-w-xs mx-auto">
          We encountered an error processing this link. Please try again or contact support if the problem persists.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3',
              'text-sm font-medium rounded-lg',
              'bg-[var(--bg-brand-solid)] text-white',
              'hover:bg-[var(--bg-brand-solid-hover)]',
              'transition-colors'
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3',
              'text-sm font-medium rounded-lg',
              'bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]/40',
              'text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]',
              'transition-colors'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
