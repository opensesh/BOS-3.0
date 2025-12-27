'use client';

import { createClient } from './client';

// ============================================
// TYPES
// ============================================

export interface Project {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  user_id?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ProjectInstructions {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  filename: string;
  original_filename: string | null;
  storage_path: string;
  bucket_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  // Computed property for display
  public_url?: string;
}

export interface ProjectChat {
  id: string;
  title: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithDetails extends Project {
  instructions: ProjectInstructions | null;
  files: ProjectFile[];
  chats: ProjectChat[];
  chat_count: number;
}

// Track if table is available
let tableChecked = false;
let tableAvailable = true;

// Storage bucket name
const PROJECT_FILES_BUCKET = 'project-files';

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Check if projects table is available
 */
async function checkTableAvailable(): Promise<boolean> {
  if (tableChecked) return tableAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    tableChecked = true;

    if (!error) {
      tableAvailable = true;
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTableMissing =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorCode === '42P01' ||
      errorCode === 'PGRST116';

    tableAvailable = false;

    if (isTableMissing) {
      console.info('Projects: Supabase table not available. Projects feature disabled.');
    }

    return false;
  } catch {
    tableChecked = true;
    tableAvailable = false;
    return false;
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get file type category for display
 */
export function getFileTypeCategory(mimeType: string | null, filename: string): string {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'IMG';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'DOC';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT';
    if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') return 'MD';
    if (mimeType === 'application/json') return 'JSON';
    if (mimeType === 'text/csv') return 'CSV';
    if (mimeType.startsWith('text/')) return 'TXT';
  }
  
  // Fallback to extension
  const ext = getFileExtension(filename);
  const extMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'DOC',
    docx: 'DOC',
    xls: 'XLS',
    xlsx: 'XLS',
    ppt: 'PPT',
    pptx: 'PPT',
    md: 'MD',
    markdown: 'MD',
    json: 'JSON',
    csv: 'CSV',
    txt: 'TXT',
    jpg: 'IMG',
    jpeg: 'IMG',
    png: 'IMG',
    gif: 'IMG',
    webp: 'IMG',
    svg: 'SVG',
  };
  
  return extMap[ext] || 'FILE';
}

/**
 * Projects Service
 * CRUD operations for chat project folders, instructions, and files
 */
export const projectsService = {
  // ============================================
  // PROJECT CRUD OPERATIONS
  // ============================================

  /**
   * Create a new project
   */
  async createProject(data: ProjectInsert): Promise<Project | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: data.name,
          description: data.description || null,
          color: data.color || '#FE5102',
          icon: data.icon || 'folder',
          user_id: data.user_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return null;
      }

      return project;
    } catch (error) {
      console.error('Error in createProject:', error);
      return null;
    }
  },

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    if (!(await checkTableAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      return projects || [];
    } catch (error) {
      console.error('Error in getProjects:', error);
      return [];
    }
  },

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return null;
      }

      return project;
    } catch (error) {
      console.error('Error in getProject:', error);
      return null;
    }
  },

  /**
   * Get a project with all its details (instructions, files, chats)
   */
  async getProjectWithDetails(id: string): Promise<ProjectWithDetails | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      // Fetch project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError || !project) {
        console.error('Error fetching project:', projectError);
        return null;
      }

      // Fetch instructions
      const { data: instructions } = await supabase
        .from('project_instructions')
        .select('*')
        .eq('project_id', id)
        .single();

      // Fetch files
      const { data: files } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      // Add public URLs to files
      const filesWithUrls = (files || []).map((file: ProjectFile) => ({
        ...file,
        public_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket_name}/${file.storage_path}`,
      }));

      // Fetch chats
      const { data: chats } = await supabase
        .from('chats')
        .select('id, title, project_id, created_at, updated_at')
        .eq('project_id', id)
        .order('updated_at', { ascending: false });

      return {
        ...project,
        instructions: instructions || null,
        files: filesWithUrls,
        chats: chats || [],
        chat_count: (chats || []).length,
      };
    } catch (error) {
      console.error('Error in getProjectWithDetails:', error);
      return null;
    }
  },

  /**
   * Update a project
   */
  async updateProject(id: string, data: ProjectUpdate): Promise<Project | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return null;
      }

      return project;
    } catch (error) {
      console.error('Error in updateProject:', error);
      return null;
    }
  },

  /**
   * Delete a project (cascades to instructions and files)
   */
  async deleteProject(id: string): Promise<boolean> {
    if (!(await checkTableAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      // First, delete all files from storage
      const { data: files } = await supabase
        .from('project_files')
        .select('storage_path')
        .eq('project_id', id);

      if (files && files.length > 0) {
        const paths = files.map((f: { storage_path: string }) => f.storage_path);
        await supabase.storage.from(PROJECT_FILES_BUCKET).remove(paths);
      }

      // Delete project (cascades to instructions and file records)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      return false;
    }
  },

  // ============================================
  // CHAT ASSIGNMENT OPERATIONS
  // ============================================

  /**
   * Assign a chat to a project
   */
  async assignChatToProject(chatId: string, projectId: string | null): Promise<boolean> {
    if (!(await checkTableAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('chats')
        .update({ project_id: projectId })
        .eq('id', chatId);

      if (error) {
        console.error('Error assigning chat to project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in assignChatToProject:', error);
      return false;
    }
  },

  /**
   * Get chats for a specific project
   */
  async getProjectChats(projectId: string): Promise<ProjectChat[]> {
    if (!(await checkTableAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('id, title, project_id, created_at, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching project chats:', error);
        return [];
      }

      return chats || [];
    } catch (error) {
      console.error('Error in getProjectChats:', error);
      return [];
    }
  },

  /**
   * Get chat count per project
   */
  async getProjectChatCounts(): Promise<Record<string, number>> {
    if (!(await checkTableAvailable())) {
      return {};
    }

    const supabase = createClient();

    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('project_id')
        .not('project_id', 'is', null);

      if (error) {
        console.error('Error fetching chat counts:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      for (const chat of chats || []) {
        if (chat.project_id) {
          counts[chat.project_id] = (counts[chat.project_id] || 0) + 1;
        }
      }

      return counts;
    } catch (error) {
      console.error('Error in getProjectChatCounts:', error);
      return {};
    }
  },

  // ============================================
  // INSTRUCTIONS OPERATIONS
  // ============================================

  /**
   * Get instructions for a project
   */
  async getProjectInstructions(projectId: string): Promise<ProjectInstructions | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('project_instructions')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows found" which is expected
        console.error('Error fetching project instructions:', error);
      }

      return data || null;
    } catch (error) {
      console.error('Error in getProjectInstructions:', error);
      return null;
    }
  },

  /**
   * Save instructions for a project (upsert)
   */
  async saveProjectInstructions(projectId: string, content: string): Promise<ProjectInstructions | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      // Check if instructions exist
      const { data: existing } = await supabase
        .from('project_instructions')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('project_instructions')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('project_id', projectId)
          .select()
          .single();

        if (error) {
          console.error('Error updating project instructions:', error);
          return null;
        }

        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('project_instructions')
          .insert({ project_id: projectId, content })
          .select()
          .single();

        if (error) {
          console.error('Error creating project instructions:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in saveProjectInstructions:', error);
      return null;
    }
  },

  /**
   * Delete instructions for a project
   */
  async deleteProjectInstructions(projectId: string): Promise<boolean> {
    if (!(await checkTableAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('project_instructions')
        .delete()
        .eq('project_id', projectId);

      if (error) {
        console.error('Error deleting project instructions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProjectInstructions:', error);
      return false;
    }
  },

  // ============================================
  // FILE OPERATIONS
  // ============================================

  /**
   * Get files for a project
   */
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    if (!(await checkTableAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project files:', error);
        return [];
      }

      // Add public URLs
      return (data || []).map((file: ProjectFile) => ({
        ...file,
        public_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket_name}/${file.storage_path}`,
      }));
    } catch (error) {
      console.error('Error in getProjectFiles:', error);
      return [];
    }
  },

  /**
   * Upload a file to a project
   */
  async uploadProjectFile(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ProjectFile | null> {
    if (!(await checkTableAvailable())) {
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size, 'Max:', MAX_FILE_SIZE);
      return null;
    }

    const supabase = createClient();

    try {
      // Generate unique filename
      const ext = getFileExtension(file.name);
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${randomId}${ext ? `.${ext}` : ''}`;
      const storagePath = `${projectId}/${filename}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        return null;
      }

      // Simulate progress (Supabase doesn't provide real progress)
      onProgress?.(100);

      // Create file record
      const { data: fileRecord, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          filename,
          original_filename: file.name,
          storage_path: storagePath,
          bucket_name: PROJECT_FILES_BUCKET,
          mime_type: file.type || null,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: delete from storage
        await supabase.storage.from(PROJECT_FILES_BUCKET).remove([storagePath]);
        console.error('Error creating file record:', dbError);
        return null;
      }

      return {
        ...fileRecord,
        public_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PROJECT_FILES_BUCKET}/${storagePath}`,
      };
    } catch (error) {
      console.error('Error in uploadProjectFile:', error);
      return null;
    }
  },

  /**
   * Delete a file from a project
   */
  async deleteProjectFile(fileId: string): Promise<boolean> {
    if (!(await checkTableAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      // Get file record
      const { data: file, error: fetchError } = await supabase
        .from('project_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError || !file) {
        console.error('Error fetching file for deletion:', fetchError);
        return false;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue to delete record anyway
      }

      // Delete record
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Error deleting file record:', dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProjectFile:', error);
      return false;
    }
  },

  /**
   * Get total file size for a project (for capacity display)
   */
  async getProjectFileSize(projectId: string): Promise<number> {
    if (!(await checkTableAvailable())) {
      return 0;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('file_size')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching file sizes:', error);
        return 0;
      }

      return (data || []).reduce((sum: number, f: { file_size: number | null }) => sum + (f.file_size || 0), 0);
    } catch (error) {
      console.error('Error in getProjectFileSize:', error);
      return 0;
    }
  },
};

export type { Project as DbProject };
