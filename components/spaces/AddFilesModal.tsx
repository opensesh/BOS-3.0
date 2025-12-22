'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { Upload, X, File, FileText, Image, FileCode, AlertCircle } from 'lucide-react';
import { SpaceFile } from '@/types';

interface AddFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFile: (file: Omit<SpaceFile, 'id' | 'addedAt'>) => void;
  existingFiles?: SpaceFile[];
  onRemoveFile?: (fileId: string) => void;
}

// Helper to get file icon based on type
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
  if (type.includes('code') || type.includes('javascript') || type.includes('typescript')) return FileCode;
  return File;
}

export function AddFilesModal({
  isOpen,
  onClose,
  onAddFile,
  existingFiles = [],
  onRemoveFile,
}: AddFilesModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Omit<SpaceFile, 'id' | 'addedAt'>[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Reset validation when files change
  useEffect(() => {
    if (pendingFiles.length > 0) {
      setShowValidation(false);
    }
  }, [pendingFiles]);

  // Focus drop zone when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowValidation(false);
      const timer = setTimeout(() => {
        dropZoneRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const newFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
    if (e.target) e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Show validation if no files selected
    if (pendingFiles.length === 0) {
      setShowValidation(true);
      return;
    }
    
    pendingFiles.forEach((file) => {
      onAddFile(file);
    });
    setPendingFiles([]);
    setShowValidation(false);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClose = () => {
    setPendingFiles([]);
    setShowValidation(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const hasNoFiles = pendingFiles.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Files" size="md">
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        tabIndex={0}
        role="button"
        aria-label="Drop files here or click to browse"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        className={`
          border-2 border-dashed rounded-xl p-8
          flex flex-col items-center justify-center
          cursor-pointer transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
          ${isDragging 
            ? 'border-[var(--border-brand-solid)] bg-[var(--bg-brand-primary)] scale-[1.02]' 
            : showValidation && hasNoFiles
              ? 'border-[var(--border-error)] bg-[var(--bg-error-primary)]'
              : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]'
          }
        `}
      >
        <Upload className={`w-10 h-10 mb-3 transition-colors ${
          isDragging 
            ? 'text-[var(--fg-brand-primary)]' 
            : showValidation && hasNoFiles 
              ? 'text-[var(--fg-error-primary)]'
              : 'text-[var(--fg-tertiary)]'
        }`} />
        <p className="text-sm text-[var(--fg-primary)] mb-1 text-center">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-[var(--fg-tertiary)] text-center">
          PDF, DOC, TXT, images, and more
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Validation message */}
      {showValidation && hasNoFiles && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--fg-error-primary)]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Please select at least one file to add</span>
        </div>
      )}

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-[var(--fg-primary)] mb-2">
            Files to add ({pendingFiles.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {pendingFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-brand-primary)] border border-[var(--border-brand)]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileIcon className="w-4 h-4 text-[var(--fg-brand-primary)] flex-shrink-0" />
                    <span className="text-sm text-[var(--fg-primary)] truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-[var(--fg-tertiary)] flex-shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingFile(index)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-error-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-error)]"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-[var(--fg-primary)] mb-2">
            Existing files ({existingFiles.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {existingFiles.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileIcon className="w-4 h-4 text-[var(--fg-tertiary)] flex-shrink-0" />
                    <span className="text-sm text-[var(--fg-primary)] truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-[var(--fg-tertiary)] flex-shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  {onRemoveFile && (
                    <button
                      type="button"
                      onClick={() => onRemoveFile(file.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-quaternary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-error-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-error)]"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {existingFiles.length === 0 && pendingFiles.length === 0 && !showValidation && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--bg-secondary)] text-center">
          <p className="text-sm text-[var(--fg-tertiary)]">
            Upload files to provide context for conversations in this space.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-secondary)]">
        <Button
          type="button"
          color="secondary"
          size="md"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          color="primary"
          size="md"
          onClick={handleSave}
        >
          {pendingFiles.length > 0 
            ? `Add ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}` 
            : 'Add files'
          }
        </Button>
      </div>
    </Modal>
  );
}
