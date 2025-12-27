'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Plus,
  FileText,
  FolderOpen,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ProjectFileCard } from './ProjectFileCard';
import { ProjectFileUpload } from './ProjectFileUpload';
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
  const [isUploadVisible, setIsUploadVisible] = useState(false);

  const usagePercent = Math.min((totalFileSize / maxFileSize) * 100, 100);

  return (
    <>
      <div className="
        w-full lg:w-80
        bg-[var(--bg-secondary)]
        border-t lg:border-t-0 lg:border-l border-[var(--border-secondary)]
        lg:h-full
        overflow-y-auto
      ">
        {/* Memory Section - Placeholder for future AI-generated context */}
        <CollapsibleSection
          title="Memory"
          icon={<Sparkles className="w-4 h-4 text-[var(--fg-tertiary)]" />}
          rightElement={
            <span className="flex items-center gap-1 text-[10px] text-[var(--fg-quaternary)]">
              <Lock className="w-3 h-3" />
              Only you
            </span>
          }
          defaultOpen={false}
        >
          <div className="space-y-2">
            <p className="text-xs text-[var(--fg-tertiary)]">
              Claude will automatically remember context from your conversations in this project.
            </p>
            <p className="text-[10px] text-[var(--fg-quaternary)] italic">
              Coming soon
            </p>
          </div>
        </CollapsibleSection>

        {/* Instructions Section */}
        <CollapsibleSection
          title="Instructions"
          icon={<FileText className="w-4 h-4 text-[var(--fg-tertiary)]" />}
          rightElement={
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsInstructionsModalOpen(true);
              }}
              className="
                p-1 rounded
                text-[var(--fg-tertiary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="Edit instructions"
            >
              <Plus className="w-4 h-4" />
            </button>
          }
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
                Add instructions to tailor Claude&apos;s responses for this project.
              </p>
            </button>
          )}
        </CollapsibleSection>

        {/* Files Section */}
        <CollapsibleSection
          title="Files"
          icon={<FolderOpen className="w-4 h-4 text-[var(--fg-tertiary)]" />}
          rightElement={
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsUploadVisible(!isUploadVisible);
              }}
              className="
                p-1 rounded
                text-[var(--fg-tertiary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="Upload files"
            >
              <Plus className="w-4 h-4" />
            </button>
          }
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

          {/* Upload zone - collapsible */}
          <AnimatePresence>
            {isUploadVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 overflow-hidden"
              >
                <ProjectFileUpload
                  projectId={projectId}
                  onUpload={onUploadFile}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
            <div className="text-center py-4">
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

