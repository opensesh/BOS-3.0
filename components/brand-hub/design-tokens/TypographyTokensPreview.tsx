'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface FontFamily {
  value: string;
  fallback: string[];
  description: string;
}

interface HierarchyItem {
  fontFamily: string;
  fontWeight: number;
  fontSize: string;
  lineHeight: number;
  note?: string;
}

interface TypographyTokensPreviewProps {
  typography: {
    fontFamilies: Record<string, FontFamily>;
    fontWeights: Record<string, number>;
    hierarchy: Record<string, HierarchyItem>;
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
      className="p-1 rounded text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Copy ${text}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </motion.button>
  );
}

// Font family preview card
function FontFamilyCard({
  name,
  family,
  index
}: {
  name: string;
  family: FontFamily;
  index: number;
}) {
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const isAccent = name === 'mono' || name === 'accent';

  // Map family name to CSS font-family
  const fontFamilyCSS = family.value === 'Offbit'
    ? 'var(--font-accent)'
    : family.value === 'Neue Haas Grotesk Display Pro'
      ? 'var(--font-display)'
      : 'inherit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30 overflow-hidden"
    >
      {/* Preview area */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Header with name and badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-medium text-[var(--fg-primary)]">
              {family.value}
            </h4>
            <p className="text-xs text-[var(--fg-tertiary)] mt-0.5">
              {family.description}
            </p>
          </div>
          {isAccent && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-amber-400 bg-amber-500/10 rounded-full shrink-0">
              Max 2 per viewport
            </span>
          )}
        </div>

        {/* Live preview */}
        <div
          className="min-h-[60px] p-3 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-secondary)]/50"
          style={{ fontFamily: fontFamilyCSS }}
        >
          <textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full bg-transparent text-lg text-[var(--fg-primary)] resize-none outline-none leading-relaxed"
            rows={2}
            placeholder="Type to preview..."
          />
        </div>

        {/* Font info */}
        <div className="flex flex-wrap gap-4 text-xs text-[var(--fg-tertiary)]">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--fg-quaternary)]">Family:</span>
            <code className="font-mono">{family.value}</code>
            <CopyButton text={family.value} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--fg-quaternary)]">Fallback:</span>
            <code className="font-mono">{family.fallback.slice(0, 2).join(', ')}</code>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Type scale row
function TypeScaleRow({
  name,
  item,
  fontFamilies,
  index
}: {
  name: string;
  item: HierarchyItem;
  fontFamilies: Record<string, FontFamily>;
  index: number;
}) {
  // Get the actual font family name
  const fontFamilyName = fontFamilies[item.fontFamily]?.value || item.fontFamily;

  // Determine font-family CSS
  const fontFamilyCSS = item.fontFamily === 'mono' || item.fontFamily === 'accent'
    ? 'var(--font-accent)'
    : 'var(--font-display)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex items-center gap-4 py-3 px-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
    >
      {/* Sample text */}
      <div
        className="w-24 sm:w-32 shrink-0"
        style={{
          fontFamily: fontFamilyCSS,
          fontSize: item.fontSize,
          fontWeight: item.fontWeight,
          lineHeight: item.lineHeight,
        }}
      >
        <span className="text-[var(--fg-primary)]">Aa</span>
      </div>

      {/* Scale name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-[var(--fg-secondary)]">{name}</code>
          {item.note && (
            <span className="text-[10px] text-amber-400 hidden sm:inline">
              {item.note}
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--fg-tertiary)]">
          {fontFamilyName}
        </span>
      </div>

      {/* Properties */}
      <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-[var(--fg-tertiary)]">
        <span className="w-16">{item.fontSize}</span>
        <span className="w-10">{item.fontWeight}</span>
        <span className="w-10">{item.lineHeight}</span>
      </div>

      {/* Copy */}
      <CopyButton text={name} />
    </motion.div>
  );
}

/**
 * TypographyTokensPreview
 *
 * Displays font families with live previews and a type scale table
 * showing all hierarchy levels with their properties.
 */
export function TypographyTokensPreview({ typography }: TypographyTokensPreviewProps) {
  // Get unique font families (display and accent only)
  const primaryFamilies = ['display', 'mono'].map(key => ({
    key,
    family: typography.fontFamilies[key]
  })).filter(f => f.family);

  // Get hierarchy items
  const hierarchyItems = Object.entries(typography.hierarchy);

  return (
    <div className="space-y-6">
      {/* Font Families */}
      <div>
        <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-3">
          Font Families
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {primaryFamilies.map((item, index) => (
            <FontFamilyCard
              key={item.key}
              name={item.key}
              family={item.family}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Type Scale */}
      <div>
        <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-3">
          Type Scale
        </h4>
        <div className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30 overflow-hidden">
          {/* Header */}
          <div className="hidden sm:flex items-center gap-4 py-2 px-4 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50">
            <span className="w-24 sm:w-32 shrink-0 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              Sample
            </span>
            <span className="flex-1 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              Token
            </span>
            <span className="w-16 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              Size
            </span>
            <span className="w-10 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              Weight
            </span>
            <span className="w-10 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              Line
            </span>
            <span className="w-6" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border-primary)]/20">
            {hierarchyItems.map(([name, item], index) => (
              <TypeScaleRow
                key={name}
                name={name}
                item={item}
                fontFamilies={typography.fontFamilies}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-3">
          Font Weights
        </h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(typography.fontWeights).map(([name, weight], index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30 group"
            >
              <span
                className="text-sm text-[var(--fg-primary)]"
                style={{ fontWeight: weight }}
              >
                {name}
              </span>
              <code className="text-xs font-mono text-[var(--fg-tertiary)]">{weight}</code>
              <CopyButton text={String(weight)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
