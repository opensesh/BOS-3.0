/**
 * API Route: Brain Brand Identity
 * 
 * Handles CRUD operations for brand identity documents
 * from the brain_brand_identity table (new architecture).
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getBrandIdentityDocs,
  getBrandIdentityDocById,
  getBrandIdentityDocBySlug,
  createBrandIdentityDoc,
  updateBrandIdentityDoc,
  deleteBrandIdentityDoc,
} from '@/lib/supabase/brain-brand-identity-service';

// Temporary default brand ID - in production this would come from auth
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/brain/brand-identity
 * 
 * Query params:
 * - id: Get a specific document by ID
 * - slug: Get a specific document by slug
 * - (none): Get all brand identity documents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;

    // Get by ID
    if (id) {
      const doc = await getBrandIdentityDocById(id);
      if (!doc) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(doc);
    }

    // Get by slug
    if (slug) {
      const doc = await getBrandIdentityDocBySlug(brandId, slug);
      if (!doc) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(doc);
    }

    // Get all documents
    const docs = await getBrandIdentityDocs(brandId);
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Error fetching brand identity docs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brain/brand-identity
 * 
 * Create a new brand identity document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brandId = body.brandId || DEFAULT_BRAND_ID;

    const doc = await createBrandIdentityDoc({
      brand_id: brandId,
      slug: body.slug,
      title: body.title,
      content: body.content || '',
      file_type: body.fileType || 'markdown',
      storage_path: body.storagePath,
      file_size: body.fileSize,
      mime_type: body.mimeType,
      sort_order: body.sortOrder || 0,
      file_path: body.filePath,
      file_hash: body.fileHash,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Error creating brand identity doc:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/brain/brand-identity
 * 
 * Update a brand identity document
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.fileType !== undefined) dbUpdates.file_type = updates.fileType;
    if (updates.storagePath !== undefined) dbUpdates.storage_path = updates.storagePath;
    if (updates.fileSize !== undefined) dbUpdates.file_size = updates.fileSize;
    if (updates.mimeType !== undefined) dbUpdates.mime_type = updates.mimeType;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.filePath !== undefined) dbUpdates.file_path = updates.filePath;
    if (updates.fileHash !== undefined) dbUpdates.file_hash = updates.fileHash;
    if (updates.syncStatus !== undefined) dbUpdates.sync_status = updates.syncStatus;

    const doc = await updateBrandIdentityDoc(id, dbUpdates);
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error updating brand identity doc:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brain/brand-identity
 * 
 * Soft delete a brand identity document
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    await deleteBrandIdentityDoc(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand identity doc:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
