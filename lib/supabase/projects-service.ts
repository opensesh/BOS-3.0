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

// Track if table is available
let tableChecked = false;
let tableAvailable = true;

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
 * Projects Service
 * CRUD operations for chat project folders
 */
export const projectsService = {
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
        .order('created_at', { ascending: false });

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
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    if (!(await checkTableAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
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
  async getProjectChats(projectId: string): Promise<string[]> {
    if (!(await checkTableAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('id')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching project chats:', error);
        return [];
      }

      return (chats || []).map(c => c.id);
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
};

export type { Project as DbProject };

