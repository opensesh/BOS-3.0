/**
 * Individual Short Link API Route
 *
 * GET    /api/links/[id] - Get a single link
 * PATCH  /api/links/[id] - Update a link
 * DELETE /api/links/[id] - Delete a link
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLinkById,
  updateLink,
  deleteLink,
  archiveLink,
  duplicateLink,
  isShortCodeAvailable,
} from '@/lib/supabase/links-service';
import { getAnalytics } from '@/lib/supabase/link-analytics-service';
import type { ShortLinkUpdate } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/links/[id]
 * Get a single link with optional analytics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const link = await getLinkById(id);

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Optionally include analytics
    let analytics = null;
    if (searchParams.get('includeAnalytics') === 'true') {
      const period =
        (searchParams.get('period') as '7d' | '30d' | '90d' | 'all') || '30d';
      analytics = await getAnalytics(id, period);
    }

    return NextResponse.json({
      link,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/links/[id]
 * Update a link
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get existing link
    const existingLink = await getLinkById(id);
    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const {
      shortCode,
      destinationUrl,
      title,
      description,
      tags,
      password,
      removePassword,
      expiresAt,
      removeExpiration,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      isActive,
      isArchived,
    } = body;

    // Validate destination URL if provided
    if (destinationUrl) {
      try {
        new URL(destinationUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid destination URL' },
          { status: 400 }
        );
      }
    }

    // Check short code availability if changing
    if (shortCode && shortCode !== existingLink.shortCode) {
      const available = await isShortCodeAvailable(
        existingLink.brandId,
        shortCode,
        existingLink.domain,
        id
      );
      if (!available) {
        return NextResponse.json(
          { error: 'Short code already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updates: ShortLinkUpdate = {};

    if (shortCode !== undefined) updates.short_code = shortCode;
    if (destinationUrl !== undefined) updates.destination_url = destinationUrl;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (isActive !== undefined) updates.is_active = isActive;
    if (isArchived !== undefined) updates.is_archived = isArchived;

    // Handle password
    if (removePassword) {
      updates.password_hash = null;
    } else if (password) {
      // TODO: Hash password with bcrypt
      updates.password_hash = password;
    }

    // Handle expiration
    if (removeExpiration) {
      updates.expires_at = null;
    } else if (expiresAt !== undefined) {
      updates.expires_at = expiresAt;
    }

    // Handle UTM params (allow setting to null to remove)
    if (utmSource !== undefined) updates.utm_source = utmSource;
    if (utmMedium !== undefined) updates.utm_medium = utmMedium;
    if (utmCampaign !== undefined) updates.utm_campaign = utmCampaign;
    if (utmTerm !== undefined) updates.utm_term = utmTerm;
    if (utmContent !== undefined) updates.utm_content = utmContent;

    const link = await updateLink(id, updates);

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/links/[id]
 * Delete a link (soft delete by default, hard delete with ?hard=true)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Check if link exists
    const link = await getLinkById(id);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const action = searchParams.get('action');

    if (action === 'archive') {
      // Soft delete (archive)
      const archivedLink = await archiveLink(id);
      return NextResponse.json(archivedLink);
    } else if (action === 'duplicate') {
      // Duplicate the link
      const duplicatedLink = await duplicateLink(id);
      return NextResponse.json(duplicatedLink, { status: 201 });
    } else if (searchParams.get('hard') === 'true') {
      // Hard delete
      await deleteLink(id);
      return NextResponse.json({ success: true });
    } else {
      // Default: archive
      const archivedLink = await archiveLink(id);
      return NextResponse.json(archivedLink);
    }
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}
