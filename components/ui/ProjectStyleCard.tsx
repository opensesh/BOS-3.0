'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface ProjectStyleCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconLabel: string;
  lastUpdated?: string | null;
}

/**
 * Supabase-style project card with text-first hierarchy
 * - Title at top-left (prominent)
 * - Description below
 * - Small icon chip + "Updated X ago" at bottom
 * - Arrow appears on hover (right side)
 */
export function ProjectStyleCard({
  href,
  title,
  description,
  icon: Icon,
  iconLabel,
  lastUpdated,
}: ProjectStyleCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={href}
        className="group relative h-full flex flex-col p-5 gap-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/60 transition-all duration-200"
      >
        {/* Row 1: Title + Hover Arrow */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-accent font-bold text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors">
            {title}
          </h3>
          <ArrowRight className="w-4 h-4 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-1.5 group-hover:translate-x-0.5" />
        </div>

        {/* Row 2: Description */}
        <p className="text-base text-[var(--fg-tertiary)] line-clamp-2 flex-1">
          {description}
        </p>

        {/* Row 3: Icon chip + Last updated */}
        <div className="flex items-center gap-3 mt-auto">
          {/* Icon chip (small badge) */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{iconLabel}</span>
          </div>

          {/* Last updated timestamp */}
          {lastUpdated && (
            <span className="text-sm text-[var(--fg-quaternary)]">
              Updated {formatRelativeTime(lastUpdated)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default ProjectStyleCard;
