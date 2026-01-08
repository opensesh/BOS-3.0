'use client';

import { createClient } from './client';
import type {
  Canvas,
  CanvasInsert,
  CanvasUpdate,
  CanvasVersion,
  CanvasVersionInsert,
  DbCanvas,
  DbCanvasVersion,
  CanvasEditedBy,
} from './types';
import { dbCanvasToApp, dbCanvasVersionToApp } from './types';

// Track if tables are available (to avoid repeated error logs)
let tablesChecked = false;
let tablesAvailable = true;

/**
 * Check if canvas tables are available
 * Returns false if tables don't exist (gracefully degrades)
 */
async function checkTablesAvailable(): Promise<boolean> {
  if (tablesChecked) return tablesAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('canvases')
      .select('id')
      .limit(1);

    tablesChecked = true;

    if (!error) {
      tablesAvailable = true;
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTableMissing =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorCode === '42P01' ||
      errorCode === 'PGRST116';

    tablesAvailable = false;

    if (isTableMissing) {
      console.info('Canvas: Supabase tables not available. Canvas feature disabled.');
    }

    return false;
  } catch {
    tablesChecked = true;
    tablesAvailable = false;
    return false;
  }
}

/**
 * Canvas Service
 * CRUD operations for collaborative canvas documents
 */
export const canvasService = {
  /**
   * Create a new canvas
   */
  async createCanvas(data: CanvasInsert): Promise<Canvas | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: canvas, error } = await supabase
        .from('canvases')
        .insert({
          ...data,
          content: data.content || '',
          content_type: data.content_type || 'markdown',
          theme_config: data.theme_config || {},
        })
        .select()
        .single();

      if (error || !canvas) {
        console.error('Error creating canvas:', error);
        return null;
      }

      return dbCanvasToApp(canvas as DbCanvas);
    } catch (error) {
      console.error('Error in createCanvas:', error);
      return null;
    }
  },

  /**
   * Get a canvas by ID
   */
  async getCanvas(id: string): Promise<Canvas | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: canvas, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !canvas) {
        console.error('Error fetching canvas:', error);
        return null;
      }

      return dbCanvasToApp(canvas as DbCanvas);
    } catch (error) {
      console.error('Error in getCanvas:', error);
      return null;
    }
  },

  /**
   * Get canvas by chat ID (returns the most recent canvas for a chat)
   */
  async getCanvasByChatId(chatId: string): Promise<Canvas | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: canvas, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !canvas) {
        // No canvas for this chat is not an error
        if (error?.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching canvas by chat:', error);
        return null;
      }

      return dbCanvasToApp(canvas as DbCanvas);
    } catch (error) {
      console.error('Error in getCanvasByChatId:', error);
      return null;
    }
  },

  /**
   * Get all canvases for a chat
   */
  async getCanvasesByChatId(chatId: string, includeArchived = false): Promise<Canvas[]> {
    if (!(await checkTablesAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      let query = supabase
        .from('canvases')
        .select('*')
        .eq('chat_id', chatId)
        .order('updated_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data: canvases, error } = await query;

      if (error || !canvases) {
        console.error('Error fetching canvases:', error);
        return [];
      }

      return canvases.map((c) => dbCanvasToApp(c as DbCanvas));
    } catch (error) {
      console.error('Error in getCanvasesByChatId:', error);
      return [];
    }
  },

  /**
   * Update a canvas
   * Automatically handles version tracking via database trigger
   */
  async updateCanvas(
    id: string,
    updates: CanvasUpdate,
    editedBy: CanvasEditedBy = 'user'
  ): Promise<Canvas | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      // Get current canvas to optionally save version history
      const { data: currentCanvas } = await supabase
        .from('canvases')
        .select('*')
        .eq('id', id)
        .single();

      if (currentCanvas && updates.content && updates.content !== currentCanvas.content) {
        // Save to version history before update
        await supabase.from('canvas_versions').insert({
          canvas_id: id,
          version: currentCanvas.version,
          content: currentCanvas.content,
          edited_by: currentCanvas.last_edited_by,
          edit_summary: currentCanvas.edit_summary,
        });
      }

      // Update the canvas
      const { data: canvas, error } = await supabase
        .from('canvases')
        .update({
          ...updates,
          last_edited_by: editedBy,
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !canvas) {
        console.error('Error updating canvas:', error);
        return null;
      }

      return dbCanvasToApp(canvas as DbCanvas);
    } catch (error) {
      console.error('Error in updateCanvas:', error);
      return null;
    }
  },

  /**
   * Update canvas content with edit tracking
   * This is the main method for user/AI edits
   */
  async updateCanvasContent(
    id: string,
    content: string,
    editedBy: CanvasEditedBy,
    editSummary?: string
  ): Promise<Canvas | null> {
    return this.updateCanvas(id, {
      content,
      last_edited_by: editedBy,
      edit_summary: editSummary,
    }, editedBy);
  },

  /**
   * Archive a canvas (soft delete)
   */
  async archiveCanvas(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('canvases')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) {
        console.error('Error archiving canvas:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in archiveCanvas:', error);
      return false;
    }
  },

  /**
   * Delete a canvas permanently
   */
  async deleteCanvas(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) {
      return false;
    }

    const supabase = createClient();

    try {
      // Delete version history first
      await supabase
        .from('canvas_versions')
        .delete()
        .eq('canvas_id', id);

      // Delete the canvas
      const { error } = await supabase
        .from('canvases')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting canvas:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteCanvas:', error);
      return false;
    }
  },

  /**
   * Get version history for a canvas
   */
  async getCanvasVersions(canvasId: string): Promise<CanvasVersion[]> {
    if (!(await checkTablesAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      const { data: versions, error } = await supabase
        .from('canvas_versions')
        .select('*')
        .eq('canvas_id', canvasId)
        .order('version', { ascending: false });

      if (error || !versions) {
        console.error('Error fetching canvas versions:', error);
        return [];
      }

      return versions.map((v) => dbCanvasVersionToApp(v as DbCanvasVersion));
    } catch (error) {
      console.error('Error in getCanvasVersions:', error);
      return [];
    }
  },

  /**
   * Get a specific version of a canvas
   */
  async getCanvasVersion(canvasId: string, version: number): Promise<CanvasVersion | null> {
    if (!(await checkTablesAvailable())) {
      return null;
    }

    const supabase = createClient();

    try {
      const { data: versionData, error } = await supabase
        .from('canvas_versions')
        .select('*')
        .eq('canvas_id', canvasId)
        .eq('version', version)
        .single();

      if (error || !versionData) {
        console.error('Error fetching canvas version:', error);
        return null;
      }

      return dbCanvasVersionToApp(versionData as DbCanvasVersion);
    } catch (error) {
      console.error('Error in getCanvasVersion:', error);
      return null;
    }
  },

  /**
   * Restore a canvas to a previous version
   */
  async restoreCanvasVersion(canvasId: string, version: number): Promise<Canvas | null> {
    const versionData = await this.getCanvasVersion(canvasId, version);
    if (!versionData) {
      return null;
    }

    return this.updateCanvasContent(
      canvasId,
      versionData.content,
      'user',
      `Restored to version ${version}`
    );
  },

  /**
   * Get all recent canvases (for browsing/history)
   */
  async getRecentCanvases(limit = 20): Promise<Canvas[]> {
    if (!(await checkTablesAvailable())) {
      return [];
    }

    const supabase = createClient();

    try {
      const { data: canvases, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error || !canvases) {
        console.error('Error fetching recent canvases:', error);
        return [];
      }

      return canvases.map((c) => dbCanvasToApp(c as DbCanvas));
    } catch (error) {
      console.error('Error in getRecentCanvases:', error);
      return [];
    }
  },

  /**
   * Duplicate a canvas
   */
  async duplicateCanvas(id: string, newTitle?: string): Promise<Canvas | null> {
    const original = await this.getCanvas(id);
    if (!original) {
      return null;
    }

    return this.createCanvas({
      chat_id: original.chatId || null,
      title: newTitle || `${original.title} (Copy)`,
      content: original.content,
      content_type: original.contentType,
      brand_id: original.brandId || null,
      theme_config: original.themeConfig,
      last_edited_by: 'user',
    });
  },
};

export type { Canvas, CanvasVersion };

