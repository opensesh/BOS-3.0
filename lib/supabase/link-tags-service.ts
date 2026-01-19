/**
 * Supabase service for short link tag management
 *
 * Handles CRUD operations for link organization tags.
 * Tags have colors for visual distinction (Dub-style).
 */

import { createClient } from './client';
import type {
  DbShortLinkTag,
  ShortLinkTag,
  ShortLinkTagInsert,
  ShortLinkTagUpdate,
  ShortLinkTagColor,
} from './types';
import { dbShortLinkTagToApp } from './types';

const supabase = createClient();

// ============================================
// TAG COLOR DEFINITIONS
// ============================================

export const TAG_COLORS: {
  name: ShortLinkTagColor;
  bg: string;
  text: string;
  border: string;
  bgDark: string;
  textDark: string;
}[] = [
  {
    name: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    bgDark: 'dark:bg-gray-800',
    textDark: 'dark:text-gray-300',
  },
  {
    name: 'red',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    bgDark: 'dark:bg-red-900/30',
    textDark: 'dark:text-red-400',
  },
  {
    name: 'orange',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    bgDark: 'dark:bg-orange-900/30',
    textDark: 'dark:text-orange-400',
  },
  {
    name: 'amber',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bgDark: 'dark:bg-amber-900/30',
    textDark: 'dark:text-amber-400',
  },
  {
    name: 'green',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    bgDark: 'dark:bg-green-900/30',
    textDark: 'dark:text-green-400',
  },
  {
    name: 'teal',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-200',
    bgDark: 'dark:bg-teal-900/30',
    textDark: 'dark:text-teal-400',
  },
  {
    name: 'blue',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    bgDark: 'dark:bg-blue-900/30',
    textDark: 'dark:text-blue-400',
  },
  {
    name: 'sky',
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-200',
    bgDark: 'dark:bg-sky-900/30',
    textDark: 'dark:text-sky-400',
  },
  {
    name: 'indigo',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    bgDark: 'dark:bg-indigo-900/30',
    textDark: 'dark:text-indigo-400',
  },
  {
    name: 'violet',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    bgDark: 'dark:bg-violet-900/30',
    textDark: 'dark:text-violet-400',
  },
  {
    name: 'purple',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    bgDark: 'dark:bg-purple-900/30',
    textDark: 'dark:text-purple-400',
  },
  {
    name: 'pink',
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-200',
    bgDark: 'dark:bg-pink-900/30',
    textDark: 'dark:text-pink-400',
  },
];

/**
 * Get color classes for a tag
 */
export function getTagColorClasses(color: ShortLinkTagColor): {
  bg: string;
  text: string;
  border: string;
  bgDark: string;
  textDark: string;
} {
  const colorDef = TAG_COLORS.find((c) => c.name === color);
  return (
    colorDef || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      bgDark: 'dark:bg-gray-800',
      textDark: 'dark:text-gray-300',
    }
  );
}

// ============================================
// TAG HELPERS
// ============================================

/**
 * Generate a URL-safe slug from a name
 */
export function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Infer tags from a short code slug pattern
 * e.g., "github-website" -> ["github", "website"]
 */
export function inferTagsFromSlug(shortCode: string): string[] {
  // Common patterns: name-channel, name-platform
  const parts = shortCode.split('-');
  if (parts.length < 2) return [];

  // Known channel/platform suffixes
  const channelSuffixes = ['website', 'social', 'profile', 'nav', 'footer'];
  const platformSuffixes = [
    'youtube',
    'linkedin',
    'instagram',
    'github',
    'figma',
    'medium',
    'substack',
    'twitter',
    'x',
  ];

  const tags: string[] = [];

  // Check if last part is a channel
  const lastPart = parts[parts.length - 1].toLowerCase();
  if (channelSuffixes.includes(lastPart)) {
    tags.push(lastPart);
    // First part might be a platform
    if (parts.length > 1 && platformSuffixes.includes(parts[0].toLowerCase())) {
      tags.push(parts[0].toLowerCase());
    }
  } else if (platformSuffixes.includes(lastPart)) {
    tags.push(lastPart);
  }

  // Check first part as well
  const firstPart = parts[0].toLowerCase();
  if (
    platformSuffixes.includes(firstPart) &&
    !tags.includes(firstPart)
  ) {
    tags.push(firstPart);
  }

  return tags;
}

// ============================================
// TAG CRUD OPERATIONS
// ============================================

/**
 * Get all tags for a brand
 */
export async function getTagsByBrand(brandId: string): Promise<ShortLinkTag[]> {
  const { data, error } = await supabase
    .from('short_link_tags')
    .select('*')
    .eq('brand_id', brandId)
    .order('name');

  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }

  return (data as DbShortLinkTag[]).map(dbShortLinkTagToApp);
}

/**
 * Get a single tag by ID
 */
export async function getTagById(id: string): Promise<ShortLinkTag | null> {
  const { data, error } = await supabase
    .from('short_link_tags')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching tag:', error);
    throw error;
  }

  return dbShortLinkTagToApp(data as DbShortLinkTag);
}

/**
 * Get a tag by slug
 */
export async function getTagBySlug(
  brandId: string,
  slug: string
): Promise<ShortLinkTag | null> {
  const { data, error } = await supabase
    .from('short_link_tags')
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching tag by slug:', error);
    throw error;
  }

  return data ? dbShortLinkTagToApp(data as DbShortLinkTag) : null;
}

/**
 * Get a tag by name
 */
export async function getTagByName(
  brandId: string,
  name: string
): Promise<ShortLinkTag | null> {
  const { data, error } = await supabase
    .from('short_link_tags')
    .select('*')
    .eq('brand_id', brandId)
    .ilike('name', name)
    .maybeSingle();

  if (error) {
    console.error('Error fetching tag by name:', error);
    throw error;
  }

  return data ? dbShortLinkTagToApp(data as DbShortLinkTag) : null;
}

/**
 * Create a new tag
 */
export async function createTag(tag: ShortLinkTagInsert): Promise<ShortLinkTag> {
  const slug = tag.slug || generateTagSlug(tag.name);

  const insertData: ShortLinkTagInsert = {
    ...tag,
    slug,
    color: tag.color || 'gray',
  };

  const { data, error } = await supabase
    .from('short_link_tags')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    throw error;
  }

  return dbShortLinkTagToApp(data as DbShortLinkTag);
}

/**
 * Create tag if it doesn't exist, otherwise return existing
 */
export async function getOrCreateTag(
  brandId: string,
  name: string,
  color?: ShortLinkTagColor
): Promise<ShortLinkTag> {
  const existing = await getTagByName(brandId, name);
  if (existing) {
    return existing;
  }

  return createTag({
    brand_id: brandId,
    name,
    color: color || getNextColor(brandId),
  });
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  updates: ShortLinkTagUpdate
): Promise<ShortLinkTag> {
  // If name is being updated, regenerate slug
  if (updates.name && !updates.slug) {
    updates.slug = generateTagSlug(updates.name);
  }

  const { data, error } = await supabase
    .from('short_link_tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tag:', error);
    throw error;
  }

  return dbShortLinkTagToApp(data as DbShortLinkTag);
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('short_link_tags').delete().eq('id', id);

  if (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
}

/**
 * Update tag usage counts based on actual link usage
 */
export async function syncTagUsageCounts(brandId: string): Promise<void> {
  // Get all links with tags
  const { data: links, error: linksError } = await supabase
    .from('short_links')
    .select('tags')
    .eq('brand_id', brandId)
    .eq('is_active', true);

  if (linksError) {
    console.error('Error fetching links for tag sync:', linksError);
    throw linksError;
  }

  // Count tag usage
  const tagCounts: Record<string, number> = {};
  links?.forEach((link) => {
    link.tags?.forEach((tag: string) => {
      const normalizedTag = tag.toLowerCase();
      tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
    });
  });

  // Get all tags
  const tags = await getTagsByBrand(brandId);

  // Update counts
  for (const tag of tags) {
    const count = tagCounts[tag.slug] || tagCounts[tag.name.toLowerCase()] || 0;
    if (count !== tag.usageCount) {
      await updateTag(tag.id, { usage_count: count });
    }
  }
}

/**
 * Get a color for a new tag (cycles through available colors)
 */
async function getNextColor(brandId: string): Promise<ShortLinkTagColor> {
  const existingTags = await getTagsByBrand(brandId);
  const usedColors = existingTags.map((t) => t.color);

  // Find first unused color
  for (const colorDef of TAG_COLORS) {
    if (!usedColors.includes(colorDef.name)) {
      return colorDef.name;
    }
  }

  // All colors used, cycle through
  const colorIndex = existingTags.length % TAG_COLORS.length;
  return TAG_COLORS[colorIndex].name;
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Ensure all tags from a list exist
 */
export async function ensureTagsExist(
  brandId: string,
  tagNames: string[]
): Promise<ShortLinkTag[]> {
  const tags: ShortLinkTag[] = [];

  for (const name of tagNames) {
    const tag = await getOrCreateTag(brandId, name);
    tags.push(tag);
  }

  return tags;
}

/**
 * Get tags map by name for quick lookup
 */
export async function getTagsMap(
  brandId: string
): Promise<Record<string, ShortLinkTag>> {
  const tags = await getTagsByBrand(brandId);
  const map: Record<string, ShortLinkTag> = {};

  tags.forEach((tag) => {
    map[tag.name.toLowerCase()] = tag;
    map[tag.slug] = tag;
  });

  return map;
}
