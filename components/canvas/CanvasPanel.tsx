'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasContext, type CanvasPanelMode, type CanvasViewMode } from '@/lib/canvas-context';
import { useBrandColors } from '@/hooks/useBrandColors';
import { useBrandFonts } from '@/hooks/useBrandFonts';
import { CanvasHeader } from './CanvasHeader';
import { CanvasContent } from './CanvasContent';

interface CanvasPanelProps {
  /** Override default panel mode */
  defaultPanelMode?: CanvasPanelMode;
  /** Override default view mode */
  defaultViewMode?: CanvasViewMode;
  /** Custom class name */
  className?: string;
}

/**
 * CanvasPanel Component
 * 
 * Main canvas editor/viewer panel that slides in from the right.
 * Supports half-screen and full-screen modes.
 */
export function CanvasPanel({
  defaultPanelMode,
  defaultViewMode,
  className = '',
}: CanvasPanelProps) {
  const {
    activeCanvas,
    isCanvasOpen,
    panelMode,
    viewMode,
    isStreaming,
    isSaving,
    localContent,
    hasUnsavedChanges,
    closeCanvas,
    setPanelMode,
    setViewMode,
    setLocalContent,
    saveCanvas,
  } = useCanvasContext();

  // Brand theming
  const { brandColors } = useBrandColors();
  const { displayFonts, bodyFonts } = useBrandFonts();

  // Get primary font family names
  const displayFontFamily = displayFonts[0]?.metadata?.fontFamily || 'var(--font-display)';
  const bodyFontFamily = bodyFonts[0]?.metadata?.fontFamily || 'var(--font-sans)';
  const accentColor = brandColors?.[0]?.hexValue || 'var(--fg-brand-primary)';

  // Set defaults if provided
  useEffect(() => {
    if (defaultPanelMode) setPanelMode(defaultPanelMode);
    if (defaultViewMode) setViewMode(defaultViewMode);
  }, [defaultPanelMode, defaultViewMode, setPanelMode, setViewMode]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isCanvasOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCanvas();
      }
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCanvas();
      }
      // Cmd/Ctrl + E to toggle view mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setViewMode(viewMode === 'view' ? 'source' : 'view');
      }
      // Cmd/Ctrl + F to toggle fullscreen
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setPanelMode(panelMode === 'half' ? 'full' : 'half');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCanvasOpen, viewMode, panelMode, closeCanvas, saveCanvas, setViewMode, setPanelMode]);

  // Build theme styles from brand
  const themeStyles: React.CSSProperties = {
    '--canvas-heading-font': displayFontFamily,
    '--canvas-body-font': bodyFontFamily,
    '--canvas-accent': accentColor,
  } as React.CSSProperties;

  // Handle content change
  const handleContentChange = useCallback((content: string) => {
    setLocalContent(content);
  }, [setLocalContent]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: CanvasViewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  // Handle panel mode change
  const handlePanelModeChange = useCallback((mode: CanvasPanelMode) => {
    setPanelMode(mode);
  }, [setPanelMode]);

  // Panel width based on mode
  const panelWidth = panelMode === 'full' ? '100%' : '50%';

  // Animation variants
  const panelVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  if (!activeCanvas) return null;

  return (
    <AnimatePresence>
      {isCanvasOpen && (
        <>
          {/* Canvas Panel - Fixed to right side */}
          <motion.div
            className={`fixed top-0 right-0 bottom-0 z-40 flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-2xl ${className}`}
            style={{ 
              width: panelWidth,
              ...themeStyles,
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            {/* Header */}
            <CanvasHeader
              title={activeCanvas.title}
              fileType={activeCanvas.contentType === 'markdown' ? 'MD' : activeCanvas.contentType.toUpperCase()}
              viewMode={viewMode}
              panelMode={panelMode}
              content={localContent}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              onViewModeChange={handleViewModeChange}
              onPanelModeChange={handlePanelModeChange}
              onClose={closeCanvas}
              onSave={saveCanvas}
            />

            {/* Content */}
            <CanvasContent
              content={localContent}
              viewMode={viewMode}
              isStreaming={isStreaming}
              isEditable={viewMode === 'source'}
              onChange={handleContentChange}
              themeStyles={themeStyles}
            />

            {/* Footer with keyboard shortcuts */}
            <div className="px-4 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex items-center justify-between text-xs text-[var(--fg-tertiary)]">
              <div className="flex items-center gap-4">
                {hasUnsavedChanges && (
                  <span className="text-[var(--fg-warning-primary)]">Unsaved changes</span>
                )}
                {isSaving && (
                  <span>Saving...</span>
                )}
                <span>Version {activeCanvas.version}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">⌘E</kbd> Toggle view
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">⌘S</kbd> Save
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">Esc</kbd> Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CanvasPanel;

