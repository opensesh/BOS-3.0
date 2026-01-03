'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BrandHubLayout } from '@/components/brand-hub/BrandHubLayout';
import { ColorSettingsModal } from '@/components/brand-hub/ColorSettingsModal';
import { Copy, Check } from 'lucide-react';
import { useBrandColors } from '@/hooks/useBrandColors';

interface ColorData {
  name: string;
  hex: string;
  rgb: string;
  label?: 'Primary' | 'Secondary';
}

interface AperolShade {
  name: string;
  tailwindClass: string;
  cssVar: string;
  hex: string;
}

const brandColors: ColorData[] = [
  { name: 'Primary/Charcoal', hex: '#191919', rgb: 'rgb(25, 25, 25)', label: 'Primary' },
  { name: 'Primary/Vanilla', hex: '#FFFAEE', rgb: 'rgb(255, 250, 238)', label: 'Secondary' },
  { name: 'Secondary/Aperol', hex: '#FE5102', rgb: 'rgb(254, 81, 2)', label: 'Secondary' },
];

const aperolShades: AperolShade[] = [
  { name: 'brand-25', tailwindClass: 'bg-brand-25', cssVar: '--color-brand-25', hex: '#fffaf5' },
  { name: 'brand-50', tailwindClass: 'bg-brand-50', cssVar: '--color-brand-50', hex: '#fff3eb' },
  { name: 'brand-100', tailwindClass: 'bg-brand-100', cssVar: '--color-brand-100', hex: '#ffe4d4' },
  { name: 'brand-200', tailwindClass: 'bg-brand-200', cssVar: '--color-brand-200', hex: '#ffc8a8' },
  { name: 'brand-300', tailwindClass: 'bg-brand-300', cssVar: '--color-brand-300', hex: '#ffa370' },
  { name: 'brand-400', tailwindClass: 'bg-brand-400', cssVar: '--color-brand-400', hex: '#ff7a38' },
  { name: 'brand-500', tailwindClass: 'bg-brand-500', cssVar: '--color-brand-500', hex: '#fe5102' },
  { name: 'brand-600', tailwindClass: 'bg-brand-600', cssVar: '--color-brand-600', hex: '#e64400' },
  { name: 'brand-700', tailwindClass: 'bg-brand-700', cssVar: '--color-brand-700', hex: '#bf3600' },
  { name: 'brand-800', tailwindClass: 'bg-brand-800', cssVar: '--color-brand-800', hex: '#992d05' },
  { name: 'brand-900', tailwindClass: 'bg-brand-900', cssVar: '--color-brand-900', hex: '#7a280a' },
  { name: 'brand-950', tailwindClass: 'bg-brand-950', cssVar: '--color-brand-950', hex: '#431302' },
];

const monoColors: ColorData[] = [
  { name: 'Black', hex: '#000000', rgb: 'rgb(0, 0, 0)' },
  { name: 'Black-90', hex: '#1E1E1E', rgb: 'rgb(30, 30, 30)' },
  { name: 'Black-80', hex: '#383838', rgb: 'rgb(56, 56, 56)' },
  { name: 'Black-70', hex: '#4A4A4A', rgb: 'rgb(74, 74, 74)' },
  { name: 'Black-60', hex: '#595959', rgb: 'rgb(89, 89, 89)' },
  { name: 'Black-50', hex: '#787878', rgb: 'rgb(120, 120, 120)' },
  { name: 'Black-40', hex: '#A3A3A3', rgb: 'rgb(163, 163, 163)' },
  { name: 'Black-30', hex: '#C7C7C7', rgb: 'rgb(199, 199, 199)' },
  { name: 'Black-20', hex: '#DDDEE2', rgb: 'rgb(221, 222, 226)' },
  { name: 'Black-10', hex: '#F0F0F0', rgb: 'rgb(240, 240, 240)' },
  { name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)' },
];

function CopyButton({ text, label, isLight }: { text: string; label: string; isLight?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const iconColor = isLight 
    ? 'text-[var(--color-charcoal)]/50 group-hover:text-[var(--color-charcoal)]' 
    : 'text-[var(--color-vanilla)]/50 group-hover:text-[var(--color-vanilla)]';
  const hoverBg = isLight 
    ? 'hover:bg-[var(--color-charcoal)]/10' 
    : 'hover:bg-[var(--color-vanilla)]/10';

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded-md ${hoverBg} transition-colors group flex-shrink-0`}
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[var(--fg-success-primary)]" />
      ) : (
        <Copy className={`w-3.5 h-3.5 ${iconColor}`} />
      )}
    </button>
  );
}

function BrandColorCard({ color }: { color: ColorData }) {
  const isLight = color.name.includes('Vanilla') || color.hex === '#FFFAEE';
  const textColor = isLight ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-vanilla)]';
  const borderColor = isLight ? 'border-[var(--border-primary)]' : 'border-transparent';

  return (
    <div 
      className={`rounded-xl overflow-hidden border ${borderColor} w-full min-h-[200px] flex flex-col`}
      style={{ backgroundColor: color.hex }}
    >
      {/* Header */}
      <div className={`flex items-start justify-between px-4 pt-4 ${textColor}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-display font-medium">{color.name}</span>
          <CopyButton text={color.name} label="color name" isLight={isLight} />
        </div>
        {color.label && (
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
            isLight 
              ? 'bg-[var(--color-charcoal)]/10 text-[var(--color-charcoal)]' 
              : 'bg-[var(--color-vanilla)]/15 text-[var(--color-vanilla)]'
          }`}>
            {color.label}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Color Values */}
      <div className={`px-4 pb-4 space-y-1.5 ${textColor}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono opacity-90">{color.hex}</span>
          <CopyButton text={color.hex} label={color.hex} isLight={isLight} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono opacity-90">{color.rgb}</span>
          <CopyButton text={color.rgb} label={color.rgb} isLight={isLight} />
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate relative luminance for WCAG contrast
function getLuminance(hex: string): number {
  const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.slice(1).map((x) => {
    const val = parseInt(x, 16) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Helper function to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function AperolShadeCard({ shade }: { shade: AperolShade }) {
  const charcoalContrast = getContrastRatio(shade.hex, '#191919');
  const vanillaContrast = getContrastRatio(shade.hex, '#FFFAEE');
  const isLight = charcoalContrast > vanillaContrast;
  const textColor = isLight ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-vanilla)]';
  const borderColor = isLight ? 'border-[var(--border-primary)]/30' : 'border-transparent';

  return (
    <div 
      className={`rounded-xl overflow-hidden border ${borderColor} min-h-[120px] flex flex-col`}
      style={{ backgroundColor: shade.hex }}
    >
      {/* Header */}
      <div className={`flex items-center gap-1.5 px-3 py-2 ${textColor}`}>
        <span className="text-xs font-display font-medium truncate flex-1">
          {shade.name}
        </span>
        <CopyButton text={shade.tailwindClass} label="Tailwind class" isLight={isLight} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Values */}
      <div className={`px-3 pb-2 space-y-0.5 ${textColor}`}>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono truncate flex-1 opacity-80">
            {shade.hex}
          </span>
          <CopyButton text={shade.hex} label={shade.hex} isLight={isLight} />
        </div>
        <div className="flex items-center gap-1">
          <code className="text-[10px] font-mono truncate flex-1 opacity-80">
            {shade.tailwindClass}
          </code>
          <CopyButton text={shade.tailwindClass} label={shade.tailwindClass} isLight={isLight} />
        </div>
      </div>
    </div>
  );
}

function MonoColorCard({ color }: { color: ColorData }) {
  // Calculate contrast ratios for both text color options
  const charcoalContrast = getContrastRatio(color.hex, '#191919');
  const vanillaContrast = getContrastRatio(color.hex, '#FFFAEE');
  
  // Choose the text color with better contrast
  const isLight = charcoalContrast > vanillaContrast;
  const textColor = isLight ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-vanilla)]';
  const borderColor = isLight ? 'border-[var(--border-primary)]/30' : 'border-transparent';
  
  // Use the better contrast ratio for accessibility check
  const contrastRatio = Math.max(charcoalContrast, vanillaContrast);
  const meetsAA = contrastRatio >= 4.5;
  const meetsAALarge = contrastRatio >= 3;

  return (
    <div 
      className={`rounded-xl overflow-hidden border ${borderColor} min-h-[120px] flex flex-col`}
      style={{ backgroundColor: color.hex }}
    >
      {/* Header */}
      <div className={`flex items-center gap-1.5 px-3 py-2 ${textColor}`}>
        <span className={`text-xs font-display font-medium truncate flex-1 ${!meetsAA && !meetsAALarge ? 'opacity-60' : ''}`}>
          {color.name}
        </span>
        <CopyButton text={color.name} label="color name" isLight={isLight} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Color Values */}
      <div className={`px-3 pb-2 space-y-0.5 ${textColor}`}>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-mono truncate flex-1 ${!meetsAA && !meetsAALarge ? 'opacity-50' : 'opacity-80'}`}>
            {color.hex}
          </span>
          <CopyButton text={color.hex} label={color.hex} isLight={isLight} />
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-mono truncate flex-1 ${!meetsAA && !meetsAALarge ? 'opacity-50' : 'opacity-80'}`}>
            {color.rgb}
          </span>
          <CopyButton text={color.rgb} label={color.rgb} isLight={isLight} />
        </div>
      </div>
    </div>
  );
}

export default function ColorsPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Fetch colors from Supabase (for future dynamic display)
  const { colors, isLoading } = useBrandColors();

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      <BrandHubLayout
        title="Color"
        description="Our color palette balances warmth with professionalism. Vanilla and Charcoal form our primary pair, while Aperol adds energy as an accent."
        onSettingsClick={() => setIsSettingsOpen(true)}
        settingsTooltip="Manage brand colors"
      >
        {/* Brand Colors Section */}
        <section className="mb-12">
          <h2 className="text-lg font-display font-semibold text-[var(--fg-primary)] mb-5">Brand</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {brandColors.map((color) => (
              <BrandColorCard key={color.name} color={color} />
            ))}
          </div>
        </section>

        {/* Mono Scale Section */}
        <section className="mb-12">
          <h2 className="text-lg font-display font-semibold text-[var(--fg-primary)] mb-5">Mono Scale</h2>
          {/* Responsive grid - auto-fit stretches items to fill available space */}
          <div className="grid gap-2" style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))'
          }}>
            {monoColors.map((color) => (
              <MonoColorCard key={color.name} color={color} />
            ))}
          </div>
        </section>

        {/* Brand Scale Section (Aperol) */}
        <section>
          <h2 className="text-lg font-display font-semibold text-[var(--fg-primary)] mb-2">Brand Scale</h2>
          <p className="text-sm text-[var(--fg-secondary)] mb-5">
            Extended brand palette for UI states, backgrounds, and accents. Use Tailwind classes like <code className="text-xs bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded font-mono">bg-brand-500</code> or <code className="text-xs bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded font-mono">text-brand-600</code>.
          </p>
          {/* Responsive grid - auto-fit stretches items to fill available space */}
          <div className="grid gap-2" style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))'
          }}>
            {aperolShades.map((shade) => (
              <AperolShadeCard key={shade.name} shade={shade} />
            ))}
          </div>
        </section>
      </BrandHubLayout>

      {/* Color Settings Modal */}
      <ColorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
