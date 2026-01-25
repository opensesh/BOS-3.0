/**
 * Logo Bundle Download Endpoint
 *
 * Creates a ZIP file containing all brand logos for easy download.
 * This provides a better UX for MCP clients that want the full logo set.
 *
 * GET /api/brand/assets/bundle/logos
 * GET /api/brand/assets/bundle/logos?variant=vanilla  (filter by color variant)
 *
 * Returns: brand-logos-{date}.zip
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

interface BrandAsset {
  id: string;
  filename: string;
  storage_path: string;
  variant: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get('variant');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Storage not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Query logos from brand_assets
  let query = supabase
    .from('brand_assets')
    .select('id, filename, storage_path, variant')
    .eq('category', 'logos');

  if (variant) {
    // Filter by variant (e.g., "vanilla", "charcoal", "glass")
    // Variants in the DB are like "brandmark-vanilla", so we use ilike
    query = query.ilike('variant', `%${variant}%`);
  }

  const { data: logos, error } = await query;

  if (error) {
    console.error('Failed to fetch logos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logos' },
      { status: 500 }
    );
  }

  if (!logos || logos.length === 0) {
    return NextResponse.json(
      { error: 'No logos found' },
      { status: 404 }
    );
  }

  const zip = new JSZip();

  // Fetch and add each logo to the ZIP
  const fetchPromises = (logos as BrandAsset[]).map(async (logo) => {
    // Skip if storage_path is empty or a full URL (legacy)
    if (!logo.storage_path || logo.storage_path.startsWith('http')) {
      return;
    }

    const fileUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${logo.storage_path}`;

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch logo: ${logo.filename}`);
        return;
      }

      const buffer = await response.arrayBuffer();
      zip.file(logo.filename, buffer);
    } catch (err) {
      console.warn(`Error fetching logo ${logo.filename}:`, err);
    }
  });

  await Promise.all(fetchPromises);

  // Check if we added any files
  if (Object.keys(zip.files).length === 0) {
    return NextResponse.json(
      { error: 'No logos could be bundled' },
      { status: 404 }
    );
  }

  // Generate the ZIP
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Create filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = variant
    ? `brand-logos-${variant}-${date}.zip`
    : `brand-logos-${date}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Served-By': 'Brand Operating System',
    },
  });
}
