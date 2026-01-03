'use client';

import { useState, useEffect, useCallback } from 'react';
import { canvasService, type Canvas, type CanvasVersion } from '@/lib/supabase/canvas-service';
import type { CanvasEditedBy, CanvasThemeConfig } from '@/lib/supabase/types';

interface UseCanvasOptions {
  /** Canvas ID to load */
  canvasId?: string;
  /** Chat ID to load canvas for */
  chatId?: string;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseCanvasReturn {
  // Data
  canvas: Canvas | null;
  versions: CanvasVersion[];
  recentCanvases: Canvas[];
  
  // Loading states
  isLoading: boolean;
  isVersionsLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  
  // CRUD operations
  create: (title: string, content?: string, chatId?: string) => Promise<Canvas | null>;
  update: (content: string, editedBy?: CanvasEditedBy, editSummary?: string) => Promise<boolean>;
  updateTitle: (title: string) => Promise<boolean>;
  updateTheme: (theme: CanvasThemeConfig) => Promise<boolean>;
  archive: () => Promise<boolean>;
  remove: () => Promise<boolean>;
  duplicate: (newTitle?: string) => Promise<Canvas | null>;
  
  // Version operations
  loadVersions: () => Promise<void>;
  restoreVersion: (version: number) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
  loadRecent: (limit?: number) => Promise<void>;
}

/**
 * Hook for managing canvas data and operations
 */
export function useCanvas(options: UseCanvasOptions = {}): UseCanvasReturn {
  const { canvasId, chatId, autoFetch = true } = options;

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [versions, setVersions] = useState<CanvasVersion[]>([]);
  const [recentCanvases, setRecentCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch canvas by ID
  const fetchCanvas = useCallback(async () => {
    if (!canvasId && !chatId) return;

    setIsLoading(true);
    setError(null);

    try {
      let fetchedCanvas: Canvas | null = null;

      if (canvasId) {
        fetchedCanvas = await canvasService.getCanvas(canvasId);
      } else if (chatId) {
        fetchedCanvas = await canvasService.getCanvasByChatId(chatId);
      }

      setCanvas(fetchedCanvas);
    } catch (err) {
      console.error('Error fetching canvas:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch canvas'));
    } finally {
      setIsLoading(false);
    }
  }, [canvasId, chatId]);

  // Auto-fetch on mount or when IDs change
  useEffect(() => {
    if (autoFetch && (canvasId || chatId)) {
      fetchCanvas();
    }
  }, [autoFetch, canvasId, chatId, fetchCanvas]);

  // Create a new canvas
  const create = useCallback(async (
    title: string,
    content: string = '',
    newChatId?: string
  ): Promise<Canvas | null> => {
    setIsSaving(true);
    setError(null);

    try {
      const newCanvas = await canvasService.createCanvas({
        title,
        content,
        chat_id: newChatId || chatId || null,
        last_edited_by: 'assistant',
      });

      if (newCanvas) {
        setCanvas(newCanvas);
      }

      return newCanvas;
    } catch (err) {
      console.error('Error creating canvas:', err);
      setError(err instanceof Error ? err : new Error('Failed to create canvas'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [chatId]);

  // Update canvas content
  const update = useCallback(async (
    content: string,
    editedBy: CanvasEditedBy = 'user',
    editSummary?: string
  ): Promise<boolean> => {
    if (!canvas) return false;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await canvasService.updateCanvasContent(
        canvas.id,
        content,
        editedBy,
        editSummary
      );

      if (updated) {
        setCanvas(updated);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating canvas:', err);
      setError(err instanceof Error ? err : new Error('Failed to update canvas'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Update canvas title
  const updateTitle = useCallback(async (title: string): Promise<boolean> => {
    if (!canvas) return false;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await canvasService.updateCanvas(canvas.id, { title });

      if (updated) {
        setCanvas(updated);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating canvas title:', err);
      setError(err instanceof Error ? err : new Error('Failed to update title'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Update canvas theme
  const updateTheme = useCallback(async (theme: CanvasThemeConfig): Promise<boolean> => {
    if (!canvas) return false;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await canvasService.updateCanvas(canvas.id, {
        theme_config: theme,
      });

      if (updated) {
        setCanvas(updated);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating canvas theme:', err);
      setError(err instanceof Error ? err : new Error('Failed to update theme'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Archive canvas
  const archive = useCallback(async (): Promise<boolean> => {
    if (!canvas) return false;

    setIsSaving(true);
    setError(null);

    try {
      const success = await canvasService.archiveCanvas(canvas.id);
      if (success) {
        setCanvas(null);
      }
      return success;
    } catch (err) {
      console.error('Error archiving canvas:', err);
      setError(err instanceof Error ? err : new Error('Failed to archive canvas'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Delete canvas
  const remove = useCallback(async (): Promise<boolean> => {
    if (!canvas) return false;

    setIsSaving(true);
    setError(null);

    try {
      const success = await canvasService.deleteCanvas(canvas.id);
      if (success) {
        setCanvas(null);
        setVersions([]);
      }
      return success;
    } catch (err) {
      console.error('Error deleting canvas:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete canvas'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Duplicate canvas
  const duplicate = useCallback(async (newTitle?: string): Promise<Canvas | null> => {
    if (!canvas) return null;

    setIsSaving(true);
    setError(null);

    try {
      const duplicated = await canvasService.duplicateCanvas(canvas.id, newTitle);
      return duplicated;
    } catch (err) {
      console.error('Error duplicating canvas:', err);
      setError(err instanceof Error ? err : new Error('Failed to duplicate canvas'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Load version history
  const loadVersions = useCallback(async () => {
    if (!canvas) return;

    setIsVersionsLoading(true);

    try {
      const fetchedVersions = await canvasService.getCanvasVersions(canvas.id);
      setVersions(fetchedVersions);
    } catch (err) {
      console.error('Error loading versions:', err);
    } finally {
      setIsVersionsLoading(false);
    }
  }, [canvas]);

  // Restore to a previous version
  const restoreVersion = useCallback(async (version: number): Promise<boolean> => {
    if (!canvas) return false;

    setIsSaving(true);
    setError(null);

    try {
      const restored = await canvasService.restoreCanvasVersion(canvas.id, version);
      if (restored) {
        setCanvas(restored);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error restoring version:', err);
      setError(err instanceof Error ? err : new Error('Failed to restore version'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canvas]);

  // Refresh current canvas
  const refresh = useCallback(async () => {
    await fetchCanvas();
  }, [fetchCanvas]);

  // Load recent canvases
  const loadRecent = useCallback(async (limit = 20) => {
    try {
      const recent = await canvasService.getRecentCanvases(limit);
      setRecentCanvases(recent);
    } catch (err) {
      console.error('Error loading recent canvases:', err);
    }
  }, []);

  return {
    // Data
    canvas,
    versions,
    recentCanvases,
    // Loading states
    isLoading,
    isVersionsLoading,
    isSaving,
    error,
    // CRUD
    create,
    update,
    updateTitle,
    updateTheme,
    archive,
    remove,
    duplicate,
    // Versions
    loadVersions,
    restoreVersion,
    // Refresh
    refresh,
    loadRecent,
  };
}

export default useCanvas;

