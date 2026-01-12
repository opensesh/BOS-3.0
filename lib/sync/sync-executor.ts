/**
 * Sync Executor
 *
 * Handles the actual execution of sync operations between
 * local files and the Supabase database.
 */

import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import {
  computeNormalizedHash,
  normalizeContent,
  contentChanged,
} from './hash-utils';
import {
  updateDocumentSync,
  updateDocumentWithSync,
  logSyncOperation,
  getDocumentByFilePath,
} from '@/lib/supabase/sync-service';
import type {
  SyncableDocument,
  SyncResult,
  SyncDirection,
  SyncTrigger,
  ConflictInfo,
} from './types';

const PROJECT_ROOT = process.cwd();

/**
 * Sync database content to local file
 *
 * Writes the database content to the local file system.
 * Used when the database is the source of truth.
 */
export async function syncDbToLocal(
  document: SyncableDocument,
  trigger: SyncTrigger
): Promise<SyncResult> {
  const filePath = join(PROJECT_ROOT, document.filePath);

  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Normalize and write content
    const content = normalizeContent(document.content);
    await writeFile(filePath, content, 'utf8');

    // Compute new hash
    const newHash = computeNormalizedHash(document.content);

    // Update database with sync status
    await updateDocumentSync(document.id, {
      file_hash: newHash,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
      sync_direction: 'none',
    });

    // Log the operation
    await logSyncOperation({
      document_id: document.id,
      sync_direction: 'db_to_local',
      sync_status: 'success',
      content_hash_before: document.fileHash || undefined,
      content_hash_after: newHash,
      triggered_by: trigger,
    });

    return {
      success: true,
      direction: 'db_to_local',
      documentId: document.id,
      filePath: document.filePath,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await logSyncOperation({
      document_id: document.id,
      sync_direction: 'db_to_local',
      sync_status: 'failed',
      error_message: errorMessage,
      triggered_by: trigger,
    });

    return {
      success: false,
      direction: 'db_to_local',
      documentId: document.id,
      filePath: document.filePath,
      error: errorMessage,
    };
  }
}

/**
 * Sync local file to database
 *
 * Reads the local file and updates the database content.
 * Used when local files are modified.
 */
export async function syncLocalToDb(
  document: SyncableDocument,
  trigger: SyncTrigger
): Promise<SyncResult> {
  const filePath = join(PROJECT_ROOT, document.filePath);

  try {
    // Read local file
    const content = await readFile(filePath, 'utf8');
    const normalizedContent = normalizeContent(content);
    const newHash = computeNormalizedHash(content);

    // Check if content actually changed
    if (!contentChanged(document.fileHash, newHash)) {
      return {
        success: true,
        direction: 'none',
        documentId: document.id,
        filePath: document.filePath,
      };
    }

    // Update database with new content
    await updateDocumentWithSync(document.id, normalizedContent, newHash, trigger);

    return {
      success: true,
      direction: 'local_to_db',
      documentId: document.id,
      filePath: document.filePath,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await logSyncOperation({
      document_id: document.id,
      sync_direction: 'local_to_db',
      sync_status: 'failed',
      error_message: errorMessage,
      triggered_by: trigger,
    });

    return {
      success: false,
      direction: 'local_to_db',
      documentId: document.id,
      filePath: document.filePath,
      error: errorMessage,
    };
  }
}

/**
 * Check if local file exists and get its hash
 */
export async function getLocalFileInfo(
  filePath: string
): Promise<{ exists: boolean; hash?: string; content?: string }> {
  const fullPath = join(PROJECT_ROOT, filePath);

  try {
    const fileStat = await stat(fullPath);
    if (!fileStat.isFile()) {
      return { exists: false };
    }

    const content = await readFile(fullPath, 'utf8');
    const hash = computeNormalizedHash(content);

    return { exists: true, hash, content };
  } catch {
    return { exists: false };
  }
}

/**
 * Detect conflicts between local file and database
 *
 * A conflict exists when:
 * - Both local and database have changed since last sync
 * - The changes are different (hashes don't match)
 */
export async function detectConflict(
  document: SyncableDocument
): Promise<ConflictInfo | null> {
  const localInfo = await getLocalFileInfo(document.filePath);

  if (!localInfo.exists || !localInfo.hash || !localInfo.content) {
    // No local file, no conflict
    return null;
  }

  const localHash = localInfo.hash;
  const dbHash = computeNormalizedHash(document.content);
  const storedHash = document.fileHash;

  // If either local or DB matches the stored hash, no conflict
  if (localHash === storedHash || dbHash === storedHash) {
    return null;
  }

  // If local and DB have the same content (despite different from stored), no conflict
  if (localHash === dbHash) {
    return null;
  }

  // Conflict detected - both sides changed differently
  return {
    localContent: localInfo.content,
    localHash,
    dbContent: document.content,
    dbHash,
    localModifiedAt: new Date(), // Could be improved with actual file mtime
    dbModifiedAt: new Date(document.lastSyncedAt || Date.now()),
  };
}

/**
 * Resolve a conflict by choosing one side
 */
export async function resolveConflict(
  document: SyncableDocument,
  resolution: 'keep_local' | 'keep_db',
  trigger: SyncTrigger
): Promise<SyncResult> {
  if (resolution === 'keep_local') {
    return syncLocalToDb(document, trigger);
  } else {
    return syncDbToLocal(document, trigger);
  }
}

/**
 * Perform initial sync for a document
 *
 * Compares hashes and syncs in the appropriate direction.
 * Since Supabase is the source of truth, DB → Local takes precedence.
 */
export async function performInitialSync(
  document: SyncableDocument,
  trigger: SyncTrigger
): Promise<SyncResult> {
  const localInfo = await getLocalFileInfo(document.filePath);

  // If no local file, write from DB
  if (!localInfo.exists) {
    return syncDbToLocal(document, trigger);
  }

  // Check for conflicts
  const conflict = await detectConflict(document);
  if (conflict) {
    // Since Supabase is source of truth, prefer DB content
    // But mark as conflict for user review
    return {
      success: false,
      direction: 'none',
      documentId: document.id,
      filePath: document.filePath,
      error: 'Conflict detected - manual resolution required',
      conflict,
    };
  }

  // No conflict - check which side needs updating
  const localHash = localInfo.hash!;
  const dbHash = computeNormalizedHash(document.content);

  if (localHash === dbHash) {
    // Already in sync
    return {
      success: true,
      direction: 'none',
      documentId: document.id,
      filePath: document.filePath,
    };
  }

  // Since Supabase is source of truth, sync DB → Local
  return syncDbToLocal(document, trigger);
}
