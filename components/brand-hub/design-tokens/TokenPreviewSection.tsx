'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Pencil } from 'lucide-react';

interface TokenPreviewSectionProps {
  /** Section title */
  title: string;
  /** Badge text (e.g., "3 colors") */
  badge?: string;
  /** Whether section starts expanded */
  defaultExpanded?: boolean;
  /** Section content */
  children: React.ReactNode;
  /** Optional edit callback */
  onEdit?: () => void;
}

/**
 * TokenPreviewSection
 *
 * A collapsible accordion section for displaying design token previews.
 * Features smooth Framer Motion animations and accessible ARIA attributes.
 */
export function TokenPreviewSection({
  title,
  badge,
  defaultExpanded = false,
  children,
  onEdit,
}: TokenPreviewSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sectionId = `token-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={sectionId}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-secondary)]/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-medium text-[var(--fg-primary)]">
            {title}
          </h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium text-[var(--fg-tertiary)] bg-[var(--bg-tertiary)]/50 rounded-full">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit button - appears on hover */}
          {onEdit && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Edit ${title}`}
            >
              <Pencil className="w-4 h-4" />
            </motion.button>
          )}

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[var(--fg-tertiary)]" />
          </motion.div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={sectionId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.2 }
            }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-[var(--border-secondary)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
