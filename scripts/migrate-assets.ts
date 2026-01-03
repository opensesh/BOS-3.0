#!/usr/bin/env npx tsx
/**
 * Asset Migration Script
 * 
 * Uploads assets from public/assets/ to Supabase Storage
 * and seeds the brand_assets table with metadata.
 * 
 * Usage: npx tsx scripts/migrate-assets.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Import the existing asset manifest
import { ASSET_MANIFEST } from '../lib/brand-knowledge/asset-manifest';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

interface AssetEntry {
  path: string;
  category: string;
  filename: string;
  variant?: string;
  description?: string;
}

interface MigrationResult {
  uploaded: number;
  skipped: number;
  failed: number;
  errors: string[];
}

async function getBrandId(brandSlug: string): Promise<string> {
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

async function uploadAsset(
  brandId: string,
  brandSlug: string,
  asset: AssetEntry,
  publicDir: string
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    // Convert asset path to local file path
    // Asset paths are like "/assets/logos/brandmark-charcoal.svg"
    const localPath = path.join(publicDir, asset.path);
    
    if (!fs.existsSync(localPath)) {
      return { success: false, error: `File not found: ${localPath}` };
    }

    // Read file
    const fileBuffer = fs.readFileSync(localPath);
    const mimeType = getMimeType(asset.filename);
    const fileSize = fileBuffer.length;

    // Storage path: {brand_slug}/{category}/{filename}
    const storagePath = `${brandSlug}/${asset.category}/${asset.filename}`;

    // Check if already exists
    const { data: existing } = await supabase.storage
      .from('brand-assets')
      .list(`${brandSlug}/${asset.category}`, {
        search: asset.filename,
      });

    if (existing && existing.length > 0) {
      // File already exists, skip upload but still insert metadata
      return { success: true, storagePath };
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    return { success: true, storagePath };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function insertAssetMetadata(
  brandId: string,
  asset: AssetEntry,
  storagePath: string,
  fileSize: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const mimeType = getMimeType(asset.filename);
    
    // Generate a better name from filename
    const name = asset.filename
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ')   // Replace dashes/underscores with spaces
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim();

    const { error } = await supabase
      .from('brand_assets')
      .upsert({
        brand_id: brandId,
        name: name || asset.filename,
        filename: asset.filename,
        description: asset.description || `${asset.category} asset: ${name}`,
        category: asset.category,
        variant: asset.variant || null,
        storage_path: storagePath,
        mime_type: mimeType,
        file_size: fileSize,
        metadata: {
          original_path: asset.path,
        },
      }, {
        onConflict: 'brand_id,storage_path',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function migrateCategory(
  brandId: string,
  brandSlug: string,
  category: string,
  assets: AssetEntry[],
  publicDir: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    uploaded: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  console.log(`\n📁 Migrating ${category}: ${assets.length} assets`);

  for (const asset of assets) {
    const localPath = path.join(publicDir, asset.path);
    const fileSize = fs.existsSync(localPath) ? fs.statSync(localPath).size : 0;
    
    // Upload file
    const uploadResult = await uploadAsset(brandId, brandSlug, asset, publicDir);
    
    if (!uploadResult.success) {
      result.failed++;
      result.errors.push(`Upload failed for ${asset.filename}: ${uploadResult.error}`);
      continue;
    }

    // Insert metadata
    const metadataResult = await insertAssetMetadata(
      brandId,
      asset,
      uploadResult.storagePath!,
      fileSize
    );

    if (!metadataResult.success) {
      result.failed++;
      result.errors.push(`Metadata insert failed for ${asset.filename}: ${metadataResult.error}`);
      continue;
    }

    result.uploaded++;
    process.stdout.write('.');
  }

  console.log(`\n  ✓ ${result.uploaded} uploaded, ${result.skipped} skipped, ${result.failed} failed`);
  
  return result;
}

async function main() {
  console.log('🚀 Starting asset migration to Supabase Storage\n');
  
  // Get the project root directory
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');
  
  console.log(`📂 Project root: ${projectRoot}`);
  console.log(`📂 Public directory: ${publicDir}`);

  // Get brand ID for Open Session
  const brandSlug = 'open-session';
  let brandId: string;
  
  try {
    brandId = await getBrandId(brandSlug);
    console.log(`✓ Found brand "${brandSlug}" with ID: ${brandId}`);
  } catch (err) {
    console.error(`✗ ${err}`);
    process.exit(1);
  }

  // Track overall results
  const totalResult: MigrationResult = {
    uploaded: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Migrate each category
  const categories = Object.keys(ASSET_MANIFEST) as Array<keyof typeof ASSET_MANIFEST>;
  
  for (const category of categories) {
    const assets = ASSET_MANIFEST[category] as AssetEntry[];
    const result = await migrateCategory(brandId, brandSlug, category, assets, publicDir);
    
    totalResult.uploaded += result.uploaded;
    totalResult.skipped += result.skipped;
    totalResult.failed += result.failed;
    totalResult.errors.push(...result.errors);
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('='.repeat(50));
  console.log(`✓ Uploaded: ${totalResult.uploaded}`);
  console.log(`⊘ Skipped:  ${totalResult.skipped}`);
  console.log(`✗ Failed:   ${totalResult.failed}`);
  
  if (totalResult.errors.length > 0) {
    console.log('\n❌ Errors:');
    totalResult.errors.forEach(err => console.log(`  - ${err}`));
  }

  // Verify final count
  const { count } = await supabase
    .from('brand_assets')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId);

  console.log(`\n📦 Total assets in database for "${brandSlug}": ${count}`);
  
  if (totalResult.failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

