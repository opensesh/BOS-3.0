-- Space Discussions table for persistent space chat threads
CREATE TABLE IF NOT EXISTS space_discussions (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  space_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  preview TEXT DEFAULT '',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient space-based queries
CREATE INDEX IF NOT EXISTS idx_space_discussions_space_slug ON space_discussions(space_slug);
CREATE INDEX IF NOT EXISTS idx_space_discussions_updated_at ON space_discussions(updated_at DESC);

-- Space Discussion Messages table
CREATE TABLE IF NOT EXISTS space_discussion_messages (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES space_discussions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient message retrieval
CREATE INDEX IF NOT EXISTS idx_space_discussion_messages_discussion_id ON space_discussion_messages(discussion_id);
CREATE INDEX IF NOT EXISTS idx_space_discussion_messages_created_at ON space_discussion_messages(created_at ASC);

-- Enable RLS
ALTER TABLE space_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_discussion_messages ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (adjust based on your auth requirements)
CREATE POLICY "Allow public read access to space_discussions"
  ON space_discussions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to space_discussions"
  ON space_discussions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to space_discussions"
  ON space_discussions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to space_discussions"
  ON space_discussions FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to space_discussion_messages"
  ON space_discussion_messages FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to space_discussion_messages"
  ON space_discussion_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to space_discussion_messages"
  ON space_discussion_messages FOR DELETE
  USING (true);

