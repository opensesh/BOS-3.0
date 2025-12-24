-- ============================================
-- Supabase Storage Buckets Setup
-- Run this after creating buckets in Supabase Dashboard
-- ============================================

-- Note: Storage buckets must be created via Supabase Dashboard or CLI:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create buckets: 'files', 'artifacts', 'code-outputs'
-- 3. Then run this migration for RLS policies

-- ============================================
-- STORAGE BUCKET POLICIES (DEMO MODE)
-- These allow public access for demo
-- ============================================

-- Files bucket - user uploads (PDFs, images, documents)
-- Path structure: files/{user_id}/{file_id}.ext (or files/anonymous/{file_id}.ext for demo)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,  -- Public for demo
  52428800,  -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/css',
    'application/json',
    'application/javascript', 'text/javascript',
    'application/typescript', 'text/typescript'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Artifacts bucket - generated code, exports
-- Path structure: artifacts/{chat_id}/{artifact_id}.ext

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artifacts',
  'artifacts',
  true,  -- Public for demo
  10485760,  -- 10MB limit
  ARRAY[
    'text/plain', 'text/html', 'text/css', 'text/markdown',
    'application/json', 'text/csv',
    'application/javascript', 'text/javascript',
    'application/typescript', 'text/typescript',
    'image/svg+xml', 'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Code outputs bucket - execution results (charts, data files)
-- Path structure: code-outputs/{execution_id}/output.ext

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'code-outputs',
  'code-outputs',
  true,  -- Public for demo
  20971520,  -- 20MB limit
  ARRAY[
    'image/png', 'image/jpeg', 'image/svg+xml',
    'text/csv', 'application/json',
    'text/plain', 'text/html'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES (DEMO - PUBLIC ACCESS)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "public_files_select" ON storage.objects;
DROP POLICY IF EXISTS "public_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_files_update" ON storage.objects;
DROP POLICY IF EXISTS "public_files_delete" ON storage.objects;

-- Public read access to all buckets
CREATE POLICY "public_files_select" ON storage.objects
  FOR SELECT USING (bucket_id IN ('files', 'artifacts', 'code-outputs'));

-- Public insert access to all buckets
CREATE POLICY "public_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('files', 'artifacts', 'code-outputs'));

-- Public update access
CREATE POLICY "public_files_update" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('files', 'artifacts', 'code-outputs'));

-- Public delete access
CREATE POLICY "public_files_delete" ON storage.objects
  FOR DELETE USING (bucket_id IN ('files', 'artifacts', 'code-outputs'));

-- ============================================
-- FUTURE: USER-SCOPED POLICIES
-- Uncomment and modify for multi-tenant production
-- ============================================

/*
-- User can only access their own files
CREATE POLICY "user_files_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "user_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "user_files_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Artifacts accessible by chat participants
CREATE POLICY "chat_artifacts_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'artifacts' AND
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.user_id = auth.uid()
      AND chats.id::text = (storage.foldername(name))[1]
    )
  );
*/

-- ============================================
-- STORAGE SETUP COMPLETE
-- Buckets: files, artifacts, code-outputs
-- All have public access for demo mode
-- ============================================



