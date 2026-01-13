/**
 * Supabase service for short link management
 *
 * Handles CRUD operations for URL shortening with analytics.
 * Inspired by Dub's UI/UX with Kutt-style self-hosted functionality.
 */

import { createClient } from './client';
import type {
  DbShortLink,
  ShortLink,
  ShortLinkInsert,
  ShortLinkUpdate,
} from './types';
import { dbShortLinkToApp } from './types';

const supabase = createClient();

// ============================================
// SHORT CODE HELPERS
// ============================================

/**
 * Characters used for generating short codes
 * Omits confusing characters: o, O, 0, i, I, l, 1, j
 */
const SHORT_CODE_ALPHABET =
  'abcdefghkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random short code
 */
export function generateShortCode(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SHORT_CODE_ALPHABET.charAt(
      Math.floor(Math.random() * SHORT_CODE_ALPHABET.length)
    );
  }
  return result;
}

/**
 * Generate a URL-safe slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validate a short code format
 */
export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{1,50}$/.test(code);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

/**
 * Build destination URL with UTM parameters
 */
export function buildDestinationUrl(
  baseUrl: string,
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  }
): string {
  if (!utm) return baseUrl;

  const params = new URLSearchParams();
  if (utm.source) params.set('utm_source', utm.source);
  if (utm.medium) params.set('utm_medium', utm.medium);
  if (utm.campaign) params.set('utm_campaign', utm.campaign);
  if (utm.term) params.set('utm_term', utm.term);
  if (utm.content) params.set('utm_content', utm.content);

  if (!params.toString()) return baseUrl;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}

// ============================================
// LINK QUERY OPTIONS
// ============================================

export interface LinkQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  sortBy?: 'created' | 'clicks' | 'alphabetical' | 'updated';
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  includeInactive?: boolean;
}

export interface LinkQueryResult {
  links: ShortLink[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// LINK CRUD OPERATIONS
// ============================================

/**
 * Get all links for a brand with filtering and pagination
 */
export async function getLinksByBrand(
  brandId: string,
  options: LinkQueryOptions = {}
): Promise<LinkQueryResult> {
  const {
    page = 1,
    limit = 20,
    search,
    tags,
    sortBy = 'created',
    sortOrder = 'desc',
    includeArchived = false,
    includeInactive = false,
  } = options;

  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('short_links')
    .select('*', { count: 'exact' })
    .eq('brand_id', brandId);

  // Filter by archive status
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  // Filter by active status
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  // Search filter
  if (search) {
    query = query.or(
      `short_code.ilike.%${search}%,destination_url.ilike.%${search}%,title.ilike.%${search}%`
    );
  }

  // Tag filter
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  // Sorting
  switch (sortBy) {
    case 'clicks':
      query = query.order('clicks', { ascending: sortOrder === 'asc' });
      break;
    case 'alphabetical':
      query = query.order('short_code', { ascending: sortOrder === 'asc' });
      break;
    case 'updated':
      query = query.order('updated_at', { ascending: sortOrder === 'asc' });
      break;
    case 'created':
    default:
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching links:', error);
    throw error;
  }

  const links = (data as DbShortLink[]).map(dbShortLinkToApp);
  const total = count || 0;

  return {
    links,
    total,
    page,
    limit,
    hasMore: offset + links.length < total,
  };
}

/**
 * Get a single link by ID
 */
export async function getLinkById(id: string): Promise<ShortLink | null> {
  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching link:', error);
    throw error;
  }

  return dbShortLinkToApp(data as DbShortLink);
}

/**
 * Get a link by short code and domain
 */
export async function getLinkByShortCode(
  brandId: string,
  shortCode: string,
  domain?: string
): Promise<ShortLink | null> {
  let query = supabase
    .from('short_links')
    .select('*')
    .eq('brand_id', brandId)
    .eq('short_code', shortCode);

  if (domain) {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching link by short code:', error);
    throw error;
  }

  return data ? dbShortLinkToApp(data as DbShortLink) : null;
}

/**
 * Get a link by short code only (for redirect handler - cross-brand)
 */
export async function getLinkByShortCodeOnly(
  shortCode: string,
  domain: string = 'opensesh.app'
): Promise<ShortLink | null> {
  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('short_code', shortCode)
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching link by short code:', error);
    throw error;
  }

  return data ? dbShortLinkToApp(data as DbShortLink) : null;
}

/**
 * Check if a short code is available
 */
export async function isShortCodeAvailable(
  brandId: string,
  shortCode: string,
  domain: string = 'opensesh.app',
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('short_links')
    .select('id')
    .eq('brand_id', brandId)
    .eq('short_code', shortCode)
    .eq('domain', domain);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking short code availability:', error);
    throw error;
  }

  return data === null;
}

/**
 * Create a new short link
 */
export async function createLink(link: ShortLinkInsert): Promise<ShortLink> {
  // Generate short code if not provided
  let shortCode = link.short_code;
  if (!shortCode) {
    // Generate and verify uniqueness
    let isAvailable = false;
    let attempts = 0;
    while (!isAvailable && attempts < 10) {
      shortCode = generateShortCode();
      isAvailable = await isShortCodeAvailable(
        link.brand_id,
        shortCode,
        link.domain || 'opensesh.app'
      );
      attempts++;
    }
    if (!isAvailable) {
      throw new Error('Failed to generate unique short code');
    }
  }

  const insertData: ShortLinkInsert = {
    ...link,
    short_code: shortCode,
    domain: link.domain || 'opensesh.app',
  };

  const { data, error } = await supabase
    .from('short_links')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating link:', error);
    throw error;
  }

  return dbShortLinkToApp(data as DbShortLink);
}

/**
 * Update a short link
 */
export async function updateLink(
  id: string,
  updates: ShortLinkUpdate
): Promise<ShortLink> {
  const { data, error } = await supabase
    .from('short_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating link:', error);
    throw error;
  }

  return dbShortLinkToApp(data as DbShortLink);
}

/**
 * Archive a link (soft delete)
 */
export async function archiveLink(id: string): Promise<ShortLink> {
  return updateLink(id, { is_archived: true });
}

/**
 * Restore an archived link
 */
export async function restoreLink(id: string): Promise<ShortLink> {
  return updateLink(id, { is_archived: false });
}

/**
 * Deactivate a link
 */
export async function deactivateLink(id: string): Promise<ShortLink> {
  return updateLink(id, { is_active: false });
}

/**
 * Activate a link
 */
export async function activateLink(id: string): Promise<ShortLink> {
  return updateLink(id, { is_active: true });
}

/**
 * Permanently delete a link
 */
export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase.from('short_links').delete().eq('id', id);

  if (error) {
    console.error('Error deleting link:', error);
    throw error;
  }
}

/**
 * Duplicate a link
 */
export async function duplicateLink(id: string): Promise<ShortLink> {
  const original = await getLinkById(id);
  if (!original) {
    throw new Error('Link not found');
  }

  const newLink: ShortLinkInsert = {
    brand_id: original.brandId,
    short_code: '', // Will be auto-generated
    domain: original.domain,
    destination_url: original.destinationUrl,
    title: original.title ? `${original.title} (Copy)` : undefined,
    description: original.description,
    tags: original.tags,
    utm_source: original.utmSource,
    utm_medium: original.utmMedium,
    utm_campaign: original.utmCampaign,
    utm_term: original.utmTerm,
    utm_content: original.utmContent,
    owner_id: original.ownerId,
    session_id: original.sessionId,
  };

  return createLink(newLink);
}

/**
 * Increment click count for a link
 */
export async function incrementClicks(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_link_clicks', {
    link_id: id,
  });

  if (error) {
    // Fallback to manual increment if RPC fails
    console.warn('RPC increment failed, using manual update:', error);
    const { error: updateError } = await supabase
      .from('short_links')
      .update({
        clicks: supabase.rpc('increment_link_clicks', { link_id: id }),
        last_clicked_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error incrementing clicks:', updateError);
      // Don't throw - click tracking shouldn't block redirect
    }
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Bulk create links (for CSV import)
 */
export async function bulkCreateLinks(
  links: ShortLinkInsert[]
): Promise<ShortLink[]> {
  // Process in batches of 100
  const batchSize = 100;
  const results: ShortLink[] = [];

  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);

    // Generate short codes for batch
    const processedBatch = await Promise.all(
      batch.map(async (link) => {
        if (!link.short_code) {
          let shortCode = generateShortCode();
          let isAvailable = await isShortCodeAvailable(
            link.brand_id,
            shortCode,
            link.domain || 'opensesh.app'
          );
          let attempts = 0;
          while (!isAvailable && attempts < 10) {
            shortCode = generateShortCode();
            isAvailable = await isShortCodeAvailable(
              link.brand_id,
              shortCode,
              link.domain || 'opensesh.app'
            );
            attempts++;
          }
          return { ...link, short_code: shortCode };
        }
        return link;
      })
    );

    const { data, error } = await supabase
      .from('short_links')
      .insert(processedBatch)
      .select();

    if (error) {
      console.error('Error in bulk create:', error);
      throw error;
    }

    results.push(...(data as DbShortLink[]).map(dbShortLinkToApp));
  }

  return results;
}

/**
 * Bulk delete links
 */
export async function bulkDeleteLinks(ids: string[]): Promise<void> {
  const { error } = await supabase.from('short_links').delete().in('id', ids);

  if (error) {
    console.error('Error in bulk delete:', error);
    throw error;
  }
}

/**
 * Bulk archive links
 */
export async function bulkArchiveLinks(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('short_links')
    .update({ is_archived: true })
    .in('id', ids);

  if (error) {
    console.error('Error in bulk archive:', error);
    throw error;
  }
}

/**
 * Bulk update tags
 */
export async function bulkUpdateTags(
  ids: string[],
  tags: string[]
): Promise<void> {
  const { error } = await supabase
    .from('short_links')
    .update({ tags })
    .in('id', ids);

  if (error) {
    console.error('Error in bulk update tags:', error);
    throw error;
  }
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get link count statistics for a brand
 */
export async function getLinkStats(brandId: string): Promise<{
  total: number;
  active: number;
  archived: number;
  totalClicks: number;
}> {
  const { data: totalData, error: totalError } = await supabase
    .from('short_links')
    .select('id, is_active, is_archived, clicks')
    .eq('brand_id', brandId);

  if (totalError) {
    console.error('Error getting link stats:', totalError);
    throw totalError;
  }

  const links = totalData || [];
  const total = links.length;
  const active = links.filter((l) => l.is_active && !l.is_archived).length;
  const archived = links.filter((l) => l.is_archived).length;
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

  return { total, active, archived, totalClicks };
}

/**
 * Get top links by clicks
 */
export async function getTopLinks(
  brandId: string,
  limit = 10
): Promise<ShortLink[]> {
  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('clicks', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting top links:', error);
    throw error;
  }

  return (data as DbShortLink[]).map(dbShortLinkToApp);
}

/**
 * Get recent links
 */
export async function getRecentLinks(
  brandId: string,
  limit = 10
): Promise<ShortLink[]> {
  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting recent links:', error);
    throw error;
  }

  return (data as DbShortLink[]).map(dbShortLinkToApp);
}
