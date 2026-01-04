-- ============================================
-- BOS Automatic Embedding System
-- Migration 011: Real-time embedding triggers
-- ============================================

-- This migration establishes:
-- 1. embedding_queue table for tracking items needing embeddings
-- 2. Triggers on brand_documents for automatic re-embedding on content change
-- 3. Triggers on brand_assets for automatic embedding on description change
-- 4. Helper functions for queue management
-- 5. pg_net integration for calling Edge Functions

-- ============================================
-- 1. ENABLE PG_NET EXTENSION (for HTTP calls)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- 2. EMBEDDING QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS embedding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL DEFAULT 'embed', -- 'embed', 'rechunk', 'delete'
  priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(table_name, record_id, operation)
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_pending 
  ON embedding_queue(priority, created_at) 
  WHERE processed_at IS NULL AND attempts < max_attempts;

CREATE INDEX IF NOT EXISTS idx_embedding_queue_table 
  ON embedding_queue(table_name, record_id);

-- RLS policies
ALTER TABLE embedding_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage embedding_queue" ON embedding_queue;
CREATE POLICY "Service role can manage embedding_queue"
  ON embedding_queue FOR ALL USING (true);

GRANT ALL ON embedding_queue TO service_role;
GRANT SELECT ON embedding_queue TO anon;
GRANT SELECT ON embedding_queue TO authenticated;

-- ============================================
-- 3. QUEUE MANAGEMENT FUNCTIONS
-- ============================================

-- Add item to queue (upsert - updates priority if exists)
CREATE OR REPLACE FUNCTION queue_for_embedding(
  p_table_name TEXT,
  p_record_id UUID,
  p_operation TEXT DEFAULT 'embed',
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO embedding_queue (table_name, record_id, operation, priority)
  VALUES (p_table_name, p_record_id, p_operation, p_priority)
  ON CONFLICT (table_name, record_id, operation) 
  DO UPDATE SET 
    priority = LEAST(embedding_queue.priority, p_priority),
    attempts = 0,
    error_message = NULL,
    processed_at = NULL,
    created_at = NOW()
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending items from queue
CREATE OR REPLACE FUNCTION get_pending_embeddings(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  record_id UUID,
  operation TEXT,
  priority INTEGER,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.table_name,
    eq.record_id,
    eq.operation,
    eq.priority,
    eq.attempts
  FROM embedding_queue eq
  WHERE eq.processed_at IS NULL 
    AND eq.attempts < eq.max_attempts
  ORDER BY eq.priority ASC, eq.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark item as processed
CREATE OR REPLACE FUNCTION mark_embedding_processed(p_queue_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE embedding_queue
  SET processed_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark item as failed
CREATE OR REPLACE FUNCTION mark_embedding_failed(p_queue_id UUID, p_error TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE embedding_queue
  SET 
    attempts = attempts + 1,
    error_message = p_error
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get queue stats
CREATE OR REPLACE FUNCTION get_embedding_queue_stats()
RETURNS TABLE (
  pending_count BIGINT,
  failed_count BIGINT,
  processed_today BIGINT,
  oldest_pending TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts < max_attempts) as pending_count,
    COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts >= max_attempts) as failed_count,
    COUNT(*) FILTER (WHERE processed_at >= CURRENT_DATE) as processed_today,
    MIN(created_at) FILTER (WHERE processed_at IS NULL) as oldest_pending
  FROM embedding_queue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. BRAND_DOCUMENTS TRIGGER
-- ============================================

-- Trigger function for document changes
CREATE OR REPLACE FUNCTION trigger_document_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: queue for chunking and embedding
  IF TG_OP = 'INSERT' THEN
    -- Only queue if content exists
    IF NEW.content IS NOT NULL AND LENGTH(NEW.content) > 0 THEN
      PERFORM queue_for_embedding('brand_documents', NEW.id, 'rechunk', 3);
    END IF;
    RETURN NEW;
  END IF;
  
  -- On UPDATE: only re-embed if content actually changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
      -- Content changed - need to rechunk and re-embed
      PERFORM queue_for_embedding('brand_documents', NEW.id, 'rechunk', 3);
      -- Clear existing embedding since content changed
      NEW.embedding = NULL;
    END IF;
    RETURN NEW;
  END IF;
  
  -- On DELETE: clean up chunks (handled by FK cascade, but queue cleanup)
  IF TG_OP = 'DELETE' THEN
    -- Remove any pending queue items for this document
    DELETE FROM embedding_queue 
    WHERE table_name = 'brand_documents' AND record_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS document_embedding_trigger ON brand_documents;
CREATE TRIGGER document_embedding_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON brand_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_document_embedding();

-- ============================================
-- 5. BRAND_ASSETS TRIGGER
-- ============================================

-- Trigger function for asset changes
CREATE OR REPLACE FUNCTION trigger_asset_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: queue for embedding if description exists
  IF TG_OP = 'INSERT' THEN
    -- Queue for embedding (assets always need embeddings for search)
    PERFORM queue_for_embedding('brand_assets', NEW.id, 'embed', 5);
    RETURN NEW;
  END IF;
  
  -- On UPDATE: only re-embed if searchable content changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name 
       OR OLD.description IS DISTINCT FROM NEW.description
       OR OLD.category IS DISTINCT FROM NEW.category
       OR OLD.variant IS DISTINCT FROM NEW.variant THEN
      -- Searchable content changed - re-embed
      PERFORM queue_for_embedding('brand_assets', NEW.id, 'embed', 5);
      -- Clear existing embedding
      NEW.embedding = NULL;
    END IF;
    RETURN NEW;
  END IF;
  
  -- On DELETE: clean up queue
  IF TG_OP = 'DELETE' THEN
    DELETE FROM embedding_queue 
    WHERE table_name = 'brand_assets' AND record_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS asset_embedding_trigger ON brand_assets;
CREATE TRIGGER asset_embedding_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON brand_assets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_asset_embedding();

-- ============================================
-- 6. WEBHOOK TRIGGER (calls Edge Function)
-- ============================================

-- Function to invoke Edge Function when queue has items
CREATE OR REPLACE FUNCTION invoke_embedding_processor()
RETURNS TRIGGER AS $$
DECLARE
  v_project_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Get project URL from environment or hardcode for now
  -- In production, this would use vault secrets
  v_project_url := current_setting('app.settings.supabase_url', true);
  
  -- Only invoke if we have the URL configured
  IF v_project_url IS NOT NULL THEN
    -- Use pg_net to call the Edge Function asynchronously
    PERFORM net.http_post(
      url := v_project_url || '/functions/v1/embed-content',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'queue_id', NEW.id,
        'table_name', NEW.table_name,
        'record_id', NEW.record_id,
        'operation', NEW.operation
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the transaction if webhook fails
    -- The cron job will pick up the item anyway
    RAISE WARNING 'Failed to invoke embedding processor: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The webhook trigger is commented out by default
-- Enable it after configuring app.settings.supabase_url and service_role_key
-- Or rely on the cron-based processing which is more reliable

-- DROP TRIGGER IF EXISTS queue_webhook_trigger ON embedding_queue;
-- CREATE TRIGGER queue_webhook_trigger
--   AFTER INSERT ON embedding_queue
--   FOR EACH ROW
--   EXECUTE FUNCTION invoke_embedding_processor();

-- ============================================
-- 7. CRON JOB FOR PROCESSING (via pg_cron)
-- ============================================

-- Note: pg_cron needs to be enabled in Supabase dashboard
-- This creates a job that runs every minute to process the queue

-- The Edge Function will be called via cron instead of webhook
-- This is more reliable and handles batching naturally

-- To enable (run in SQL Editor after enabling pg_cron extension):
-- SELECT cron.schedule(
--   'process-embedding-queue',
--   '* * * * *',  -- Every minute
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/embed-content',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--     body := '{"process_queue": true}'::jsonb
--   );
--   $$
-- );

-- ============================================
-- 8. HELPER VIEW FOR MONITORING
-- ============================================

CREATE OR REPLACE VIEW embedding_queue_status AS
SELECT 
  table_name,
  operation,
  COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts < max_attempts) as pending,
  COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts >= max_attempts) as failed,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as completed,
  MIN(created_at) FILTER (WHERE processed_at IS NULL) as oldest_pending,
  MAX(processed_at) as last_processed
FROM embedding_queue
GROUP BY table_name, operation;

GRANT SELECT ON embedding_queue_status TO anon;
GRANT SELECT ON embedding_queue_status TO authenticated;
GRANT SELECT ON embedding_queue_status TO service_role;

-- ============================================
-- 9. GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION queue_for_embedding TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_embeddings TO service_role;
GRANT EXECUTE ON FUNCTION mark_embedding_processed TO service_role;
GRANT EXECUTE ON FUNCTION mark_embedding_failed TO service_role;
GRANT EXECUTE ON FUNCTION get_embedding_queue_stats TO service_role;
GRANT EXECUTE ON FUNCTION get_embedding_queue_stats TO anon;
GRANT EXECUTE ON FUNCTION get_embedding_queue_stats TO authenticated;

