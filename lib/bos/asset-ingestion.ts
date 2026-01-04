/**
 * Asset Ingestion Service
 * 
 * Orchestrates the asset embedding pipeline:
 * 1. Fetch assets from brand_assets
 * 2. Enrich descriptions using LLM
 * 3. Generate embeddings for enriched descriptions
 * 4. Update brand_assets with embeddings
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, generateEmbeddings, enrichAssetDescription } from './embedding-service';

// Types
export interface AssetIngestResult {
  success: boolean;
  assetsProcessed: number;
  assetsSkipped: number;
  errors: string[];
  results: Array<{
    assetId: string;
    name: string;
    category: string;
    enrichedDescription: string;
  }>;
}

interface BrandAsset {
  id: string;
  brand_id: string;
  name: string;
  filename: string;
  description: string;
  category: string;
  variant: string | null;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
}

/**
 * Get Supabase client with service role key for admin operations
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Get brand ID from slug
 */
async function getBrandId(supabase: ReturnType<typeof createClient>, brandSlug: string): Promise<string> {
  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .single();

  if (error || !data) {
    throw new Error(`Brand not found: ${brandSlug}`);
  }

  return data.id;
}

/**
 * Enrich and embed a single asset
 */
export async function enrichAndEmbedAsset(
  asset: BrandAsset,
  options?: { skipEnrichment?: boolean }
): Promise<{ enrichedDescription: string; embedding: number[] }> {
  // Enrich the description using LLM (unless skipped)
  let enrichedDescription = asset.description;
  
  if (!options?.skipEnrichment) {
    enrichedDescription = await enrichAssetDescription({
      name: asset.name,
      filename: asset.filename,
      description: asset.description,
      category: asset.category,
      variant: asset.variant || undefined,
      metadata: asset.metadata,
    });
  }

  // Generate embedding for the enriched description
  const embedding = await generateEmbedding(enrichedDescription);

  return { enrichedDescription, embedding };
}

/**
 * Ingest all assets for a brand with LLM enrichment
 */
export async function ingestAllAssets(
  brandSlug: string,
  options?: {
    /** Only process specific categories */
    categories?: string[];
    /** Skip LLM enrichment (use existing descriptions) */
    skipEnrichment?: boolean;
    /** Only process assets without embeddings */
    onlyMissing?: boolean;
    /** Batch size for embedding generation */
    batchSize?: number;
    /** Store enriched descriptions back to DB */
    storeEnrichedDescriptions?: boolean;
  }
): Promise<AssetIngestResult> {
  const supabase = getSupabaseAdmin();
  const result: AssetIngestResult = {
    success: true,
    assetsProcessed: 0,
    assetsSkipped: 0,
    errors: [],
    results: [],
  };

  const batchSize = options?.batchSize || 10;

  try {
    // 1. Get brand ID
    const brandId = await getBrandId(supabase, brandSlug);

    // 2. Build query for assets
    let query = supabase
      .from('brand_assets')
      .select('*')
      .eq('brand_id', brandId);

    if (options?.categories && options.categories.length > 0) {
      query = query.in('category', options.categories);
    }

    if (options?.onlyMissing) {
      query = query.is('embedding', null);
    }

    const { data: assets, error: fetchError } = await query.order('category').order('name');

    if (fetchError) {
      throw new Error(`Failed to fetch assets: ${fetchError.message}`);
    }

    if (!assets || assets.length === 0) {
      console.log('No assets found to process');
      return result;
    }

    console.log(`Found ${assets.length} assets to process\n`);

    // 3. Process assets in batches
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize) as BrandAsset[];
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(assets.length / batchSize)} (${batch.length} assets)`);

      // Enrich descriptions for the batch
      const enrichedDescriptions: string[] = [];
      
      for (const asset of batch) {
        try {
          let enrichedDescription = asset.description;
          
          if (!options?.skipEnrichment) {
            console.log(`  🔄 Enriching: ${asset.name} (${asset.category})`);
            enrichedDescription = await enrichAssetDescription({
              name: asset.name,
              filename: asset.filename,
              description: asset.description,
              category: asset.category,
              variant: asset.variant || undefined,
              metadata: asset.metadata,
            });
          }
          
          enrichedDescriptions.push(enrichedDescription);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`${asset.name}: ${errorMsg}`);
          enrichedDescriptions.push(asset.description); // Fall back to original
        }
      }

      // Generate embeddings for the batch
      console.log(`  📊 Generating embeddings for ${batch.length} assets...`);
      const embeddings = await generateEmbeddings(enrichedDescriptions);

      // Update each asset in the database
      for (let j = 0; j < batch.length; j++) {
        const asset = batch[j];
        const embedding = embeddings[j];
        const enrichedDescription = enrichedDescriptions[j];

        try {
          const updateData: Record<string, unknown> = {
            embedding,
          };

          // Optionally store the enriched description
          if (options?.storeEnrichedDescriptions && enrichedDescription !== asset.description) {
            updateData.description = enrichedDescription;
          }

          const { error: updateError } = await supabase
            .from('brand_assets')
            .update(updateData)
            .eq('id', asset.id);

          if (updateError) {
            throw new Error(updateError.message);
          }

          result.assetsProcessed++;
          result.results.push({
            assetId: asset.id,
            name: asset.name,
            category: asset.category,
            enrichedDescription: enrichedDescription.slice(0, 100) + '...',
          });

          console.log(`  ✓ ${asset.name}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`${asset.name}: ${errorMsg}`);
          console.log(`  ✗ ${asset.name}: ${errorMsg}`);
        }
      }
    }

    result.success = result.errors.length === 0;

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Get the current state of asset embeddings
 */
export async function getAssetEmbeddingStatus(brandSlug: string): Promise<{
  totalAssets: number;
  assetsWithEmbeddings: number;
  byCategory: Record<string, { total: number; withEmbeddings: number }>;
}> {
  const supabase = getSupabaseAdmin();
  const brandId = await getBrandId(supabase, brandSlug);

  // Get all assets with their embedding status
  const { data: assets, error } = await supabase
    .from('brand_assets')
    .select('id, category, embedding')
    .eq('brand_id', brandId);

  if (error || !assets) {
    throw new Error(`Failed to fetch assets: ${error?.message}`);
  }

  const byCategory: Record<string, { total: number; withEmbeddings: number }> = {};

  for (const asset of assets) {
    if (!byCategory[asset.category]) {
      byCategory[asset.category] = { total: 0, withEmbeddings: 0 };
    }
    byCategory[asset.category].total++;
    if (asset.embedding) {
      byCategory[asset.category].withEmbeddings++;
    }
  }

  const totalAssets = assets.length;
  const assetsWithEmbeddings = assets.filter(a => a.embedding).length;

  return {
    totalAssets,
    assetsWithEmbeddings,
    byCategory,
  };
}

/**
 * Ingest brand colors (for completeness)
 */
export async function ingestBrandColors(brandSlug: string): Promise<{
  success: boolean;
  colorsProcessed: number;
  errors: string[];
}> {
  const supabase = getSupabaseAdmin();
  const result = {
    success: true,
    colorsProcessed: 0,
    errors: [] as string[],
  };

  try {
    const brandId = await getBrandId(supabase, brandSlug);

    // Fetch colors with descriptions or usage guidelines
    const { data: colors, error } = await supabase
      .from('brand_colors')
      .select('id, name, hex_value, description, usage_guidelines, color_group, color_role')
      .eq('brand_id', brandId)
      .eq('is_active', true);

    if (error || !colors) {
      throw new Error(`Failed to fetch colors: ${error?.message}`);
    }

    // Build searchable text for each color
    const colorTexts = colors.map(color => {
      const parts = [
        `Color: ${color.name}`,
        `Hex: ${color.hex_value}`,
        color.color_group ? `Group: ${color.color_group}` : '',
        color.color_role ? `Role: ${color.color_role}` : '',
        color.description || '',
        color.usage_guidelines || '',
      ].filter(Boolean);
      return parts.join('. ');
    });

    // Note: brand_colors table doesn't have an embedding column in the current schema
    // This function is here for future expansion if needed
    console.log(`Found ${colors.length} colors (embedding storage not yet implemented for colors)`);
    result.colorsProcessed = colors.length;

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

