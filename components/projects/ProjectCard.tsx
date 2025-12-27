'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Lock, Plus, Folder } from 'lucide-react';
import type { Project } from '@/lib/supabase/projects-service';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project?: Project;
  chatCount?: number;
  isCreate?: boolean;
  onCreateClick?: () => void;
  index?: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hr. ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) > 1 ? 's' : ''} ago`;
}

/**
 * ProjectCard component - Matches SpaceCard styling patterns
 * Uses semantic theme tokens for consistent styling across light/dark modes
 */
export function ProjectCard({ project, chatCount = 0, isCreate = false, onCreateClick, index = 0 }: ProjectCardProps) {
  // Card base styles using UUI semantic tokens
  const cardBaseStyles = cn(
    'relative flex flex-col',
    'p-6 rounded-xl',
    'border border-border-secondary',
    'bg-bg-secondary',
    'hover:bg-bg-secondary-hover',
    'hover:border-border-brand',
    'transition-all duration-200 ease-out',
    'min-h-[200px]',
    'shadow-sm',
    'hover:shadow-md',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-brand'
  );

  if (isCreate) {
    return (
      <button
        onClick={onCreateClick}
        className={cn(
          cardBaseStyles,
          'items-center justify-center',
          'border-2 border-dashed',
          'hover:border-border-brand-solid',
          'cursor-pointer w-full text-left group'
        )}
      >
        <div className="w-14 h-14 bg-bg-brand-primary rounded-full flex items-center justify-center mb-4 group-hover:bg-bg-brand-secondary transition-colors">
          <Plus className="w-7 h-7 text-fg-brand-primary" />
        </div>
        <h3 className="text-lg font-display font-semibold text-fg-primary mb-2">
          Create a Project
        </h3>
        <p className="text-sm text-fg-tertiary text-center">
          Organize conversations and add context.
        </p>
      </button>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/projects/${project.id}`}
        className={cn(cardBaseStyles, 'cursor-pointer group')}
      >
        {/* Icon */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ 
              backgroundColor: project.color ? `${project.color}20` : 'var(--bg-tertiary)',
            }}
          >
            <Folder 
              className="w-6 h-6 transition-colors" 
              style={{ color: project.color || 'var(--fg-tertiary)' }}
            />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-display font-semibold text-fg-primary mb-2 group-hover:text-fg-brand-primary transition-colors">
          {project.name}
        </h3>
        
        {/* Description */}
        {project.description ? (
          <p className="text-sm text-fg-tertiary mb-4 line-clamp-2">
            {project.description}
          </p>
        ) : (
          <p className="text-sm text-fg-quaternary mb-4 italic">
            No description
          </p>
        )}
        
        {/* Metadata */}
        <div className="mt-auto flex items-center gap-4 text-xs text-fg-quaternary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">{formatRelativeTime(project.updated_at)}</span>
          </div>
          {chatCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium">{chatCount} chat{chatCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
