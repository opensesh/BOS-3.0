'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// Default brand ID for Open Session
const DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || '16aa5681-c792-45cf-bf65-9f9cbc3197af';

export interface CategoryTimestamps {
  // Brand Hub categories
  logo: string | null;
  colors: string | null;
  fonts: string | null;
  artDirection: string | null;
  textures: string | null;
  guidelines: string | null;
  tokens: string | null;

  // Brain categories
  architecture: string | null; // Always null - system generated
  brandIdentity: string | null;
  writingStyles: string | null;
  skills: string | null;
  plugins: string | null;
  agents: string | null;
}

interface UseCategoryLastUpdatedOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseCategoryLastUpdatedReturn {
  timestamps: CategoryTimestamps;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const initialTimestamps: CategoryTimestamps = {
  logo: null,
  colors: null,
  fonts: null,
  artDirection: null,
  textures: null,
  guidelines: null,
  tokens: null,
  architecture: null,
  brandIdentity: null,
  writingStyles: null,
  skills: null,
  plugins: null,
  agents: null,
};

/**
 * Hook to fetch the most recent updated_at timestamp for each category
 * Used to display "Updated X ago" on category cards
 */
export function useCategoryLastUpdated(
  options: UseCategoryLastUpdatedOptions = {}
): UseCategoryLastUpdatedReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [timestamps, setTimestamps] = useState<CategoryTimestamps>(initialTimestamps);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTimestamps = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Query all timestamps in parallel for efficiency
      const [
        logoResult,
        colorsResult,
        fontsResult,
        artResult,
        texturesResult,
        guidelinesResult,
        tokensResult,
        brandIdentityResult,
        writingStylesResult,
        skillsResult,
        pluginsResult,
        agentsResult,
      ] = await Promise.all([
        // Brand Hub: Logo (brand_assets where category='logos')
        supabase
          .from('brand_assets')
          .select('updated_at')
          .eq('brand_id', brandId)
          .eq('category', 'logos')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brand Hub: Colors
        supabase
          .from('brand_colors')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brand Hub: Typography (brand_assets where category='fonts')
        supabase
          .from('brand_assets')
          .select('updated_at')
          .eq('brand_id', brandId)
          .eq('category', 'fonts')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brand Hub: Art Direction (brand_assets where category='art')
        supabase
          .from('brand_assets')
          .select('updated_at')
          .eq('brand_id', brandId)
          .eq('category', 'art')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brand Hub: Textures (brand_assets where category='textures')
        supabase
          .from('brand_assets')
          .select('updated_at')
          .eq('brand_id', brandId)
          .eq('category', 'textures')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brand Hub: Guidelines
        supabase
          .from('brand_guidelines')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brand Hub: Tokens (brand_documents where category='config')
        supabase
          .from('brand_documents')
          .select('updated_at')
          .eq('brand_id', brandId)
          .eq('category', 'config')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brain: Brand Identity
        supabase
          .from('brain_brand_identity')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brain: Writing Styles
        supabase
          .from('brain_writing_styles')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brain: Skills
        supabase
          .from('brain_skills')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brain: Plugins
        supabase
          .from('brain_plugins')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Brain: Agents
        supabase
          .from('brain_agents')
          .select('updated_at')
          .eq('brand_id', brandId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setTimestamps({
        logo: logoResult.data?.updated_at ?? null,
        colors: colorsResult.data?.updated_at ?? null,
        fonts: fontsResult.data?.updated_at ?? null,
        artDirection: artResult.data?.updated_at ?? null,
        textures: texturesResult.data?.updated_at ?? null,
        guidelines: guidelinesResult.data?.updated_at ?? null,
        tokens: tokensResult.data?.updated_at ?? null,
        architecture: null, // Always null - system generated
        brandIdentity: brandIdentityResult.data?.updated_at ?? null,
        writingStyles: writingStylesResult.data?.updated_at ?? null,
        skills: skillsResult.data?.updated_at ?? null,
        plugins: pluginsResult.data?.updated_at ?? null,
        agents: agentsResult.data?.updated_at ?? null,
      });
    } catch (err) {
      console.error('Error fetching category timestamps:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch timestamps'));
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (autoFetch) {
      fetchTimestamps();
    }
  }, [autoFetch, fetchTimestamps]);

  return {
    timestamps,
    isLoading,
    error,
    refresh: fetchTimestamps,
  };
}

export default useCategoryLastUpdated;
