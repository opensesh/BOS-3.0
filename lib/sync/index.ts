/**
 * Claude Configuration Sync Module
 *
 * This module provides bidirectional synchronization between
 * local .claude/ files and the Supabase brand_documents table.
 *
 * Key features:
 * - Real-time file watching for local changes
 * - Supabase Realtime for database changes
 * - Hash-based change detection
 * - Conflict resolution
 * - Version history integration
 */

// Types
export type {
  SyncableDocument,
  SyncEvent,
  SyncResult,
  ConflictInfo,
  SyncQueueItem,
  SyncStats,
  FileMappingConfig,
  SyncOptions,
  SyncConfig,
  SyncStatus,
  SyncDirection,
  SyncTrigger,
} from './types';

// Constants
export {
  FILE_MAPPINGS,
  SYNC_CONFIG,
  getFileMappingBySlug,
  getFileMappingByPath,
  getFileMappingsByCategory,
} from './constants';

// Hash utilities
export {
  computeContentHash,
  computeNormalizedHash,
  contentChanged,
  normalizeContent,
  contentEquals,
  shortHash,
} from './hash-utils';

// Sync executor
export {
  syncDbToLocal,
  syncLocalToDb,
  getLocalFileInfo,
  detectConflict,
  resolveConflict,
  performInitialSync,
} from './sync-executor';

// Sync orchestrator
export {
  syncOrchestrator,
  syncAll,
  syncDocument,
  getSyncStatsFromOrchestrator,
  checkConflicts,
  resolveDocumentConflict,
} from './sync-orchestrator';

// File watcher (for local file changes)
export {
  startFileWatcher,
  stopFileWatcher,
  isFileWatcherRunning,
  getWatchedPaths,
  triggerFileSync,
} from './file-watcher';

// Database listener (for Supabase changes)
export {
  startDbListener,
  stopDbListener,
  isDbListenerRunning,
  getSubscriptionStatus,
} from './db-listener';
