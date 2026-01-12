/**
 * API Route for sync operations
 *
 * Provides endpoints for triggering sync operations between
 * local .claude/ files and the Supabase database.
 *
 * GET /api/sync - Get sync status and statistics
 * POST /api/sync - Trigger sync operation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  syncOrchestrator,
  syncAll,
  syncDocument,
  checkConflicts,
  resolveDocumentConflict,
} from '@/lib/sync';
import type { SyncDirection } from '@/lib/sync';

/**
 * GET /api/sync - Get sync status
 *
 * Returns sync statistics including:
 * - Total documents
 * - Synced count
 * - Pending counts
 * - Conflict count
 * - Last sync time
 */
export async function GET() {
  try {
    const stats = await syncOrchestrator.getStats();
    const conflicts = await checkConflicts();
    const conflictDocuments = conflicts
      .filter((c) => c.hasConflict)
      .map((c) => ({
        id: c.document.id,
        title: c.document.title,
        filePath: c.document.filePath,
      }));

    return NextResponse.json({
      success: true,
      stats,
      conflicts: conflictDocuments,
      queueLength: syncOrchestrator.getQueueLength(),
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync - Trigger sync operation
 *
 * Request body:
 * - direction: 'db_to_local' | 'local_to_db' | 'auto' (default: 'db_to_local')
 * - documentId: Optional specific document to sync
 * - resolution: 'keep_local' | 'keep_db' (for conflict resolution)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      direction = 'db_to_local',
      documentId,
      resolution,
    } = body as {
      direction?: SyncDirection | 'auto';
      documentId?: string;
      resolution?: 'keep_local' | 'keep_db';
    };

    // Handle conflict resolution
    if (documentId && resolution) {
      const result = await resolveDocumentConflict(documentId, resolution);
      return NextResponse.json({
        success: result.success,
        result,
      });
    }

    // Handle specific document sync
    if (documentId) {
      const result = await syncDocument(
        documentId,
        direction === 'auto' ? 'none' : direction
      );
      return NextResponse.json({
        success: result.success,
        result,
      });
    }

    // Handle full sync
    const syncDirection: SyncDirection =
      direction === 'auto' ? 'none' : direction;
    const results = await syncAll(syncDirection);

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const conflicts = results.filter((r) => r.conflict);

    return NextResponse.json({
      success: failed.length === 0,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        conflicts: conflicts.length,
      },
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
