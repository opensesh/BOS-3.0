-- =============================================================================
-- Quick Action Configuration Tables
-- =============================================================================
-- This migration creates tables for storing quick action form configuration:
-- - Channels (social media platforms)
-- - Content sub-types (per channel and format)
-- - Goals
-- - Content pillars
-- =============================================================================

-- =============================================================================
-- 1. Quick Action Channels
-- =============================================================================
CREATE TABLE IF NOT EXISTS quick_action_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  icon TEXT,
  supported_formats TEXT[] NOT NULL DEFAULT ARRAY['written'],
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching channels by user (custom) or default
CREATE INDEX idx_quick_action_channels_user ON quick_action_channels(user_id);
CREATE INDEX idx_quick_action_channels_default ON quick_action_channels(is_default);

-- Enable RLS
ALTER TABLE quick_action_channels ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read all default channels + their own custom ones
CREATE POLICY "Users can read default channels" ON quick_action_channels
  FOR SELECT USING (is_default = true);

CREATE POLICY "Users can read their own channels" ON quick_action_channels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channels" ON quick_action_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own channels" ON quick_action_channels
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own channels" ON quick_action_channels
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- =============================================================================
-- 2. Quick Action Content Sub-types
-- =============================================================================
CREATE TABLE IF NOT EXISTS quick_action_content_subtypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('short_form', 'long_form', 'written')),
  channel_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quick_action_subtypes_format ON quick_action_content_subtypes(format);
CREATE INDEX idx_quick_action_subtypes_user ON quick_action_content_subtypes(user_id);
CREATE INDEX idx_quick_action_subtypes_default ON quick_action_content_subtypes(is_default);

-- Enable RLS
ALTER TABLE quick_action_content_subtypes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read default subtypes" ON quick_action_content_subtypes
  FOR SELECT USING (is_default = true);

CREATE POLICY "Users can read their own subtypes" ON quick_action_content_subtypes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtypes" ON quick_action_content_subtypes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own subtypes" ON quick_action_content_subtypes
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own subtypes" ON quick_action_content_subtypes
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- =============================================================================
-- 3. Quick Action Goals
-- =============================================================================
CREATE TABLE IF NOT EXISTS quick_action_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quick_action_goals_user ON quick_action_goals(user_id);
CREATE INDEX idx_quick_action_goals_default ON quick_action_goals(is_default);

-- Enable RLS
ALTER TABLE quick_action_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read default goals" ON quick_action_goals
  FOR SELECT USING (is_default = true);

CREATE POLICY "Users can read their own goals" ON quick_action_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON quick_action_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own goals" ON quick_action_goals
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own goals" ON quick_action_goals
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- =============================================================================
-- 4. Quick Action Content Pillars
-- =============================================================================
CREATE TABLE IF NOT EXISTS quick_action_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quick_action_pillars_user ON quick_action_pillars(user_id);
CREATE INDEX idx_quick_action_pillars_default ON quick_action_pillars(is_default);

-- Enable RLS
ALTER TABLE quick_action_pillars ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read default pillars" ON quick_action_pillars
  FOR SELECT USING (is_default = true);

CREATE POLICY "Users can read their own pillars" ON quick_action_pillars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pillars" ON quick_action_pillars
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own pillars" ON quick_action_pillars
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own pillars" ON quick_action_pillars
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- =============================================================================
-- 5. Insert Default Channels (~20 common platforms)
-- =============================================================================
INSERT INTO quick_action_channels (label, short_label, icon, supported_formats, is_default, display_order) VALUES
  ('Instagram', 'IG', 'instagram', ARRAY['short_form', 'long_form', 'written'], true, 1),
  ('LinkedIn', 'LI', 'linkedin', ARRAY['long_form', 'written'], true, 2),
  ('TikTok', 'TT', 'tiktok', ARRAY['short_form', 'written'], true, 3),
  ('YouTube', 'YT', 'youtube', ARRAY['short_form', 'long_form', 'written'], true, 4),
  ('X (Twitter)', 'X', 'twitter', ARRAY['short_form', 'written'], true, 5),
  ('Facebook', 'FB', 'facebook', ARRAY['short_form', 'long_form', 'written'], true, 6),
  ('Pinterest', 'PIN', 'pinterest', ARRAY['long_form', 'written'], true, 7),
  ('Threads', 'THR', 'threads', ARRAY['written'], true, 8),
  ('Snapchat', 'SNAP', 'snapchat', ARRAY['short_form'], true, 9),
  ('Reddit', 'RED', 'reddit', ARRAY['long_form', 'written'], true, 10),
  ('Discord', 'DISC', 'discord', ARRAY['written'], true, 11),
  ('Tumblr', 'TUMB', 'tumblr', ARRAY['long_form', 'written'], true, 12),
  ('Medium', 'MED', 'medium', ARRAY['long_form'], true, 13),
  ('Substack', 'SUB', 'substack', ARRAY['long_form'], true, 14),
  ('Spotify', 'SPOT', 'spotify', ARRAY['long_form'], true, 15),
  ('Apple Podcasts', 'APOD', 'apple-podcasts', ARRAY['long_form'], true, 16),
  ('Twitch', 'TWCH', 'twitch', ARRAY['short_form', 'long_form'], true, 17),
  ('BeReal', 'BREAL', 'bereal', ARRAY['short_form'], true, 18),
  ('Mastodon', 'MAST', 'mastodon', ARRAY['written'], true, 19),
  ('Bluesky', 'BSKY', 'bluesky', ARRAY['written'], true, 20);

-- =============================================================================
-- 6. Insert Default Content Sub-types
-- =============================================================================
-- We need to reference channel IDs, so we'll use a DO block
DO $$
DECLARE
  instagram_id UUID;
  linkedin_id UUID;
  tiktok_id UUID;
  youtube_id UUID;
  x_id UUID;
  facebook_id UUID;
  pinterest_id UUID;
  threads_id UUID;
  snapchat_id UUID;
  reddit_id UUID;
  twitch_id UUID;
BEGIN
  -- Get channel IDs
  SELECT id INTO instagram_id FROM quick_action_channels WHERE short_label = 'IG';
  SELECT id INTO linkedin_id FROM quick_action_channels WHERE short_label = 'LI';
  SELECT id INTO tiktok_id FROM quick_action_channels WHERE short_label = 'TT';
  SELECT id INTO youtube_id FROM quick_action_channels WHERE short_label = 'YT';
  SELECT id INTO x_id FROM quick_action_channels WHERE short_label = 'X';
  SELECT id INTO facebook_id FROM quick_action_channels WHERE short_label = 'FB';
  SELECT id INTO pinterest_id FROM quick_action_channels WHERE short_label = 'PIN';
  SELECT id INTO threads_id FROM quick_action_channels WHERE short_label = 'THR';
  SELECT id INTO snapchat_id FROM quick_action_channels WHERE short_label = 'SNAP';
  SELECT id INTO reddit_id FROM quick_action_channels WHERE short_label = 'RED';
  SELECT id INTO twitch_id FROM quick_action_channels WHERE short_label = 'TWCH';

  -- Short-form sub-types
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Reel', 'short_form', ARRAY[instagram_id, facebook_id], true, 1),
    ('Story', 'short_form', ARRAY[instagram_id, facebook_id, snapchat_id, tiktok_id], true, 2),
    ('Short', 'short_form', ARRAY[youtube_id], true, 3),
    ('Video', 'short_form', ARRAY[tiktok_id, twitch_id], true, 4),
    ('Clip', 'short_form', ARRAY[twitch_id], true, 5),
    ('Snap', 'short_form', ARRAY[snapchat_id], true, 6);

  -- Long-form sub-types
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Carousel', 'long_form', ARRAY[instagram_id, linkedin_id, tiktok_id], true, 1),
    ('Video', 'long_form', ARRAY[youtube_id, facebook_id, twitch_id], true, 2),
    ('Article', 'long_form', ARRAY[linkedin_id], true, 3),
    ('Document', 'long_form', ARRAY[linkedin_id], true, 4),
    ('Post', 'long_form', ARRAY[instagram_id, facebook_id, reddit_id], true, 5),
    ('Pin', 'long_form', ARRAY[pinterest_id], true, 6),
    ('Idea Pin', 'long_form', ARRAY[pinterest_id], true, 7),
    ('Premiere', 'long_form', ARRAY[youtube_id], true, 8),
    ('Stream', 'long_form', ARRAY[twitch_id], true, 9);

  -- Written sub-types
  INSERT INTO quick_action_content_subtypes (label, format, channel_ids, is_default, display_order) VALUES
    ('Caption', 'written', ARRAY[instagram_id, tiktok_id, facebook_id], true, 1),
    ('Post', 'written', ARRAY[linkedin_id, threads_id, reddit_id], true, 2),
    ('Tweet', 'written', ARRAY[x_id], true, 3),
    ('Thread', 'written', ARRAY[x_id, threads_id], true, 4),
    ('Reply', 'written', ARRAY[x_id, threads_id], true, 5),
    ('Comment', 'written', ARRAY[instagram_id, linkedin_id, tiktok_id, youtube_id, facebook_id, reddit_id], true, 6),
    ('Description', 'written', ARRAY[youtube_id], true, 7),
    ('Community Post', 'written', ARRAY[youtube_id], true, 8);
END $$;

-- =============================================================================
-- 7. Insert Default Goals
-- =============================================================================
INSERT INTO quick_action_goals (label, description, is_default, display_order) VALUES
  ('Awareness', 'Increase brand visibility and reach', true, 1),
  ('Engagement', 'Drive likes, comments, and shares', true, 2),
  ('Conversion', 'Drive specific actions (clicks, sign-ups, sales)', true, 3),
  ('Education', 'Teach or inform your audience', true, 4),
  ('Entertainment', 'Entertain and delight your audience', true, 5),
  ('Community', 'Build and nurture community', true, 6);

-- =============================================================================
-- 8. Insert Default Content Pillars
-- =============================================================================
INSERT INTO quick_action_pillars (label, is_default, display_order) VALUES
  ('Educational', true, 1),
  ('Behind-the-scenes', true, 2),
  ('Product/Service', true, 3),
  ('User-generated', true, 4),
  ('Inspirational', true, 5),
  ('Entertainment', true, 6),
  ('Industry News', true, 7),
  ('Tips & Tricks', true, 8);

-- =============================================================================
-- 9. Updated At Trigger Function (reusable)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_quick_action_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_quick_action_channels_updated_at
  BEFORE UPDATE ON quick_action_channels
  FOR EACH ROW EXECUTE FUNCTION update_quick_action_updated_at();

CREATE TRIGGER update_quick_action_subtypes_updated_at
  BEFORE UPDATE ON quick_action_content_subtypes
  FOR EACH ROW EXECUTE FUNCTION update_quick_action_updated_at();

CREATE TRIGGER update_quick_action_goals_updated_at
  BEFORE UPDATE ON quick_action_goals
  FOR EACH ROW EXECUTE FUNCTION update_quick_action_updated_at();

CREATE TRIGGER update_quick_action_pillars_updated_at
  BEFORE UPDATE ON quick_action_pillars
  FOR EACH ROW EXECUTE FUNCTION update_quick_action_updated_at();

