'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  FileText,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { ProjectFileCard } from './ProjectFileCard';
import { ProjectInstructionsModal } from './ProjectInstructionsModal';
import type { ProjectFile, ProjectInstructions } from '@/lib/supabase/projects-service';

interface ProjectSidebarProps {
  projectId: string;
  projectName: string;
  instructions: ProjectInstructions | null;
  files: ProjectFile[];
  totalFileSize: number;
  maxFileSize?: number; // Total capacity in bytes
  onSaveInstructions: (content: string) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
}

// 500MB default capacity
const DEFAULT_MAX_SIZE = 500 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  rightElement,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border-secondary)] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between
          px-4 py-3
          text-left
          hover:bg-[var(--bg-tertiary)]/50
          transition-colors
        "
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-[var(--fg-primary)]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {rightElement}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProjectSidebar({
  projectId,
  projectName,
  instructions,
  files,
  totalFileSize,
  maxFileSize = DEFAULT_MAX_SIZE,
  onSaveInstructions,
  onUploadFile,
  onDeleteFile,
}: ProjectSidebarProps) {
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const usagePercent = Math.min((totalFileSize / maxFileSize) * 100, 100);

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of droppedFiles) {
        await onUploadFile(file);
      }
    } finally {
      setIsUploading(false);
    }
  }, [onUploadFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        await onUploadFile(file);
      }
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  }, [onUploadFile]);

  return (
    <>
      <div className="
        w-full lg:w-80
        bg-[var(--bg-secondary)]
        border-t lg:border-t-0 lg:border-l border-[var(--border-secondary)]
        lg:h-full
        overflow-y-auto
      ">
        {/* Instructions Section */}
        <CollapsibleSection
          title="Instructions"
          icon={<FileText className="w-4 h-4 text-[var(--fg-tertiary)]" />}
        >
          {instructions?.content ? (
            <button
              onClick={() => setIsInstructionsModalOpen(true)}
              className="
                w-full text-left
                p-3 rounded-lg
                bg-[var(--bg-primary)]
                border border-[var(--border-secondary)]
                hover:border-[var(--border-primary)]
                transition-colors
              "
            >
              <p className="text-xs text-[var(--fg-secondary)] line-clamp-4">
                {instructions.content}
              </p>
              <p className="text-[10px] text-[var(--fg-quaternary)] mt-2">
                Click to edit
              </p>
            </button>
          ) : (
            <button
              onClick={() => setIsInstructionsModalOpen(true)}
              className="
                w-full text-left
                p-3 rounded-lg
                border border-dashed border-[var(--border-secondary)]
                hover:border-[var(--border-primary)]
                hover:bg-[var(--bg-tertiary)]/50
                transition-colors
              "
            >
              <p className="text-xs text-[var(--fg-tertiary)]">
                Add instructions to tailor AI responses for this project.
              </p>
            </button>
          )}
        </CollapsibleSection>

        {/* Files Section */}
        <CollapsibleSection
          title="Files"
          icon={<FolderOpen className="w-4 h-4 text-[var(--fg-tertiary)]" />}
        >
          {/* Capacity bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[var(--fg-quaternary)]">
                {formatBytes(totalFileSize)} used
              </span>
              <span className="text-[10px] text-[var(--fg-quaternary)]">
                {Math.round(usagePercent)}% of project capacity
              </span>
            </div>
            <div className="h-1.5 bg-[var(--bg-quaternary)] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  usagePercent > 90
                    ? 'bg-[var(--fg-error-primary)]'
                    : usagePercent > 70
                    ? 'bg-yellow-500'
                    : 'bg-[var(--bg-brand-solid)]'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Drop zone - always visible */}
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              block mb-4 cursor-pointer
              border-2 border-dashed rounded-lg
              p-4 text-center
              transition-all
              ${isDragOver 
                ? 'border-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]' 
                : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]/50'
              }
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <Upload className={`w-5 h-5 mx-auto mb-2 ${isDragOver ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-quaternary)]'}`} />
            <p className={`text-xs ${isDragOver ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)]'}`}>
              {isUploading ? 'Uploading...' : 'Drag files here or click to upload'}
            </p>
          </label>

          {/* Files grid */}
          {files.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {files.map((file, index) => (
                <ProjectFileCard
                  key={file.id}
                  file={file}
                  onDelete={onDeleteFile}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-[var(--fg-quaternary)]">
                No files uploaded yet
              </p>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Instructions Modal */}
      <ProjectInstructionsModal
        isOpen={isInstructionsModalOpen}
        onClose={() => setIsInstructionsModalOpen(false)}
        projectName={projectName}
        initialContent={instructions?.content || ''}
        onSave={onSaveInstructions}
      />
    </>
  );
}
