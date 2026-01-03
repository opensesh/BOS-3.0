/**
 * API Routes for Brand Document Version History
 * 
 * GET /api/brain/versions - Get version history for a document
 * POST /api/brain/versions/restore - Restore to a specific version
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getVersionHistory,
  getVersion,
  restoreToVersion,
  getLatestVersion,
} from '@/lib/supabase/brand-documents-service';

// ============================================
// GET - Get version history
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const versionNumber = searchParams.get('version');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get specific version
    if (versionNumber) {
      const version = await getVersion(documentId, parseInt(versionNumber, 10));
      if (!version) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(version);
    }

    // Get all versions for document
    const versions = await getVersionHistory(documentId);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error in GET /api/brain/versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Restore to version
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, versionNumber, createdBy } = body;

    if (!documentId || !versionNumber) {
      return NextResponse.json(
        { error: 'Document ID and version number are required' },
        { status: 400 }
      );
    }

    // Check version exists
    const version = await getVersion(documentId, versionNumber);
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Restore to version
    const document = await restoreToVersion(documentId, versionNumber, createdBy);

    return NextResponse.json({
      document,
      message: `Restored to version ${versionNumber}`,
    });
  } catch (error) {
    console.error('Error in POST /api/brain/versions:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper endpoint for getting latest version
// ============================================

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return new NextResponse(null, { status: 400 });
    }

    const latest = await getLatestVersion(documentId);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Latest-Version': latest?.versionNumber?.toString() || '0',
        'X-Version-Count': latest?.versionNumber?.toString() || '0',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

