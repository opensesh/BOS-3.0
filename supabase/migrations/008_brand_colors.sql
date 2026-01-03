-- Brand Colors table for storing design system color palettes
-- Supports brand colors, mono scale, and brand scale with full CRUD
-- Accessible via custom MCP resource for consumer LLM integration

-- ============================================
-- 1. MAIN COLORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS brand_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Brand association (multi-tenant)
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Color identification
  name TEXT NOT NULL,                    -- e.g., "Charcoal", "Aperol", "Black-50"
  slug TEXT NOT NULL,                    -- e.g., "charcoal", "aperol", "black-50"
  
  -- Color values (stored in multiple formats for flexibility)
  hex_value TEXT NOT NULL,               -- e.g., "#191919"
  rgb_value TEXT,                        -- e.g., "rgb(25, 25, 25)" (auto-computed)
  hsl_value TEXT,                        -- e.g., "hsl(0, 0%, 10%)" (auto-computed)
  
  -- Semantic categorization
  color_group TEXT NOT NULL DEFAULT 'custom' 
    CHECK (color_group IN ('brand', 'mono-scale', 'brand-scale', 'custom')),
  color_role TEXT CHECK (color_role IN ('primary', 'secondary', 'accent', 'neutral', NULL)),
  
  -- Text color recommendation (for contrast)
  text_color TEXT DEFAULT 'light' CHECK (text_color IN ('light', 'dark')),
  
  -- Usage metadata
  description TEXT,                      -- User-provided description
  usage_guidelines TEXT,                 -- When/how to use this color
  
  -- CSS variable name (for design token export)
  css_variable_name TEXT,                -- e.g., "--color-charcoal"
  
  -- Ordering & state
  sort_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,       -- System colors can't be deleted
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per brand
  UNIQUE(brand_id, slug)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_brand_colors_brand_id ON brand_colors(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_colors_group ON brand_colors(brand_id, color_group);
CREATE INDEX IF NOT EXISTS idx_brand_colors_active ON brand_colors(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_brand_colors_sort ON brand_colors(brand_id, color_group, sort_order);

-- ============================================
-- 3. UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_brand_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_colors_updated_at ON brand_colors;
CREATE TRIGGER brand_colors_updated_at
  BEFORE UPDATE ON brand_colors
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_colors_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE brand_colors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read on brand_colors" ON brand_colors;
DROP POLICY IF EXISTS "Allow public insert on brand_colors" ON brand_colors;
DROP POLICY IF EXISTS "Allow public update on brand_colors" ON brand_colors;
DROP POLICY IF EXISTS "Allow public delete on brand_colors" ON brand_colors;

-- Full CRUD for demo mode (public access)
CREATE POLICY "Allow public read on brand_colors"
  ON brand_colors FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on brand_colors"
  ON brand_colors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on brand_colors"
  ON brand_colors FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on brand_colors"
  ON brand_colors FOR DELETE
  USING (is_system = false); -- Prevent deletion of system colors

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON brand_colors TO anon;
GRANT ALL ON brand_colors TO authenticated;

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to convert HEX to RGB
CREATE OR REPLACE FUNCTION hex_to_rgb(hex TEXT)
RETURNS TEXT AS $$
DECLARE
  r INTEGER;
  g INTEGER;
  b INTEGER;
  clean_hex TEXT;
BEGIN
  -- Remove # if present
  clean_hex := REPLACE(hex, '#', '');
  
  -- Parse RGB values
  r := ('x' || SUBSTRING(clean_hex, 1, 2))::bit(8)::integer;
  g := ('x' || SUBSTRING(clean_hex, 3, 2))::bit(8)::integer;
  b := ('x' || SUBSTRING(clean_hex, 5, 2))::bit(8)::integer;
  
  RETURN 'rgb(' || r || ', ' || g || ', ' || b || ')';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-populate RGB on insert/update
CREATE OR REPLACE FUNCTION auto_populate_color_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate RGB if not provided
  IF NEW.rgb_value IS NULL AND NEW.hex_value IS NOT NULL THEN
    NEW.rgb_value := hex_to_rgb(NEW.hex_value);
  END IF;
  
  -- Auto-generate CSS variable name if not provided
  IF NEW.css_variable_name IS NULL AND NEW.slug IS NOT NULL THEN
    NEW.css_variable_name := '--color-' || NEW.slug;
  END IF;
  
  -- Auto-generate slug if not provided
  IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_colors_auto_populate ON brand_colors;
CREATE TRIGGER brand_colors_auto_populate
  BEFORE INSERT OR UPDATE ON brand_colors
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_color_values();

-- ============================================
-- 7. SEED DEFAULT COLORS (for Open Session brand)
-- ============================================

-- First, get or create the Open Session brand
DO $$
DECLARE
  os_brand_id UUID;
BEGIN
  -- Get the Open Session brand ID
  SELECT id INTO os_brand_id FROM brands WHERE slug = 'open-session' LIMIT 1;
  
  -- If brand exists, seed the colors
  IF os_brand_id IS NOT NULL THEN
    
    -- Brand Colors (Primary)
    INSERT INTO brand_colors (brand_id, name, slug, hex_value, color_group, color_role, text_color, description, usage_guidelines, sort_order, is_system)
    VALUES 
      (os_brand_id, 'Charcoal', 'charcoal', '#191919', 'brand', 'primary', 'light', 
       'Primary dark color', 'Primary dark background, text on light surfaces. Use for headers, footers, and dark UI elements.', 1, true),
      (os_brand_id, 'Vanilla', 'vanilla', '#FFFAEE', 'brand', 'primary', 'dark',
       'Primary light color', 'Primary light background, text on dark surfaces. Use for content areas and light UI elements.', 2, true),
      (os_brand_id, 'Aperol', 'aperol', '#FE5102', 'brand', 'secondary', 'light',
       'Accent color', 'Accent color for CTAs, highlights, and interactive elements. Maximum 10% composition in any design.', 3, true)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      hex_value = EXCLUDED.hex_value,
      color_group = EXCLUDED.color_group,
      color_role = EXCLUDED.color_role,
      text_color = EXCLUDED.text_color,
      description = EXCLUDED.description,
      usage_guidelines = EXCLUDED.usage_guidelines,
      sort_order = EXCLUDED.sort_order,
      is_system = EXCLUDED.is_system;

    -- Mono Scale (Grayscale)
    INSERT INTO brand_colors (brand_id, name, slug, hex_value, color_group, text_color, sort_order, is_system)
    VALUES 
      (os_brand_id, 'Black', 'black', '#000000', 'mono-scale', 'light', 1, true),
      (os_brand_id, 'Black-90', 'black-90', '#1E1E1E', 'mono-scale', 'light', 2, true),
      (os_brand_id, 'Black-80', 'black-80', '#383838', 'mono-scale', 'light', 3, true),
      (os_brand_id, 'Black-70', 'black-70', '#4A4A4A', 'mono-scale', 'light', 4, true),
      (os_brand_id, 'Black-60', 'black-60', '#595959', 'mono-scale', 'light', 5, true),
      (os_brand_id, 'Black-50', 'black-50', '#787878', 'mono-scale', 'light', 6, true),
      (os_brand_id, 'Black-40', 'black-40', '#A3A3A3', 'mono-scale', 'dark', 7, true),
      (os_brand_id, 'Black-30', 'black-30', '#C7C7C7', 'mono-scale', 'dark', 8, true),
      (os_brand_id, 'Black-20', 'black-20', '#DDDEE2', 'mono-scale', 'dark', 9, true),
      (os_brand_id, 'Black-10', 'black-10', '#F0F0F0', 'mono-scale', 'dark', 10, true),
      (os_brand_id, 'White', 'white', '#FFFFFF', 'mono-scale', 'dark', 11, true)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      hex_value = EXCLUDED.hex_value,
      color_group = EXCLUDED.color_group,
      text_color = EXCLUDED.text_color,
      sort_order = EXCLUDED.sort_order,
      is_system = EXCLUDED.is_system;

    -- Brand Scale (Extended brand colors - initially empty, users can add)
    -- This section is for users to add tints, shades, or variations of brand colors
    
    RAISE NOTICE 'Brand colors seeded successfully for Open Session brand';
  ELSE
    RAISE NOTICE 'Open Session brand not found - colors will be seeded when brand is created';
  END IF;
END $$;

-- ============================================
-- DONE! Brand colors table is ready.
-- ============================================

