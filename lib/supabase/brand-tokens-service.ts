/**
 * Supabase service for brand design tokens export
 * 
 * Generates design tokens from brand_colors and brand_assets (fonts).
 * Exports tokens in multiple formats: JSON, CSS variables, Tailwind config.
 */

import { getColorsByBrand, hexToRgb, hexToHsl } from './brand-colors-service';
import { getFontsByBrand } from './brand-fonts-service';
import type {
  BrandColor,
  BrandFont,
  BrandFontMetadata,
} from './types';

// ============================================
// TOKEN TYPES
// ============================================

export interface ColorToken {
  name: string;
  slug: string;
  hex: string;
  rgb: string;
  hsl?: string;
  cssVariable: string;
  tailwindClass: string;
  group: string;
  role?: string;
  description?: string;
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  cssVariable: string;
  tailwindClass: string;
  weights: string[];
  usage?: string;
}

export interface SpacingToken {
  name: string;
  value: string;
  cssVariable: string;
  tailwindClass: string;
}

export interface RadiusToken {
  name: string;
  value: string;
  cssVariable: string;
  tailwindClass: string;
}

export interface ShadowToken {
  name: string;
  value: string;
  cssVariable: string;
  tailwindClass: string;
}

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  radius: RadiusToken[];
  shadows: ShadowToken[];
  metadata: {
    brandId: string;
    brandName?: string;
    generatedAt: string;
    version: string;
  };
}

// ============================================
// DEFAULT TOKENS (non-database values)
// ============================================

const DEFAULT_SPACING: SpacingToken[] = [
  { name: 'xs', value: '4px', cssVariable: '--spacing-xs', tailwindClass: 'spacing-xs' },
  { name: 'sm', value: '8px', cssVariable: '--spacing-sm', tailwindClass: 'spacing-sm' },
  { name: 'md', value: '16px', cssVariable: '--spacing-md', tailwindClass: 'spacing-md' },
  { name: 'lg', value: '24px', cssVariable: '--spacing-lg', tailwindClass: 'spacing-lg' },
  { name: 'xl', value: '32px', cssVariable: '--spacing-xl', tailwindClass: 'spacing-xl' },
  { name: '2xl', value: '48px', cssVariable: '--spacing-2xl', tailwindClass: 'spacing-2xl' },
  { name: '3xl', value: '64px', cssVariable: '--spacing-3xl', tailwindClass: 'spacing-3xl' },
];

const DEFAULT_RADIUS: RadiusToken[] = [
  { name: 'none', value: '0', cssVariable: '--radius-none', tailwindClass: 'rounded-none' },
  { name: 'sm', value: '4px', cssVariable: '--radius-sm', tailwindClass: 'rounded-sm' },
  { name: 'md', value: '8px', cssVariable: '--radius-md', tailwindClass: 'rounded-md' },
  { name: 'brand', value: '12px', cssVariable: '--radius-brand', tailwindClass: 'rounded-brand' },
  { name: 'brand-lg', value: '16px', cssVariable: '--radius-brand-lg', tailwindClass: 'rounded-brand-lg' },
  { name: 'xl', value: '24px', cssVariable: '--radius-xl', tailwindClass: 'rounded-xl' },
  { name: 'full', value: '9999px', cssVariable: '--radius-full', tailwindClass: 'rounded-full' },
];

const DEFAULT_SHADOWS: ShadowToken[] = [
  { name: 'sm', value: '0 1px 2px rgba(0,0,0,0.05)', cssVariable: '--shadow-sm', tailwindClass: 'shadow-sm' },
  { name: 'md', value: '0 4px 6px -1px rgba(0,0,0,0.1)', cssVariable: '--shadow-md', tailwindClass: 'shadow-md' },
  { name: 'brand', value: '0 2px 8px rgba(0,0,0,0.1)', cssVariable: '--shadow-brand', tailwindClass: 'shadow-brand' },
  { name: 'brand-lg', value: '0 4px 16px rgba(0,0,0,0.15)', cssVariable: '--shadow-brand-lg', tailwindClass: 'shadow-brand-lg' },
  { name: 'xl', value: '0 20px 25px -5px rgba(0,0,0,0.1)', cssVariable: '--shadow-xl', tailwindClass: 'shadow-xl' },
];

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate all design tokens for a brand
 */
export async function generateDesignTokens(
  brandId: string,
  brandName?: string
): Promise<DesignTokens> {
  // Fetch colors and fonts from Supabase
  const [colors, fonts] = await Promise.all([
    getColorsByBrand(brandId).catch(() => []),
    getFontsByBrand(brandId).catch(() => []),
  ]);

  // Transform to tokens
  const colorTokens = colors.map(colorToToken);
  const typographyTokens = fontsToTypographyTokens(fonts);

  return {
    colors: colorTokens,
    typography: typographyTokens,
    spacing: DEFAULT_SPACING,
    radius: DEFAULT_RADIUS,
    shadows: DEFAULT_SHADOWS,
    metadata: {
      brandId,
      brandName,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

/**
 * Convert a BrandColor to a ColorToken
 */
function colorToToken(color: BrandColor): ColorToken {
  return {
    name: color.name,
    slug: color.slug,
    hex: color.hexValue,
    rgb: color.rgbValue || hexToRgb(color.hexValue),
    hsl: color.hslValue || hexToHsl(color.hexValue),
    cssVariable: color.cssVariableName || `--color-${color.slug}`,
    tailwindClass: `${color.colorGroup === 'brand' ? 'brand' : color.slug}`,
    group: color.colorGroup,
    role: color.colorRole,
    description: color.description,
  };
}

/**
 * Convert BrandFonts to TypographyTokens
 */
function fontsToTypographyTokens(fonts: BrandFont[]): TypographyToken[] {
  // Group fonts by family
  const families = new Map<string, BrandFont[]>();
  
  fonts.forEach(font => {
    const meta = font.metadata as BrandFontMetadata;
    const family = meta.fontFamily || font.name;
    
    if (!families.has(family)) {
      families.set(family, []);
    }
    families.get(family)!.push(font);
  });

  // Create tokens for each family
  const tokens: TypographyToken[] = [];
  
  families.forEach((familyFonts, familyName) => {
    const meta = familyFonts[0]?.metadata as BrandFontMetadata;
    const slug = familyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    tokens.push({
      name: familyName,
      fontFamily: familyName,
      cssVariable: `--font-${slug}`,
      tailwindClass: `font-${meta.usage || 'sans'}`,
      weights: familyFonts.map(f => (f.metadata as BrandFontMetadata).fontWeight || '400'),
      usage: meta.usage,
    });
  });

  // Add default system fonts if no fonts in database
  if (tokens.length === 0) {
    tokens.push(
      {
        name: 'Neue Haas Grotesk Display Pro',
        fontFamily: 'Neue Haas Grotesk Display Pro',
        cssVariable: '--font-display',
        tailwindClass: 'font-display',
        weights: ['500', '600', '700'],
        usage: 'display',
      },
      {
        name: 'Neue Haas Grotesk Text Pro',
        fontFamily: 'Neue Haas Grotesk Text Pro',
        cssVariable: '--font-sans',
        tailwindClass: 'font-sans',
        weights: ['400', '500'],
        usage: 'body',
      },
      {
        name: 'OffBit',
        fontFamily: 'OffBit',
        cssVariable: '--font-mono',
        tailwindClass: 'font-mono',
        weights: ['400', '700'],
        usage: 'accent',
      }
    );
  }

  return tokens;
}

// ============================================
// EXPORT FORMATS
// ============================================

/**
 * Export tokens as JSON
 */
export function exportTokensAsJson(tokens: DesignTokens): string {
  return JSON.stringify(tokens, null, 2);
}

/**
 * Export tokens as CSS variables
 */
export function exportTokensAsCss(tokens: DesignTokens): string {
  const lines: string[] = [
    '/* Brand Design Tokens - Auto-generated */',
    `/* Generated: ${tokens.metadata.generatedAt} */`,
    '',
    ':root {',
  ];

  // Colors
  lines.push('  /* Colors */');
  tokens.colors.forEach(color => {
    lines.push(`  ${color.cssVariable}: ${color.hex};`);
  });

  lines.push('');

  // Typography
  lines.push('  /* Typography */');
  tokens.typography.forEach(font => {
    lines.push(`  ${font.cssVariable}: "${font.fontFamily}", sans-serif;`);
  });

  lines.push('');

  // Spacing
  lines.push('  /* Spacing */');
  tokens.spacing.forEach(spacing => {
    lines.push(`  ${spacing.cssVariable}: ${spacing.value};`);
  });

  lines.push('');

  // Radius
  lines.push('  /* Border Radius */');
  tokens.radius.forEach(radius => {
    lines.push(`  ${radius.cssVariable}: ${radius.value};`);
  });

  lines.push('');

  // Shadows
  lines.push('  /* Shadows */');
  tokens.shadows.forEach(shadow => {
    lines.push(`  ${shadow.cssVariable}: ${shadow.value};`);
  });

  lines.push('}');

  return lines.join('\n');
}

/**
 * Export tokens as Tailwind config extension
 */
export function exportTokensAsTailwind(tokens: DesignTokens): string {
  const config = {
    theme: {
      extend: {
        colors: {} as Record<string, string>,
        fontFamily: {} as Record<string, string[]>,
        spacing: {} as Record<string, string>,
        borderRadius: {} as Record<string, string>,
        boxShadow: {} as Record<string, string>,
      },
    },
  };

  // Colors - group by color group
  const brandColors: Record<string, string> = {};
  const monoColors: Record<string, string> = {};
  
  tokens.colors.forEach(color => {
    if (color.group === 'brand') {
      brandColors[color.slug] = color.hex;
    } else if (color.group === 'mono-scale') {
      monoColors[color.slug] = color.hex;
    } else {
      config.theme.extend.colors[color.slug] = color.hex;
    }
  });

  if (Object.keys(brandColors).length > 0) {
    config.theme.extend.colors['brand'] = brandColors as unknown as string;
  }
  if (Object.keys(monoColors).length > 0) {
    config.theme.extend.colors['mono'] = monoColors as unknown as string;
  }

  // Typography
  tokens.typography.forEach(font => {
    const key = font.usage || font.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    config.theme.extend.fontFamily[key] = [font.fontFamily, 'sans-serif'];
  });

  // Spacing
  tokens.spacing.forEach(spacing => {
    config.theme.extend.spacing[spacing.name] = spacing.value;
  });

  // Radius
  tokens.radius.forEach(radius => {
    config.theme.extend.borderRadius[radius.name] = radius.value;
  });

  // Shadows
  tokens.shadows.forEach(shadow => {
    config.theme.extend.boxShadow[shadow.name] = shadow.value;
  });

  return `// Tailwind Config Extension - Auto-generated
// Generated: ${tokens.metadata.generatedAt}

module.exports = ${JSON.stringify(config, null, 2)};`;
}

/**
 * Export tokens for AI/MCP context
 */
export function exportTokensForAI(tokens: DesignTokens): string {
  const lines: string[] = [
    '# Brand Design Tokens',
    '',
    `Generated: ${tokens.metadata.generatedAt}`,
    '',
    '## Colors',
    '',
  ];

  // Group colors
  const brandColors = tokens.colors.filter(c => c.group === 'brand');
  const monoColors = tokens.colors.filter(c => c.group === 'mono-scale');
  const otherColors = tokens.colors.filter(c => !['brand', 'mono-scale'].includes(c.group));

  if (brandColors.length > 0) {
    lines.push('### Brand Colors');
    brandColors.forEach(color => {
      lines.push(`- **${color.name}**: ${color.hex} (${color.role || 'general'})`);
      if (color.description) {
        lines.push(`  - ${color.description}`);
      }
    });
    lines.push('');
  }

  if (monoColors.length > 0) {
    lines.push('### Grayscale');
    monoColors.forEach(color => {
      lines.push(`- **${color.name}**: ${color.hex}`);
    });
    lines.push('');
  }

  if (otherColors.length > 0) {
    lines.push('### Additional Colors');
    otherColors.forEach(color => {
      lines.push(`- **${color.name}**: ${color.hex}`);
    });
    lines.push('');
  }

  lines.push('## Typography');
  lines.push('');
  tokens.typography.forEach(font => {
    lines.push(`### ${font.name}`);
    lines.push(`- Family: ${font.fontFamily}`);
    lines.push(`- Weights: ${font.weights.join(', ')}`);
    lines.push(`- Usage: ${font.usage || 'general'}`);
    lines.push('');
  });

  lines.push('## Spacing Scale');
  lines.push('');
  tokens.spacing.forEach(spacing => {
    lines.push(`- ${spacing.name}: ${spacing.value}`);
  });
  lines.push('');

  lines.push('## Border Radius');
  lines.push('');
  tokens.radius.forEach(radius => {
    lines.push(`- ${radius.name}: ${radius.value}`);
  });
  lines.push('');

  lines.push('## Shadows');
  lines.push('');
  tokens.shadows.forEach(shadow => {
    lines.push(`- ${shadow.name}: ${shadow.value}`);
  });

  return lines.join('\n');
}

// ============================================
// DOWNLOAD HELPERS
// ============================================

/**
 * Create a downloadable tokens package
 */
export async function createTokensPackage(
  brandId: string,
  brandName?: string
): Promise<{
  json: string;
  css: string;
  tailwind: string;
  aiContext: string;
}> {
  const tokens = await generateDesignTokens(brandId, brandName);

  return {
    json: exportTokensAsJson(tokens),
    css: exportTokensAsCss(tokens),
    tailwind: exportTokensAsTailwind(tokens),
    aiContext: exportTokensForAI(tokens),
  };
}

