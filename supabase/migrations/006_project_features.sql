-- ============================================
-- PROJECT FEATURES: COMPLETE SETUP
-- Migration 006: Projects table + instructions + file storage
-- This is a combined migration that creates everything needed
-- ============================================

-- ============================================
-- PROJECTS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- Removed FK to auth.users for demo compatibility
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#FE5102',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- ============================================
-- ADD project_id TO CHATS TABLE (if not exists)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE chats ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);

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
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_instructions_project_id ON project_instructions(project_id);

-- ============================================
-- PROJECT FILES TABLE
-- Stores metadata for files uploaded to a project
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

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY - PROJECTS
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert on projects" ON projects;
DROP POLICY IF EXISTS "Allow public update on projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete on projects" ON projects;

CREATE POLICY "Allow public read on projects"
  ON projects FOR SELECT USING (true);

CREATE POLICY "Allow public insert on projects"
  ON projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on projects"
  ON projects FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on projects"
  ON projects FOR DELETE USING (true);

-- ============================================
-- ROW LEVEL SECURITY - PROJECT INSTRUCTIONS
-- ============================================

ALTER TABLE project_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on project_instructions" ON project_instructions;
DROP POLICY IF EXISTS "Allow public insert on project_instructions" ON project_instructions;
DROP POLICY IF EXISTS "Allow public update on project_instructions" ON project_instructions;
DROP POLICY IF EXISTS "Allow public delete on project_instructions" ON project_instructions;

CREATE POLICY "Allow public read on project_instructions"
  ON project_instructions FOR SELECT USING (true);

CREATE POLICY "Allow public insert on project_instructions"
  ON project_instructions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on project_instructions"
  ON project_instructions FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on project_instructions"
  ON project_instructions FOR DELETE USING (true);

-- ============================================
-- ROW LEVEL SECURITY - PROJECT FILES
-- ============================================

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow public insert on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow public update on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow public delete on project_files" ON project_files;

CREATE POLICY "Allow public read on project_files"
  ON project_files FOR SELECT USING (true);

CREATE POLICY "Allow public insert on project_files"
  ON project_files FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on project_files"
  ON project_files FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on project_files"
  ON project_files FOR DELETE USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON projects TO anon;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_instructions TO anon;
GRANT ALL ON project_instructions TO authenticated;
GRANT ALL ON project_files TO anon;
GRANT ALL ON project_files TO authenticated;

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Projects trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Project instructions trigger
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
-- DONE! All project tables are ready.
-- 
-- Next steps:
-- 1. Create 'project-files' storage bucket in Supabase Dashboard
--    or run: npx tsx scripts/setup-project-storage.ts
-- ============================================
