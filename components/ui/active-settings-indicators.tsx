'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, PenTool } from 'lucide-react';
import { Project } from './project-selector';
import { WritingStyle } from './writing-style-selector';

interface IndicatorChipProps {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  onRemove: () => void;
  disabled?: boolean;
}

function IndicatorChip({ icon: Icon, tooltip, onRemove, disabled }: IndicatorChipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        // Delay tooltip slightly
        setTimeout(() => setShowTooltip(true), 400);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          if (!disabled) {
            e.stopPropagation();
            onRemove();
          }
        }}
        disabled={disabled}
        className={`
          relative
          flex items-center justify-center
          w-9 h-9 rounded-lg
          bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]
          transition-all duration-150
          ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-[var(--bg-brand-secondary)]'}
        `}
      >
        <Icon className="w-[18px] h-[18px]" />
        
        {/* X overlay - appears on hover */}
        <AnimatePresence>
          {isHovered && !disabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.1 }}
              className="
                absolute inset-0
                flex items-center justify-center
                bg-[var(--bg-brand-secondary)] rounded-lg
              "
            >
              <X className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg px-3 py-1.5 whitespace-nowrap">
              <div className="text-xs font-medium text-[var(--fg-primary)]">
                {tooltip}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActiveSettingsIndicatorsProps {
  currentProject: Project | null;
  currentWritingStyle: WritingStyle | null;
  onRemoveProject: () => void;
  onRemoveWritingStyle: () => void;
  disabled?: boolean;
}

export function ActiveSettingsIndicators({
  currentProject,
  currentWritingStyle,
  onRemoveProject,
  onRemoveWritingStyle,
  disabled,
}: ActiveSettingsIndicatorsProps) {
  const hasActiveSettings = currentProject || currentWritingStyle;

  if (!hasActiveSettings) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <AnimatePresence mode="popLayout">
        {/* Project indicator */}
        {currentProject && (
          <motion.div
            key="project"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <IndicatorChip
              icon={Folder}
              tooltip={currentProject.name}
              onRemove={onRemoveProject}
              disabled={disabled}
            />
          </motion.div>
        )}

        {/* Writing style indicator */}
        {currentWritingStyle && (
          <motion.div
            key="style"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <IndicatorChip
              icon={PenTool}
              tooltip={currentWritingStyle.name}
              onRemove={onRemoveWritingStyle}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
