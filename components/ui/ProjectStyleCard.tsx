'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, type LucideIcon } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface ProjectStyleCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconLabel: string;
  lastUpdated?: string | null;
  minHeight?: string;
}

/**
 * Compact card with icon-first hierarchy
 * - Large icon at top-left (40x40 container)
 * - Title below icon
 * - Description (1-2 lines)
 * - Timestamp chip at bottom
 * - Hover: border changes to Aperol, text stays consistent
 */
export function ProjectStyleCard({
  href,
  title,
  description,
  icon: Icon,
  lastUpdated,
  minHeight,
}: ProjectStyleCardProps) {
  return (
    <motion.div
      className="h-full"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={href}
        className="group relative h-full flex flex-col p-4 gap-3 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/60 hover:border-[var(--border-brand)] transition-all duration-150"
        style={minHeight ? { minHeight } : undefined}
      >
        {/* Row 1: Icon container (top-left) */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] transition-colors">
            <Icon className="w-5 h-5 text-[var(--fg-secondary)]" />
          </div>
          <ArrowRight className="w4 h-4 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0 group-hover:translate-x-0.5" />
        </div>

        {/* Row 2: Title */}
        <h3 className="text-lg font-accent font-bold text-[var(--fg-primary)]">
          {title}
        </h3>

        {/* Row 3: Description */}
        <p className="text-sm text-[var(--fg-tertiary)] line-clamp-2 flex-1">
          {description}
        </p>

        {/* Row 4: Timestamp chip - always render with fallback */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] w-fit mt-auto">
          <Clock className="w-3 h-3" />
          <span className="text-xs">
            {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : 'Not yet updated'}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default ProjectStyleCard;
