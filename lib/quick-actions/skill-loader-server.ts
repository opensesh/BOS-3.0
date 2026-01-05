/**
 * Server-side Skill Loader for Quick Actions
 * 
 * This file contains server-only functions that use next/headers.
 * Import directly in API routes, not through the barrel export.
 */

import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Load skill content from Supabase by slug (server-side for API routes)
 * 
 * @param skillSlug - The skill identifier (e.g., 'create-post-copy')
 * @param brandId - Optional brand ID for multi-tenant support
 * @returns The skill content or null if not found
 */
export async function loadSkillContent(
  skillSlug: string,
  brandId?: string
): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    
    // Query for skill - prefer brand-specific, fall back to system default
    // Order by is_system ASC so brand-specific (is_system=false) comes first
    let query = supabase
      .from('brand_documents')
      .select('content')
      .eq('category', 'skills')
      .eq('slug', skillSlug)
      .eq('is_deleted', false);
    
    // If brandId provided, get brand-specific or system skills
    // Otherwise just get system skills
    if (brandId) {
      query = query.or(`brand_id.eq.${brandId},is_system.eq.true`);
    }
    
    const { data, error } = await query
      .order('is_system', { ascending: true })
      .limit(1)
      .single();
    
    if (error) {
      // PGRST116 means no rows found - not an error, just no skill
      if (error.code === 'PGRST116') {
        console.warn(`Skill not found: ${skillSlug}`);
        return null;
      }
      console.error('Error fetching skill:', error);
      return null;
    }
    
    return data?.content ?? null;
  } catch (err) {
    console.error('Failed to load skill content:', err);
    return null;
  }
}

