/**
 * Migration Runner API
 *
 * Runs the sync infrastructure migration on demand.
 * This endpoint should only be called once to set up the sync system.
 *
 * POST /api/sync/migrate
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

const MIGRATION_SQL = `
-- ============================================
-- SYNC INFRASTRUCTURE MIGRATION
-- ============================================

-- 1. Drop existing category constraint if it exists
ALTER TABLE brand_documents
DROP CONSTRAINT IF EXISTS brand_documents_category_check;

-- 2. Add new constraint with extended categories
ALTER TABLE brand_documents
ADD CONSTRAINT brand_documents_category_check
CHECK (category IN (
  'brand-identity',
  'writing-styles',
  'skills',
  'commands',
  'data',
  'config'
));

-- 3. Add sync-related columns to brand_documents
ALTER TABLE brand_documents
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_direction TEXT;

-- Add constraints for sync columns
ALTER TABLE brand_documents
DROP CONSTRAINT IF EXISTS brand_documents_sync_status_check;

ALTER TABLE brand_documents
ADD CONSTRAINT brand_documents_sync_status_check
CHECK (sync_status IS NULL OR sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict'));

ALTER TABLE brand_documents
DROP CONSTRAINT IF EXISTS brand_documents_sync_direction_check;

ALTER TABLE brand_documents
ADD CONSTRAINT brand_documents_sync_direction_check
CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none'));
`;

const CREATE_SYNC_LOG_SQL = `
-- Create sync log table for audit trail
CREATE TABLE IF NOT EXISTS brand_document_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES brand_documents(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('db_to_local', 'local_to_db')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'conflict')),
  content_hash_before TEXT,
  content_hash_after TEXT,
  error_message TEXT,
  triggered_by TEXT CHECK (triggered_by IS NULL OR triggered_by IN ('file_watcher', 'db_trigger', 'manual', 'api')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const CREATE_INDEXES_SQL = `
-- Create indexes for sync operations
CREATE INDEX IF NOT EXISTS idx_brand_documents_file_path
ON brand_documents(file_path) WHERE file_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_brand_documents_sync_status
ON brand_documents(sync_status) WHERE sync_status IS NOT NULL AND sync_status != 'synced';

CREATE INDEX IF NOT EXISTS idx_brand_documents_file_hash
ON brand_documents(file_hash) WHERE file_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_log_document_id
ON brand_document_sync_log(document_id);

CREATE INDEX IF NOT EXISTS idx_sync_log_created_at
ON brand_document_sync_log(created_at DESC);
`;

const UPDATE_FILE_PATHS_SQL = `
-- Update existing documents with file paths
UPDATE brand_documents SET file_path = '.claude/knowledge/core/OS_brand identity.md'
WHERE category = 'brand-identity' AND slug = 'brand-identity' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/core/OS_brand messaging.md'
WHERE category = 'brand-identity' AND slug = 'brand-messaging' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/core/OS_art direction.md'
WHERE category = 'brand-identity' AND slug = 'art-direction' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/writing-styles/blog.md'
WHERE category = 'writing-styles' AND slug = 'blog' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/writing-styles/creative.md'
WHERE category = 'writing-styles' AND slug = 'creative' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/writing-styles/long-form.md'
WHERE category = 'writing-styles' AND slug = 'long-form' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/writing-styles/short-form.md'
WHERE category = 'writing-styles' AND slug = 'short-form' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/knowledge/writing-styles/strategic.md'
WHERE category = 'writing-styles' AND slug = 'strategic' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/algorithmic-art/SKILL.md'
WHERE category = 'skills' AND slug = 'algorithmic-art' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/artifacts-builder/SKILL.md'
WHERE category = 'skills' AND slug = 'artifacts-builder' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/brand-guidelines/SKILL.md'
WHERE category = 'skills' AND slug = 'brand-guidelines' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/canvas-design/SKILL.md'
WHERE category = 'skills' AND slug = 'canvas-design' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/mcp-builder/SKILL.md'
WHERE category = 'skills' AND slug = 'mcp-builder' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/skill-creator/SKILL.md'
WHERE category = 'skills' AND slug = 'skill-creator' AND file_path IS NULL;

UPDATE brand_documents SET file_path = '.claude/skills/create-post-copy/SKILL.md'
WHERE category = 'skills' AND slug = 'create-post-copy' AND file_path IS NULL;

-- Set default sync status for all documents
UPDATE brand_documents SET sync_status = 'synced' WHERE sync_status IS NULL;
`;

export async function POST() {
  const supabase = createClient();
  const results: Array<{ step: string; success: boolean; error?: string }> = [];

  // Step 1: Alter table and add constraints
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: MIGRATION_SQL });
    if (error) throw error;
    results.push({ step: 'Alter brand_documents table', success: true });
  } catch (error) {
    // Try individual statements if RPC doesn't exist
    results.push({
      step: 'Alter brand_documents table',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error - RPC may not exist'
    });
  }

  // Step 2: Create sync log table
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: CREATE_SYNC_LOG_SQL });
    if (error) throw error;
    results.push({ step: 'Create sync_log table', success: true });
  } catch (error) {
    results.push({
      step: 'Create sync_log table',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Step 3: Create indexes
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: CREATE_INDEXES_SQL });
    if (error) throw error;
    results.push({ step: 'Create indexes', success: true });
  } catch (error) {
    results.push({
      step: 'Create indexes',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Step 4: Update file paths
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: UPDATE_FILE_PATHS_SQL });
    if (error) throw error;
    results.push({ step: 'Update file paths', success: true });
  } catch (error) {
    results.push({
      step: 'Update file paths',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  const allSuccess = results.every(r => r.success);

  return NextResponse.json({
    success: allSuccess,
    message: allSuccess
      ? 'Migration completed successfully'
      : 'Migration completed with errors - you may need to run the SQL manually in Supabase dashboard',
    results,
    manualInstructions: !allSuccess ?
      'Copy the SQL from supabase/migrations/018_sync_infrastructure.sql and run it in the Supabase SQL Editor' :
      undefined
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to run the sync migration',
    warning: 'This will modify the brand_documents table structure'
  });
}
