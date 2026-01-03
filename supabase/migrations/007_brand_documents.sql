-- Brand Documents table for storing editable markdown content
-- Categories: brand-identity, writing-styles, skills
-- Version control through brand_document_versions table

-- ============================================
-- 1. MAIN DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS brand_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document identification
  category TEXT NOT NULL CHECK (category IN ('brand-identity', 'writing-styles', 'skills')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  
  -- Content
  content TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  icon TEXT DEFAULT 'file-text',
  sort_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false, -- True for default/seeded documents
  is_deleted BOOLEAN DEFAULT false, -- Soft delete for recovery
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint on category + slug
  UNIQUE(category, slug)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_brand_documents_category ON brand_documents(category);
CREATE INDEX IF NOT EXISTS idx_brand_documents_slug ON brand_documents(slug);
CREATE INDEX IF NOT EXISTS idx_brand_documents_is_deleted ON brand_documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_brand_documents_sort_order ON brand_documents(category, sort_order);

-- ============================================
-- 2. VERSION HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS brand_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to parent document
  document_id UUID NOT NULL REFERENCES brand_documents(id) ON DELETE CASCADE,
  
  -- Version info
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  
  -- Change tracking
  change_summary TEXT, -- Optional description of what changed
  created_by TEXT, -- User identifier (can be null for demo mode)
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique version number per document
  UNIQUE(document_id, version_number)
);

-- Indexes for version queries
CREATE INDEX IF NOT EXISTS idx_brand_document_versions_document_id ON brand_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_brand_document_versions_created_at ON brand_document_versions(created_at DESC);

-- ============================================
-- 3. UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_brand_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_documents_updated_at ON brand_documents;
CREATE TRIGGER brand_documents_updated_at
  BEFORE UPDATE ON brand_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_documents_updated_at();

-- ============================================
-- 4. VERSION AUTO-INCREMENT FUNCTION
-- ============================================

-- Function to get the next version number for a document
CREATE OR REPLACE FUNCTION get_next_version_number(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM brand_document_versions
  WHERE document_id = doc_id;
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. ROW LEVEL SECURITY (Demo Mode - Public Access)
-- ============================================

ALTER TABLE brand_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_document_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read on brand_documents" ON brand_documents;
DROP POLICY IF EXISTS "Allow public insert on brand_documents" ON brand_documents;
DROP POLICY IF EXISTS "Allow public update on brand_documents" ON brand_documents;
DROP POLICY IF EXISTS "Allow public delete on brand_documents" ON brand_documents;

DROP POLICY IF EXISTS "Allow public read on brand_document_versions" ON brand_document_versions;
DROP POLICY IF EXISTS "Allow public insert on brand_document_versions" ON brand_document_versions;

-- Brand documents - full CRUD for demo
CREATE POLICY "Allow public read on brand_documents"
  ON brand_documents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on brand_documents"
  ON brand_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on brand_documents"
  ON brand_documents FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on brand_documents"
  ON brand_documents FOR DELETE
  USING (true);

-- Version history - read and insert only (versions are immutable)
CREATE POLICY "Allow public read on brand_document_versions"
  ON brand_document_versions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on brand_document_versions"
  ON brand_document_versions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON brand_documents TO anon;
GRANT ALL ON brand_documents TO authenticated;
GRANT ALL ON brand_document_versions TO anon;
GRANT ALL ON brand_document_versions TO authenticated;

-- ============================================
-- 7. SEED DEFAULT DOCUMENTS (System Documents)
-- ============================================

-- Brand Identity documents
INSERT INTO brand_documents (category, slug, title, icon, sort_order, is_system, content)
VALUES 
  ('brand-identity', 'brand-identity', 'Brand Identity', 'badge', 1, true, ''),
  ('brand-identity', 'brand-messaging', 'Brand Messaging', 'message-square', 2, true, ''),
  ('brand-identity', 'art-direction', 'Art Direction', 'palette', 3, true, '')
ON CONFLICT (category, slug) DO NOTHING;

-- Writing Styles documents
INSERT INTO brand_documents (category, slug, title, icon, sort_order, is_system, content)
VALUES 
  ('writing-styles', 'blog', 'Blog', 'book-open', 1, true, ''),
  ('writing-styles', 'creative', 'Creative', 'sparkles', 2, true, ''),
  ('writing-styles', 'long-form', 'Long Form', 'file-text', 3, true, ''),
  ('writing-styles', 'short-form', 'Short Form', 'message-circle', 4, true, ''),
  ('writing-styles', 'strategic', 'Strategic', 'target', 5, true, '')
ON CONFLICT (category, slug) DO NOTHING;

-- Skills documents (placeholders - actual content loaded from .claude/skills)
INSERT INTO brand_documents (category, slug, title, icon, sort_order, is_system, content)
VALUES 
  ('skills', 'algorithmic-art', 'Algorithmic Art', 'cpu', 1, true, ''),
  ('skills', 'artifacts-builder', 'Artifacts Builder', 'boxes', 2, true, ''),
  ('skills', 'brand-guidelines', 'Brand Guidelines', 'book-marked', 3, true, ''),
  ('skills', 'canvas-design', 'Canvas Design', 'layout', 4, true, ''),
  ('skills', 'mcp-builder', 'MCP Builder', 'plug', 5, true, ''),
  ('skills', 'skill-creator', 'Skill Creator', 'wand-2', 6, true, '')
ON CONFLICT (category, slug) DO NOTHING;

-- ============================================
-- DONE! Brand documents tables are ready.
-- Content will be seeded from markdown files on first load.
-- ============================================

