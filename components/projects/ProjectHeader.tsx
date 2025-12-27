'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Check, X, Trash2, Pencil } from 'lucide-react';
import type { Project } from '@/lib/supabase/projects-service';

interface ProjectHeaderProps {
  project: Project;
  onUpdate: (updates: { name?: string; description?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ProjectHeader({ project, onUpdate, onDelete }: ProjectHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus inputs when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription && descInputRef.current) {
      descInputRef.current.focus();
      descInputRef.current.select();
    }
  }, [isEditingDescription]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== project.name) {
      await onUpdate({ name: editedName.trim() });
    } else {
      setEditedName(project.name);
    }
    setIsEditingName(false);
  };

  const handleSaveDescription = async () => {
    const newDesc = editedDescription.trim();
    if (newDesc !== (project.description || '')) {
      await onUpdate({ description: newDesc || undefined });
    }
    setIsEditingDescription(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, save: () => void, cancel: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      cancel();
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mb-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="
          inline-flex items-center gap-1.5
          text-sm text-[var(--fg-tertiary)]
          hover:text-[var(--fg-primary)]
          transition-colors
          mb-4
        "
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All projects</span>
      </Link>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleSaveName, () => {
                  setEditedName(project.name);
                  setIsEditingName(false);
                })}
                onBlur={handleSaveName}
                className="
                  flex-1 px-2 py-1 -ml-2
                  text-2xl font-bold
                  text-[var(--fg-primary)]
                  bg-transparent
                  border border-[var(--border-primary)]
                  rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20
                "
                maxLength={100}
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 rounded-md text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)]"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setEditedName(project.name);
                  setIsEditingName(false);
                }}
                className="p-1.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <h1
              className="
                text-2xl font-bold text-[var(--fg-primary)]
                cursor-pointer
                hover:bg-[var(--bg-tertiary)]
                -ml-2 px-2 py-1
                rounded-lg
                transition-colors
              "
              onClick={() => setIsEditingName(true)}
              title="Click to edit"
            >
              {project.name}
            </h1>
          )}
        </div>

        {/* Actions - only more menu */}
        <div className="flex items-center gap-1">
          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="
                p-2 rounded-lg
                text-[var(--fg-tertiary)]
                hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-tertiary)]
                transition-colors
              "
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="
                absolute right-0 top-full mt-1
                w-48
                bg-[var(--bg-secondary)]
                border border-[var(--border-primary)]
                rounded-lg
                shadow-xl
                py-1
                z-50
              ">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditingName(true);
                  }}
                  className="
                    w-full flex items-center gap-3 px-4 py-2
                    text-sm text-[var(--fg-primary)]
                    hover:bg-[var(--bg-tertiary)]
                    transition-colors
                  "
                >
                  <Pencil className="w-4 h-4" />
                  <span>Rename</span>
                </button>
                <div className="my-1 border-t border-[var(--border-secondary)]" />
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="
                    w-full flex items-center gap-3 px-4 py-2
                    text-sm text-[var(--fg-error-primary)]
                    hover:bg-[var(--bg-error-primary)]
                    transition-colors
                    disabled:opacity-50
                  "
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete project'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2">
        {isEditingDescription ? (
          <div className="flex items-start gap-2">
            <textarea
              ref={descInputRef}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleSaveDescription, () => {
                setEditedDescription(project.description || '');
                setIsEditingDescription(false);
              })}
              onBlur={handleSaveDescription}
              placeholder="Add a description..."
              rows={2}
              className="
                flex-1 px-3 py-2
                text-sm text-[var(--fg-secondary)]
                bg-[var(--bg-primary)]
                border border-[var(--border-primary)]
                rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20
                resize-none
              "
              maxLength={500}
            />
            <button
              onClick={handleSaveDescription}
              className="p-1.5 rounded-md text-[var(--fg-brand-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditedDescription(project.description || '');
                setIsEditingDescription(false);
              }}
              className="p-1.5 rounded-md text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p
            className="
              text-sm text-[var(--fg-secondary)]
              cursor-pointer
              hover:bg-[var(--bg-tertiary)]
              -ml-2 px-2 py-1
              rounded-lg
              transition-colors
            "
            onClick={() => setIsEditingDescription(true)}
            title="Click to edit"
          >
            {project.description || (
              <span className="text-[var(--fg-quaternary)] italic">
                Add a description...
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
