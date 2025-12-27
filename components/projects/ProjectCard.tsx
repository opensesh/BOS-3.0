'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MoreHorizontal, Star } from 'lucide-react';
import type { Project } from '@/lib/supabase/projects-service';

interface ProjectCardProps {
  project: Project;
  chatCount?: number;
  isExample?: boolean;
  index?: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffWeeks < 4) return `Updated ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `Updated ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `Updated ${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) > 1 ? 's' : ''} ago`;
}

export function ProjectCard({ project, chatCount = 0, isExample = false, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/projects/${project.id}`}
        className="
          group block
          bg-[var(--bg-secondary)]
          border border-[var(--border-secondary)]
          rounded-xl
          p-5
          transition-all duration-200
          hover:border-[var(--border-primary)]
          hover:shadow-lg hover:shadow-black/5
          dark:hover:shadow-black/20
        "
      >
        {/* Header with title and actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--fg-primary)] truncate">
              {project.name}
            </h3>
            {isExample && (
              <span className="
                flex-shrink-0
                text-[10px] font-medium
                px-2 py-0.5
                rounded-full
                bg-[var(--bg-brand-primary)]
                text-[var(--fg-brand-primary)]
              ">
                Example project
              </span>
            )}
          </div>
          
          {/* Actions - visible on hover */}
          <div className="
            flex items-center gap-1
            opacity-0 group-hover:opacity-100
            transition-opacity duration-150
          ">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Toggle favorite
              }}
              className="
                p-1.5 rounded-md
                text-[var(--fg-quaternary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="Add to favorites"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Open menu
              }}
              className="
                p-1.5 rounded-md
                text-[var(--fg-quaternary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="
          text-sm text-[var(--fg-secondary)]
          line-clamp-3
          min-h-[3.75rem]
          mb-4
        ">
          {project.description || 'No description'}
        </p>

        {/* Footer with metadata */}
        <div className="flex items-center justify-between text-xs text-[var(--fg-tertiary)]">
          <span>{formatRelativeTime(project.updated_at)}</span>
          {chatCount > 0 && (
            <span>{chatCount} conversation{chatCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

