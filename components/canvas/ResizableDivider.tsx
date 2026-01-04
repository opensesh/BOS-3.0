'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ResizableDividerProps {
  /** Current width percentage of left panel (0-100) */
  leftWidth: number;
  /** Callback when width changes */
  onWidthChange: (width: number) => void;
  /** Minimum width percentage for left panel */
  minLeftWidth?: number;
  /** Maximum width percentage for left panel */
  maxLeftWidth?: number;
  /** Whether the divider is visible/active */
  isActive?: boolean;
}

/**
 * ResizableDivider Component
 * 
 * A draggable divider that allows users to resize the chat and canvas panels.
 * Shows a visual indicator on hover and while dragging.
 */
export function ResizableDivider({
  leftWidth,
  onWidthChange,
  minLeftWidth = 25,
  maxLeftWidth = 75,
  isActive = true,
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newLeftWidth = (e.clientX / windowWidth) * 100;
      
      // Clamp to min/max bounds
      const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Change cursor while dragging
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minLeftWidth, maxLeftWidth, onWidthChange]);

  if (!isActive) return null;

  const showIndicator = isHovered || isDragging;

  return (
    <div
      ref={dividerRef}
      className="fixed top-12 bottom-0 z-50 flex items-center justify-center cursor-col-resize"
      style={{ left: `${leftWidth}%`, width: '12px', marginLeft: '-6px' }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible hit area */}
      <div className="absolute inset-0" />
      
      {/* Visual divider line */}
      <motion.div
        className="w-[3px] h-full rounded-full"
        initial={false}
        animate={{
          backgroundColor: showIndicator 
            ? 'var(--fg-brand-primary)' 
            : 'var(--border-secondary)',
          scaleX: showIndicator ? 1.5 : 1,
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Drag handle indicator */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 p-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-secondary)]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showIndicator ? 1 : 0,
          scale: showIndicator ? 1 : 0.8,
        }}
        transition={{ duration: 0.15 }}
      >
        {/* Grip dots */}
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-[var(--fg-tertiary)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--fg-tertiary)]" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-[var(--fg-tertiary)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--fg-tertiary)]" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-[var(--fg-tertiary)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--fg-tertiary)]" />
        </div>
      </motion.div>
    </div>
  );
}

export default ResizableDivider;

