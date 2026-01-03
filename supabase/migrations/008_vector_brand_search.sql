-- ============================================
-- BOS Vector Database + Multi-tenant Brand Setup
-- Migration 008: Vector search infrastructure
-- ============================================

-- This migration establishes:
-- 1. pgvector extension for semantic search
-- 2. brands table for multi-tenant isolation
-- 3. Updates brand_documents with brand_id and embeddings
-- 4. brand_document_chunks for RAG retrieval
-- 5. brand_assets for semantic asset search
-- 6. Search functions: match_document_chunks, match_assets, match_documents
-- 7. ivfflat indexes for efficient vector similarity search
-- 8. Storage bucket: brand-assets

-- ============================================
-- 1. ENABLE PGVECTOR EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================
-- 2. BRANDS TABLE (Multi-tenant isolation)
-- ============================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

CREATE OR REPLACE FUNCTION update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brands_updated_at ON brands;
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_brands_updated_at();

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on brands" ON brands;
CREATE POLICY "Allow public read on brands"
  ON brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on brands" ON brands;
CREATE POLICY "Allow public insert on brands"
  ON brands FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on brands" ON brands;
CREATE POLICY "Allow public update on brands"
  ON brands FOR UPDATE USING (true);

GRANT ALL ON brands TO anon;
GRANT ALL ON brands TO authenticated;

-- ============================================
-- 3. SEED OPEN SESSION BRAND
-- ============================================

INSERT INTO brands (name, slug, settings) VALUES (
  'Open Session',
  'open-session',
  '{
    "colors": {
      "primary": "#FE5102",
      "charcoal": "#1C1917",
      "vanilla": "#FFF8F0",
      "glass": "rgba(255, 248, 240, 0.1)"
    },
    "fonts": {
      "display": "Neue Haas Grotesk Display",
      "text": "Neue Haas Grotesk Text",
      "mono": "OffBit"
    },
    "description": "Brand Operating System for Open Session"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. ALTER BRAND_DOCUMENTS FOR MULTI-TENANCY
-- ============================================

ALTER TABLE brand_documents 
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

UPDATE brand_documents 
SET brand_id = (SELECT id FROM brands WHERE slug = 'open-session')
WHERE brand_id IS NULL;

ALTER TABLE brand_documents 
  ALTER COLUMN brand_id SET NOT NULL;

ALTER TABLE brand_documents 
  DROP CONSTRAINT IF EXISTS brand_documents_category_slug_key;

ALTER TABLE brand_documents
  ADD CONSTRAINT brand_documents_brand_category_slug_key 
  UNIQUE (brand_id, category, slug);

CREATE INDEX IF NOT EXISTS idx_brand_documents_brand_id 
  ON brand_documents(brand_id);

-- ============================================
-- 5. BRAND DOCUMENT CHUNKS (RAG retrieval)
-- ============================================

CREATE TABLE IF NOT EXISTS brand_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES brand_documents(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  heading_hierarchy TEXT[] DEFAULT '{}',
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_document_chunks_document_id 
  ON brand_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_brand_document_chunks_brand_id 
  ON brand_document_chunks(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_document_chunks_chunk_index 
  ON brand_document_chunks(document_id, chunk_index);

CREATE OR REPLACE FUNCTION update_brand_document_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_document_chunks_updated_at ON brand_document_chunks;
CREATE TRIGGER brand_document_chunks_updated_at
  BEFORE UPDATE ON brand_document_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_document_chunks_updated_at();

ALTER TABLE brand_document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on brand_document_chunks" ON brand_document_chunks;
CREATE POLICY "Allow public read on brand_document_chunks"
  ON brand_document_chunks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on brand_document_chunks" ON brand_document_chunks;
CREATE POLICY "Allow public insert on brand_document_chunks"
  ON brand_document_chunks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on brand_document_chunks" ON brand_document_chunks;
CREATE POLICY "Allow public update on brand_document_chunks"
  ON brand_document_chunks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on brand_document_chunks" ON brand_document_chunks;
CREATE POLICY "Allow public delete on brand_document_chunks"
  ON brand_document_chunks FOR DELETE USING (true);

GRANT ALL ON brand_document_chunks TO anon;
GRANT ALL ON brand_document_chunks TO authenticated;

-- ============================================
-- 6. BRAND ASSETS (Semantic asset search)
-- ============================================

CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('logos', 'fonts', 'illustrations', 'images', 'textures', 'icons')),
  variant TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  embedding extensions.vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (brand_id, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON brand_assets(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_brand_assets_variant ON brand_assets(brand_id, variant);

CREATE OR REPLACE FUNCTION update_brand_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_assets_updated_at ON brand_assets;
CREATE TRIGGER brand_assets_updated_at
  BEFORE UPDATE ON brand_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_assets_updated_at();

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on brand_assets" ON brand_assets;
CREATE POLICY "Allow public read on brand_assets"
  ON brand_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on brand_assets" ON brand_assets;
CREATE POLICY "Allow public insert on brand_assets"
  ON brand_assets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on brand_assets" ON brand_assets;
CREATE POLICY "Allow public update on brand_assets"
  ON brand_assets FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on brand_assets" ON brand_assets;
CREATE POLICY "Allow public delete on brand_assets"
  ON brand_assets FOR DELETE USING (true);

GRANT ALL ON brand_assets TO anon;
GRANT ALL ON brand_assets TO authenticated;

-- ============================================
-- 7. SEMANTIC SEARCH FUNCTIONS
-- ============================================

-- Function: match_document_chunks
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding extensions.vector(1536),
  p_brand_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  brand_id UUID,
  heading_hierarchy TEXT[],
  chunk_index INTEGER,
  content TEXT,
  token_count INTEGER,
  similarity FLOAT,
  document_title TEXT,
  document_category TEXT,
  document_slug TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.document_id,
    c.brand_id,
    c.heading_hierarchy,
    c.chunk_index,
    c.content,
    c.token_count,
    1 - (c.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.category AS document_category,
    d.slug AS document_slug
  FROM brand_document_chunks c
  JOIN brand_documents d ON d.id = c.document_id
  WHERE c.brand_id = p_brand_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: match_assets
CREATE OR REPLACE FUNCTION match_assets(
  query_embedding extensions.vector(1536),
  p_brand_id UUID,
  p_category TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  brand_id UUID,
  name TEXT,
  filename TEXT,
  description TEXT,
  category TEXT,
  variant TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_size INTEGER,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.brand_id,
    a.name,
    a.filename,
    a.description,
    a.category,
    a.variant,
    a.storage_path,
    a.mime_type,
    a.file_size,
    a.metadata,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM brand_assets a
  WHERE a.brand_id = p_brand_id
    AND a.embedding IS NOT NULL
    AND (p_category IS NULL OR a.category = p_category)
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: match_documents
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding extensions.vector(1536),
  p_brand_id UUID,
  p_category TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  brand_id UUID,
  category TEXT,
  slug TEXT,
  title TEXT,
  content TEXT,
  icon TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.brand_id,
    d.category,
    d.slug,
    d.title,
    d.content,
    d.icon,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM brand_documents d
  WHERE d.brand_id = p_brand_id
    AND d.embedding IS NOT NULL
    AND d.is_deleted = false
    AND (p_category IS NULL OR d.category = p_category)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_document_chunks TO anon;
GRANT EXECUTE ON FUNCTION match_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_assets TO anon;
GRANT EXECUTE ON FUNCTION match_assets TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

-- ============================================
-- 8. IVFFLAT INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_brand_document_chunks_embedding 
  ON brand_document_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_brand_assets_embedding 
  ON brand_assets 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_brand_documents_embedding 
  ON brand_documents 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- ============================================
-- 9. STORAGE BUCKET: brand-assets
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  52428800,
  ARRAY[
    'image/svg+xml',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for brand-assets" ON storage.objects;
CREATE POLICY "Public read access for brand-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated upload for brand-assets" ON storage.objects;
CREATE POLICY "Authenticated upload for brand-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated update for brand-assets" ON storage.objects;
CREATE POLICY "Authenticated update for brand-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated delete for brand-assets" ON storage.objects;
CREATE POLICY "Authenticated delete for brand-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-assets');

-- ============================================
-- DONE! Vector database setup complete.
-- Run scripts/migrate-assets.ts to upload assets.
-- ============================================

