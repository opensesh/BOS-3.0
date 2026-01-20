'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileText,
  Layers,
  Target,
  AlertCircle,
  ExternalLink,
  Quote,
  Clock,
  Zap,
  XCircle,
} from 'lucide-react';
import type { ResearchResult } from '@/hooks/useResearch';
import type { SubQuestion, ResearchNote, Citation, ResearchGap } from '@/lib/ai/research/types';

// ============================================
// TYPES
// ============================================

interface ResearchTimelineProps {
  /** Research result from useResearch hook */
  result: ResearchResult;
  /** Optional title override */
  title?: string;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
}

interface TimelineEventProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  timestamp?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isLast?: boolean;
}

// ============================================
// TIMELINE EVENT
// ============================================

function TimelineEvent({
  icon: Icon,
  iconColor,
  title,
  children,
  defaultOpen = false,
  isLast = false,
}: TimelineEventProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-[var(--border-secondary)]" />
      )}

      {/* Icon */}
      <div
        className={`
          relative z-10 flex-shrink-0 w-8 h-8 rounded-full
          flex items-center justify-center
          bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]
        `}
      >
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left group"
        >
          <span className="text-sm font-medium text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors">
            {title}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// NOTE CARD
// ============================================

function NoteCard({ note }: { note: ResearchNote }) {
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)] p-3 space-y-2">
      {/* Content */}
      <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
        {note.content}
      </p>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--fg-success-primary)] rounded-full"
            style={{ width: `${note.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs text-[var(--fg-tertiary)]">
          {Math.round(note.confidence * 100)}% confidence
        </span>
      </div>

      {/* Citations toggle */}
      {note.citations.length > 0 && (
        <>
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="text-xs text-[var(--fg-brand-primary)] hover:underline flex items-center gap-1"
          >
            <Quote className="w-3 h-3" />
            {note.citations.length} source{note.citations.length > 1 ? 's' : ''}
            {showCitations ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          <AnimatePresence>
            {showCitations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {note.citations.map((citation, i) => (
                  <CitationItem key={i} citation={citation} compact />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ============================================
// CITATION ITEM
// ============================================

function CitationItem({
  citation,
  compact = false,
}: {
  citation: Citation;
  compact?: boolean;
}) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        group flex items-start gap-2 rounded-lg
        ${compact ? 'p-2 bg-[var(--bg-tertiary)]/50' : 'p-3 bg-[var(--bg-primary)] border border-[var(--border-secondary)]'}
        hover:bg-[var(--bg-tertiary)] transition-colors
      `}
    >
      {/* Number badge */}
      <span
        className={`
          flex-shrink-0 w-5 h-5 rounded-full
          bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]
          flex items-center justify-center text-xs font-medium
        `}
      >
        {citation.number}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`
              ${compact ? 'text-xs' : 'text-sm'}
              font-medium text-[var(--fg-primary)]
              group-hover:text-[var(--fg-brand-primary)]
              truncate transition-colors
            `}
          >
            {citation.title || citation.source}
          </span>
          <ExternalLink className="w-3 h-3 text-[var(--fg-tertiary)] flex-shrink-0" />
        </div>
        {!compact && citation.excerpt && (
          <p className="text-xs text-[var(--fg-tertiary)] mt-1 line-clamp-2">
            {citation.excerpt}
          </p>
        )}
        <span className="text-xs text-[var(--fg-tertiary)]">{citation.source}</span>
      </div>
    </a>
  );
}

// ============================================
// GAP ITEM
// ============================================

function GapItem({ gap }: { gap: ResearchGap }) {
  const priorityColors = {
    high: 'text-[var(--fg-error-primary)] bg-[var(--bg-error-primary)]/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-[var(--fg-tertiary)] bg-[var(--bg-tertiary)]',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)]">
      <div
        className={`
          flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
          ${priorityColors[gap.priority]}
        `}
      >
        {gap.priority}
      </div>
      <div className="flex-1">
        <p className="text-sm text-[var(--fg-primary)]">{gap.description}</p>
        <p className="text-xs text-[var(--fg-tertiary)] mt-1">
          Suggested: {gap.suggestedQuery}
        </p>
        {gap.resolved && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--fg-success-primary)] mt-1">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// METRICS SUMMARY
// ============================================

function MetricsSummary({ result }: { result: ResearchResult }) {
  const metrics = result.metrics;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg">
        <Clock className="w-4 h-4 text-[var(--fg-tertiary)]" />
        <div>
          <p className="text-xs text-[var(--fg-tertiary)]">Total Time</p>
          <p className="text-sm font-medium text-[var(--fg-primary)]">
            {(result.totalTime / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg">
        <Search className="w-4 h-4 text-[var(--fg-tertiary)]" />
        <div>
          <p className="text-xs text-[var(--fg-tertiary)]">Queries</p>
          <p className="text-sm font-medium text-[var(--fg-primary)]">
            {metrics.totalQueries || result.notes.length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg">
        <Quote className="w-4 h-4 text-[var(--fg-tertiary)]" />
        <div>
          <p className="text-xs text-[var(--fg-tertiary)]">Citations</p>
          <p className="text-sm font-medium text-[var(--fg-primary)]">
            {result.citations.length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg">
        <Zap className="w-4 h-4 text-[var(--fg-tertiary)]" />
        <div>
          <p className="text-xs text-[var(--fg-tertiary)]">Efficiency</p>
          <p className="text-sm font-medium text-[var(--fg-primary)]">
            {metrics.parallelizationEfficiency
              ? `${Math.round(metrics.parallelizationEfficiency * 100)}%`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ResearchTimeline({
  result,
  title = 'Research Process',
  defaultCollapsed = true,
}: ResearchTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--fg-brand-primary)]" />
          <span className="text-sm font-medium text-[var(--fg-primary)]">
            {title}
          </span>
          <span className="text-xs text-[var(--fg-tertiary)]">
            {result.notes.length} notes • {result.citations.length} citations
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
        ) : (
          <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)]" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-[var(--border-secondary)] p-4 space-y-4">
              {/* Metrics */}
              <MetricsSummary result={result} />

              {/* Timeline */}
              <div className="space-y-0">
                {/* Planning phase */}
                <TimelineEvent
                  icon={Target}
                  iconColor="text-[var(--fg-brand-primary)]"
                  title="Query Analysis & Planning"
                  defaultOpen={false}
                >
                  <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)] p-3">
                    <p className="text-sm text-[var(--fg-secondary)]">
                      Query decomposed into {result.notes.length} research questions
                      for comprehensive coverage.
                    </p>
                  </div>
                </TimelineEvent>

                {/* Research notes */}
                <TimelineEvent
                  icon={Search}
                  iconColor="text-[var(--fg-brand-primary)]"
                  title={`Research Notes (${result.notes.length})`}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {result.notes.map((note, i) => (
                      <NoteCard key={i} note={note} />
                    ))}
                  </div>
                </TimelineEvent>

                {/* Gaps found */}
                {result.gaps.length > 0 && (
                  <TimelineEvent
                    icon={AlertCircle}
                    iconColor="text-amber-500"
                    title={`Knowledge Gaps (${result.gaps.length})`}
                    defaultOpen={false}
                  >
                    <div className="space-y-2">
                      {result.gaps.map((gap, i) => (
                        <GapItem key={i} gap={gap} />
                      ))}
                    </div>
                  </TimelineEvent>
                )}

                {/* Synthesis */}
                <TimelineEvent
                  icon={FileText}
                  iconColor="text-[var(--fg-success-primary)]"
                  title="Synthesis & Answer Generation"
                  defaultOpen={false}
                  isLast={result.citations.length === 0}
                >
                  <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-secondary)] p-3">
                    <p className="text-sm text-[var(--fg-secondary)]">
                      Combined findings from {result.notes.length} research notes
                      into a comprehensive answer with {result.citations.length} verified citations.
                    </p>
                  </div>
                </TimelineEvent>

                {/* Citations */}
                {result.citations.length > 0 && (
                  <TimelineEvent
                    icon={Quote}
                    iconColor="text-[var(--fg-brand-primary)]"
                    title={`Sources (${result.citations.length})`}
                    defaultOpen={false}
                    isLast={true}
                  >
                    <div className="space-y-2">
                      {result.citations.map((citation, i) => (
                        <CitationItem key={i} citation={citation} />
                      ))}
                    </div>
                  </TimelineEvent>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// INLINE TIMELINE (Compact)
// ============================================

export function ResearchTimelineInline({
  notes,
  citations,
}: {
  notes: ResearchNote[];
  citations: Citation[];
}) {
  if (notes.length === 0 && citations.length === 0) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-[var(--fg-tertiary)]">
      {notes.length > 0 && (
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {notes.length} notes
        </span>
      )}
      {citations.length > 0 && (
        <span className="flex items-center gap-1">
          <Quote className="w-3 h-3" />
          {citations.length} sources
        </span>
      )}
    </div>
  );
}

export default ResearchTimeline;
