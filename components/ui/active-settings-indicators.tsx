'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, PenTool, Clock } from 'lucide-react';
import { Project } from './project-selector';
import { WritingStyle } from './writing-style-selector';

interface IndicatorChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
  onRemove: () => void;
  disabled?: boolean;
}

function IndicatorChip({ icon: Icon, label, tooltip, onRemove, disabled }: IndicatorChipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        // Delay tooltip slightly
        setTimeout(() => setShowTooltip(true), 300);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
    >
      <div
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]
          transition-all duration-150
          ${isHovered ? 'pr-1.5' : ''}
        `}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs font-medium truncate max-w-[100px]">{label}</span>
        
        {/* Remove button - appears on hover */}
        <AnimatePresence>
          {isHovered && !disabled && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex items-center justify-center w-4 h-4 rounded hover:bg-[var(--bg-brand-secondary)] transition-colors"
              aria-label={`Remove ${label}`}
            >
              <X className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

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
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-[var(--shadow-lg)] px-3 py-2 whitespace-nowrap max-w-[200px]">
              <div className="text-xs text-[var(--fg-primary)] truncate">
                {tooltip}
              </div>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-6 border-transparent border-t-[var(--bg-secondary)]" style={{ borderWidth: '6px' }} />
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
  extendedThinkingEnabled: boolean;
  onRemoveProject: () => void;
  onRemoveWritingStyle: () => void;
  onRemoveExtendedThinking: () => void;
  disabled?: boolean;
}

export function ActiveSettingsIndicators({
  currentProject,
  currentWritingStyle,
  extendedThinkingEnabled,
  onRemoveProject,
  onRemoveWritingStyle,
  onRemoveExtendedThinking,
  disabled,
}: ActiveSettingsIndicatorsProps) {
  const hasActiveSettings = currentProject || currentWritingStyle || extendedThinkingEnabled;

  if (!hasActiveSettings) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
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
              icon={FolderPlus}
              label={currentProject.name}
              tooltip={`Project: ${currentProject.name}`}
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
              label={currentWritingStyle.name}
              tooltip={`Writing style: ${currentWritingStyle.name}${currentWritingStyle.description ? ` - ${currentWritingStyle.description}` : ''}`}
              onRemove={onRemoveWritingStyle}
              disabled={disabled}
            />
          </motion.div>
        )}

        {/* Extended thinking indicator */}
        {extendedThinkingEnabled && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <IndicatorChip
              icon={Clock}
              label="Extended"
              tooltip="Extended thinking mode enabled - Claude will think longer for complex problems"
              onRemove={onRemoveExtendedThinking}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

