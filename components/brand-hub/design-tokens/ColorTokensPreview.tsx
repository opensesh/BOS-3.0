'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface ColorValue {
  value: string;
  description: string;
}

interface ColorTokensPreviewProps {
  colors: {
    brand: Record<string, ColorValue>;
    os: Record<string, ColorValue>;
    semantic: {
      background: { light: string; dark: string };
      foreground: { light: string; dark: string };
      focus: { value: string; description: string };
    };
  };
}

// Helper to determine if text should be light or dark on a color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#191919' : '#FFFFFF';
}

// Copy button component
function CopyButton({ text, className = '' }: { text: string; className?: string }) {
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
      className={`p-1 rounded transition-colors ${className}`}
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

// Brand color swatch component
function BrandColorSwatch({
  name,
  value,
  description
}: {
  name: string;
  value: string;
  description: string;
}) {
  const textColor = getContrastColor(value);
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <motion.div
      className="group relative flex flex-col rounded-xl overflow-hidden border border-[var(--border-secondary)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      {/* Color swatch */}
      <div
        className="h-24 sm:h-28 relative flex items-end p-3"
        style={{ backgroundColor: value }}
      >
        <span
          className="text-lg font-medium"
          style={{ color: textColor }}
        >
          {capitalizedName}
        </span>

        {/* Copy button - appears on hover */}
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: textColor }}
        >
          <CopyButton text={value} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-[var(--bg-secondary)]/50 space-y-1.5">
        <div className="flex items-center justify-between">
          <code className="text-xs font-mono text-[var(--fg-secondary)]">
            {value}
          </code>
          <CopyButton text={value} className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]" />
        </div>
        <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// Semantic token row
function SemanticTokenRow({
  name,
  lightValue,
  darkValue,
  index
}: {
  name: string;
  lightValue: string;
  darkValue: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
    >
      {/* Variable name */}
      <span className="flex-1 text-sm font-mono text-[var(--fg-secondary)]">
        --{name}
      </span>

      {/* Light mode swatch */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md border border-[var(--border-secondary)] shadow-sm"
          style={{ backgroundColor: lightValue }}
          title={`Light: ${lightValue}`}
        />
        <span className="text-xs text-[var(--fg-tertiary)] w-16 font-mono hidden sm:block">
          {lightValue}
        </span>
      </div>

      {/* Dark mode swatch */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md border border-[var(--border-secondary)] shadow-sm"
          style={{ backgroundColor: darkValue }}
          title={`Dark: ${darkValue}`}
        />
        <span className="text-xs text-[var(--fg-tertiary)] w-16 font-mono hidden sm:block">
          {darkValue}
        </span>
      </div>

      {/* Copy */}
      <CopyButton
        text={`--${name}`}
        className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
}

// OS palette color chip
function OSColorChip({
  name,
  value,
  index
}: {
  name: string;
  value: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
    >
      <div
        className="w-5 h-5 rounded-md border border-[var(--border-secondary)] shadow-sm shrink-0"
        style={{ backgroundColor: value }}
      />
      <span className="text-xs font-mono text-[var(--fg-tertiary)] truncate">
        {name}
      </span>
      <CopyButton
        text={value}
        className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
      />
    </motion.div>
  );
}

/**
 * ColorTokensPreview
 *
 * Displays brand colors, OS palette, and semantic tokens with
 * visual swatches and copy-to-clipboard functionality.
 */
export function ColorTokensPreview({ colors }: ColorTokensPreviewProps) {
  const brandColors = Object.entries(colors.brand);
  const osColors = Object.entries(colors.os);

  // Build semantic pairs for light/dark display
  const semanticPairs = [
    { name: 'background', light: colors.semantic.background.light, dark: colors.semantic.background.dark },
    { name: 'foreground', light: colors.semantic.foreground.light, dark: colors.semantic.foreground.dark },
  ];

  return (
    <div className="space-y-6">
      {/* Brand Colors */}
      <div>
        <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-3">
          Brand Colors
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {brandColors.map(([name, color]) => (
            <BrandColorSwatch
              key={name}
              name={name}
              value={color.value}
              description={color.description}
            />
          ))}
        </div>
      </div>

      {/* Semantic Tokens */}
      <div>
        <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-3">
          Semantic Tokens
        </h4>
        <div className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 py-2 px-3 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50">
            <span className="flex-1 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
              Variable
            </span>
            <span className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider w-24 sm:w-28 text-center">
              Light
            </span>
            <span className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider w-24 sm:w-28 text-center">
              Dark
            </span>
            <span className="w-6" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border-primary)]/20">
            {semanticPairs.map((pair, index) => (
              <SemanticTokenRow
                key={pair.name}
                name={pair.name}
                lightValue={pair.light}
                darkValue={pair.dark}
                index={index}
              />
            ))}
          </div>

          {/* Focus color */}
          <div className="flex items-center gap-3 py-2 px-3 border-t border-[var(--border-secondary)]">
            <span className="flex-1 text-sm font-mono text-[var(--fg-secondary)]">
              --focus
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md border border-[var(--border-secondary)] shadow-sm"
                style={{ backgroundColor: colors.semantic.focus.value }}
              />
              <span className="text-xs text-[var(--fg-tertiary)] font-mono">
                {colors.semantic.focus.value}
              </span>
            </div>
            <CopyButton
              text={colors.semantic.focus.value}
              className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
            />
          </div>
        </div>
      </div>

      {/* OS Palette */}
      <div>
        <h4 className="text-sm font-medium text-[var(--fg-secondary)] mb-3">
          OS Palette
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30">
          {osColors.map(([name, color], index) => (
            <OSColorChip
              key={name}
              name={name}
              value={color.value}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
