'use client';

import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Page shown when a short link has expired
 */
export default function LinkExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-display font-bold text-[var(--fg-primary)]">
          Link Expired
        </h1>
        <p className="mt-3 text-sm text-[var(--fg-tertiary)] max-w-xs mx-auto">
          This short link has expired and is no longer available. Please contact the link owner for a new link.
        </p>

        {/* Action */}
        <div className="mt-8">
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
