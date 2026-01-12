#!/usr/bin/env npx tsx
/**
 * Claude Files Sync CLI
 *
 * Synchronizes .claude/ files with Supabase brand_documents table.
 *
 * Usage:
 *   npx tsx scripts/sync-claude-files.ts [command] [options]
 *
 * Commands:
 *   status   - Show sync status (default)
 *   pull     - Pull from Supabase to local files
 *   push     - Push local files to Supabase
 *   conflicts - Show documents with conflicts
 *
 * Examples:
 *   npm run sync:status
 *   npm run sync:pull
 *   npm run sync:push
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { syncAll, getSyncStatsFromOrchestrator, checkConflicts } from '../lib/sync';

const command = process.argv[2] || 'status';

async function main() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔄 Claude Files Sync');
  console.log('═'.repeat(60));
  console.log('');

  switch (command) {
    case 'pull':
      await runPull();
      break;

    case 'push':
      await runPush();
      break;

    case 'conflicts':
      await showConflicts();
      break;

    case 'status':
    default:
      await showStatus();
      break;
  }

  console.log('');
}

async function showStatus() {
  console.log('📊 Sync Status\n');

  try {
    const stats = await getSyncStatsFromOrchestrator();

    console.log(`  Total documents:  ${stats.totalDocuments}`);
    console.log(`  Synced:           ${stats.syncedCount}`);
    console.log(`  Pending (local):  ${stats.pendingLocalCount}`);
    console.log(`  Pending (db):     ${stats.pendingDbCount}`);
    console.log(`  Conflicts:        ${stats.conflictCount}`);

    if (stats.lastSyncAt) {
      console.log(`  Last sync:        ${new Date(stats.lastSyncAt).toLocaleString()}`);
    } else {
      console.log(`  Last sync:        Never`);
    }

    if (stats.conflictCount > 0) {
      console.log('\n⚠️  Conflicts detected! Run `npm run sync:conflicts` to see details.');
    }
  } catch (error) {
    console.error('❌ Error getting status:', error);
    process.exit(1);
  }
}

async function runPull() {
  console.log('📥 Pulling from Supabase to local files...\n');

  try {
    const results = await syncAll('db_to_local');
    printResults(results);
  } catch (error) {
    console.error('❌ Pull failed:', error);
    process.exit(1);
  }
}

async function runPush() {
  console.log('📤 Pushing local files to Supabase...\n');

  try {
    const results = await syncAll('local_to_db');
    printResults(results);
  } catch (error) {
    console.error('❌ Push failed:', error);
    process.exit(1);
  }
}

async function showConflicts() {
  console.log('⚠️  Checking for conflicts...\n');

  try {
    const conflicts = await checkConflicts();
    const conflictingDocs = conflicts.filter((c) => c.hasConflict);

    if (conflictingDocs.length === 0) {
      console.log('✅ No conflicts found!');
      return;
    }

    console.log(`Found ${conflictingDocs.length} conflict(s):\n`);

    for (const { document } of conflictingDocs) {
      console.log(`  • ${document.title}`);
      console.log(`    File: ${document.filePath}`);
      console.log(`    Category: ${document.category}`);
      console.log('');
    }

    console.log('To resolve conflicts, use the BOS web interface or the API:');
    console.log('  POST /api/sync { documentId: "...", resolution: "keep_local" | "keep_db" }');
  } catch (error) {
    console.error('❌ Error checking conflicts:', error);
    process.exit(1);
  }
}

function printResults(results: Array<{ success: boolean; direction: string; filePath: string; error?: string }>) {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    console.log(`✅ Successful: ${successful.length}`);
    for (const r of successful) {
      const direction = r.direction === 'db_to_local' ? '←' : r.direction === 'local_to_db' ? '→' : '⇆';
      console.log(`   ${direction} ${r.filePath}`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    for (const r of failed) {
      console.log(`   • ${r.filePath}`);
      if (r.error) {
        console.log(`     Error: ${r.error}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`Total: ${results.length} | Success: ${successful.length} | Failed: ${failed.length}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
