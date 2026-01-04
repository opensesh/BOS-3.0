-- Migration: Add is_system flag to brand_assets for logo protection
-- This prevents deletion of existing/system logos while allowing users to add new ones

-- Add is_system column to brand_assets
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Mark all existing logos as system (protected from deletion)
UPDATE brand_assets
SET is_system = TRUE
WHERE category = 'logos';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_brand_assets_is_system 
ON brand_assets(is_system) 
WHERE is_system = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN brand_assets.is_system IS 'When true, asset cannot be deleted by users. Used to protect default brand logos.';

