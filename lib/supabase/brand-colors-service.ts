/**
 * Supabase service for brand color management
 * 
 * Handles CRUD operations for brand design system colors.
 * Supports brand colors, mono scale, and brand scale groupings.
 * Data is accessible via custom MCP resource for consumer LLM integration.
 */

import { createClient } from './client';
import type {
  DbBrandColor,
  BrandColor,
  BrandColorInsert,
  BrandColorUpdate,
  BrandColorGroup,
} from './types';
import { dbBrandColorToApp } from './types';

const supabase = createClient();

// ============================================
// COLOR HELPERS
// ============================================

/**
 * Convert HEX color to RGB string
 */
export function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert HEX color to HSL string
 */
export function hexToHsl(hex: string): string {
  const cleanHex = hex.replace('#', '');
  let r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  let g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  let b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/**
 * Calculate relative luminance for WCAG contrast
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const rgb = [
    parseInt(cleanHex.substring(0, 2), 16) / 255,
    parseInt(cleanHex.substring(2, 4), 16) / 255,
    parseInt(cleanHex.substring(4, 6), 16) / 255,
  ].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Determine if text should be light or dark based on background color
 */
export function getTextColorForBackground(hex: string): 'light' | 'dark' {
  const luminance = getLuminance(hex);
  // Use WCAG threshold - if luminance > 0.179, use dark text
  return luminance > 0.179 ? 'dark' : 'light';
}

/**
 * Generate a URL-safe slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate CSS variable name from slug
 */
export function generateCssVariableName(slug: string): string {
  return `--color-${slug}`;
}

/**
 * Validate HEX color format
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// ============================================
// COLOR CRUD OPERATIONS
// ============================================

/**
 * Get all colors for a brand
 */
export async function getColorsByBrand(
  brandId: string,
  includeInactive = false
): Promise<BrandColor[]> {
  let query = supabase
    .from('brand_colors')
    .select('*')
    .eq('brand_id', brandId)
    .order('color_group')
    .order('sort_order');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching colors:', error);
    throw error;
  }

  return (data as DbBrandColor[]).map(dbBrandColorToApp);
}

/**
 * Get colors by group
 */
export async function getColorsByGroup(
  brandId: string,
  group: BrandColorGroup
): Promise<BrandColor[]> {
  const { data, error } = await supabase
    .from('brand_colors')
    .select('*')
    .eq('brand_id', brandId)
    .eq('color_group', group)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching colors by group:', error);
    throw error;
  }

  return (data as DbBrandColor[]).map(dbBrandColorToApp);
}

/**
 * Get a single color by ID
 */
export async function getColorById(id: string): Promise<BrandColor | null> {
  const { data, error } = await supabase
    .from('brand_colors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching color:', error);
    throw error;
  }

  return dbBrandColorToApp(data as DbBrandColor);
}

/**
 * Get a color by slug within a brand
 */
export async function getColorBySlug(
  brandId: string,
  slug: string
): Promise<BrandColor | null> {
  const { data, error } = await supabase
    .from('brand_colors')
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching color by slug:', error);
    throw error;
  }

  return dbBrandColorToApp(data as DbBrandColor);
}

/**
 * Create a new color
 */
export async function createColor(color: BrandColorInsert): Promise<BrandColor> {
  // Auto-generate values if not provided
  const slug = color.slug || generateSlug(color.name);
  const cssVariableName = color.css_variable_name || generateCssVariableName(slug);
  const textColor = color.text_color || getTextColorForBackground(color.hex_value);

  const insertData: BrandColorInsert = {
    ...color,
    slug,
    css_variable_name: cssVariableName,
    text_color: textColor,
  };

  const { data, error } = await supabase
    .from('brand_colors')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating color:', error);
    throw error;
  }

  return dbBrandColorToApp(data as DbBrandColor);
}

/**
 * Update a color
 */
export async function updateColor(
  id: string,
  updates: BrandColorUpdate
): Promise<BrandColor> {
  // If hex_value is being updated, recalculate text_color
  if (updates.hex_value && !updates.text_color) {
    updates.text_color = getTextColorForBackground(updates.hex_value);
  }

  // If name is being updated and slug isn't provided, regenerate slug
  if (updates.name && !updates.slug) {
    updates.slug = generateSlug(updates.name);
    updates.css_variable_name = generateCssVariableName(updates.slug);
  }

  const { data, error } = await supabase
    .from('brand_colors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating color:', error);
    throw error;
  }

  return dbBrandColorToApp(data as DbBrandColor);
}

/**
 * Delete a color (soft delete by setting is_active = false)
 */
export async function deleteColor(id: string): Promise<void> {
  // First check if it's a system color
  const color = await getColorById(id);
  if (!color) {
    throw new Error('Color not found');
  }
  
  if (color.isSystem) {
    throw new Error('Cannot delete system colors');
  }

  const { error } = await supabase
    .from('brand_colors')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting color:', error);
    throw error;
  }
}

/**
 * Permanently delete a color
 */
export async function hardDeleteColor(id: string): Promise<void> {
  // First check if it's a system color
  const color = await getColorById(id);
  if (!color) {
    throw new Error('Color not found');
  }
  
  if (color.isSystem) {
    throw new Error('Cannot delete system colors');
  }

  const { error } = await supabase
    .from('brand_colors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting color:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted color
 */
export async function restoreColor(id: string): Promise<BrandColor> {
  const { data, error } = await supabase
    .from('brand_colors')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error restoring color:', error);
    throw error;
  }

  return dbBrandColorToApp(data as DbBrandColor);
}

/**
 * Reorder colors within a group
 */
export async function reorderColors(
  brandId: string,
  colorGroup: BrandColorGroup,
  colorIds: string[]
): Promise<void> {
  // Update sort_order for each color
  const updates = colorIds.map((id, index) => ({
    id,
    sort_order: index + 1,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('brand_colors')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('brand_id', brandId)
      .eq('color_group', colorGroup);

    if (error) {
      console.error('Error reordering color:', error);
      throw error;
    }
  }
}

/**
 * Duplicate a color
 */
export async function duplicateColor(id: string): Promise<BrandColor> {
  const original = await getColorById(id);
  if (!original) {
    throw new Error('Color not found');
  }

  const newColor: BrandColorInsert = {
    brand_id: original.brandId,
    name: `${original.name} Copy`,
    hex_value: original.hexValue,
    color_group: original.colorGroup,
    color_role: original.colorRole,
    text_color: original.textColor,
    description: original.description,
    usage_guidelines: original.usageGuidelines,
    sort_order: original.sortOrder + 1,
    is_system: false, // Duplicates are never system colors
  };

  return createColor(newColor);
}

// ============================================
// MCP EXPORT FUNCTIONS
// ============================================

/**
 * Export colors in a format suitable for MCP resource
 */
export async function exportColorsForMcp(brandId: string): Promise<{
  brand: { name: string; description: string; colors: McpColor[] };
  monoScale: { name: string; description: string; colors: McpColor[] };
  brandScale: { name: string; description: string; colors: McpColor[] };
  custom: { name: string; description: string; colors: McpColor[] };
  cssTokens: Record<string, string>;
}> {
  const colors = await getColorsByBrand(brandId);

  const groupColors = (group: BrandColorGroup): McpColor[] =>
    colors
      .filter((c) => c.colorGroup === group)
      .map((c) => ({
        name: c.name,
        hex: c.hexValue,
        rgb: c.rgbValue || hexToRgb(c.hexValue),
        cssVariable: c.cssVariableName || generateCssVariableName(c.slug),
        textColor: c.textColor,
        role: c.colorRole || null,
        usage: c.usageGuidelines || null,
      }));

  const cssTokens: Record<string, string> = {};
  colors.forEach((c) => {
    const varName = c.cssVariableName || generateCssVariableName(c.slug);
    cssTokens[varName] = c.hexValue;
  });

  return {
    brand: {
      name: 'Brand Colors',
      description: 'Primary brand palette',
      colors: groupColors('brand'),
    },
    monoScale: {
      name: 'Mono Scale',
      description: 'Grayscale palette from black to white',
      colors: groupColors('mono-scale'),
    },
    brandScale: {
      name: 'Brand Scale',
      description: 'Extended brand color variations',
      colors: groupColors('brand-scale'),
    },
    custom: {
      name: 'Custom Colors',
      description: 'User-defined custom colors',
      colors: groupColors('custom'),
    },
    cssTokens,
  };
}

/**
 * MCP Color format
 */
interface McpColor {
  name: string;
  hex: string;
  rgb: string;
  cssVariable: string;
  textColor: 'light' | 'dark';
  role: string | null;
  usage: string | null;
}

/**
 * Search colors by name, hex, or description
 */
export async function searchColors(
  brandId: string,
  query: string
): Promise<BrandColor[]> {
  const searchTerm = query.toLowerCase();
  
  const { data, error } = await supabase
    .from('brand_colors')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .or(
      `name.ilike.%${searchTerm}%,hex_value.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,css_variable_name.ilike.%${searchTerm}%`
    )
    .order('sort_order');

  if (error) {
    console.error('Error searching colors:', error);
    throw error;
  }

  return (data as DbBrandColor[]).map(dbBrandColorToApp);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get color counts by group for a brand
 */
export async function getColorCounts(
  brandId: string
): Promise<Record<BrandColorGroup, number>> {
  const { data, error } = await supabase
    .from('brand_colors')
    .select('color_group')
    .eq('brand_id', brandId)
    .eq('is_active', true);

  if (error) {
    console.error('Error getting color counts:', error);
    throw error;
  }

  const counts: Record<BrandColorGroup, number> = {
    brand: 0,
    'mono-scale': 0,
    'brand-scale': 0,
    custom: 0,
  };

  data.forEach((item) => {
    const group = item.color_group as BrandColorGroup;
    if (group in counts) {
      counts[group]++;
    }
  });

  return counts;
}

/**
 * Check if a slug is available within a brand
 */
export async function isSlugAvailable(
  brandId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('brand_colors')
    .select('id')
    .eq('brand_id', brandId)
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking slug availability:', error);
    throw error;
  }

  return data === null;
}

/**
 * Get the next sort order for a group
 */
export async function getNextSortOrder(
  brandId: string,
  colorGroup: BrandColorGroup
): Promise<number> {
  const { data, error } = await supabase
    .from('brand_colors')
    .select('sort_order')
    .eq('brand_id', brandId)
    .eq('color_group', colorGroup)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return 1; // No colors yet in this group
    }
    console.error('Error getting next sort order:', error);
    throw error;
  }

  return (data?.sort_order || 0) + 1;
}

