/**
 * API Route: Brain Writing Styles
 *
 * Handles CRUD operations for writing style documents
 * from the brain_writing_styles table (new architecture).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWritingStyles,
  getWritingStyleById,
  getWritingStyleBySlug,
  createWritingStyle,
  updateWritingStyle,
  deleteWritingStyle,
  generateWritingStyleSlug,
} from '@/lib/supabase/brain-writing-styles-service';

// Temporary default brand ID - in production this would come from auth
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/brain/writing-styles
 *
 * Query params:
 * - id: Get a specific style by ID
 * - slug: Get a specific style by slug
 * - (none): Get all writing styles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;

    // Get by ID
    if (id) {
      const style = await getWritingStyleById(id);
      if (!style) {
        return NextResponse.json(
          { error: 'Writing style not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(style);
    }

    // Get by slug
    if (slug) {
      const style = await getWritingStyleBySlug(brandId, slug);
      if (!style) {
        return NextResponse.json(
          { error: 'Writing style not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(style);
    }

    // Get all writing styles
    const styles = await getWritingStyles(brandId);
    return NextResponse.json(styles);
  } catch (error) {
    console.error('Error fetching writing styles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writing styles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brain/writing-styles
 *
 * Create a new writing style
 *
 * Body: { title, content, slug?, metadata? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brandId = body.brandId || DEFAULT_BRAND_ID;

    const slug = body.slug || generateWritingStyleSlug(body.title);

    const style = await createWritingStyle({
      brand_id: brandId,
      slug,
      title: body.title,
      content: body.content || '',
      sort_order: body.sortOrder || 0,
      metadata: body.metadata,
      file_path: body.filePath,
      file_hash: body.fileHash,
    });

    return NextResponse.json(style, { status: 201 });
  } catch (error) {
    console.error('Error creating writing style:', error);
    return NextResponse.json(
      { error: 'Failed to create writing style' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/brain/writing-styles
 *
 * Update a writing style
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Writing style ID is required' },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.filePath !== undefined) dbUpdates.file_path = updates.filePath;
    if (updates.fileHash !== undefined) dbUpdates.file_hash = updates.fileHash;
    if (updates.syncStatus !== undefined) dbUpdates.sync_status = updates.syncStatus;

    const style = await updateWritingStyle(id, dbUpdates);
    return NextResponse.json(style);
  } catch (error) {
    console.error('Error updating writing style:', error);
    return NextResponse.json(
      { error: 'Failed to update writing style' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brain/writing-styles
 *
 * Soft delete a writing style
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Writing style ID is required' },
        { status: 400 }
      );
    }

    await deleteWritingStyle(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting writing style:', error);
    return NextResponse.json(
      { error: 'Failed to delete writing style' },
      { status: 500 }
    );
  }
}
