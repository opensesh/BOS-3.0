'use client';

import React from 'react';
import { MarkdownEditor } from './MarkdownEditor';
import { PDFViewer } from './PDFViewer';

export type FileType = 'markdown' | 'pdf';

interface FileTypeViewerProps {
  /** The type of file to display */
  fileType: FileType;
  /** Unique identifier for the document */
  documentId: string;
  /** The filename to display in the header */
  filename: string;
  /** The content (for markdown) or URL (for PDF) */
  content: string;
  /** Optional title */
  title?: string;
  /** Optional file size for PDFs */
  fileSize?: number;
  /** Max lines for markdown viewer */
  maxLines?: number;
  /** Max height for PDF viewer */
  maxHeight?: number;
  /** Whether the content is loading */
  isLoading?: boolean;
  /** Whether the content is read-only */
  readOnly?: boolean;
  /** Callback for saving markdown content */
  onSave?: (content: string, changeSummary?: string) => Promise<void>;
  /** Callback for deleting the document */
  onDelete?: () => void;
  /** Callback for viewing version history */
  onViewHistory?: () => void;
  /** Callback when editing state changes */
  onEditingChange?: (isEditing: boolean) => void;
  /** Additional className */
  className?: string;
}

/**
 * FileTypeViewer routes to the appropriate viewer based on file type.
 * - Markdown files use MarkdownEditor with syntax highlighting and editing
 * - PDF files use PDFViewer with embedded preview and download
 */
export function FileTypeViewer({
  fileType,
  documentId,
  filename,
  content,
  title,
  fileSize,
  maxLines = 50,
  maxHeight = 600,
  isLoading = false,
  readOnly = false,
  onSave,
  onDelete,
  onViewHistory,
  onEditingChange,
  className = '',
}: FileTypeViewerProps) {
  if (fileType === 'pdf') {
    return (
      <PDFViewer
        url={content}
        filename={filename}
        title={title}
        fileSize={fileSize}
        maxHeight={maxHeight}
        className={className}
      />
    );
  }

  // Default to markdown
  return (
    <MarkdownEditor
      documentId={documentId}
      filename={filename}
      content={content}
      maxLines={maxLines}
      isLoading={isLoading}
      readOnly={readOnly}
      onSave={onSave}
      onDelete={onDelete}
      onViewHistory={onViewHistory}
      onEditingChange={onEditingChange}
    />
  );
}

/**
 * Determine file type from filename or mime type
 */
export function getFileType(filename: string, mimeType?: string): FileType {
  if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  return 'markdown';
}

/**
 * Get appropriate icon name for a file type
 */
export function getFileTypeIcon(fileType: FileType): string {
  switch (fileType) {
    case 'pdf':
      return 'file-text';
    case 'markdown':
    default:
      return 'file-code';
  }
}

/**
 * Get file type badge color classes
 */
export function getFileTypeBadgeColors(fileType: FileType): { bg: string; text: string } {
  switch (fileType) {
    case 'pdf':
      return { bg: 'bg-red-500/20', text: 'text-red-400' };
    case 'markdown':
    default:
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  }
}

export default FileTypeViewer;
