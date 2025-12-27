-- ============================================
-- PROJECT FEATURES: INSTRUCTIONS AND FILES
-- Migration 006: Add project instructions and file storage
-- ============================================

-- ============================================
-- PROJECT INSTRUCTIONS TABLE
-- Stores custom instructions that guide AI responses within a project
-- ============================================

CREATE TABLE IF NOT EXISTS project_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one instruction set per project
  UNIQUE(project_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_instructions_project_id ON project_instructions(project_id);

-- ============================================
-- PROJECT FILES TABLE
-- Stores metadata for files uploaded to a project
-- Actual files stored in Supabase Storage bucket
-- ============================================

CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT,
  storage_path TEXT NOT NULL,
  bucket_name TEXT DEFAULT 'project-files',
  mime_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY FOR PROJECT INSTRUCTIONS
-- ============================================

ALTER TABLE project_instructions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read on project_instructions" ON project_instructions;
DROP POLICY IF EXISTS "Allow public insert on project_instructions" ON project_instructions;
DROP POLICY IF EXISTS "Allow public update on project_instructions" ON project_instructions;
DROP POLICY IF EXISTS "Allow public delete on project_instructions" ON project_instructions;

-- Create public access policies (for demo environment)
CREATE POLICY "Allow public read on project_instructions"
  ON project_instructions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on project_instructions"
  ON project_instructions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on project_instructions"
  ON project_instructions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on project_instructions"
  ON project_instructions FOR DELETE
  USING (true);

-- ============================================
-- ROW LEVEL SECURITY FOR PROJECT FILES
-- ============================================

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow public insert on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow public update on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow public delete on project_files" ON project_files;

-- Create public access policies (for demo environment)
CREATE POLICY "Allow public read on project_files"
  ON project_files FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on project_files"
  ON project_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on project_files"
  ON project_files FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on project_files"
  ON project_files FOR DELETE
  USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON project_instructions TO anon;
GRANT ALL ON project_instructions TO authenticated;
GRANT ALL ON project_files TO anon;
GRANT ALL ON project_files TO authenticated;

-- ============================================
-- TRIGGER FOR updated_at ON PROJECT INSTRUCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_project_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_instructions_updated_at ON project_instructions;
CREATE TRIGGER project_instructions_updated_at
  BEFORE UPDATE ON project_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_project_instructions_updated_at();

-- ============================================
-- STORAGE BUCKET SETUP (run in Supabase dashboard or via API)
-- Note: Storage buckets are typically created via the Supabase dashboard
-- or using the storage API, not via SQL migrations.
-- 
-- To create the bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create new bucket named "project-files"
-- 3. Set to public or configure RLS policies as needed
-- ============================================

-- ============================================
-- DONE! Project features tables are ready.
-- ============================================

