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
 * Supports half-screen and full-screen modes with delightful animations.
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

  // Panel width based on mode - always 50% for half mode
  const panelWidth = panelMode === 'full' ? '100%' : '50%';

  // Animation variants - delightful spring animation
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
        stiffness: 400,
        damping: 35,
        mass: 0.8,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 0.8,
      },
    },
  };

  // Backdrop for full mode
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  if (!activeCanvas) return null;

  return (
    <AnimatePresence mode="wait">
      {isCanvasOpen && (
        <>
          {/* Backdrop for full mode */}
          {panelMode === 'full' && (
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/20 z-40"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeCanvas}
            />
          )}

          {/* Canvas Panel */}
          <motion.div
            key="canvas-panel"
            className={`fixed top-12 right-0 bottom-0 z-40 flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-2xl ${className}`}
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
            {/* Header - matching chat header height */}
            <CanvasHeader
              title={activeCanvas.title}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CanvasPanel;
