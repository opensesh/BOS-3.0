/**
 * Client-side Skill Loader for Quick Actions
 * 
 * Fetches skill content from Supabase brand_documents table.
 * Skills teach the AI how to properly execute quick actions with
 * platform-specific knowledge, output formats, and best practices.
 * 
 * NOTE: For server-side skill loading in API routes, import
 * loadSkillContent from './skill-loader-server' instead.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Load skill content for client-side use (uses browser client)
 * Note: This is for non-API route contexts
 */
export async function loadSkillContentClient(
  skillSlug: string
): Promise<string | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('brand_documents')
      .select('content')
      .eq('category', 'skills')
      .eq('slug', skillSlug)
      .eq('is_deleted', false)
      .order('is_system', { ascending: true })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
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

/**
 * Get skill ID for a quick action type
 */
export function getSkillIdForQuickAction(quickActionType: string): string | null {
  const skillMap: Record<string, string> = {
    'create-post-copy': 'create-post-copy',
    'plan-campaign': 'plan-campaign',
    'brainstorm-ideas': 'brainstorm-ideas',
    'get-feedback': 'get-feedback',
  };
  
  return skillMap[quickActionType] ?? null;
}
