/**
 * Type definitions for the Claude configuration sync system
 *
 * This module defines types for synchronizing .claude/ files with Supabase.
 */

import type {
  BrandDocumentCategory,
  SyncStatus,
  SyncDirection,
  SyncTrigger,
} from '@/lib/supabase/types';

// Re-export base types for convenience
export type { SyncStatus, SyncDirection, SyncTrigger };

/**
 * A document that can be synced between local files and Supabase
 */
export interface SyncableDocument {
  id: string;
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content: string;
  filePath: string;
  fileHash: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

/**
 * Event representing a change that needs to be synced
 */
export interface SyncEvent {
  type: 'file_change' | 'db_change';
  documentId?: string;
  filePath: string;
  content: string;
  hash: string;
  timestamp: Date;
  trigger: SyncTrigger;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  direction: SyncDirection;
  documentId: string;
  filePath: string;
  error?: string;
  conflict?: ConflictInfo;
}

/**
 * Information about a conflict between local and database versions
 */
export interface ConflictInfo {
  localContent: string;
  localHash: string;
  dbContent: string;
  dbHash: string;
  localModifiedAt: Date;
  dbModifiedAt: Date;
}

/**
 * Item in the sync queue
 */
export interface SyncQueueItem {
  id: string;
  event: SyncEvent;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Statistics about sync state
 */
export interface SyncStats {
  totalDocuments: number;
  syncedCount: number;
  pendingLocalCount: number;
  pendingDbCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
}

/**
 * Configuration for file mapping
 */
export interface FileMappingConfig {
  category: BrandDocumentCategory;
  slug: string;
  filePath: string;
  title: string;
  icon: string;
}

/**
 * Options for sync operations
 */
export interface SyncOptions {
  force?: boolean;          // Force sync even if hashes match
  createIfMissing?: boolean; // Create document/file if it doesn't exist
  skipVersioning?: boolean; // Skip creating version history entry
}

/**
 * Sync service configuration
 */
export interface SyncConfig {
  debounceMs: number;       // Debounce time for file changes
  maxRetries: number;       // Maximum retry attempts
  retryDelayMs: number;     // Delay between retries
  batchSize: number;        // Max items to process at once
  watchPaths: string[];     // Glob patterns to watch
  ignorePaths: string[];    // Glob patterns to ignore
}
