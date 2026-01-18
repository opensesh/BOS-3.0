/**
 * Supabase service for Brain Writing Styles documents
 * 
 * Handles CRUD operations for writing style documents.
 */

import { createAdminClient } from './admin';
import type {
  DbBrainWritingStyle,
  BrainWritingStyle,
  BrainWritingStyleInsert,
  BrainWritingStyleUpdate,
  SyncStatus,
  SyncDirection,
} from './types';
import { dbBrainWritingStyleToApp } from './types';

// Use admin client to bypass RLS for server-side operations
const getSupabase = () => createAdminClient();

// ============================================
// DOCUMENT CRUD OPERATIONS
// ============================================

/**
 * Get all writing style documents for a brand
 */
export async function getWritingStyles(
  brandId: string,
  includeInactive = false
): Promise<BrainWritingStyle[]> {
  let query = getSupabase()
    .from('brain_writing_styles')
    .select('*')
    .eq('brand_id', brandId)
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching writing styles:', error);
    throw error;
  }

  return (data as DbBrainWritingStyle[]).map(dbBrainWritingStyleToApp);
}

/**
 * Get a single writing style by ID
 */
export async function getWritingStyleById(
  id: string
): Promise<BrainWritingStyle | null> {
  const { data, error } = await getSupabase()
    .from('brain_writing_styles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching writing style:', error);
    throw error;
  }

  return dbBrainWritingStyleToApp(data as DbBrainWritingStyle);
}

/**
 * Get a writing style by slug
 */
export async function getWritingStyleBySlug(
  brandId: string,
  slug: string
): Promise<BrainWritingStyle | null> {
  const { data, error } = await getSupabase()
    .from('brain_writing_styles')
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching writing style by slug:', error);
    throw error;
  }

  return dbBrainWritingStyleToApp(data as DbBrainWritingStyle);
}

/**
 * Create a new writing style
 */
export async function createWritingStyle(
  style: BrainWritingStyleInsert
): Promise<BrainWritingStyle> {
  const { data, error } = await getSupabase()
    .from('brain_writing_styles')
    .insert(style)
    .select()
    .single();

  if (error) {
    console.error('Error creating writing style:', error);
    throw error;
  }

  return dbBrainWritingStyleToApp(data as DbBrainWritingStyle);
}

/**
 * Update a writing style
 */
export async function updateWritingStyle(
  id: string,
  updates: BrainWritingStyleUpdate
): Promise<BrainWritingStyle> {
  const { data, error } = await getSupabase()
    .from('brain_writing_styles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating writing style:', error);
    throw error;
  }

  return dbBrainWritingStyleToApp(data as DbBrainWritingStyle);
}

/**
 * Delete a writing style (soft delete)
 */
export async function deleteWritingStyle(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('brain_writing_styles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting writing style:', error);
    throw error;
  }
}

/**
 * Hard delete a writing style
 */
export async function hardDeleteWritingStyle(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('brain_writing_styles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting writing style:', error);
    throw error;
  }
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Update sync metadata for a writing style
 */
export async function updateWritingStyleSync(
  id: string,
  updates: {
    file_hash?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_direction?: SyncDirection;
  }
): Promise<BrainWritingStyle | null> {
  const { data, error } = await getSupabase()
    .from('brain_writing_styles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating writing style sync:', error);
    throw error;
  }

  return data ? dbBrainWritingStyleToApp(data as DbBrainWritingStyle) : null;
}

/**
 * Get all syncable writing styles
 */
export async function getSyncableWritingStyles(
  brandId: string
): Promise<BrainWritingStyle[]> {
  const { data, error } = await getSupabase()
    .from('brain_writing_styles')
    .select('*')
    .eq('brand_id', brandId)
    .not('file_path', 'is', null)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching syncable writing styles:', error);
    throw error;
  }

  return (data as DbBrainWritingStyle[]).map(dbBrainWritingStyleToApp);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a slug from a title
 */
export function generateWritingStyleSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if a slug is available
 */
export async function isWritingStyleSlugAvailable(
  brandId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = getSupabase()
    .from('brain_writing_styles')
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
