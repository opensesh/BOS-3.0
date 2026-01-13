/**
 * Supabase service for Brain Agents
 * 
 * Handles CRUD operations for agents with nested folder structure support.
 */

import { createClient } from './client';
import type {
  DbBrainAgent,
  BrainAgent,
  BrainAgentInsert,
  BrainAgentUpdate,
  SyncStatus,
  SyncDirection,
} from './types';
import { dbBrainAgentToApp } from './types';

const supabase = createClient();

// ============================================
// AGENT CRUD OPERATIONS
// ============================================

/**
 * Get all root-level agents for a brand
 */
export async function getAgents(
  brandId: string,
  includeInactive = false
): Promise<BrainAgent[]> {
  let query = supabase
    .from('brain_agents')
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
    console.error('Error fetching agents:', error);
    throw error;
  }

  return (data as DbBrainAgent[]).map(dbBrainAgentToApp);
}

/**
 * Get all items for a specific agent
 */
export async function getAgentItems(
  brandId: string,
  agentSlug: string,
  includeInactive = false
): Promise<BrainAgent[]> {
  let query = supabase
    .from('brain_agents')
    .select('*')
    .eq('brand_id', brandId)
    .eq('agent_slug', agentSlug)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching agent items:', error);
    throw error;
  }

  return (data as DbBrainAgent[]).map(dbBrainAgentToApp);
}

/**
 * Get agent items as a tree structure
 */
export async function getAgentTree(
  brandId: string,
  agentSlug: string
): Promise<BrainAgent | null> {
  const items = await getAgentItems(brandId, agentSlug);
  if (items.length === 0) return null;

  const itemMap = new Map<string, BrainAgent>();
  items.forEach((item) => {
    item.children = [];
    itemMap.set(item.id, item);
  });

  let root: BrainAgent | null = null;
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
export async function getAgentChildren(
  parentId: string,
  includeInactive = false
): Promise<BrainAgent[]> {
  let query = supabase
    .from('brain_agents')
    .select('*')
    .eq('parent_id', parentId)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching agent children:', error);
    throw error;
  }

  return (data as DbBrainAgent[]).map(dbBrainAgentToApp);
}

/**
 * Get a single agent item by ID
 */
export async function getAgentItemById(id: string): Promise<BrainAgent | null> {
  const { data, error } = await supabase
    .from('brain_agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching agent item:', error);
    throw error;
  }

  return dbBrainAgentToApp(data as DbBrainAgent);
}

/**
 * Create a new agent item
 */
export async function createAgentItem(
  item: BrainAgentInsert
): Promise<BrainAgent> {
  const { data, error } = await supabase
    .from('brain_agents')
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error('Error creating agent item:', error);
    throw error;
  }

  return dbBrainAgentToApp(data as DbBrainAgent);
}

/**
 * Create a new root-level agent folder
 */
export async function createAgent(
  brandId: string,
  slug: string,
  title: string,
  metadata?: Record<string, unknown>
): Promise<BrainAgent> {
  return createAgentItem({
    brand_id: brandId,
    slug,
    title,
    item_type: 'folder',
    agent_slug: slug,
    path_segments: [],
    metadata,
  });
}

/**
 * Update an agent item
 */
export async function updateAgentItem(
  id: string,
  updates: BrainAgentUpdate
): Promise<BrainAgent> {
  const { data, error } = await supabase
    .from('brain_agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent item:', error);
    throw error;
  }

  return dbBrainAgentToApp(data as DbBrainAgent);
}

/**
 * Delete an agent item (soft delete)
 */
export async function deleteAgentItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_agents')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting agent item:', error);
    throw error;
  }
}

/**
 * Delete an entire agent and all its children
 */
export async function deleteAgent(
  brandId: string,
  agentSlug: string
): Promise<void> {
  const { error } = await supabase
    .from('brain_agents')
    .update({ is_active: false })
    .eq('brand_id', brandId)
    .eq('agent_slug', agentSlug);

  if (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
}

/**
 * Hard delete an agent item
 */
export async function hardDeleteAgentItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_agents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting agent item:', error);
    throw error;
  }
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Update sync metadata for an agent item
 */
export async function updateAgentItemSync(
  id: string,
  updates: {
    file_hash?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_direction?: SyncDirection;
  }
): Promise<BrainAgent | null> {
  const { data, error } = await supabase
    .from('brain_agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent item sync:', error);
    throw error;
  }

  return data ? dbBrainAgentToApp(data as DbBrainAgent) : null;
}

/**
 * Get all syncable agent items
 */
export async function getSyncableAgentItems(
  brandId: string
): Promise<BrainAgent[]> {
  const { data, error } = await supabase
    .from('brain_agents')
    .select('*')
    .eq('brand_id', brandId)
    .eq('item_type', 'file')
    .not('file_path', 'is', null)
    .eq('is_active', true)
    .order('agent_slug')
    .order('sort_order');

  if (error) {
    console.error('Error fetching syncable agent items:', error);
    throw error;
  }

  return (data as DbBrainAgent[]).map(dbBrainAgentToApp);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a slug from a title
 */
export function generateAgentSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format an agent name from slug
 */
export function formatAgentName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a slug is available within an agent
 */
export async function isAgentSlugAvailable(
  brandId: string,
  agentSlug: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('brain_agents')
    .select('id')
    .eq('brand_id', brandId)
    .eq('agent_slug', agentSlug)
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
export async function buildAgentPathSegments(
  parentId: string | null,
  itemSlug: string
): Promise<string[]> {
  if (!parentId) {
    return [itemSlug];
  }

  const parent = await getAgentItemById(parentId);
  if (!parent) {
    return [itemSlug];
  }

  return [...parent.pathSegments, itemSlug];
}
