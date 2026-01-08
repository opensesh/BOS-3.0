-- Migration: Add quick_action_type column to chats table
-- Purpose: Track which quick action (if any) initiated a chat session
-- This enables filtering chat history by quick action type

-- Add the quick_action_type column
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS quick_action_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN chats.quick_action_type IS 'The quick action type that initiated this chat (e.g., create-post-copy, brand-review). NULL for regular chats.';

-- Create index for efficient filtering by quick action type
CREATE INDEX IF NOT EXISTS idx_chats_quick_action_type 
ON chats(quick_action_type) 
WHERE quick_action_type IS NOT NULL;

-- Create composite index for common query pattern (user + quick action type)
CREATE INDEX IF NOT EXISTS idx_chats_user_quick_action_type 
ON chats(user_id, quick_action_type) 
WHERE quick_action_type IS NOT NULL;

