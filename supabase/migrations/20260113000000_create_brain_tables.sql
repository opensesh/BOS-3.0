-- ============================================
-- Brain Tables Migration
-- Creates dedicated tables for each Brain content type
-- Mirrors the .claude/ directory structure
-- ============================================
-- Note: This migration was applied via Supabase MCP
-- This file is for local reference and version control

-- 1. brain_brand_identity (supports MD + PDF)
CREATE TABLE IF NOT EXISTS brain_brand_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  file_type TEXT NOT NULL DEFAULT 'markdown' CHECK (file_type IN ('markdown', 'pdf')),
  storage_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, slug)
);

-- 2. brain_writing_styles (flat MD content)
CREATE TABLE IF NOT EXISTS brain_writing_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, slug)
);

-- 3. brain_plugins (nested folder structure)
CREATE TABLE IF NOT EXISTS brain_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES brain_plugins(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'file' CHECK (item_type IN ('folder', 'file')),
  content TEXT DEFAULT '',
  plugin_slug TEXT NOT NULL,
  path_segments TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, plugin_slug, slug)
);

-- 4. brain_skills (nested folder structure)
CREATE TABLE IF NOT EXISTS brain_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES brain_skills(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'file' CHECK (item_type IN ('folder', 'file')),
  content TEXT DEFAULT '',
  skill_slug TEXT NOT NULL,
  path_segments TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, skill_slug, slug)
);

-- 5. brain_agents (nested structure)
CREATE TABLE IF NOT EXISTS brain_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES brain_agents(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'file' CHECK (item_type IN ('folder', 'file')),
  content TEXT DEFAULT '',
  agent_slug TEXT NOT NULL,
  path_segments TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, agent_slug, slug)
);

-- 6. brain_commands (nested structure for slash commands)
CREATE TABLE IF NOT EXISTS brain_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES brain_commands(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'file' CHECK (item_type IN ('folder', 'file')),
  content TEXT DEFAULT '',
  command_slug TEXT NOT NULL,
  path_segments TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, command_slug, slug)
);

-- 7. brain_knowledge (general knowledge docs)
CREATE TABLE IF NOT EXISTS brain_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  file_type TEXT NOT NULL DEFAULT 'markdown' CHECK (file_type IN ('markdown', 'pdf')),
  storage_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, slug)
);

-- 8. brain_system (system configuration)
CREATE TABLE IF NOT EXISTS brain_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  config_type TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- Sync fields
  file_path TEXT,
  file_hash TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_local', 'pending_db', 'conflict')),
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IS NULL OR sync_direction IN ('db_to_local', 'local_to_db', 'none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brain_brand_identity_brand_id ON brain_brand_identity(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_writing_styles_brand_id ON brain_writing_styles(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_plugins_brand_id ON brain_plugins(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_plugins_parent_id ON brain_plugins(parent_id);
CREATE INDEX IF NOT EXISTS idx_brain_plugins_plugin_slug ON brain_plugins(plugin_slug);
CREATE INDEX IF NOT EXISTS idx_brain_skills_brand_id ON brain_skills(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_skills_parent_id ON brain_skills(parent_id);
CREATE INDEX IF NOT EXISTS idx_brain_skills_skill_slug ON brain_skills(skill_slug);
CREATE INDEX IF NOT EXISTS idx_brain_agents_brand_id ON brain_agents(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_agents_parent_id ON brain_agents(parent_id);
CREATE INDEX IF NOT EXISTS idx_brain_agents_agent_slug ON brain_agents(agent_slug);
CREATE INDEX IF NOT EXISTS idx_brain_commands_brand_id ON brain_commands(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_commands_parent_id ON brain_commands(parent_id);
CREATE INDEX IF NOT EXISTS idx_brain_commands_command_slug ON brain_commands(command_slug);
CREATE INDEX IF NOT EXISTS idx_brain_knowledge_brand_id ON brain_knowledge(brand_id);
CREATE INDEX IF NOT EXISTS idx_brain_system_brand_id ON brain_system(brand_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_brain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for each table (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_brand_identity_updated_at') THEN
    CREATE TRIGGER brain_brand_identity_updated_at
      BEFORE UPDATE ON brain_brand_identity
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_writing_styles_updated_at') THEN
    CREATE TRIGGER brain_writing_styles_updated_at
      BEFORE UPDATE ON brain_writing_styles
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_plugins_updated_at') THEN
    CREATE TRIGGER brain_plugins_updated_at
      BEFORE UPDATE ON brain_plugins
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_skills_updated_at') THEN
    CREATE TRIGGER brain_skills_updated_at
      BEFORE UPDATE ON brain_skills
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_agents_updated_at') THEN
    CREATE TRIGGER brain_agents_updated_at
      BEFORE UPDATE ON brain_agents
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_commands_updated_at') THEN
    CREATE TRIGGER brain_commands_updated_at
      BEFORE UPDATE ON brain_commands
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_knowledge_updated_at') THEN
    CREATE TRIGGER brain_knowledge_updated_at
      BEFORE UPDATE ON brain_knowledge
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brain_system_updated_at') THEN
    CREATE TRIGGER brain_system_updated_at
      BEFORE UPDATE ON brain_system
      FOR EACH ROW EXECUTE FUNCTION update_brain_updated_at();
  END IF;
END;
$$;
