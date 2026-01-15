/**
 * Short Links API Route
 *
 * GET  /api/links - List links with filtering and pagination
 * POST /api/links - Create a new link
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLinksByBrand,
  createLink,
  getLinkStats,
  type LinkQueryOptions,
} from '@/lib/supabase/links-service';
import type { ShortLinkInsert } from '@/lib/supabase/types';

// Default brand ID (demo mode - no auth)
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/links
 * List links with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query options
    const options: LinkQueryOptions = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      sortBy:
        (searchParams.get('sortBy') as LinkQueryOptions['sortBy']) || 'created',
      sortOrder:
        (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      includeArchived: searchParams.get('includeArchived') === 'true',
      includeInactive: searchParams.get('includeInactive') === 'true',
    };

    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;

    // Fetch links
    const result = await getLinksByBrand(brandId, options);

    // Optionally include stats
    let stats = null;
    if (searchParams.get('includeStats') === 'true') {
      stats = await getLinkStats(brandId);
    }

    return NextResponse.json({
      ...result,
      stats,
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/links
 * Create a new link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      brandId = DEFAULT_BRAND_ID,
      shortCode,
      domain,
      destinationUrl,
      title,
      description,
      tags,
      password,
      expiresAt,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    } = body;

    // Validate required fields
    if (!destinationUrl) {
      return NextResponse.json(
        { error: 'Destination URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid destination URL' },
        { status: 400 }
      );
    }

    // Build insert data
    const linkData: ShortLinkInsert = {
      brand_id: brandId,
      short_code: shortCode || '', // Will be auto-generated if empty
      domain: domain || 'opensesh.app',
      destination_url: destinationUrl,
      title,
      description,
      tags: tags || [],
      expires_at: expiresAt,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
    };

    // Handle password (would need bcrypt in production)
    if (password) {
      // For now, store as-is. In production, use bcrypt:
      // linkData.password_hash = await bcrypt.hash(password, 10);
      linkData.password_hash = password; // TODO: Hash this
    }

    const link = await createLink(linkData);

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);

    // Handle duplicate short code error
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value')
    ) {
      return NextResponse.json(
        { error: 'Short code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}
