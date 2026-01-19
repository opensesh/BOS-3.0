/**
 * Database Listener for Real-time Sync
 *
 * Listens to Supabase Realtime for changes to brand_documents
 * and triggers sync operations to update local files.
 *
 * Uses Supabase Realtime subscriptions for instant notifications
 * when database records are modified.
 */

import { createClient } from '@/lib/supabase/client';
import { syncOrchestrator } from './sync-orchestrator';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SyncableDocument } from './types';

let channel: RealtimeChannel | null = null;
let isListening = false;

/**
 * Start listening to database changes
 */
export function startDbListener(): void {
  if (channel || isListening) {
    console.log('[Sync] DB listener already running');
    return;
  }

  const supabase = createClient();

  console.log('[Sync] Starting database listener');
  isListening = true;

  channel = supabase
    .channel('document-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'brand_documents',
      },
      async (payload) => {
        console.log('[Sync] Database change detected:', payload.eventType);

        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const record = payload.new as Record<string, unknown>;

          // Skip if no file_path (not a syncable document)
          if (!record.file_path) return;

          // Skip if this was triggered by our own sync (already synced)
          if (record.sync_status === 'synced' && record.sync_direction === 'none') {
            return;
          }

          const document: SyncableDocument = {
            id: record.id as string,
            category: record.category as SyncableDocument['category'],
            slug: record.slug as string,
            title: record.title as string,
            content: (record.content as string) || '',
            filePath: record.file_path as string,
            fileHash: (record.file_hash as string) || null,
            syncStatus: (record.sync_status as SyncableDocument['syncStatus']) || 'synced',
            lastSyncedAt: (record.last_synced_at as string) || null,
          };

          try {
            await syncOrchestrator.queueDbChange(document, 'db_trigger');
          } catch (error) {
            console.error('[Sync] Error queuing DB change:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('[Sync] Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[Sync] Successfully subscribed to document changes');
      } else if (status === 'CLOSED') {
        isListening = false;
        channel = null;
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Sync] Channel error - will cleanup and retry');
        // MEMORY OPTIMIZATION: Properly cleanup before reconnecting to prevent subscription leaks
        // First, mark as not listening to allow reconnection
        isListening = false;
        // Cleanup the failed channel to prevent memory leaks
        if (channel) {
          try {
            channel.unsubscribe();
          } catch {
            // Ignore errors during cleanup
          }
          channel = null;
        }
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!isListening && !channel) {
            startDbListener();
          }
        }, 5000);
      }
    });
}

/**
 * Stop listening to database changes
 */
export function stopDbListener(): void {
  if (channel) {
    channel.unsubscribe();
    channel = null;
    isListening = false;
    console.log('[Sync] DB listener stopped');
  }
}

/**
 * Check if the database listener is running
 */
export function isDbListenerRunning(): boolean {
  return isListening && channel !== null;
}

/**
 * Get the current subscription status
 */
export function getSubscriptionStatus(): string {
  if (!channel) return 'not_started';
  // Note: Supabase doesn't expose the current status directly,
  // so we track it ourselves
  return isListening ? 'subscribed' : 'disconnected';
}
