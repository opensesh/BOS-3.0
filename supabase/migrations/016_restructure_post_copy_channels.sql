-- =============================================================================
-- Migration 016: Restructure Post Copy Channels and Content Subtypes
-- =============================================================================
-- Purpose: Re-architect the Create Post Copy action to have proper hierarchical
-- filtering with accurate platform-specific content types.
--
-- Changes:
-- 1. Remove channels: Facebook, Pinterest, Reddit, Discord, Tumblr, Mastodon, 
--    Bluesky, Snapchat, Twitch, BeReal, Twitter/X, Threads
-- 2. Add new channels: Patreon, Skool, Website/Blog
-- 3. Update supported formats for existing channels
-- 4. Update content subtypes to accurately reflect platform capabilities
-- =============================================================================

-- =============================================================================
-- 1. Delete all existing content subtypes (we'll recreate them)
-- =============================================================================
DELETE FROM quick_action_content_subtypes;

-- =============================================================================
-- 2. Delete deprecated channels
-- =============================================================================
DELETE FROM quick_action_channels 
WHERE short_label IN ('FB', 'PIN', 'RED', 'DISC', 'TUMB', 'MAST', 'BSKY', 'SNAP', 'TWCH', 'BREAL', 'X', 'THR');

-- =============================================================================
-- 3. Update existing channels with correct format mappings
-- =============================================================================

-- Instagram: short_form only (Post, Reel, Story)
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['short_form']::text[],
  display_order = 1
WHERE short_label = 'IG';

-- TikTok: short_form only
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['short_form']::text[],
  display_order = 2
WHERE short_label = 'TT';

-- YouTube: Both short_form and long_form
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['short_form', 'long_form']::text[],
  display_order = 3
WHERE short_label = 'YT';

-- LinkedIn: written only
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['written']::text[],
  display_order = 4
WHERE short_label = 'LI';

-- Substack: written only (was long_form)
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['written']::text[],
  display_order = 5
WHERE short_label = 'SUB';

-- Medium: written only (was long_form)
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['written']::text[],
  display_order = 6
WHERE short_label = 'MED';

-- Spotify: long_form only (for podcasts)
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['long_form']::text[],
  display_order = 7
WHERE short_label = 'SPOT';

-- Apple Podcasts: long_form only
UPDATE quick_action_channels
SET 
  supported_formats = ARRAY['long_form']::text[],
  display_order = 8
WHERE short_label = 'APOD';

-- =============================================================================
-- 4. Insert new channels (Patreon, Skool, Website/Blog)
-- =============================================================================
INSERT INTO quick_action_channels (label, short_label, icon, supported_formats, is_default, display_order)
VALUES 
  ('Patreon', 'PATR', 'patreon', ARRAY['long_form']::text[], true, 9),
  ('Skool', 'SKOOL', 'skool', ARRAY['long_form']::text[], true, 10),
  ('Website/Blog', 'BLOG', 'blog', ARRAY['written']::text[], true, 11);

-- =============================================================================
-- 5. Insert new content subtypes with accurate platform mappings
-- =============================================================================

-- Get channel IDs for content subtype mappings
DO $$
DECLARE
  instagram_id UUID;
  tiktok_id UUID;
  youtube_id UUID;
  linkedin_id UUID;
  substack_id UUID;
  medium_id UUID;
  spotify_id UUID;
  apple_podcasts_id UUID;
  patreon_id UUID;
  skool_id UUID;
  blog_id UUID;
BEGIN
  -- Get channel IDs
  SELECT id INTO instagram_id FROM quick_action_channels WHERE short_label = 'IG';
  SELECT id INTO tiktok_id FROM quick_action_channels WHERE short_label = 'TT';
  SELECT id INTO youtube_id FROM quick_action_channels WHERE short_label = 'YT';
  SELECT id INTO linkedin_id FROM quick_action_channels WHERE short_label = 'LI';
  SELECT id INTO substack_id FROM quick_action_channels WHERE short_label = 'SUB';
  SELECT id INTO medium_id FROM quick_action_channels WHERE short_label = 'MED';
  SELECT id INTO spotify_id FROM quick_action_channels WHERE short_label = 'SPOT';
  SELECT id INTO apple_podcasts_id FROM quick_action_channels WHERE short_label = 'APOD';
  SELECT id INTO patreon_id FROM quick_action_channels WHERE short_label = 'PATR';
  SELECT id INTO skool_id FROM quick_action_channels WHERE short_label = 'SKOOL';
  SELECT id INTO blog_id FROM quick_action_channels WHERE short_label = 'BLOG';

  -- ============================================================================
  -- SHORT-FORM CONTENT TYPES
  -- ============================================================================
  
  -- Instagram: Post, Reel, Story
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Post', 'short_form', ARRAY[instagram_id], true, 1),
    ('Reel', 'short_form', ARRAY[instagram_id], true, 2),
    ('Story', 'short_form', ARRAY[instagram_id], true, 3);
  
  -- TikTok: Video
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Video', 'short_form', ARRAY[tiktok_id], true, 4);
  
  -- YouTube: Short
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Short', 'short_form', ARRAY[youtube_id], true, 5);

  -- ============================================================================
  -- LONG-FORM CONTENT TYPES
  -- ============================================================================
  
  -- YouTube: Video, Premiere
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Video', 'long_form', ARRAY[youtube_id], true, 1),
    ('Premiere', 'long_form', ARRAY[youtube_id], true, 2);
  
  -- Patreon: Video
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Video', 'long_form', ARRAY[patreon_id], true, 3);
  
  -- Skool: Video
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Video', 'long_form', ARRAY[skool_id], true, 4);
  
  -- Spotify & Apple Podcasts: Episode Outline
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Episode Outline', 'long_form', ARRAY[spotify_id, apple_podcasts_id], true, 5);

  -- ============================================================================
  -- WRITTEN CONTENT TYPES
  -- ============================================================================
  
  -- LinkedIn: Post, Article
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Post', 'written', ARRAY[linkedin_id], true, 1),
    ('Article', 'written', ARRAY[linkedin_id], true, 2);
  
  -- Substack: Article
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Article', 'written', ARRAY[substack_id], true, 3);
  
  -- Medium: Article
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Article', 'written', ARRAY[medium_id], true, 4);
  
  -- Website/Blog: Post
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Post', 'written', ARRAY[blog_id], true, 5);

END $$;
