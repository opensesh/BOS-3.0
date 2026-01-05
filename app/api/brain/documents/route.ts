/**
 * API Routes for Brand Documents CRUD operations
 * 
 * GET /api/brain/documents - List documents (with optional category filter)
 * POST /api/brain/documents - Create a new document
 * PUT /api/brain/documents - Update a document
 * DELETE /api/brain/documents - Delete a document (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDocumentsByCategory,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  restoreDocument,
  getAllDocuments,
  generateSlug,
  isSlugAvailable,
} from '@/lib/supabase/brand-documents-service';
import { getDefaultBrandId } from '@/lib/supabase/brand-assets-service';
import type { BrandDocumentCategory, BrandDocumentInsert, BrandDocumentUpdate } from '@/lib/supabase/types';

// ============================================
// GET - List documents
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as BrandDocumentCategory | null;
    const id = searchParams.get('id');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // Get single document by ID
    if (id) {
      const document = await getDocumentById(id);
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(document);
    }

    // Get documents by category or all
    const documents = category
      ? await getDocumentsByCategory(category, includeDeleted)
      : await getAllDocuments(includeDeleted);

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error in GET /api/brain/documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create document
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, title, content, icon } = body;

    // Validate required fields
    if (!category || !title) {
      return NextResponse.json(
        { error: 'Category and title are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!['brand-identity', 'writing-styles', 'skills'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Get the default brand ID
    const brandId = await getDefaultBrandId();

    // Generate slug from title
    let slug = generateSlug(title);

    // Ensure slug is unique
    let slugCounter = 0;
    let baseSlug = slug;
    while (!(await isSlugAvailable(category, slug))) {
      slugCounter++;
      slug = `${baseSlug}-${slugCounter}`;
    }

    // Create document
    const documentData: BrandDocumentInsert = {
      brand_id: brandId,
      category,
      slug,
      title,
      content: content || '',
      icon: icon || 'file-text',
    };

    const document = await createDocument(documentData);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/brain/documents:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update document
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, icon, changeSummary, createdBy } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check document exists
    const existingDoc = await getDocumentById(id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: BrandDocumentUpdate = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (icon !== undefined) updates.icon = icon;

    // Update document
    const document = await updateDocument(id, updates, changeSummary, createdBy);

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error in PUT /api/brain/documents:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete document (soft delete)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const restore = searchParams.get('restore') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check document exists
    const existingDoc = await getDocumentById(id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Restore or delete
    if (restore) {
      const document = await restoreDocument(id);
      return NextResponse.json(document);
    } else {
      await deleteDocument(id);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error in DELETE /api/brain/documents:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

