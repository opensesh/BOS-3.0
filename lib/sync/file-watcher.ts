/**
 * File Watcher for Real-time Sync
 *
 * Watches the .claude/ directory for file changes and triggers
 * sync operations to update Supabase when local files are modified.
 *
 * Uses chokidar for cross-platform file watching with debouncing
 * to prevent rapid-fire events during file saves.
 */

import chokidar from 'chokidar';
import { SYNC_CONFIG, getFileMappingByPath } from './constants';
import { syncOrchestrator } from './sync-orchestrator';
import type { FSWatcher } from 'chokidar';

let watcher: FSWatcher | null = null;
let isWatching = false;

// Debounce map to prevent rapid-fire events
const debounceMap = new Map<string, NodeJS.Timeout>();

/**
 * Start watching the .claude/ directory for file changes
 */
export function startFileWatcher(): void {
  if (watcher || isWatching) {
    console.log('[Sync] File watcher already running');
    return;
  }

  console.log('[Sync] Starting file watcher for .claude/ directory');
  isWatching = true;

  watcher = chokidar.watch(SYNC_CONFIG.watchPaths, {
    ignored: SYNC_CONFIG.ignorePaths,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
    cwd: process.cwd(),
  });

  watcher
    .on('add', (path) => handleFileChange('add', path))
    .on('change', (path) => handleFileChange('change', path))
    .on('unlink', (path) => handleFileChange('unlink', path))
    .on('error', (error) => {
      console.error('[Sync] Watcher error:', error);
    })
    .on('ready', () => {
      console.log('[Sync] File watcher ready');
    });
}

/**
 * Stop the file watcher
 */
export function stopFileWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
    isWatching = false;
    debounceMap.clear();
    console.log('[Sync] File watcher stopped');
  }
}

/**
 * Check if the file watcher is running
 */
export function isFileWatcherRunning(): boolean {
  return isWatching && watcher !== null;
}

/**
 * Handle a file change event
 */
function handleFileChange(
  eventType: 'add' | 'change' | 'unlink',
  filePath: string
): void {
  // Clear existing timeout for this file
  const existing = debounceMap.get(filePath);
  if (existing) {
    clearTimeout(existing);
  }

  // Set new debounced handler
  debounceMap.set(
    filePath,
    setTimeout(async () => {
      debounceMap.delete(filePath);

      // Find matching document mapping
      const mapping = getFileMappingByPath(filePath);

      if (!mapping) {
        // Not a tracked file
        return;
      }

      console.log(`[Sync] File ${eventType}: ${filePath}`);

      if (eventType === 'unlink') {
        // File was deleted - we don't delete from DB, just log
        console.log(`[Sync] File deleted: ${filePath} (not removing from database)`);
        return;
      }

      try {
        await syncOrchestrator.queueLocalChange(mapping, 'file_watcher');
      } catch (error) {
        console.error(`[Sync] Error queuing change for ${filePath}:`, error);
      }
    }, SYNC_CONFIG.debounceMs)
  );
}

/**
 * Get the list of watched paths
 */
export function getWatchedPaths(): string[] {
  if (!watcher) return [];
  return watcher.getWatched()
    ? Object.keys(watcher.getWatched())
    : [];
}

/**
 * Manually trigger a sync for a specific file
 */
export async function triggerFileSync(filePath: string): Promise<void> {
  const mapping = getFileMappingByPath(filePath);
  if (mapping) {
    await syncOrchestrator.queueLocalChange(mapping, 'manual');
  }
}
