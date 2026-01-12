/**
 * Supabase service for sync operations
 *
 * Provides database operations specific to the sync system,
 * including updating sync metadata and logging sync operations.
 */

import { createClient } from './client';
import type {
  BrandDocument,
  BrandDocumentUpdate,
  BrandDocumentSyncLogInsert,
  SyncStatus,
  SyncDirection,
  SyncTrigger,
} from './types';
import { dbBrandDocumentToApp } from './types';
import type { SyncStats, SyncableDocument } from '@/lib/sync/types';

// Lazy-initialized Supabase client (allows env vars to be loaded first in CLI scripts)
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// ============================================
// SYNC METADATA OPERATIONS
// ============================================

/**
 * Update sync metadata for a document
 */
export async function updateDocumentSync(
  id: string,
  updates: {
    file_hash?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_direction?: SyncDirection;
  }
): Promise<BrandDocument | null> {
  const { data, error } = await getSupabase()
    .from('brand_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating document sync metadata:', error);
    throw error;
  }

  return data ? dbBrandDocumentToApp(data) : null;
}

/**
 * Update document content with sync metadata
 */
export async function updateDocumentWithSync(
  id: string,
  content: string,
  fileHash: string,
  trigger: SyncTrigger
): Promise<BrandDocument | null> {
  const { data, error } = await getSupabase()
    .from('brand_documents')
    .update({
      content,
      file_hash: fileHash,
      sync_status: 'synced' as SyncStatus,
      last_synced_at: new Date().toISOString(),
      sync_direction: 'none' as SyncDirection,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating document with sync:', error);
    throw error;
  }

  // Log the sync operation
  await logSyncOperation({
    document_id: id,
    sync_direction: 'local_to_db',
    sync_status: 'success',
    content_hash_after: fileHash,
    triggered_by: trigger,
  });

  return data ? dbBrandDocumentToApp(data) : null;
}

/**
 * Get all documents with file paths (syncable documents)
 */
export async function getSyncableDocuments(): Promise<SyncableDocument[]> {
  const { data, error } = await getSupabase()
    .from('brand_documents')
    .select('*')
    .not('file_path', 'is', null)
    .eq('is_deleted', false)
    .order('category')
    .order('sort_order');

  if (error) {
    console.error('Error fetching syncable documents:', error);
    throw error;
  }

  return (data || []).map((doc) => ({
    id: doc.id,
    category: doc.category,
    slug: doc.slug,
    title: doc.title,
    content: doc.content || '',
    filePath: doc.file_path,
    fileHash: doc.file_hash,
    syncStatus: doc.sync_status || 'synced',
    lastSyncedAt: doc.last_synced_at,
  }));
}

/**
 * Get a single syncable document by file path
 */
export async function getDocumentByFilePath(
  filePath: string
): Promise<SyncableDocument | null> {
  const { data, error } = await getSupabase()
    .from('brand_documents')
    .select('*')
    .eq('file_path', filePath)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching document by file path:', error);
    throw error;
  }

  return data
    ? {
        id: data.id,
        category: data.category,
        slug: data.slug,
        title: data.title,
        content: data.content || '',
        filePath: data.file_path,
        fileHash: data.file_hash,
        syncStatus: data.sync_status || 'synced',
        lastSyncedAt: data.last_synced_at,
      }
    : null;
}

/**
 * Mark a document as having a pending sync
 */
export async function markDocumentPending(
  id: string,
  direction: 'pending_local' | 'pending_db'
): Promise<void> {
  const { error } = await getSupabase()
    .from('brand_documents')
    .update({
      sync_status: direction,
      sync_direction: direction === 'pending_local' ? 'db_to_local' : 'local_to_db',
    })
    .eq('id', id);

  if (error) {
    console.error('Error marking document pending:', error);
    throw error;
  }
}

/**
 * Mark a document as having a conflict
 */
export async function markDocumentConflict(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('brand_documents')
    .update({ sync_status: 'conflict' as SyncStatus })
    .eq('id', id);

  if (error) {
    console.error('Error marking document conflict:', error);
    throw error;
  }
}

// ============================================
// SYNC LOG OPERATIONS
// ============================================

/**
 * Log a sync operation for audit trail
 */
export async function logSyncOperation(
  log: BrandDocumentSyncLogInsert
): Promise<void> {
  const { error } = await getSupabase()
    .from('brand_document_sync_log')
    .insert(log);

  if (error) {
    console.error('Error logging sync operation:', error);
    // Don't throw - logging failure shouldn't break sync
  }
}

/**
 * Get recent sync logs for a document
 */
export async function getSyncLogs(
  documentId: string,
  limit = 10
): Promise<
  Array<{
    id: string;
    syncDirection: string;
    syncStatus: string;
    errorMessage?: string;
    triggeredBy?: string;
    createdAt: string;
  }>
> {
  const { data, error } = await getSupabase()
    .from('brand_document_sync_log')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sync logs:', error);
    throw error;
  }

  return (data || []).map((log) => ({
    id: log.id,
    syncDirection: log.sync_direction,
    syncStatus: log.sync_status,
    errorMessage: log.error_message || undefined,
    triggeredBy: log.triggered_by || undefined,
    createdAt: log.created_at,
  }));
}

// ============================================
// SYNC STATISTICS
// ============================================

/**
 * Get sync statistics for all documents
 */
export async function getSyncStats(): Promise<SyncStats> {
  const { data, error } = await getSupabase()
    .from('brand_documents')
    .select('sync_status, last_synced_at')
    .not('file_path', 'is', null)
    .eq('is_deleted', false);

  if (error) {
    console.error('Error fetching sync stats:', error);
    throw error;
  }

  const docs = data || [];
  const syncedCount = docs.filter((d) => d.sync_status === 'synced').length;
  const pendingLocalCount = docs.filter(
    (d) => d.sync_status === 'pending_local'
  ).length;
  const pendingDbCount = docs.filter(
    (d) => d.sync_status === 'pending_db'
  ).length;
  const conflictCount = docs.filter((d) => d.sync_status === 'conflict').length;

  // Find the most recent sync time
  const syncTimes = docs
    .map((d) => d.last_synced_at)
    .filter((t): t is string => t !== null)
    .sort()
    .reverse();

  return {
    totalDocuments: docs.length,
    syncedCount,
    pendingLocalCount,
    pendingDbCount,
    conflictCount,
    lastSyncAt: syncTimes[0] || null,
  };
}
