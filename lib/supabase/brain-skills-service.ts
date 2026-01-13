/**
 * Supabase service for Brain Skills
 * 
 * Handles CRUD operations for skills with nested folder structure support.
 * Skills can contain folders and files (SKILL.md, examples, references).
 */

import { createClient } from './client';
import type {
  DbBrainSkill,
  BrainSkill,
  BrainSkillInsert,
  BrainSkillUpdate,
  SyncStatus,
  SyncDirection,
} from './types';
import { dbBrainSkillToApp } from './types';

const supabase = createClient();

// ============================================
// SKILL CRUD OPERATIONS
// ============================================

/**
 * Get all root-level skills for a brand
 */
export async function getSkills(
  brandId: string,
  includeInactive = false
): Promise<BrainSkill[]> {
  let query = supabase
    .from('brain_skills')
    .select('*')
    .eq('brand_id', brandId)
    .is('parent_id', null)
    .eq('item_type', 'folder')
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }

  return (data as DbBrainSkill[]).map(dbBrainSkillToApp);
}

/**
 * Get all items for a specific skill
 */
export async function getSkillItems(
  brandId: string,
  skillSlug: string,
  includeInactive = false
): Promise<BrainSkill[]> {
  let query = supabase
    .from('brain_skills')
    .select('*')
    .eq('brand_id', brandId)
    .eq('skill_slug', skillSlug)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching skill items:', error);
    throw error;
  }

  return (data as DbBrainSkill[]).map(dbBrainSkillToApp);
}

/**
 * Get skill items as a tree structure
 */
export async function getSkillTree(
  brandId: string,
  skillSlug: string
): Promise<BrainSkill | null> {
  const items = await getSkillItems(brandId, skillSlug);
  if (items.length === 0) return null;

  const itemMap = new Map<string, BrainSkill>();
  items.forEach((item) => {
    item.children = [];
    itemMap.set(item.id, item);
  });

  let root: BrainSkill | null = null;
  items.forEach((item) => {
    if (!item.parentId) {
      root = item;
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent && parent.children) {
        parent.children.push(item);
      }
    }
  });

  return root;
}

/**
 * Get children of a specific folder
 */
export async function getSkillChildren(
  parentId: string,
  includeInactive = false
): Promise<BrainSkill[]> {
  let query = supabase
    .from('brain_skills')
    .select('*')
    .eq('parent_id', parentId)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching skill children:', error);
    throw error;
  }

  return (data as DbBrainSkill[]).map(dbBrainSkillToApp);
}

/**
 * Get a single skill item by ID
 */
export async function getSkillItemById(id: string): Promise<BrainSkill | null> {
  const { data, error } = await supabase
    .from('brain_skills')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching skill item:', error);
    throw error;
  }

  return dbBrainSkillToApp(data as DbBrainSkill);
}

/**
 * Create a new skill item
 */
export async function createSkillItem(
  item: BrainSkillInsert
): Promise<BrainSkill> {
  const { data, error } = await supabase
    .from('brain_skills')
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error('Error creating skill item:', error);
    throw error;
  }

  return dbBrainSkillToApp(data as DbBrainSkill);
}

/**
 * Create a new root-level skill folder
 */
export async function createSkill(
  brandId: string,
  slug: string,
  title: string,
  metadata?: Record<string, unknown>
): Promise<BrainSkill> {
  return createSkillItem({
    brand_id: brandId,
    slug,
    title,
    item_type: 'folder',
    skill_slug: slug,
    path_segments: [],
    metadata,
  });
}

/**
 * Update a skill item
 */
export async function updateSkillItem(
  id: string,
  updates: BrainSkillUpdate
): Promise<BrainSkill> {
  const { data, error } = await supabase
    .from('brain_skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating skill item:', error);
    throw error;
  }

  return dbBrainSkillToApp(data as DbBrainSkill);
}

/**
 * Delete a skill item (soft delete)
 */
export async function deleteSkillItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_skills')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting skill item:', error);
    throw error;
  }
}

/**
 * Delete an entire skill and all its children
 */
export async function deleteSkill(
  brandId: string,
  skillSlug: string
): Promise<void> {
  const { error } = await supabase
    .from('brain_skills')
    .update({ is_active: false })
    .eq('brand_id', brandId)
    .eq('skill_slug', skillSlug);

  if (error) {
    console.error('Error deleting skill:', error);
    throw error;
  }
}

/**
 * Hard delete a skill item
 */
export async function hardDeleteSkillItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_skills')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting skill item:', error);
    throw error;
  }
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Update sync metadata for a skill item
 */
export async function updateSkillItemSync(
  id: string,
  updates: {
    file_hash?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_direction?: SyncDirection;
  }
): Promise<BrainSkill | null> {
  const { data, error } = await supabase
    .from('brain_skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating skill item sync:', error);
    throw error;
  }

  return data ? dbBrainSkillToApp(data as DbBrainSkill) : null;
}

/**
 * Get all syncable skill items
 */
export async function getSyncableSkillItems(
  brandId: string
): Promise<BrainSkill[]> {
  const { data, error } = await supabase
    .from('brain_skills')
    .select('*')
    .eq('brand_id', brandId)
    .eq('item_type', 'file')
    .not('file_path', 'is', null)
    .eq('is_active', true)
    .order('skill_slug')
    .order('sort_order');

  if (error) {
    console.error('Error fetching syncable skill items:', error);
    throw error;
  }

  return (data as DbBrainSkill[]).map(dbBrainSkillToApp);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a slug from a title
 */
export function generateSkillSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format a skill name from slug
 */
export function formatSkillName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a slug is available within a skill
 */
export async function isSkillSlugAvailable(
  brandId: string,
  skillSlug: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('brain_skills')
    .select('id')
    .eq('brand_id', brandId)
    .eq('skill_slug', skillSlug)
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
 * Build path segments from parent
 */
export async function buildSkillPathSegments(
  parentId: string | null,
  itemSlug: string
): Promise<string[]> {
  if (!parentId) {
    return [itemSlug];
  }

  const parent = await getSkillItemById(parentId);
  if (!parent) {
    return [itemSlug];
  }

  return [...parent.pathSegments, itemSlug];
}
