-- ============================================
-- CANVAS TABLE FOR COLLABORATIVE EDITING
-- ============================================
-- Stores canvas documents that can be created/updated by AI
-- and edited by users, with version tracking for context.

-- ============================================
-- 1. CREATE CANVASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS canvases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to chat session (optional - canvas can exist independently)
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  
  -- Canvas content
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type TEXT DEFAULT 'markdown' CHECK (content_type IN ('markdown', 'text', 'html')),
  
  -- Version tracking for AI context awareness
  version INTEGER DEFAULT 1,
  last_edited_by TEXT CHECK (last_edited_by IN ('user', 'assistant')),
  previous_content TEXT, -- Stores last version for diff context
  edit_summary TEXT, -- Brief description of what changed
  
  -- Brand theming (optional)
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  theme_config JSONB DEFAULT '{}',
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_canvases_chat_id ON canvases(chat_id);
CREATE INDEX IF NOT EXISTS idx_canvases_brand_id ON canvases(brand_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON canvases(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvases_is_archived ON canvases(is_archived) WHERE is_archived = FALSE;

-- ============================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_canvases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS canvases_updated_at ON canvases;
CREATE TRIGGER canvases_updated_at
  BEFORE UPDATE ON canvases
  FOR EACH ROW
  EXECUTE FUNCTION update_canvases_updated_at();

-- ============================================
-- 4. CREATE VERSION INCREMENT FUNCTION
-- ============================================

-- Automatically increment version and store previous content when content changes
CREATE OR REPLACE FUNCTION canvas_version_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.version = OLD.version + 1;
    NEW.previous_content = OLD.content;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS canvas_version_tracking ON canvases;
CREATE TRIGGER canvas_version_tracking
  BEFORE UPDATE ON canvases
  FOR EACH ROW
  EXECUTE FUNCTION canvas_version_tracking();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES (Demo - Public Access)
-- ============================================

DROP POLICY IF EXISTS "Allow public read on canvases" ON canvases;
CREATE POLICY "Allow public read on canvases"
  ON canvases FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on canvases" ON canvases;
CREATE POLICY "Allow public insert on canvases"
  ON canvases FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on canvases" ON canvases;
CREATE POLICY "Allow public update on canvases"
  ON canvases FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete on canvases" ON canvases;
CREATE POLICY "Allow public delete on canvases"
  ON canvases FOR DELETE
  USING (true);

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON canvases TO anon;
GRANT ALL ON canvases TO authenticated;

-- ============================================
-- 8. CANVAS VERSION HISTORY TABLE (Optional)
-- ============================================
-- For full version history beyond just previous_content

CREATE TABLE IF NOT EXISTS canvas_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  edited_by TEXT CHECK (edited_by IN ('user', 'assistant')),
  edit_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_versions_canvas_id ON canvas_versions(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_versions_version ON canvas_versions(canvas_id, version DESC);

ALTER TABLE canvas_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on canvas_versions" ON canvas_versions;
CREATE POLICY "Allow public read on canvas_versions"
  ON canvas_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on canvas_versions" ON canvas_versions;
CREATE POLICY "Allow public insert on canvas_versions"
  ON canvas_versions FOR INSERT
  WITH CHECK (true);

GRANT ALL ON canvas_versions TO anon;
GRANT ALL ON canvas_versions TO authenticated;

-- ============================================
-- DONE! Canvas tables created.
-- ============================================

