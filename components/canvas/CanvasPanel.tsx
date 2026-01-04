'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasContext, type CanvasPanelMode, type CanvasViewMode } from '@/lib/canvas-context';
import { useBrandColors } from '@/hooks/useBrandColors';
import { useBrandFonts } from '@/hooks/useBrandFonts';
import { CanvasHeader } from './CanvasHeader';
import { CanvasContent } from './CanvasContent';
import { ResizableDivider } from './ResizableDivider';

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
 * - Desktop: Resizable width with draggable divider
 * - Tablet/Mobile: Always 100% width with back button
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
    canvasWidthPercent,
    closeCanvas,
    setPanelMode,
    setViewMode,
    setLocalContent,
    saveCanvas,
    setCanvasWidthPercent,
  } = useCanvasContext();

  // Track if we're on mobile/tablet
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Handle divider resize - sets chat width (left side)
  const handleWidthChange = useCallback((chatWidth: number) => {
    // Canvas width is 100 - chat width
    setCanvasWidthPercent(100 - chatWidth);
  }, [setCanvasWidthPercent]);

  // Panel width: 100% on mobile, or based on canvasWidthPercent on desktop
  const getPanelWidth = () => {
    if (isMobile) return '100%';
    if (panelMode === 'full') return '100%';
    return `${canvasWidthPercent}%`;
  };

  // Chat width (left side) for the divider
  const chatWidth = 100 - canvasWidthPercent;

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

  // Backdrop for full mode on desktop
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
          {/* Backdrop for full mode on desktop */}
          {panelMode === 'full' && !isMobile && (
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

          {/* Resizable Divider - only on desktop in half mode */}
          {!isMobile && panelMode === 'half' && (
            <ResizableDivider
              leftWidth={chatWidth}
              onWidthChange={handleWidthChange}
              minLeftWidth={25}
              maxLeftWidth={75}
              isActive={true}
            />
          )}

          {/* Canvas Panel - top-14 on mobile, top-12 on desktop to match header */}
          <motion.div
            key="canvas-panel"
            className={`fixed top-14 lg:top-12 right-0 bottom-0 z-40 flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-2xl ${className}`}
            style={{ 
              width: getPanelWidth(),
              ...themeStyles,
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
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
              showBackButton={isMobile}
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
