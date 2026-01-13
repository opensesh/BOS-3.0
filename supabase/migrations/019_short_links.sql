-- ============================================
-- SHORT LINKS MIGRATION
-- ============================================
--
-- This migration creates the infrastructure for a URL shortener feature
-- inspired by Dub's UI/UX with Kutt-style self-hosted functionality.
-- Includes link management, click tracking, and analytics.

-- ============================================
-- 1. MAIN SHORT LINKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Brand association (multi-tenant)
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Link identification
  short_code VARCHAR(50) NOT NULL,
  domain VARCHAR(255) DEFAULT 'opensesh.app',

  -- Destination
  destination_url TEXT NOT NULL,

  -- Metadata
  title VARCHAR(255),
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Advanced options
  password_hash TEXT,                   -- bcrypt hash for password protection
  expires_at TIMESTAMPTZ,

  -- UTM parameters (stored separately for easy editing)
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),

  -- Analytics counters (denormalized for performance)
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,

  -- Ownership
  owner_id TEXT,                        -- User ID when auth implemented
  session_id TEXT,                      -- Anonymous session tracking

  -- State
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: short_code per domain per brand
  UNIQUE(brand_id, domain, short_code)
);

-- ============================================
-- 2. CLICK ANALYTICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS short_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link reference
  short_link_id UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,

  -- Timing
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Geolocation (from IP lookup via ip-api.com)
  ip_address VARCHAR(45),               -- IPv4 or IPv6
  country VARCHAR(100),
  country_code VARCHAR(2),
  city VARCHAR(255),
  region VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Device/Browser info (from user-agent parsing)
  user_agent TEXT,
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(50),              -- 'mobile', 'tablet', 'desktop'
  device_brand VARCHAR(100),

  -- Referrer tracking
  referer TEXT,
  referer_domain VARCHAR(255),

  -- UTM tracking (captured at click time)
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255)
);

-- ============================================
-- 3. TAGS LOOKUP TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS short_link_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Brand association
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Tag info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT 'gray',     -- Tailwind color name

  -- Usage count (denormalized)
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique per brand
  UNIQUE(brand_id, slug)
);

-- ============================================
-- 4. INDEXES
-- ============================================

-- Short links indexes
CREATE INDEX IF NOT EXISTS idx_short_links_brand ON short_links(brand_id);
CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_domain_code ON short_links(domain, short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_active ON short_links(brand_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_short_links_tags ON short_links USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_short_links_created ON short_links(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_links_clicks ON short_links(brand_id, clicks DESC);

-- Click analytics indexes
CREATE INDEX IF NOT EXISTS idx_clicks_link ON short_link_clicks(short_link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_time ON short_link_clicks(short_link_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON short_link_clicks(short_link_id, country);
CREATE INDEX IF NOT EXISTS idx_clicks_device ON short_link_clicks(short_link_id, device_type);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON short_link_clicks(clicked_at::date);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_brand ON short_link_tags(brand_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON short_link_tags(brand_id, name);

-- ============================================
-- 5. UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_short_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS short_links_updated_at ON short_links;
CREATE TRIGGER short_links_updated_at
  BEFORE UPDATE ON short_links
  FOR EACH ROW
  EXECUTE FUNCTION update_short_links_updated_at();

DROP TRIGGER IF EXISTS short_link_tags_updated_at ON short_link_tags;
CREATE TRIGGER short_link_tags_updated_at
  BEFORE UPDATE ON short_link_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_short_links_updated_at();

-- ============================================
-- 6. INCREMENT CLICKS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE short_links
  SET
    clicks = clicks + 1,
    last_clicked_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_link_tags ENABLE ROW LEVEL SECURITY;

-- Public access policies (demo mode)
DROP POLICY IF EXISTS "Allow public access on short_links" ON short_links;
CREATE POLICY "Allow public access on short_links"
  ON short_links FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access on short_link_clicks" ON short_link_clicks;
CREATE POLICY "Allow public access on short_link_clicks"
  ON short_link_clicks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access on short_link_tags" ON short_link_tags;
CREATE POLICY "Allow public access on short_link_tags"
  ON short_link_tags FOR ALL USING (true);

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON short_links TO anon, authenticated;
GRANT ALL ON short_link_clicks TO anon, authenticated;
GRANT ALL ON short_link_tags TO anon, authenticated;

-- ============================================
-- 9. SEED DEFAULT TAGS (Dub-style colored tags)
-- ============================================

DO $$
DECLARE
  v_brand_id UUID;
BEGIN
  -- Get brand_id from any existing document
  SELECT brand_id INTO v_brand_id FROM brand_documents LIMIT 1;

  -- Only insert if we have a brand_id
  IF v_brand_id IS NOT NULL THEN
    INSERT INTO short_link_tags (brand_id, name, slug, color)
    VALUES
      (v_brand_id, 'Website', 'website', 'blue'),
      (v_brand_id, 'Social', 'social', 'purple'),
      (v_brand_id, 'Business', 'business', 'amber'),
      (v_brand_id, 'YouTube', 'youtube', 'red'),
      (v_brand_id, 'LinkedIn', 'linkedin', 'sky'),
      (v_brand_id, 'Instagram', 'instagram', 'pink'),
      (v_brand_id, 'GitHub', 'github', 'gray'),
      (v_brand_id, 'Figma', 'figma', 'violet'),
      (v_brand_id, 'Substack', 'substack', 'orange'),
      (v_brand_id, 'Medium', 'medium', 'green')
    ON CONFLICT (brand_id, slug) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 10. ANALYTICS AGGREGATION VIEWS
-- ============================================

-- Daily clicks view for charts
CREATE OR REPLACE VIEW short_link_clicks_by_day AS
SELECT
  short_link_id,
  DATE(clicked_at) as click_date,
  COUNT(*) as click_count
FROM short_link_clicks
GROUP BY short_link_id, DATE(clicked_at)
ORDER BY click_date DESC;

-- Country breakdown view
CREATE OR REPLACE VIEW short_link_clicks_by_country AS
SELECT
  short_link_id,
  country,
  country_code,
  COUNT(*) as click_count
FROM short_link_clicks
WHERE country IS NOT NULL
GROUP BY short_link_id, country, country_code
ORDER BY click_count DESC;

-- Device breakdown view
CREATE OR REPLACE VIEW short_link_clicks_by_device AS
SELECT
  short_link_id,
  device_type,
  COUNT(*) as click_count
FROM short_link_clicks
WHERE device_type IS NOT NULL
GROUP BY short_link_id, device_type
ORDER BY click_count DESC;

-- Browser breakdown view
CREATE OR REPLACE VIEW short_link_clicks_by_browser AS
SELECT
  short_link_id,
  browser,
  COUNT(*) as click_count
FROM short_link_clicks
WHERE browser IS NOT NULL
GROUP BY short_link_id, browser
ORDER BY click_count DESC;

-- Referrer breakdown view
CREATE OR REPLACE VIEW short_link_clicks_by_referer AS
SELECT
  short_link_id,
  referer_domain,
  COUNT(*) as click_count
FROM short_link_clicks
WHERE referer_domain IS NOT NULL
GROUP BY short_link_id, referer_domain
ORDER BY click_count DESC;

-- Grant view access
GRANT SELECT ON short_link_clicks_by_day TO anon, authenticated;
GRANT SELECT ON short_link_clicks_by_country TO anon, authenticated;
GRANT SELECT ON short_link_clicks_by_device TO anon, authenticated;
GRANT SELECT ON short_link_clicks_by_browser TO anon, authenticated;
GRANT SELECT ON short_link_clicks_by_referer TO anon, authenticated;
