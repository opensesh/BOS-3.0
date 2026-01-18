'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface SpacingTokensPreviewProps {
  spacing: {
    scale: Record<string, string>;
  };
}

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="p-1 rounded text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors opacity-0 group-hover:opacity-100"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Copy ${text}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </motion.button>
  );
}

// Convert rem to px for display
function remToPx(rem: string): number {
  const value = parseFloat(rem);
  return value * 16;
}

// Spacing bar component
function SpacingBar({
  name,
  value,
  maxValue,
  index
}: {
  name: string;
  value: string;
  maxValue: number;
  index: number;
}) {
  const pxValue = remToPx(value);
  const percentage = maxValue > 0 ? (pxValue / maxValue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
    >
      {/* Token name */}
      <div className="w-10 shrink-0">
        <code className="text-sm font-mono text-[var(--fg-secondary)]">{name}</code>
      </div>

      {/* Visual bar */}
      <div className="flex-1 h-6 bg-[var(--bg-tertiary)]/30 rounded relative overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percentage, 2)}%` }}
          transition={{ duration: 0.5, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
          className="h-full bg-[var(--fg-brand-primary)]/20 rounded relative"
        >
          {/* Inner fill for visual interest */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: index * 0.03 + 0.2 }}
            className="absolute inset-y-0 left-0 w-1 bg-[var(--fg-brand-primary)] rounded-l"
            style={{ originX: 0 }}
          />
        </motion.div>

        {/* Pixel value indicator */}
        {pxValue > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 + 0.3 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--fg-tertiary)]"
          >
            {pxValue}px
          </motion.div>
        )}
      </div>

      {/* Rem value */}
      <div className="w-16 text-right shrink-0">
        <code className="text-xs font-mono text-[var(--fg-tertiary)]">{value}</code>
      </div>

      {/* Copy */}
      <CopyButton text={value} />
    </motion.div>
  );
}

/**
 * SpacingTokensPreview
 *
 * Displays the spacing scale with visual bars representing
 * relative sizes and both rem and px values.
 */
export function SpacingTokensPreview({ spacing }: SpacingTokensPreviewProps) {
  const spacingEntries = Object.entries(spacing.scale);

  // Find max value for scaling bars
  const maxPxValue = Math.max(...spacingEntries.map(([, value]) => remToPx(value)));

  return (
    <div className="space-y-4">
      {/* Scale visualization */}
      <div className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 py-2 px-3 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50">
          <span className="w-10 shrink-0 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
            Token
          </span>
          <span className="flex-1 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
            Scale
          </span>
          <span className="w-16 text-right shrink-0 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
            Value
          </span>
          <span className="w-6" />
        </div>

        {/* Bars */}
        <div className="divide-y divide-[var(--border-primary)]/10">
          {spacingEntries.map(([name, value], index) => (
            <SpacingBar
              key={name}
              name={name}
              value={value}
              maxValue={maxPxValue}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Quick reference chips */}
      <div>
        <h4 className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2">
          Common Values
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { name: '4', label: 'sm', desc: 'Tight spacing' },
            { name: '8', label: 'md', desc: 'Default gap' },
            { name: '12', label: 'lg', desc: 'Section padding' },
            { name: '16', label: 'xl', desc: 'Large sections' },
          ].map((item, index) => {
            const value = spacing.scale[item.name];
            if (!value) return null;

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 group"
              >
                <span className="text-sm font-medium text-[var(--fg-primary)]">
                  {item.label}
                </span>
                <span className="text-xs text-[var(--fg-tertiary)]">
                  {value} ({remToPx(value)}px)
                </span>
                <CopyButton text={value} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Usage note */}
      <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed">
        Use consistent spacing tokens for padding, margins, and gaps. The scale follows a 4px base unit
        with values doubling at key breakpoints for visual rhythm.
      </p>
    </div>
  );
}
