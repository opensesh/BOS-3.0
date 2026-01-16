/**
 * Link Tags API Route
 *
 * GET    /api/links/tags - List all tags for a brand
 * POST   /api/links/tags - Create a new tag
 * PATCH  /api/links/tags - Update a tag
 * DELETE /api/links/tags - Delete a tag
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTagsByBrand,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getOrCreateTag,
  syncTagUsageCounts,
} from '@/lib/supabase/link-tags-service';
import type { ShortLinkTagColor } from '@/lib/supabase/types';

// Default brand ID (demo mode - no auth)
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/links/tags
 * List all tags for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;

    // Optionally sync usage counts first
    if (searchParams.get('sync') === 'true') {
      await syncTagUsageCounts(brandId);
    }

    const tags = await getTagsByBrand(brandId);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/links/tags
 * Create a new tag or get existing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId = DEFAULT_BRAND_ID, name, color, getOrCreate = false } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Validate color if provided
    const validColors: ShortLinkTagColor[] = [
      'gray',
      'red',
      'orange',
      'amber',
      'green',
      'teal',
      'blue',
      'sky',
      'indigo',
      'violet',
      'purple',
      'pink',
    ];

    if (color && !validColors.includes(color)) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }

    let tag;
    if (getOrCreate) {
      tag = await getOrCreateTag(brandId, name, color);
    } else {
      tag = await createTag({
        brand_id: brandId,
        name,
        color: color || 'gray',
      });
    }

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);

    // Handle duplicate error
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value')
    ) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/links/tags
 * Update a tag
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Check tag exists
    const existing = await getTagById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Validate color if provided
    const validColors: ShortLinkTagColor[] = [
      'gray',
      'red',
      'orange',
      'amber',
      'green',
      'teal',
      'blue',
      'sky',
      'indigo',
      'violet',
      'purple',
      'pink',
    ];

    if (color && !validColors.includes(color)) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }

    const updates: { name?: string; color?: ShortLinkTagColor } = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;

    const tag = await updateTag(id, updates);

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/links/tags
 * Delete a tag
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Check tag exists
    const existing = await getTagById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await deleteTag(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
