-- Message Feedback Table for storing likes/dislikes on AI responses
-- This data is used to improve response quality over time

CREATE TABLE IF NOT EXISTS message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,                      -- ID of the message being rated
  chat_id TEXT,                                  -- Optional chat/session ID for context
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  user_id TEXT,                                  -- Optional user identifier
  session_id TEXT,                               -- Browser session for anonymous users
  query TEXT,                                    -- The original query for context
  response_content TEXT,                         -- Snapshot of response content
  model_used TEXT,                               -- Which model generated the response
  metadata JSONB DEFAULT '{}',                   -- Additional context (sources, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_chat_id ON message_feedback(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_feedback_type ON message_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_message_feedback_created_at ON message_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_feedback_session_id ON message_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_model_used ON message_feedback(model_used);

-- Composite index for looking up existing feedback
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_feedback_unique 
  ON message_feedback(message_id, COALESCE(session_id, ''), COALESCE(user_id, ''));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS message_feedback_updated_at ON message_feedback;
CREATE TRIGGER message_feedback_updated_at
  BEFORE UPDATE ON message_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_message_feedback_updated_at();

-- Enable Row Level Security (optional, for multi-tenant)
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (adjust based on your auth setup)
CREATE POLICY "Allow all operations on message_feedback" 
  ON message_feedback 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

