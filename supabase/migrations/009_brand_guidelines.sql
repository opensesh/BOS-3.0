-- Brand Guidelines table for storing brand documentation and reference materials
-- Supports Figma embeds, uploaded PDFs/PPTs, and external links
-- Multi-tenant with brand_id foreign key

-- ============================================
-- 1. MAIN GUIDELINES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS brand_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Brand association (multi-tenant)
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Guideline identification
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Type of guideline source
  guideline_type TEXT NOT NULL CHECK (guideline_type IN ('figma', 'pdf', 'pptx', 'ppt', 'link', 'notion', 'google-doc')),
  
  -- Source location
  url TEXT,                          -- External URL, Figma embed URL, or Notion link
  embed_url TEXT,                    -- Pre-formatted embed URL (for Figma prototypes)
  storage_path TEXT,                 -- For uploaded files (PDFs, PPTs) in Supabase Storage
  
  -- Metadata
  description TEXT,
  category TEXT,                     -- e.g., 'brand-identity', 'messaging', 'art-direction', 'ai-guidance'
  thumbnail_url TEXT,                -- Preview image URL
  file_size INTEGER,                 -- For uploaded files (bytes)
  mime_type TEXT,                    -- For uploaded files
  
  -- Ordering & state
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,  -- Mark as primary/featured guideline
  is_active BOOLEAN DEFAULT true,
  
  -- Flexible metadata for future extensions
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per brand
  UNIQUE(brand_id, slug)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_brand_guidelines_brand_id ON brand_guidelines(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_type ON brand_guidelines(brand_id, guideline_type);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_category ON brand_guidelines(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_active ON brand_guidelines(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_sort ON brand_guidelines(brand_id, sort_order);

-- ============================================
-- 3. UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_brand_guidelines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_guidelines_updated_at ON brand_guidelines;
CREATE TRIGGER brand_guidelines_updated_at
  BEFORE UPDATE ON brand_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_guidelines_updated_at();

-- ============================================
-- 4. AUTO-GENERATE SLUG TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION auto_generate_guideline_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_guidelines_auto_slug ON brand_guidelines;
CREATE TRIGGER brand_guidelines_auto_slug
  BEFORE INSERT OR UPDATE ON brand_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_guideline_slug();

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read on brand_guidelines" ON brand_guidelines;
DROP POLICY IF EXISTS "Allow public insert on brand_guidelines" ON brand_guidelines;
DROP POLICY IF EXISTS "Allow public update on brand_guidelines" ON brand_guidelines;
DROP POLICY IF EXISTS "Allow public delete on brand_guidelines" ON brand_guidelines;

-- Full CRUD for demo mode (public access)
CREATE POLICY "Allow public read on brand_guidelines"
  ON brand_guidelines FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on brand_guidelines"
  ON brand_guidelines FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on brand_guidelines"
  ON brand_guidelines FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on brand_guidelines"
  ON brand_guidelines FOR DELETE
  USING (true);

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON brand_guidelines TO anon;
GRANT ALL ON brand_guidelines TO authenticated;

-- ============================================
-- 7. SEED DEFAULT GUIDELINE (for Open Session brand)
-- ============================================

DO $$
DECLARE
  os_brand_id UUID;
BEGIN
  -- Get the Open Session brand ID
  SELECT id INTO os_brand_id FROM brands WHERE slug = 'open-session' LIMIT 1;
  
  -- If brand exists, seed the default guideline
  IF os_brand_id IS NOT NULL THEN
    
    INSERT INTO brand_guidelines (
      brand_id, 
      title, 
      slug, 
      guideline_type, 
      url, 
      embed_url,
      description, 
      category, 
      is_primary,
      sort_order
    )
    VALUES 
      (
        os_brand_id, 
        'OS Design System', 
        'os-design-system', 
        'figma',
        'https://www.figma.com/proto/t6ibLjzJFXY6HzU0bIahxw/BRAND-OS?page-id=19939%3A21956&node-id=20255-18337&viewport=465%2C-92%2C0.05&t=Fjx1co9Q53DPCGLw-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=20255%3A18337',
        'https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2Ft6ibLjzJFXY6HzU0bIahxw%2FBRAND-OS%3Fpage-id%3D19939%253A21956%26node-id%3D20255-18337%26viewport%3D465%252C-92%252C0.05%26t%3DFjx1co9Q53DPCGLw-1%26scaling%3Dscale-down%26content-scaling%3Dfixed%26starting-point-node-id%3D20255%253A18337',
        'Complete brand guidelines covering identity, messaging, art direction, and AI guidance.',
        'brand-identity',
        true,
        1
      )
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      title = EXCLUDED.title,
      guideline_type = EXCLUDED.guideline_type,
      url = EXCLUDED.url,
      embed_url = EXCLUDED.embed_url,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      is_primary = EXCLUDED.is_primary,
      sort_order = EXCLUDED.sort_order;

    RAISE NOTICE 'Brand guidelines seeded successfully for Open Session brand';
  ELSE
    RAISE NOTICE 'Open Session brand not found - guidelines will be seeded when brand is created';
  END IF;
END $$;

-- ============================================
-- DONE! Brand guidelines table is ready.
-- ============================================

