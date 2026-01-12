-- ============================================
-- SYNC INFRASTRUCTURE MIGRATION
-- ============================================
--
-- This migration adds infrastructure for syncing .claude/ files with Supabase.
-- Supports bidirectional sync between local files and the brand_documents table.

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
  'commands',      -- NEW: slash commands like /news-update, /content-ideas
  'data',          -- NEW: data files like news-sources.md
  'config'         -- NEW: config files like CLAUDE.md, mcp-instructions.md
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
CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict'));

ALTER TABLE brand_documents
DROP CONSTRAINT IF EXISTS brand_documents_sync_direction_check;

ALTER TABLE brand_documents
ADD CONSTRAINT brand_documents_sync_direction_check
CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none'));

-- 4. Create indexes for sync operations
CREATE INDEX IF NOT EXISTS idx_brand_documents_file_path
ON brand_documents(file_path) WHERE file_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_brand_documents_sync_status
ON brand_documents(sync_status) WHERE sync_status != 'synced';

CREATE INDEX IF NOT EXISTS idx_brand_documents_file_hash
ON brand_documents(file_hash) WHERE file_hash IS NOT NULL;

-- 5. Create sync log table for audit trail
CREATE TABLE IF NOT EXISTS brand_document_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES brand_documents(id) ON DELETE CASCADE,

  -- Sync details
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('db_to_local', 'local_to_db')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'conflict')),

  -- Content snapshots for debugging
  content_hash_before TEXT,
  content_hash_after TEXT,

  -- Error tracking
  error_message TEXT,

  -- Metadata
  triggered_by TEXT CHECK (triggered_by IN ('file_watcher', 'db_trigger', 'manual', 'api')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_document_id
ON brand_document_sync_log(document_id);

CREATE INDEX IF NOT EXISTS idx_sync_log_created_at
ON brand_document_sync_log(created_at DESC);

-- 6. Create trigger function for realtime notifications
CREATE OR REPLACE FUNCTION notify_document_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip notification if only sync metadata changed (prevent loops)
  IF TG_OP = 'UPDATE'
     AND OLD.content IS NOT DISTINCT FROM NEW.content
     AND OLD.title IS NOT DISTINCT FROM NEW.title THEN
    RETURN NEW;
  END IF;

  -- Notify via pg_notify for realtime subscriptions
  PERFORM pg_notify(
    'document_changes',
    json_build_object(
      'operation', TG_OP,
      'document_id', NEW.id,
      'category', NEW.category,
      'slug', NEW.slug,
      'file_path', NEW.file_path,
      'timestamp', NOW()
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS document_change_trigger ON brand_documents;
CREATE TRIGGER document_change_trigger
  AFTER INSERT OR UPDATE OF content, title ON brand_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_change();

-- 7. Row Level Security for sync log
ALTER TABLE brand_document_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on brand_document_sync_log" ON brand_document_sync_log;
CREATE POLICY "Allow public read on brand_document_sync_log"
  ON brand_document_sync_log FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on brand_document_sync_log" ON brand_document_sync_log;
CREATE POLICY "Allow public insert on brand_document_sync_log"
  ON brand_document_sync_log FOR INSERT
  WITH CHECK (true);

GRANT ALL ON brand_document_sync_log TO anon;
GRANT ALL ON brand_document_sync_log TO authenticated;

-- 8. Add unique constraint on (category, slug) for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_documents_category_slug
ON brand_documents(category, slug);

-- 9. Seed new category documents with file paths
-- Get the brand_id from an existing document (assumes at least one document exists)
DO $$
DECLARE
  v_brand_id UUID;
BEGIN
  -- Get brand_id from any existing document
  SELECT brand_id INTO v_brand_id FROM brand_documents LIMIT 1;

  -- Only insert if we have a brand_id
  IF v_brand_id IS NOT NULL THEN
    -- Config files
    INSERT INTO brand_documents (brand_id, category, slug, title, icon, sort_order, is_system, file_path, content)
    VALUES
      (v_brand_id, 'config', 'claude-md', 'CLAUDE.md', 'settings', 1, true, '.claude/CLAUDE.md', ''),
      (v_brand_id, 'config', 'mcp-instructions', 'MCP Instructions', 'plug', 2, true, '.claude/mcp-instructions.md', '')
    ON CONFLICT (category, slug) DO UPDATE SET
      file_path = EXCLUDED.file_path;

    -- Commands
    INSERT INTO brand_documents (brand_id, category, slug, title, icon, sort_order, is_system, file_path, content)
    VALUES
      (v_brand_id, 'commands', 'news-update', 'News Update', 'newspaper', 1, true, '.claude/commands/news-update.md', ''),
      (v_brand_id, 'commands', 'content-ideas', 'Content Ideas', 'lightbulb', 2, true, '.claude/commands/content-ideas.md', '')
    ON CONFLICT (category, slug) DO UPDATE SET
      file_path = EXCLUDED.file_path;

    -- Data files
    INSERT INTO brand_documents (brand_id, category, slug, title, icon, sort_order, is_system, file_path, content)
    VALUES
      (v_brand_id, 'data', 'news-sources', 'News Sources', 'rss', 1, true, '.claude/data/news-sources.md', '')
    ON CONFLICT (category, slug) DO UPDATE SET
      file_path = EXCLUDED.file_path;
  END IF;
END $$;

-- 10. Update existing documents with file paths
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

-- Skills with SKILL.md paths
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

-- 11. Set default sync status for all documents
UPDATE brand_documents SET sync_status = 'synced' WHERE sync_status IS NULL;
