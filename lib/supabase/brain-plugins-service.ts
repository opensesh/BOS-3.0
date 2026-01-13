/**
 * Supabase service for Brain Plugins
 * 
 * Handles CRUD operations for plugins with nested folder structure support.
 * Plugins can contain folders and files (agents, commands, skills within a plugin).
 */

import { createClient } from './client';
import type {
  DbBrainPlugin,
  BrainPlugin,
  BrainPluginInsert,
  BrainPluginUpdate,
  SyncStatus,
  SyncDirection,
} from './types';
import { dbBrainPluginToApp } from './types';

const supabase = createClient();

// ============================================
// PLUGIN CRUD OPERATIONS
// ============================================

/**
 * Get all root-level plugins for a brand (items without parent_id with item_type='folder')
 */
export async function getPlugins(
  brandId: string,
  includeInactive = false
): Promise<BrainPlugin[]> {
  let query = supabase
    .from('brain_plugins')
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
    console.error('Error fetching plugins:', error);
    throw error;
  }

  return (data as DbBrainPlugin[]).map(dbBrainPluginToApp);
}

/**
 * Get all items (folders and files) for a specific plugin
 */
export async function getPluginItems(
  brandId: string,
  pluginSlug: string,
  includeInactive = false
): Promise<BrainPlugin[]> {
  let query = supabase
    .from('brain_plugins')
    .select('*')
    .eq('brand_id', brandId)
    .eq('plugin_slug', pluginSlug)
    .order('item_type', { ascending: true }) // Folders first
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching plugin items:', error);
    throw error;
  }

  return (data as DbBrainPlugin[]).map(dbBrainPluginToApp);
}

/**
 * Get plugin items as a tree structure
 */
export async function getPluginTree(
  brandId: string,
  pluginSlug: string
): Promise<BrainPlugin | null> {
  const items = await getPluginItems(brandId, pluginSlug);
  if (items.length === 0) return null;

  // Build a map for quick lookup
  const itemMap = new Map<string, BrainPlugin>();
  items.forEach((item) => {
    item.children = [];
    itemMap.set(item.id, item);
  });

  // Find root and build tree
  let root: BrainPlugin | null = null;
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
export async function getPluginChildren(
  parentId: string,
  includeInactive = false
): Promise<BrainPlugin[]> {
  let query = supabase
    .from('brain_plugins')
    .select('*')
    .eq('parent_id', parentId)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching plugin children:', error);
    throw error;
  }

  return (data as DbBrainPlugin[]).map(dbBrainPluginToApp);
}

/**
 * Get a single plugin item by ID
 */
export async function getPluginItemById(
  id: string
): Promise<BrainPlugin | null> {
  const { data, error } = await supabase
    .from('brain_plugins')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching plugin item:', error);
    throw error;
  }

  return dbBrainPluginToApp(data as DbBrainPlugin);
}

/**
 * Get a plugin item by path segments
 */
export async function getPluginItemByPath(
  brandId: string,
  pluginSlug: string,
  pathSegments: string[]
): Promise<BrainPlugin | null> {
  const { data, error } = await supabase
    .from('brain_plugins')
    .select('*')
    .eq('brand_id', brandId)
    .eq('plugin_slug', pluginSlug)
    .contains('path_segments', pathSegments)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching plugin item by path:', error);
    throw error;
  }

  return dbBrainPluginToApp(data as DbBrainPlugin);
}

/**
 * Create a new plugin item (folder or file)
 */
export async function createPluginItem(
  item: BrainPluginInsert
): Promise<BrainPlugin> {
  const { data, error } = await supabase
    .from('brain_plugins')
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error('Error creating plugin item:', error);
    throw error;
  }

  return dbBrainPluginToApp(data as DbBrainPlugin);
}

/**
 * Create a new root-level plugin folder
 */
export async function createPlugin(
  brandId: string,
  slug: string,
  title: string,
  metadata?: Record<string, unknown>
): Promise<BrainPlugin> {
  return createPluginItem({
    brand_id: brandId,
    slug,
    title,
    item_type: 'folder',
    plugin_slug: slug,
    path_segments: [],
    metadata,
  });
}

/**
 * Update a plugin item
 */
export async function updatePluginItem(
  id: string,
  updates: BrainPluginUpdate
): Promise<BrainPlugin> {
  const { data, error } = await supabase
    .from('brain_plugins')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating plugin item:', error);
    throw error;
  }

  return dbBrainPluginToApp(data as DbBrainPlugin);
}

/**
 * Delete a plugin item (soft delete)
 */
export async function deletePluginItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_plugins')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting plugin item:', error);
    throw error;
  }
}

/**
 * Delete an entire plugin and all its children
 */
export async function deletePlugin(
  brandId: string,
  pluginSlug: string
): Promise<void> {
  const { error } = await supabase
    .from('brain_plugins')
    .update({ is_active: false })
    .eq('brand_id', brandId)
    .eq('plugin_slug', pluginSlug);

  if (error) {
    console.error('Error deleting plugin:', error);
    throw error;
  }
}

/**
 * Hard delete a plugin item
 */
export async function hardDeletePluginItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_plugins')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting plugin item:', error);
    throw error;
  }
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Update sync metadata for a plugin item
 */
export async function updatePluginItemSync(
  id: string,
  updates: {
    file_hash?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_direction?: SyncDirection;
  }
): Promise<BrainPlugin | null> {
  const { data, error } = await supabase
    .from('brain_plugins')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating plugin item sync:', error);
    throw error;
  }

  return data ? dbBrainPluginToApp(data as DbBrainPlugin) : null;
}

/**
 * Get all syncable plugin items (files with file_path)
 */
export async function getSyncablePluginItems(
  brandId: string
): Promise<BrainPlugin[]> {
  const { data, error } = await supabase
    .from('brain_plugins')
    .select('*')
    .eq('brand_id', brandId)
    .eq('item_type', 'file')
    .not('file_path', 'is', null)
    .eq('is_active', true)
    .order('plugin_slug')
    .order('sort_order');

  if (error) {
    console.error('Error fetching syncable plugin items:', error);
    throw error;
  }

  return (data as DbBrainPlugin[]).map(dbBrainPluginToApp);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a slug from a title
 */
export function generatePluginSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format a plugin name from slug (e.g., "pr-review-toolkit" -> "Pr Review Toolkit")
 */
export function formatPluginName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a slug is available within a plugin
 */
export async function isPluginSlugAvailable(
  brandId: string,
  pluginSlug: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('brain_plugins')
    .select('id')
    .eq('brand_id', brandId)
    .eq('plugin_slug', pluginSlug)
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
export async function buildPathSegments(
  parentId: string | null,
  itemSlug: string
): Promise<string[]> {
  if (!parentId) {
    return [itemSlug];
  }

  const parent = await getPluginItemById(parentId);
  if (!parent) {
    return [itemSlug];
  }

  return [...parent.pathSegments, itemSlug];
}
