-- ============================================
-- Claude Desktop Parity - Extended Features Migration
-- Adds: thinking_blocks, tool_executions, artifacts, files, mcp_connections
-- ============================================

-- ============================================
-- 1. ADD METADATA COLUMN TO MESSAGES
-- ============================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- 2. THINKING BLOCKS TABLE
-- Stores Claude's extended thinking/reasoning
-- ============================================

CREATE TABLE IF NOT EXISTS thinking_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  thinking_content TEXT NOT NULL,
  signature TEXT, -- Anthropic's thinking signature for verification
  is_redacted BOOLEAN DEFAULT false,
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by message
CREATE INDEX IF NOT EXISTS idx_thinking_blocks_message ON thinking_blocks(message_id);

-- ============================================
-- 3. TOOL EXECUTIONS TABLE
-- Logs all tool calls and their results
-- ============================================

CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  tool_use_id VARCHAR(100), -- Anthropic's tool_use block id
  input_params JSONB,
  output_result JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by message
CREATE INDEX IF NOT EXISTS idx_tool_executions_message ON tool_executions(message_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_status ON tool_executions(status);

-- ============================================
-- 4. ARTIFACTS TABLE
-- Stores generated code, diagrams, documents
-- ============================================

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  artifact_type VARCHAR(50) NOT NULL CHECK (artifact_type IN ('code', 'diagram', 'document', 'chart', 'html', 'svg', 'markdown', 'json', 'csv')),
  title VARCHAR(255),
  content TEXT NOT NULL,
  language VARCHAR(50), -- javascript, python, mermaid, html, etc.
  version INT DEFAULT 1,
  storage_path TEXT, -- If exported to Storage bucket
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_chat ON artifacts(chat_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_message ON artifacts(message_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(artifact_type);

-- ============================================
-- 5. FILES TABLE
-- Metadata for uploaded files (actual files in Storage)
-- ============================================

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- null for demo/anonymous
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  bucket_name VARCHAR(100) DEFAULT 'files',
  mime_type VARCHAR(100),
  file_size INT,
  extracted_text JSONB, -- For PDFs: {pages: [{text, page_num}]}, for code: {content, language}
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for files
CREATE INDEX IF NOT EXISTS idx_files_chat ON files(chat_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_message ON files(message_id);

-- ============================================
-- 6. MCP CONNECTIONS TABLE
-- Stores Model Context Protocol server configurations
-- ============================================

CREATE TABLE IF NOT EXISTS mcp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- null for demo/global connections
  name VARCHAR(100) NOT NULL,
  description TEXT,
  server_url TEXT NOT NULL,
  server_type VARCHAR(50) DEFAULT 'remote' CHECK (server_type IN ('remote', 'local', 'stdio')),
  auth_type VARCHAR(50) DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'api_key', 'oauth')),
  auth_config JSONB DEFAULT '{}', -- Encrypted in production: {token, api_key, etc.}
  is_active BOOLEAN DEFAULT true,
  available_tools JSONB, -- Cached list of tools from this server
  last_health_check TIMESTAMPTZ,
  health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ
);

-- Indexes for MCP connections
CREATE INDEX IF NOT EXISTS idx_mcp_connections_user ON mcp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_connections_active ON mcp_connections(is_active);

-- ============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE thinking_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. DROP EXISTING POLICIES (if re-running)
-- ============================================

DROP POLICY IF EXISTS "public_read_thinking_blocks" ON thinking_blocks;
DROP POLICY IF EXISTS "public_insert_thinking_blocks" ON thinking_blocks;
DROP POLICY IF EXISTS "public_delete_thinking_blocks" ON thinking_blocks;

DROP POLICY IF EXISTS "public_read_tool_executions" ON tool_executions;
DROP POLICY IF EXISTS "public_insert_tool_executions" ON tool_executions;
DROP POLICY IF EXISTS "public_update_tool_executions" ON tool_executions;
DROP POLICY IF EXISTS "public_delete_tool_executions" ON tool_executions;

DROP POLICY IF EXISTS "public_read_artifacts" ON artifacts;
DROP POLICY IF EXISTS "public_insert_artifacts" ON artifacts;
DROP POLICY IF EXISTS "public_update_artifacts" ON artifacts;
DROP POLICY IF EXISTS "public_delete_artifacts" ON artifacts;

DROP POLICY IF EXISTS "public_read_files" ON files;
DROP POLICY IF EXISTS "public_insert_files" ON files;
DROP POLICY IF EXISTS "public_update_files" ON files;
DROP POLICY IF EXISTS "public_delete_files" ON files;

DROP POLICY IF EXISTS "public_read_mcp_connections" ON mcp_connections;
DROP POLICY IF EXISTS "public_insert_mcp_connections" ON mcp_connections;
DROP POLICY IF EXISTS "public_update_mcp_connections" ON mcp_connections;
DROP POLICY IF EXISTS "public_delete_mcp_connections" ON mcp_connections;

-- ============================================
-- 9. CREATE PUBLIC ACCESS POLICIES (DEMO MODE)
-- These allow all visitors to access all data
-- Replace with user-scoped policies for production
-- ============================================

-- Thinking blocks - full CRUD
CREATE POLICY "public_read_thinking_blocks" ON thinking_blocks FOR SELECT USING (true);
CREATE POLICY "public_insert_thinking_blocks" ON thinking_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_thinking_blocks" ON thinking_blocks FOR DELETE USING (true);

-- Tool executions - full CRUD
CREATE POLICY "public_read_tool_executions" ON tool_executions FOR SELECT USING (true);
CREATE POLICY "public_insert_tool_executions" ON tool_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_tool_executions" ON tool_executions FOR UPDATE USING (true);
CREATE POLICY "public_delete_tool_executions" ON tool_executions FOR DELETE USING (true);

-- Artifacts - full CRUD
CREATE POLICY "public_read_artifacts" ON artifacts FOR SELECT USING (true);
CREATE POLICY "public_insert_artifacts" ON artifacts FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_artifacts" ON artifacts FOR UPDATE USING (true);
CREATE POLICY "public_delete_artifacts" ON artifacts FOR DELETE USING (true);

-- Files - full CRUD
CREATE POLICY "public_read_files" ON files FOR SELECT USING (true);
CREATE POLICY "public_insert_files" ON files FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_files" ON files FOR UPDATE USING (true);
CREATE POLICY "public_delete_files" ON files FOR DELETE USING (true);

-- MCP connections - full CRUD
CREATE POLICY "public_read_mcp_connections" ON mcp_connections FOR SELECT USING (true);
CREATE POLICY "public_insert_mcp_connections" ON mcp_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_mcp_connections" ON mcp_connections FOR UPDATE USING (true);
CREATE POLICY "public_delete_mcp_connections" ON mcp_connections FOR DELETE USING (true);

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON thinking_blocks TO anon;
GRANT ALL ON thinking_blocks TO authenticated;

GRANT ALL ON tool_executions TO anon;
GRANT ALL ON tool_executions TO authenticated;

GRANT ALL ON artifacts TO anon;
GRANT ALL ON artifacts TO authenticated;

GRANT ALL ON files TO anon;
GRANT ALL ON files TO authenticated;

GRANT ALL ON mcp_connections TO anon;
GRANT ALL ON mcp_connections TO authenticated;

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Function to update artifact's updated_at timestamp
CREATE OR REPLACE FUNCTION update_artifact_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update artifact timestamp
DROP TRIGGER IF EXISTS artifact_updated_at ON artifacts;
CREATE TRIGGER artifact_updated_at
  BEFORE UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_timestamp();

-- ============================================
-- MIGRATION COMPLETE
-- New tables: thinking_blocks, tool_executions, artifacts, files, mcp_connections
-- All tables have public access for demo mode
-- ============================================



