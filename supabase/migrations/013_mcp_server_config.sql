-- ============================================
-- BOS MCP Server Configuration
-- Migration 013: MCP server config and API keys
-- ============================================

-- This migration establishes:
-- 1. mcp_server_config table for managing MCP server settings
-- 2. API key management with tracking
-- 3. Tool permission controls
-- 4. Rate limiting configuration
-- 5. Usage tracking

-- ============================================
-- 1. MCP SERVER CONFIG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mcp_server_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Server settings
  is_enabled BOOLEAN DEFAULT true,
  
  -- Tool permissions - which tools are exposed via MCP
  allowed_tools TEXT[] DEFAULT ARRAY[
    'search_brand_knowledge',
    'get_brand_colors',
    'get_brand_assets',
    'get_brand_guidelines',
    'search_brand_assets'
  ],
  
  -- API keys for external access
  -- Format: [{ key, name, created_at, last_used, is_active, created_by }]
  api_keys JSONB DEFAULT '[]',
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Usage tracking
  total_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One config per brand
  UNIQUE(brand_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_mcp_server_config_brand_id 
  ON mcp_server_config(brand_id);

CREATE INDEX IF NOT EXISTS idx_mcp_server_config_enabled 
  ON mcp_server_config(is_enabled) 
  WHERE is_enabled = true;

-- ============================================
-- 2. UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_mcp_server_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mcp_server_config_updated_at ON mcp_server_config;
CREATE TRIGGER mcp_server_config_updated_at
  BEFORE UPDATE ON mcp_server_config
  FOR EACH ROW
  EXECUTE FUNCTION update_mcp_server_config_updated_at();

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE mcp_server_config ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access on mcp_server_config" ON mcp_server_config;
CREATE POLICY "Service role full access on mcp_server_config"
  ON mcp_server_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read for API key validation (Edge Function uses service role anyway)
DROP POLICY IF EXISTS "Allow public read on mcp_server_config" ON mcp_server_config;
CREATE POLICY "Allow public read on mcp_server_config"
  ON mcp_server_config FOR SELECT
  USING (true);

-- Allow authenticated users to manage their brand's config
DROP POLICY IF EXISTS "Allow authenticated insert on mcp_server_config" ON mcp_server_config;
CREATE POLICY "Allow authenticated insert on mcp_server_config"
  ON mcp_server_config FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on mcp_server_config" ON mcp_server_config;
CREATE POLICY "Allow authenticated update on mcp_server_config"
  ON mcp_server_config FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on mcp_server_config" ON mcp_server_config;
CREATE POLICY "Allow authenticated delete on mcp_server_config"
  ON mcp_server_config FOR DELETE
  USING (true);

-- Grant permissions
GRANT ALL ON mcp_server_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON mcp_server_config TO authenticated;
GRANT SELECT ON mcp_server_config TO anon;

-- ============================================
-- 4. MCP USAGE LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mcp_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES mcp_server_config(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Request details
  api_key_name TEXT,
  tool_name TEXT NOT NULL,
  request_params JSONB,
  
  -- Response details
  response_status TEXT CHECK (response_status IN ('success', 'error')),
  error_message TEXT,
  response_time_ms INTEGER,
  
  -- Metadata
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mcp_usage_log_config_id 
  ON mcp_usage_log(config_id);

CREATE INDEX IF NOT EXISTS idx_mcp_usage_log_brand_id 
  ON mcp_usage_log(brand_id);

CREATE INDEX IF NOT EXISTS idx_mcp_usage_log_created_at 
  ON mcp_usage_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mcp_usage_log_tool_name 
  ON mcp_usage_log(tool_name);

-- RLS for usage log
ALTER TABLE mcp_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on mcp_usage_log" ON mcp_usage_log;
CREATE POLICY "Allow public insert on mcp_usage_log"
  ON mcp_usage_log FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on mcp_usage_log" ON mcp_usage_log;
CREATE POLICY "Allow public read on mcp_usage_log"
  ON mcp_usage_log FOR SELECT
  USING (true);

GRANT ALL ON mcp_usage_log TO service_role;
GRANT SELECT, INSERT ON mcp_usage_log TO authenticated;
GRANT INSERT ON mcp_usage_log TO anon;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Generate a secure API key
CREATE OR REPLACE FUNCTION generate_mcp_api_key()
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  -- Generate a secure random key with prefix
  key := 'bos_mcp_' || encode(gen_random_bytes(24), 'base64');
  -- Remove any characters that might cause issues
  key := replace(replace(replace(key, '+', 'x'), '/', 'y'), '=', '');
  RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Add a new API key to a config
CREATE OR REPLACE FUNCTION add_mcp_api_key(
  p_config_id UUID,
  p_key_name TEXT,
  p_created_by TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_key TEXT;
  new_key_obj JSONB;
  current_keys JSONB;
BEGIN
  -- Generate new key
  new_key := generate_mcp_api_key();
  
  -- Create key object
  new_key_obj := jsonb_build_object(
    'key', new_key,
    'name', p_key_name,
    'created_at', NOW(),
    'last_used', NULL,
    'is_active', true,
    'created_by', p_created_by
  );
  
  -- Get current keys
  SELECT api_keys INTO current_keys
  FROM mcp_server_config
  WHERE id = p_config_id;
  
  -- Append new key
  UPDATE mcp_server_config
  SET api_keys = COALESCE(current_keys, '[]'::jsonb) || new_key_obj
  WHERE id = p_config_id;
  
  RETURN new_key_obj;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke an API key
CREATE OR REPLACE FUNCTION revoke_mcp_api_key(
  p_config_id UUID,
  p_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_keys JSONB;
  updated_keys JSONB;
BEGIN
  SELECT api_keys INTO current_keys
  FROM mcp_server_config
  WHERE id = p_config_id;
  
  -- Mark the key as inactive instead of deleting
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'key' = p_key 
      THEN elem || '{"is_active": false}'::jsonb
      ELSE elem
    END
  ) INTO updated_keys
  FROM jsonb_array_elements(current_keys) AS elem;
  
  UPDATE mcp_server_config
  SET api_keys = COALESCE(updated_keys, '[]'::jsonb)
  WHERE id = p_config_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get usage statistics for a config
CREATE OR REPLACE FUNCTION get_mcp_usage_stats(
  p_config_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  avg_response_time NUMERIC,
  requests_by_tool JSONB,
  requests_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE response_status = 'success') as success,
      COUNT(*) FILTER (WHERE response_status = 'error') as errors,
      AVG(response_time_ms) as avg_time
    FROM mcp_usage_log
    WHERE config_id = p_config_id
      AND created_at > NOW() - (p_days || ' days')::INTERVAL
  ),
  by_tool AS (
    SELECT jsonb_object_agg(tool_name, cnt) as data
    FROM (
      SELECT tool_name, COUNT(*) as cnt
      FROM mcp_usage_log
      WHERE config_id = p_config_id
        AND created_at > NOW() - (p_days || ' days')::INTERVAL
      GROUP BY tool_name
    ) t
  ),
  by_day AS (
    SELECT jsonb_agg(
      jsonb_build_object('date', day, 'count', cnt)
      ORDER BY day
    ) as data
    FROM (
      SELECT DATE(created_at) as day, COUNT(*) as cnt
      FROM mcp_usage_log
      WHERE config_id = p_config_id
        AND created_at > NOW() - (p_days || ' days')::INTERVAL
      GROUP BY DATE(created_at)
    ) t
  )
  SELECT
    s.total,
    s.success,
    s.errors,
    ROUND(s.avg_time, 2),
    COALESCE(bt.data, '{}'::jsonb),
    COALESCE(bd.data, '[]'::jsonb)
  FROM stats s
  CROSS JOIN by_tool bt
  CROSS JOIN by_day bd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generate_mcp_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION add_mcp_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_mcp_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION get_mcp_usage_stats TO authenticated;

-- ============================================
-- 6. SEED DEFAULT CONFIG FOR OPEN SESSION
-- ============================================

INSERT INTO mcp_server_config (brand_id, is_enabled, allowed_tools)
SELECT 
  id,
  true,
  ARRAY[
    'search_brand_knowledge',
    'get_brand_colors',
    'get_brand_assets',
    'get_brand_guidelines',
    'search_brand_assets'
  ]
FROM brands
WHERE slug = 'open-session'
ON CONFLICT (brand_id) DO NOTHING;

-- ============================================
-- DONE! MCP Server config setup complete.
-- ============================================

