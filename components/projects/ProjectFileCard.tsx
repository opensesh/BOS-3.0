'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';
import { getFileTypeCategory, type ProjectFile } from '@/lib/supabase/projects-service';

interface ProjectFileCardProps {
  file: ProjectFile;
  onDelete?: (fileId: string) => void;
  index?: number;
}

// Color mapping for file types
const FILE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  PDF: { bg: 'bg-red-500/20', text: 'text-red-400' },
  DOC: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  XLS: { bg: 'bg-green-500/20', text: 'text-green-400' },
  PPT: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  MD: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  JSON: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  CSV: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  TXT: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  IMG: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  SVG: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  FILE: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFileCard({ file, onDelete, index = 0 }: ProjectFileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileType = getFileTypeCategory(file.mime_type, file.filename);
  const colors = FILE_TYPE_COLORS[fileType] || FILE_TYPE_COLORS.FILE;
  const displayName = file.original_filename || file.filename;
  const truncatedName = displayName.length > 20 
    ? displayName.slice(0, 17) + '...' 
    : displayName;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(file.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpen = () => {
    if (file.public_url) {
      window.open(file.public_url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleOpen}
        className="
          w-full
          bg-[var(--bg-primary)]
          border border-[var(--border-secondary)]
          rounded-lg
          p-3
          text-left
          hover:border-[var(--border-primary)]
          hover:shadow-md
          transition-all
          group
        "
      >
        {/* Preview or type badge */}
        <div className="
          aspect-[4/3]
          rounded-md
          mb-2
          overflow-hidden
          bg-[var(--bg-tertiary)]
          flex items-center justify-center
        ">
          {file.mime_type?.startsWith('image/') && file.public_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.public_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`
              px-3 py-1.5
              rounded
              text-xs font-bold
              ${colors.bg}
              ${colors.text}
            `}>
              {fileType}
            </div>
          )}
        </div>

        {/* File info */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--fg-primary)] truncate" title={displayName}>
            {truncatedName}
          </p>
          {file.file_size && (
            <p className="text-[10px] text-[var(--fg-quaternary)]">
              {formatFileSize(file.file_size)}
            </p>
          )}
        </div>
      </button>

      {/* Hover actions */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            absolute top-2 right-2
            flex items-center gap-1
          "
        >
          {file.public_url && (
            <a
              href={file.public_url}
              download={file.original_filename || file.filename}
              onClick={(e) => e.stopPropagation()}
              className="
                p-1.5 rounded-md
                bg-[var(--bg-secondary)]/90
                backdrop-blur-sm
                text-[var(--fg-tertiary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
                shadow-sm
              "
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                p-1.5 rounded-md
                bg-[var(--bg-secondary)]/90
                backdrop-blur-sm
                text-[var(--fg-tertiary)]
                hover:text-[var(--fg-error-primary)]
                hover:bg-[var(--bg-error-primary)]
                transition-colors
                shadow-sm
                disabled:opacity-50
              "
              title="Delete"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

