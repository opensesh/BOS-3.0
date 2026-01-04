'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { canvasService, type Canvas } from '@/lib/supabase/canvas-service';
import type { CanvasEditedBy, CanvasThemeConfig } from '@/lib/supabase/types';

export type CanvasPanelMode = 'half' | 'full';
export type CanvasViewMode = 'view' | 'source';

export interface CanvasState {
  /** The currently active canvas */
  activeCanvas: Canvas | null;
  /** Whether the canvas panel is open */
  isCanvasOpen: boolean;
  /** Panel display mode */
  panelMode: CanvasPanelMode;
  /** View mode (rendered markdown or source) */
  viewMode: CanvasViewMode;
  /** Whether content is being streamed from AI */
  isStreaming: boolean;
  /** Whether canvas is saving */
  isSaving: boolean;
  /** Local edit content (before save) */
  localContent: string;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Canvas panel width as percentage (0-100) - only used on desktop in half mode */
  canvasWidthPercent: number;
}

interface CanvasContextValue extends CanvasState {
  // Canvas CRUD
  createCanvas: (title: string, content?: string, chatId?: string) => Promise<Canvas | null>;
  openCanvas: (canvas: Canvas) => void;
  closeCanvas: () => void;
  updateCanvasContent: (content: string, editedBy?: CanvasEditedBy, editSummary?: string) => Promise<boolean>;
  saveCanvas: () => Promise<boolean>;
  deleteCanvas: () => Promise<boolean>;
  
  // Panel controls
  setPanelMode: (mode: CanvasPanelMode) => void;
  togglePanelMode: () => void;
  setViewMode: (mode: CanvasViewMode) => void;
  toggleViewMode: () => void;
  setCanvasWidthPercent: (width: number) => void;
  
  // Content editing
  setLocalContent: (content: string) => void;
  
  // Streaming
  setIsStreaming: (streaming: boolean) => void;
  appendStreamContent: (chunk: string) => void;
  
  // AI context helpers
  getCanvasContextForAI: () => string | null;
  
  // Load canvas by ID or chat ID
  loadCanvas: (canvasId: string) => Promise<Canvas | null>;
  loadCanvasByChatId: (chatId: string) => Promise<Canvas | null>;
  
  // Theme
  updateCanvasTheme: (theme: CanvasThemeConfig) => Promise<boolean>;
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  // Canvas state
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<CanvasPanelMode>('half');
  const [viewMode, setViewMode] = useState<CanvasViewMode>('view');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [canvasWidthPercent, setCanvasWidthPercent] = useState(50); // Default 50% width

  // Sync local content with active canvas
  useEffect(() => {
    if (activeCanvas) {
      setLocalContent(activeCanvas.content);
      setHasUnsavedChanges(false);
    }
  }, [activeCanvas?.id, activeCanvas?.version]);

  // Track unsaved changes
  useEffect(() => {
    if (activeCanvas && localContent !== activeCanvas.content) {
      setHasUnsavedChanges(true);
    }
  }, [localContent, activeCanvas?.content]);

  // Create a new canvas
  const createCanvas = useCallback(async (
    title: string,
    content: string = '',
    chatId?: string
  ): Promise<Canvas | null> => {
    const canvas = await canvasService.createCanvas({
      title,
      content,
      chat_id: chatId || null,
      last_edited_by: 'assistant',
    });

    if (canvas) {
      setActiveCanvas(canvas);
      setLocalContent(canvas.content);
      setIsCanvasOpen(true);
      setHasUnsavedChanges(false);
    }

    return canvas;
  }, []);

  // Open an existing canvas
  const openCanvas = useCallback((canvas: Canvas) => {
    setActiveCanvas(canvas);
    setLocalContent(canvas.content);
    setIsCanvasOpen(true);
    setHasUnsavedChanges(false);
  }, []);

  // Close the canvas panel
  const closeCanvas = useCallback(() => {
    setIsCanvasOpen(false);
    // Don't clear activeCanvas immediately - allow for animations
    setTimeout(() => {
      if (!isCanvasOpen) {
        // Only clear if still closed after timeout
      }
    }, 300);
  }, [isCanvasOpen]);

  // Update canvas content
  const updateCanvasContent = useCallback(async (
    content: string,
    editedBy: CanvasEditedBy = 'user',
    editSummary?: string
  ): Promise<boolean> => {
    if (!activeCanvas) return false;

    setIsSaving(true);
    try {
      const updated = await canvasService.updateCanvasContent(
        activeCanvas.id,
        content,
        editedBy,
        editSummary
      );

      if (updated) {
        setActiveCanvas(updated);
        setLocalContent(updated.content);
        setHasUnsavedChanges(false);
        return true;
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [activeCanvas]);

  // Save current local content
  const saveCanvas = useCallback(async (): Promise<boolean> => {
    if (!activeCanvas || !hasUnsavedChanges) return true;
    return updateCanvasContent(localContent, 'user');
  }, [activeCanvas, hasUnsavedChanges, localContent, updateCanvasContent]);

  // Delete current canvas
  const deleteCanvas = useCallback(async (): Promise<boolean> => {
    if (!activeCanvas) return false;

    const success = await canvasService.deleteCanvas(activeCanvas.id);
    if (success) {
      setActiveCanvas(null);
      setIsCanvasOpen(false);
      setLocalContent('');
      setHasUnsavedChanges(false);
    }
    return success;
  }, [activeCanvas]);

  // Toggle panel mode
  const togglePanelMode = useCallback(() => {
    setPanelMode(prev => prev === 'half' ? 'full' : 'half');
  }, []);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'view' ? 'source' : 'view');
  }, []);

  // Handle local content changes
  const handleSetLocalContent = useCallback((content: string) => {
    setLocalContent(content);
  }, []);

  // Append streaming content from AI
  const appendStreamContent = useCallback((chunk: string) => {
    setLocalContent(prev => prev + chunk);
  }, []);

  // Get canvas context for AI prompts
  const getCanvasContextForAI = useCallback((): string | null => {
    if (!activeCanvas) return null;

    let context = `<current_canvas id="${activeCanvas.id}" title="${activeCanvas.title}" version="${activeCanvas.version}">
${localContent || activeCanvas.content}
</current_canvas>`;

    // Include previous content if user has made edits
    if (activeCanvas.previousContent && activeCanvas.lastEditedBy === 'user') {
      context += `

<previous_canvas_version>
${activeCanvas.previousContent}
</previous_canvas_version>

Note: The user has edited the canvas since the last AI response.`;
    }

    return context;
  }, [activeCanvas, localContent]);

  // Load canvas by ID
  const loadCanvas = useCallback(async (canvasId: string): Promise<Canvas | null> => {
    const canvas = await canvasService.getCanvas(canvasId);
    if (canvas) {
      openCanvas(canvas);
    }
    return canvas;
  }, [openCanvas]);

  // Load canvas by chat ID
  const loadCanvasByChatId = useCallback(async (chatId: string): Promise<Canvas | null> => {
    const canvas = await canvasService.getCanvasByChatId(chatId);
    if (canvas) {
      openCanvas(canvas);
    }
    return canvas;
  }, [openCanvas]);

  // Update canvas theme
  const updateCanvasTheme = useCallback(async (theme: CanvasThemeConfig): Promise<boolean> => {
    if (!activeCanvas) return false;

    const updated = await canvasService.updateCanvas(activeCanvas.id, {
      theme_config: theme,
    });

    if (updated) {
      setActiveCanvas(updated);
      return true;
    }
    return false;
  }, [activeCanvas]);

  return (
    <CanvasContext.Provider value={{
      // State
      activeCanvas,
      isCanvasOpen,
      panelMode,
      viewMode,
      isStreaming,
      isSaving,
      localContent,
      hasUnsavedChanges,
      canvasWidthPercent,
      // CRUD
      createCanvas,
      openCanvas,
      closeCanvas,
      updateCanvasContent,
      saveCanvas,
      deleteCanvas,
      // Panel controls
      setPanelMode,
      togglePanelMode,
      setViewMode,
      toggleViewMode,
      setCanvasWidthPercent,
      // Content editing
      setLocalContent: handleSetLocalContent,
      // Streaming
      setIsStreaming,
      appendStreamContent,
      // AI context
      getCanvasContextForAI,
      // Load
      loadCanvas,
      loadCanvasByChatId,
      // Theme
      updateCanvasTheme,
    }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
}

// Optional hook for components that may be outside CanvasProvider
export function useCanvasContextOptional() {
  return useContext(CanvasContext);
}

