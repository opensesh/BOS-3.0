/**
 * Brand Asset Download Proxy
 *
 * Proxies brand asset downloads through a branded URL,
 * hiding the underlying storage infrastructure from consumers.
 *
 * URL Pattern: /api/brand/assets/download/{storage_path}
 *
 * Example:
 *   /api/brand/assets/download/logos/brandmark-vanilla.svg
 *   → proxies from Supabase storage: brand-assets/logos/brandmark-vanilla.svg
 *
 * Query params:
 *   ?bucket=brand-guidelines  → fetch from brand-guidelines bucket instead
 */

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_BUCKETS = ['brand-assets', 'brand-guidelines'] as const;
type AllowedBucket = typeof ALLOWED_BUCKETS[number];

const MIME_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.json': 'application/json',
  '.css': 'text/css',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const storagePath = path.join('/');

  // Security: prevent path traversal
  if (storagePath.includes('..') || storagePath.includes('//')) {
    return NextResponse.json(
      { error: 'Invalid asset path' },
      { status: 400 }
    );
  }

  // Determine bucket from query param (default: brand-assets)
  const bucketParam = request.nextUrl.searchParams.get('bucket') || 'brand-assets';
  const bucket = ALLOWED_BUCKETS.includes(bucketParam as AllowedBucket)
    ? bucketParam
    : 'brand-assets';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Storage not configured' },
      { status: 500 }
    );
  }

  // Construct the upstream URL
  const upstreamUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

  try {
    const response = await fetch(upstreamUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Determine content type
    const ext = '.' + storagePath.split('.').pop()?.toLowerCase();
    const contentType = MIME_TYPES[ext] || response.headers.get('content-type') || 'application/octet-stream';

    // Stream the response
    const body = response.body;
    if (!body) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'X-Content-Type-Options': 'nosniff',
        'X-Served-By': 'Brand Operating System',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve asset' },
      { status: 502 }
    );
  }
}
