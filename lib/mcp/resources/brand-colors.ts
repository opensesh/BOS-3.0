/**
 * MCP Resource: Brand Colors
 * 
 * Exposes the brand color design system as an MCP resource for consumer LLMs.
 * This resource provides structured access to brand colors, mono scale, and brand scale.
 * 
 * URI Pattern: bos://brand/{brandSlug}/colors
 * 
 * @example
 * // Fetch brand colors for Open Session
 * const colors = await fetchBrandColorsResource('open-session');
 */

import { exportColorsForMcp, hexToRgb, generateCssVariableName } from '@/lib/supabase/brand-colors-service';
import { getBrandBySlug } from '@/lib/supabase/brand-assets-service';

// ============================================
// MCP RESOURCE TYPES
// ============================================

/**
 * Individual color in MCP format
 */
export interface McpBrandColor {
  /** Display name (e.g., "Charcoal") */
  name: string;
  /** HEX value (e.g., "#191919") */
  hex: string;
  /** RGB value (e.g., "rgb(25, 25, 25)") */
  rgb: string;
  /** CSS custom property name (e.g., "--color-charcoal") */
  cssVariable: string;
  /** Recommended text color for this background */
  textColor: 'light' | 'dark';
  /** Semantic role if applicable */
  role: 'primary' | 'secondary' | 'accent' | 'neutral' | null;
  /** Usage guidelines */
  usage: string | null;
}

/**
 * Color group in MCP format
 */
export interface McpColorGroup {
  /** Group display name */
  name: string;
  /** Group description */
  description: string;
  /** Colors in this group */
  colors: McpBrandColor[];
}

/**
 * Complete MCP Brand Colors resource response
 */
export interface McpBrandColorsResource {
  /** Resource metadata */
  meta: {
    uri: string;
    name: string;
    description: string;
    brandSlug: string;
    generatedAt: string;
  };
  /** Primary brand colors (Charcoal, Vanilla, Aperol) */
  brand: McpColorGroup;
  /** Grayscale palette (11 shades from black to white) */
  monoScale: McpColorGroup;
  /** Extended brand color variations */
  brandScale: McpColorGroup;
  /** User-defined custom colors */
  custom: McpColorGroup;
  /** All colors as CSS custom properties */
  cssTokens: Record<string, string>;
  /** Quick reference for common use cases */
  quickReference: {
    primaryLight: string;
    primaryDark: string;
    accent: string;
    backgrounds: string[];
    text: string[];
  };
}

// ============================================
// RESOURCE DEFINITION
// ============================================

/**
 * MCP Resource definition for brand colors
 */
export const brandColorsResourceDefinition = {
  uri: 'bos://brand/{brandSlug}/colors',
  name: 'Brand Color Palette',
  description: 'Access the complete brand color design system including brand colors, mono scale, brand scale, and CSS tokens',
  mimeType: 'application/json',
  
  // JSON Schema for the resource
  schema: {
    type: 'object',
    properties: {
      meta: {
        type: 'object',
        description: 'Resource metadata',
        properties: {
          uri: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          brandSlug: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
        },
      },
      brand: { $ref: '#/definitions/ColorGroup' },
      monoScale: { $ref: '#/definitions/ColorGroup' },
      brandScale: { $ref: '#/definitions/ColorGroup' },
      custom: { $ref: '#/definitions/ColorGroup' },
      cssTokens: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'CSS custom properties for all colors',
      },
      quickReference: {
        type: 'object',
        description: 'Quick access to common colors',
        properties: {
          primaryLight: { type: 'string' },
          primaryDark: { type: 'string' },
          accent: { type: 'string' },
          backgrounds: { type: 'array', items: { type: 'string' } },
          text: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    definitions: {
      ColorGroup: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          colors: {
            type: 'array',
            items: { $ref: '#/definitions/Color' },
          },
        },
      },
      Color: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          rgb: { type: 'string' },
          cssVariable: { type: 'string' },
          textColor: { type: 'string', enum: ['light', 'dark'] },
          role: { type: 'string', enum: ['primary', 'secondary', 'accent', 'neutral', null] },
          usage: { type: 'string', nullable: true },
        },
      },
    },
  },
};

// ============================================
// RESOURCE FETCHER
// ============================================

/**
 * Fetch brand colors resource for a specific brand
 * 
 * @param brandSlug - The brand's URL-safe identifier (e.g., "open-session")
 * @returns The complete brand colors resource in MCP format
 */
export async function fetchBrandColorsResource(
  brandSlug: string
): Promise<McpBrandColorsResource> {
  // Get brand by slug
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) {
    throw new Error(`Brand not found: ${brandSlug}`);
  }

  // Export colors from service
  const colorData = await exportColorsForMcp(brand.id);

  // Build quick reference
  const brandColors = colorData.brand.colors;
  const primaryLight = brandColors.find(c => c.name === 'Vanilla')?.hex || '#FFFAEE';
  const primaryDark = brandColors.find(c => c.name === 'Charcoal')?.hex || '#191919';
  const accent = brandColors.find(c => c.role === 'secondary')?.hex || '#FE5102';

  // Background colors (light theme suggestions)
  const backgrounds = [
    primaryLight,
    colorData.monoScale.colors.find(c => c.name === 'White')?.hex || '#FFFFFF',
    colorData.monoScale.colors.find(c => c.name === 'Black-10')?.hex || '#F0F0F0',
  ];

  // Text colors (for readability)
  const text = [
    primaryDark,
    colorData.monoScale.colors.find(c => c.name === 'Black-80')?.hex || '#383838',
    colorData.monoScale.colors.find(c => c.name === 'Black-60')?.hex || '#595959',
  ];

  return {
    meta: {
      uri: `bos://brand/${brandSlug}/colors`,
      name: 'Brand Color Palette',
      description: `Color design system for ${brandSlug}`,
      brandSlug,
      generatedAt: new Date().toISOString(),
    },
    brand: colorData.brand,
    monoScale: colorData.monoScale,
    brandScale: colorData.brandScale,
    custom: colorData.custom,
    cssTokens: colorData.cssTokens,
    quickReference: {
      primaryLight,
      primaryDark,
      accent,
      backgrounds,
      text,
    },
  };
}

/**
 * Generate a human-readable summary of brand colors for LLM context
 * 
 * @param brandSlug - The brand's URL-safe identifier
 * @returns Markdown-formatted color summary
 */
export async function getBrandColorsSummary(brandSlug: string): Promise<string> {
  const resource = await fetchBrandColorsResource(brandSlug);
  
  const lines: string[] = [
    `## ${resource.meta.name}`,
    '',
    '### Brand Colors',
    ...resource.brand.colors.map(c => 
      `- **${c.name}**: ${c.hex} (${c.role || 'brand color'})${c.usage ? ` — ${c.usage}` : ''}`
    ),
    '',
    '### Mono Scale',
    resource.monoScale.colors.map(c => `${c.name}: ${c.hex}`).join(' | '),
    '',
  ];

  if (resource.brandScale.colors.length > 0) {
    lines.push(
      '### Brand Scale',
      ...resource.brandScale.colors.map(c => `- **${c.name}**: ${c.hex}`),
      ''
    );
  }

  if (resource.custom.colors.length > 0) {
    lines.push(
      '### Custom Colors',
      ...resource.custom.colors.map(c => `- **${c.name}**: ${c.hex}`),
      ''
    );
  }

  lines.push(
    '### Quick Reference',
    `- Primary Light: ${resource.quickReference.primaryLight}`,
    `- Primary Dark: ${resource.quickReference.primaryDark}`,
    `- Accent: ${resource.quickReference.accent}`,
  );

  return lines.join('\n');
}

// ============================================
// EXPORT FORMAT HELPERS
// ============================================

/**
 * Export colors as CSS custom properties
 */
export function exportAsCss(resource: McpBrandColorsResource): string {
  const lines = [':root {'];
  
  for (const [varName, value] of Object.entries(resource.cssTokens)) {
    lines.push(`  ${varName}: ${value};`);
  }
  
  lines.push('}');
  return lines.join('\n');
}

/**
 * Export colors as SCSS variables
 */
export function exportAsScss(resource: McpBrandColorsResource): string {
  const lines: string[] = [];
  
  for (const [varName, value] of Object.entries(resource.cssTokens)) {
    // Convert --color-name to $color-name
    const scssVar = varName.replace(/^--/, '$');
    lines.push(`${scssVar}: ${value};`);
  }
  
  return lines.join('\n');
}

/**
 * Export colors as Tailwind config object
 */
export function exportAsTailwind(resource: McpBrandColorsResource): string {
  const colors: Record<string, string> = {};
  
  const allColors = [
    ...resource.brand.colors,
    ...resource.monoScale.colors,
    ...resource.brandScale.colors,
    ...resource.custom.colors,
  ];
  
  for (const color of allColors) {
    // Convert to kebab-case key
    const key = color.name.toLowerCase().replace(/\s+/g, '-');
    colors[key] = color.hex;
  }
  
  return `// tailwind.config.js colors
const colors = ${JSON.stringify(colors, null, 2)};

module.exports = {
  theme: {
    extend: {
      colors,
    },
  },
};`;
}

/**
 * Export colors as JSON design tokens (Style Dictionary format)
 */
export function exportAsTokens(resource: McpBrandColorsResource): string {
  const tokens: Record<string, Record<string, { value: string; type: string }>> = {
    color: {},
  };
  
  const allColors = [
    ...resource.brand.colors,
    ...resource.monoScale.colors,
    ...resource.brandScale.colors,
    ...resource.custom.colors,
  ];
  
  for (const color of allColors) {
    const key = color.name.toLowerCase().replace(/\s+/g, '-');
    tokens.color[key] = {
      value: color.hex,
      type: 'color',
    };
  }
  
  return JSON.stringify(tokens, null, 2);
}

