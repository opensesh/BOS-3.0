'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Circle,
} from 'lucide-react';
import type { ResearchProgress as ResearchProgressType, ResearchPhase } from '@/hooks/useResearch';
import type { SubQuestion, QueryComplexity } from '@/lib/ai/research/types';

// ============================================
// TYPES
// ============================================

interface ResearchProgressProps {
  /** Progress state from useResearch hook */
  progress: ResearchProgressType;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
  /** Show detailed sub-question breakdown */
  showDetails?: boolean;
  /** Callback when user wants to see full timeline */
  onShowTimeline?: () => void;
}

// ============================================
// PHASE CONFIGURATION
// ============================================

interface PhaseConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const phaseConfig: Record<ResearchPhase, PhaseConfig> = {
  idle: {
    label: 'Ready',
    icon: Search,
    description: 'Waiting to start',
    color: 'text-[var(--fg-tertiary)]',
  },
  starting: {
    label: 'Starting',
    icon: Search,
    description: 'Initializing research',
    color: 'text-[var(--fg-brand-primary)]',
  },
  classifying: {
    label: 'Analyzing',
    icon: Search,
    description: 'Determining query complexity',
    color: 'text-[var(--fg-brand-primary)]',
  },
  planning: {
    label: 'Planning',
    icon: Search,
    description: 'Breaking down into sub-questions',
    color: 'text-[var(--fg-brand-primary)]',
  },
  searching: {
    label: 'Researching',
    icon: Search,
    description: 'Searching for information',
    color: 'text-[var(--fg-brand-primary)]',
  },
  synthesizing: {
    label: 'Synthesizing',
    icon: Search,
    description: 'Combining research findings',
    color: 'text-[var(--fg-brand-primary)]',
  },
  gap_analysis: {
    label: 'Gap Analysis',
    icon: Search,
    description: 'Identifying missing information',
    color: 'text-amber-500',
  },
  round2: {
    label: 'Round 2',
    icon: Search,
    description: 'Filling research gaps',
    color: 'text-[var(--fg-brand-primary)]',
  },
  completed: {
    label: 'Complete',
    icon: CheckCircle,
    description: 'Research finished',
    color: 'text-[var(--fg-success-primary)]',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    description: 'Something went wrong',
    color: 'text-[var(--fg-error-primary)]',
  },
};

// ============================================
// COMPLEXITY BADGE
// ============================================

function ComplexityBadge({ complexity }: { complexity: QueryComplexity | null }) {
  if (!complexity) return null;

  const config = {
    simple: {
      label: 'Simple',
      bg: 'bg-green-500/10',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-500/20',
    },
    moderate: {
      label: 'Moderate',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
    },
    complex: {
      label: 'Complex',
      bg: 'bg-[var(--bg-brand-primary)]/10',
      text: 'text-[var(--fg-brand-primary)]',
      border: 'border-[var(--border-brand-primary)]',
    },
  };

  const c = config[complexity];

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        ${c.bg} ${c.text} border ${c.border}
      `}
    >
      {c.label}
    </span>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

function ProgressBar({
  progress,
  showPercentage = false
}: {
  progress: number;
  showPercentage?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--bg-brand-solid)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs text-[var(--fg-tertiary)] tabular-nums w-10 text-right">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

// ============================================
// SUB-QUESTION ITEM
// ============================================

function SubQuestionItem({ question, index }: { question: SubQuestion; index: number }) {
  const statusIcons = {
    pending: Circle,
    searching: Loader2,
    completed: CheckCircle,
    failed: AlertCircle,
  };

  const statusColors = {
    pending: 'text-[var(--fg-tertiary)]',
    searching: 'text-[var(--fg-brand-primary)]',
    completed: 'text-[var(--fg-success-primary)]',
    failed: 'text-[var(--fg-error-primary)]',
  };

  const Icon = statusIcons[question.status];
  const color = statusColors[question.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-2 py-1.5"
    >
      <Icon
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color} ${
          question.status === 'searching' ? 'animate-spin' : ''
        }`}
      />
      <span className="text-sm text-[var(--fg-secondary)] leading-tight">
        {question.question}
      </span>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ResearchProgress({
  progress,
  defaultCollapsed = false,
  showDetails = true,
  onShowTimeline,
}: ResearchProgressProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const config = phaseConfig[progress.phase];
  const Icon = config.icon;
  const isActive = !['idle', 'completed', 'error'].includes(progress.phase);

  // Calculate overall progress percentage
  const overallProgress = calculateOverallProgress(progress);

  // Auto-expand when research starts
  useEffect(() => {
    if (progress.phase === 'starting' || progress.phase === 'classifying') {
      setIsCollapsed(false);
    }
  }, [progress.phase]);

  // Don't render if idle
  if (progress.phase === 'idle') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="mb-4 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-primary)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Icon with subtle pulse animation */}
          <motion.div
            className={`
              p-2 rounded-lg
              ${isActive ? 'bg-[var(--bg-brand-primary)]/10' : 'bg-[var(--bg-tertiary)]'}
            `}
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className={`w-4 h-4 ${config.color}`} />
          </motion.div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--fg-primary)]">
                Deep Research
              </span>
              <ComplexityBadge complexity={progress.complexity} />
            </div>
            <span className="text-xs text-[var(--fg-tertiary)]">
              {config.description}
              {progress.currentSearch && (
                <span className="ml-1">• {truncate(progress.currentSearch, 40)}</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Estimated time with blinking activity dot */}
          {isActive && progress.estimatedTime > 0 && (
            <span className="text-xs text-[var(--fg-tertiary)] flex items-center gap-1.5">
              <motion.div
                className="w-2 h-2 bg-[var(--bg-brand-solid)] rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <Clock className="w-3 h-3" />
              ~{progress.estimatedTime}s
            </span>
          )}

          {/* Search counter */}
          {progress.totalSearches > 0 && (
            <span className="text-xs text-[var(--fg-tertiary)]">
              {progress.completedSearches}/{progress.totalSearches} searches
            </span>
          )}

          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)]" />
          )}
        </div>
      </button>

      {/* Overall Progress Bar */}
      {isActive && (
        <div className="px-4 pb-2">
          <ProgressBar progress={overallProgress} showPercentage />
        </div>
      )}

      {/* Details */}
      <AnimatePresence>
        {!isCollapsed && showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-[var(--border-secondary)] px-4 py-3 space-y-3">
              {/* Pipeline stages */}
              <div className="flex items-center gap-1">
                {renderPipelineStages(progress)}
              </div>

              {/* Sub-questions */}
              {progress.subQuestions.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                    Research Questions ({progress.completedSearches}/{progress.subQuestions.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    {progress.subQuestions.map((sq, i) => (
                      <SubQuestionItem key={sq.id} question={sq} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Synthesis progress */}
              {progress.phase === 'synthesizing' && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                    Synthesizing Answer
                  </h4>
                  <ProgressBar progress={progress.synthesisProgress} showPercentage />
                </div>
              )}

              {/* Gaps found */}
              {progress.gaps.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Gaps Identified ({progress.gaps.length})
                  </h4>
                  <div className="space-y-1">
                    {progress.gaps.map((gap, i) => (
                      <div
                        key={i}
                        className="text-xs text-[var(--fg-secondary)] bg-amber-500/5 rounded px-2 py-1"
                      >
                        {gap.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Round 2 indicator */}
              {progress.isRound2 && (
                <div className="flex items-center gap-2 text-xs text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]/10 rounded-lg px-3 py-2">
                  <Search className="w-3 h-3" />
                  <span>Performing additional research to fill gaps</span>
                </div>
              )}

              {/* Sources found */}
              {progress.sourcesFound > 0 && (
                <div className="text-xs text-[var(--fg-tertiary)]">
                  {progress.sourcesFound} sources found
                </div>
              )}

              {/* Show full timeline link */}
              {onShowTimeline && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowTimeline();
                  }}
                  className="text-xs text-[var(--fg-brand-primary)] hover:underline"
                >
                  Show full research timeline →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateOverallProgress(progress: ResearchProgressType): number {
  const phases: ResearchPhase[] = ['classifying', 'planning', 'searching', 'synthesizing'];
  const phaseIndex = phases.indexOf(progress.phase);

  if (progress.phase === 'completed') return 100;
  if (progress.phase === 'error') return 0;
  if (phaseIndex === -1) return 5; // Starting phase

  const phaseWeight = 100 / phases.length;
  let baseProgress = phaseIndex * phaseWeight;

  // Add progress within current phase
  if (progress.phase === 'searching' && progress.totalSearches > 0) {
    baseProgress += (progress.completedSearches / progress.totalSearches) * phaseWeight;
  } else if (progress.phase === 'synthesizing') {
    baseProgress += (progress.synthesisProgress / 100) * phaseWeight;
  } else {
    baseProgress += phaseWeight * 0.5; // Midway through phase
  }

  return Math.min(baseProgress, 95); // Cap at 95 until truly complete
}

function renderPipelineStages(progress: ResearchProgressType) {
  const stages = [
    { key: 'classify', label: 'Analyze', phases: ['classifying'] },
    { key: 'plan', label: 'Plan', phases: ['planning'] },
    { key: 'search', label: 'Research', phases: ['searching', 'round2'] },
    { key: 'synthesize', label: 'Synthesize', phases: ['synthesizing', 'gap_analysis'] },
  ];

  const getStageStatus = (stage: typeof stages[0]) => {
    if (progress.phase === 'completed') return 'completed';
    if (progress.phase === 'error') return 'error';
    if (stage.phases.includes(progress.phase)) return 'active';

    const currentIndex = stages.findIndex((s) => s.phases.includes(progress.phase));
    const stageIndex = stages.indexOf(stage);

    if (stageIndex < currentIndex) return 'completed';
    return 'pending';
  };

  return stages.map((stage, index) => {
    const status = getStageStatus(stage);
    const isLast = index === stages.length - 1;

    return (
      <React.Fragment key={stage.key}>
        <div className="flex items-center gap-1">
          <div
            className={`
              w-2 h-2 rounded-full
              ${status === 'completed' ? 'bg-[var(--fg-success-primary)]' : ''}
              ${status === 'active' ? 'bg-[var(--bg-brand-solid)]' : ''}
              ${status === 'pending' ? 'bg-[var(--bg-tertiary)]' : ''}
              ${status === 'error' ? 'bg-[var(--fg-error-primary)]' : ''}
            `}
          />
          <span
            className={`
              text-xs
              ${status === 'active' ? 'text-[var(--fg-primary)] font-medium' : 'text-[var(--fg-tertiary)]'}
            `}
          >
            {stage.label}
          </span>
        </div>
        {!isLast && (
          <div
            className={`
              flex-1 h-px max-w-8
              ${status === 'completed' ? 'bg-[var(--fg-success-primary)]' : 'bg-[var(--border-secondary)]'}
            `}
          />
        )}
      </React.Fragment>
    );
  });
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// ============================================
// COMPACT VARIANT
// ============================================

export function ResearchProgressCompact({ progress }: { progress: ResearchProgressType }) {
  if (progress.phase === 'idle') return null;

  const config = phaseConfig[progress.phase];
  const Icon = config.icon;
  const isActive = !['idle', 'completed', 'error'].includes(progress.phase);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]"
    >
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </motion.div>
      <span className="text-sm text-[var(--fg-secondary)]">{config.label}</span>
      {progress.totalSearches > 0 && (
        <span className="text-xs text-[var(--fg-tertiary)]">
          {progress.completedSearches}/{progress.totalSearches}
        </span>
      )}
    </motion.div>
  );
}

export default ResearchProgress;
