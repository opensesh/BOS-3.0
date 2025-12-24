'use client';

import React from 'react';
import {
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileImage,
  FileCode,
  FileArchive,
  File,
  X,
  Upload,
  Newspaper,
  ListTodo,
} from 'lucide-react';
import type { SpaceFile, SpaceLink, SpaceTask } from '@/types';

interface SpaceResourceCardsProps {
  files?: SpaceFile[];
  links?: SpaceLink[];
  instructions?: string;
  tasks?: SpaceTask[];
  onRemoveFile?: (fileId: string) => void;
  onRemoveLink?: (linkId: string) => void;
  onToggleTask?: (taskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
  isReadOnly?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  if (type.includes('zip') || type.includes('archive')) return FileArchive;
  if (type.includes('javascript') || type.includes('typescript') || type.includes('json')) return FileCode;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Check if a link is an article (internal discover link)
const isArticleLink = (link: SpaceLink): boolean => {
  return link.url.startsWith('/discover/') || !!link.articleId;
};

export function SpaceResourceCards({
  files = [],
  links = [],
  instructions,
  tasks = [],
  onRemoveFile,
  onRemoveLink,
  onToggleTask,
  onRemoveTask,
  isReadOnly = false,
}: SpaceResourceCardsProps) {
  const hasContent =
    files.length > 0 || links.length > 0 || (instructions && instructions.trim()) || tasks.length > 0;

  if (!hasContent) return null;

  const completedTasks = tasks.filter((t) => t.completed).length;
  
  // Separate article links from regular links
  const articleLinks = links.filter(isArticleLink);
  const regularLinks = links.filter(link => !isArticleLink(link));

  // Build flat list of all resources for unified grid
  const allResources: Array<{
    type: 'file' | 'link' | 'article' | 'instruction' | 'task';
    id: string;
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    href?: string;
    completed?: boolean;
    onRemove?: () => void;
    onToggle?: () => void;
  }> = [];

  // Add files
  files.forEach(file => {
    allResources.push({
      type: 'file',
      id: file.id,
      icon: getFileIcon(file.type),
      label: file.name,
      sublabel: formatFileSize(file.size),
      onRemove: onRemoveFile ? () => onRemoveFile(file.id) : undefined,
    });
  });

  // Add regular links
  regularLinks.forEach(link => {
    allResources.push({
      type: 'link',
      id: link.id,
      icon: LinkIcon,
      label: link.title || getDomainFromUrl(link.url),
      sublabel: getDomainFromUrl(link.url),
      href: link.url,
      onRemove: onRemoveLink ? () => onRemoveLink(link.id) : undefined,
    });
  });

  // Add articles
  articleLinks.forEach(link => {
    allResources.push({
      type: 'article',
      id: link.id,
      icon: Newspaper,
      label: link.title || 'Article',
      sublabel: 'Discover',
      href: link.url,
      onRemove: onRemoveLink ? () => onRemoveLink(link.id) : undefined,
    });
  });

  // Add instructions as single item
  if (instructions && instructions.trim()) {
    allResources.push({
      type: 'instruction',
      id: 'instructions',
      icon: FileText,
      label: instructions.slice(0, 60) + (instructions.length > 60 ? '...' : ''),
      sublabel: 'Custom instructions',
    });
  }

  // Add tasks
  tasks.forEach(task => {
    allResources.push({
      type: 'task',
      id: task.id,
      icon: task.completed ? CheckCircle2 : Circle,
      label: task.title,
      completed: task.completed,
      onRemove: onRemoveTask ? () => onRemoveTask(task.id) : undefined,
      onToggle: onToggleTask ? () => onToggleTask(task.id) : undefined,
    });
  });

  return (
    <div className="mb-6">
      {/* Container with distinct background */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] p-3">
        {/* Unified 3-column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {allResources.map((item) => {
            const Icon = item.icon;
            const isTask = item.type === 'task';
            const isCompleted = item.completed;
            
            const cardClasses = `
              group relative flex items-center gap-2 p-2 rounded-lg border transition-all min-w-0
              ${isCompleted 
                ? 'bg-[var(--bg-success-primary)] border-[var(--border-success)] hover:border-[var(--border-success)]' 
                : 'bg-[var(--bg-primary)] border-[var(--border-tertiary)] hover:border-[var(--border-brand)] hover:bg-primary-hover'
              }
            `;

            const content = (
              <>
                {/* Icon - clickable for tasks */}
                <div 
                  className={`
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                    ${isCompleted 
                      ? 'bg-[var(--bg-success-secondary)]' 
                      : 'bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-brand-primary)]'
                    }
                    ${isTask && !isReadOnly ? 'cursor-pointer' : ''}
                  `}
                  onClick={isTask ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.onToggle?.();
                  } : undefined}
                >
                  <Icon className={`w-3 h-3 transition-colors ${
                    isCompleted 
                      ? 'text-[var(--fg-success-primary)]' 
                      : 'text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)]'
                  }`} />
                </div>
                
                {/* Text content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className={`text-[11px] font-medium truncate leading-tight transition-colors ${
                    isCompleted 
                      ? 'text-[var(--fg-tertiary)] line-through' 
                      : 'text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)]'
                  }`}>
                    {item.label}
                  </p>
                  {item.sublabel && !isTask && (
                    <p className="text-[9px] text-[var(--fg-quaternary)] truncate leading-tight">
                      {item.sublabel}
                    </p>
                  )}
                </div>

                {/* Remove button */}
                {item.onRemove && !isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.onRemove?.();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-error-primary)] text-[var(--fg-quaternary)] hover:text-[var(--fg-error-primary)] transition-all flex-shrink-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </>
            );

            if (item.href) {
              return (
                <a 
                  key={`${item.type}-${item.id}`}
                  href={item.href} 
                  target={item.href.startsWith('/') ? undefined : '_blank'} 
                  rel="noopener noreferrer" 
                  className={cardClasses}
                >
                  {content}
                </a>
              );
            }

            return (
              <div key={`${item.type}-${item.id}`} className={cardClasses}>
                {content}
              </div>
            );
          })}
        </div>
        
        {/* Resource count footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-tertiary)]">
          <div className="flex items-center gap-3 text-[9px] text-[var(--fg-quaternary)]">
            {files.length > 0 && (
              <span className="flex items-center gap-1">
                <Upload className="w-2.5 h-2.5" /> {files.length}
              </span>
            )}
            {regularLinks.length > 0 && (
              <span className="flex items-center gap-1">
                <LinkIcon className="w-2.5 h-2.5" /> {regularLinks.length}
              </span>
            )}
            {articleLinks.length > 0 && (
              <span className="flex items-center gap-1">
                <Newspaper className="w-2.5 h-2.5" /> {articleLinks.length}
              </span>
            )}
            {instructions && (
              <span className="flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> 1
              </span>
            )}
            {tasks.length > 0 && (
              <span className="flex items-center gap-1">
                <ListTodo className="w-2.5 h-2.5" /> {completedTasks}/{tasks.length}
              </span>
            )}
          </div>
          <span className="text-[9px] text-[var(--fg-quinary)]">
            {allResources.length} items
          </span>
        </div>
      </div>
    </div>
  );
}
