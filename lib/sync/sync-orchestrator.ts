/**
 * Sync Orchestrator
 *
 * Coordinates all sync operations between local files and Supabase.
 * Manages the sync queue, handles batching, and coordinates between
 * file watcher and database listener.
 */

import { getSyncableDocuments, getSyncStats } from '@/lib/supabase/sync-service';
import {
  syncDbToLocal,
  syncLocalToDb,
  performInitialSync,
  detectConflict,
  resolveConflict,
} from './sync-executor';
import { getFileMappingByPath } from './constants';
import { SYNC_CONFIG } from './constants';
import type {
  SyncResult,
  SyncStats,
  SyncTrigger,
  SyncDirection,
  SyncableDocument,
  FileMappingConfig,
} from './types';

/**
 * Main orchestrator class for sync operations
 */
class SyncOrchestrator {
  private isProcessing = false;
  private pendingQueue: Array<{
    document: SyncableDocument;
    direction: SyncDirection;
    trigger: SyncTrigger;
  }> = [];

  /**
   * Sync all documents in a specific direction
   */
  async syncAll(
    direction: SyncDirection = 'db_to_local'
  ): Promise<SyncResult[]> {
    const documents = await getSyncableDocuments();
    const results: SyncResult[] = [];

    for (const doc of documents) {
      let result: SyncResult;

      if (direction === 'db_to_local') {
        result = await syncDbToLocal(doc, 'manual');
      } else if (direction === 'local_to_db') {
        result = await syncLocalToDb(doc, 'manual');
      } else {
        // Auto-detect direction based on current state
        result = await performInitialSync(doc, 'manual');
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Sync a specific document by ID
   */
  async syncDocument(
    documentId: string,
    direction: SyncDirection = 'db_to_local'
  ): Promise<SyncResult> {
    const documents = await getSyncableDocuments();
    const doc = documents.find((d) => d.id === documentId);

    if (!doc) {
      return {
        success: false,
        direction,
        documentId,
        filePath: '',
        error: 'Document not found',
      };
    }

    if (direction === 'db_to_local') {
      return syncDbToLocal(doc, 'manual');
    } else if (direction === 'local_to_db') {
      return syncLocalToDb(doc, 'manual');
    } else {
      return performInitialSync(doc, 'manual');
    }
  }

  /**
   * Queue a local file change for sync
   */
  async queueLocalChange(
    mapping: FileMappingConfig,
    trigger: SyncTrigger
  ): Promise<void> {
    const documents = await getSyncableDocuments();
    const doc = documents.find(
      (d) => d.category === mapping.category && d.slug === mapping.slug
    );

    if (!doc) {
      console.warn(
        `[Sync] Document not found for ${mapping.category}/${mapping.slug}`
      );
      return;
    }

    this.pendingQueue.push({
      document: doc,
      direction: 'local_to_db',
      trigger,
    });

    this.processQueue();
  }

  /**
   * Queue a database change for sync
   */
  async queueDbChange(
    document: SyncableDocument,
    trigger: SyncTrigger
  ): Promise<void> {
    this.pendingQueue.push({
      document,
      direction: 'db_to_local',
      trigger,
    });

    this.processQueue();
  }

  /**
   * Process the pending queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (this.pendingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Process up to batchSize items
      const batch = this.pendingQueue.splice(0, SYNC_CONFIG.batchSize);

      for (const item of batch) {
        try {
          if (item.direction === 'db_to_local') {
            await syncDbToLocal(item.document, item.trigger);
          } else {
            await syncLocalToDb(item.document, item.trigger);
          }
        } catch (error) {
          console.error('[Sync] Error processing queue item:', error);
        }
      }
    } finally {
      this.isProcessing = false;

      // Continue processing if there are more items
      if (this.pendingQueue.length > 0) {
        setTimeout(() => this.processQueue(), SYNC_CONFIG.debounceMs);
      }
    }
  }

  /**
   * Get sync statistics
   */
  async getStats(): Promise<SyncStats> {
    return getSyncStats();
  }

  /**
   * Check for conflicts in all documents
   */
  async checkConflicts(): Promise<
    Array<{ document: SyncableDocument; hasConflict: boolean }>
  > {
    const documents = await getSyncableDocuments();
    const results: Array<{ document: SyncableDocument; hasConflict: boolean }> =
      [];

    for (const doc of documents) {
      const conflict = await detectConflict(doc);
      results.push({
        document: doc,
        hasConflict: conflict !== null,
      });
    }

    return results;
  }

  /**
   * Resolve a conflict for a specific document
   */
  async resolveDocumentConflict(
    documentId: string,
    resolution: 'keep_local' | 'keep_db'
  ): Promise<SyncResult> {
    const documents = await getSyncableDocuments();
    const doc = documents.find((d) => d.id === documentId);

    if (!doc) {
      return {
        success: false,
        direction: 'none',
        documentId,
        filePath: '',
        error: 'Document not found',
      };
    }

    return resolveConflict(doc, resolution, 'manual');
  }

  /**
   * Get the pending queue length
   */
  getQueueLength(): number {
    return this.pendingQueue.length;
  }

  /**
   * Clear the pending queue
   */
  clearQueue(): void {
    this.pendingQueue = [];
  }
}

// Singleton instance
export const syncOrchestrator = new SyncOrchestrator();

// Export convenience functions
export const syncAll = (direction?: SyncDirection) =>
  syncOrchestrator.syncAll(direction);
export const syncDocument = (documentId: string, direction?: SyncDirection) =>
  syncOrchestrator.syncDocument(documentId, direction);
export const getSyncStatsFromOrchestrator = () => syncOrchestrator.getStats();
export const checkConflicts = () => syncOrchestrator.checkConflicts();
export const resolveDocumentConflict = (
  documentId: string,
  resolution: 'keep_local' | 'keep_db'
) => syncOrchestrator.resolveDocumentConflict(documentId, resolution);
