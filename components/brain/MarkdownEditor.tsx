'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Copy, 
  Check, 
  Pencil, 
  X, 
  Save, 
  History, 
  RotateCcw,
  AlertCircle,
  Eye,
  Code,
  Trash2,
} from 'lucide-react';

interface MarkdownEditorProps {
  documentId: string;
  filename: string;
  content: string;
  className?: string;
  maxLines?: number;
  onSave?: (content: string, changeSummary?: string) => Promise<void>;
  onDelete?: () => void;
  onViewHistory?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

type ViewMode = 'preview' | 'source';

export function MarkdownEditor({ 
  documentId,
  filename, 
  content: initialContent, 
  className = '', 
  maxLines = 22,
  onSave,
  onDelete,
  onViewHistory,
  isLoading = false,
  readOnly = false,
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [editContent, setEditContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('source');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftKey = `brain-draft-${documentId}`;

  // Sync content when prop changes
  useEffect(() => {
    setContent(initialContent);
    if (!isEditing) {
      setEditContent(initialContent);
    }
  }, [initialContent, isEditing]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft && savedDraft !== initialContent) {
      setEditContent(savedDraft);
      setHasUnsavedChanges(true);
    }
  }, [draftKey, initialContent]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (isEditing && editContent !== content) {
      const timer = setTimeout(() => {
        localStorage.setItem(draftKey, editContent);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEditing, editContent, content, draftKey]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        // Cmd/Ctrl + S to save
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        // Escape to cancel
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editContent]);

  const lines = content.split('\n');
  const maxHeight = maxLines * 24;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editContent : content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content, editContent, isEditing]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([isEditing ? editContent : content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, editContent, filename, isEditing]);

  const handleEdit = useCallback(() => {
    setEditContent(content);
    setIsEditing(true);
    setError(null);
    // Focus textarea after state update
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [content]);

  const handleCancel = useCallback(() => {
    // Check for unsaved changes
    if (editContent !== content) {
      if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    setIsEditing(false);
    setEditContent(content);
    setHasUnsavedChanges(false);
    setError(null);
    localStorage.removeItem(draftKey);
  }, [content, editContent, draftKey]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    setError(null);

    try {
      await onSave(editContent);
      setContent(editContent);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      localStorage.removeItem(draftKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [editContent, onSave, draftKey]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditContent(newContent);
    setHasUnsavedChanges(newContent !== content);
  }, [content]);

  const handleRestoreDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setEditContent(savedDraft);
      setHasUnsavedChanges(true);
      setIsEditing(true);
    }
  }, [draftKey]);

  return (
    <div className={`rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-sans text-[var(--fg-tertiary)]">
            {filename}
          </span>
          {isEditing && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-brand-solid)] text-white">
              Editing
            </span>
          )}
          {hasUnsavedChanges && !isEditing && (
            <button
              onClick={handleRestoreDraft}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-warning-subtle)] text-[var(--fg-warning-primary)] hover:bg-[var(--bg-warning-secondary)] transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restore Draft
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle (only when not editing) */}
          {!isEditing && (
            <div className="flex items-center rounded-lg bg-[var(--bg-primary)]/50 p-0.5">
              <button
                onClick={() => setViewMode('source')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'source' 
                    ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' 
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }`}
                title="Source view"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'preview' 
                    ? 'bg-[var(--bg-tertiary)] text-[var(--fg-primary)]' 
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                }`}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Version history button - only when not editing */}
          {onViewHistory && !isEditing && (
            <button
              onClick={onViewHistory}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
              title="Version History"
            >
              <History className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors" />
            </button>
          )}

          {/* Download button - only when not editing */}
          {!isEditing && (
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
              title="Download"
            >
              <Download className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors" />
            </button>
          )}

          {/* Copy button - only when not editing */}
          {!isEditing && (
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? (
                <Check className="w-4 h-4 text-[var(--fg-success-primary)]" />
              ) : (
                <Copy className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors" />
              )}
            </button>
          )}

          {/* Edit/Delete/Save/Exit buttons */}
          {!readOnly && (
            <>
              {isEditing ? (
                <>
                  {/* Delete button - only shown in edit mode */}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="p-2 rounded-lg hover:bg-[var(--bg-error-subtle)] transition-colors group"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-error-primary)] transition-colors" />
                    </button>
                  )}
                  <button
                    onClick={handleCancel}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                    title="Exit (Esc)"
                  >
                    <X className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="p-2 rounded-lg bg-[var(--bg-brand-solid)] hover:bg-[var(--bg-brand-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Save (⌘S)"
                  >
                    {isSaving ? (
                      <span className="animate-spin text-white">⟳</span>
                    ) : (
                      <Save className="w-4 h-4 text-white" />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-[var(--bg-error-subtle)] border-b border-[var(--border-error)] flex items-center gap-2 text-sm text-[var(--fg-error-primary)]"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div 
        className="overflow-auto custom-scrollbar"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {isEditing ? (
          // Edit mode - textarea
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={handleContentChange}
            className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-transparent text-[var(--fg-primary)] resize-none focus:outline-none"
            style={{ minHeight: `${maxHeight}px` }}
            placeholder="Enter markdown content..."
            spellCheck={false}
          />
        ) : viewMode === 'preview' ? (
          // Preview mode - rendered markdown
          <div className="p-4 prose prose-invert max-w-none">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          // Source mode - syntax highlighted view
          <div className="p-4 font-sans text-sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-[var(--fg-tertiary)]">
                <span className="animate-spin mr-2">⟳</span>
                Loading...
              </div>
            ) : (
              lines.map((line, index) => (
                <div key={index} className="flex leading-6">
                  <span className="w-10 flex-shrink-0 text-right pr-4 text-[var(--fg-quaternary)]/50 select-none">
                    {index + 1}
                  </span>
                  <span className="text-[var(--fg-primary)]/90 whitespace-pre-wrap break-words">
                    {renderMarkdownLine(line)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer with keyboard shortcuts */}
      {isEditing && (
        <div className="px-4 py-2 bg-[var(--bg-tertiary)]/30 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--fg-tertiary)]">
          <span>
            {hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}
          </span>
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">⌘S</kbd> Save</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">Esc</kbd> Cancel</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown syntax highlighting for source view
function renderMarkdownLine(line: string): React.ReactNode {
  // Headers
  if (line.startsWith('# ')) {
    return <span className="text-[var(--fg-brand-primary)] font-bold">{line}</span>;
  }
  if (line.startsWith('## ')) {
    return <span className="text-[var(--fg-brand-primary)] font-semibold">{line}</span>;
  }
  if (line.startsWith('### ') || line.startsWith('#### ')) {
    return <span className="text-[var(--fg-brand-primary)]">{line}</span>;
  }
  
  // Code blocks
  if (line.startsWith('```')) {
    return <span className="text-[var(--fg-success-primary)]">{line}</span>;
  }
  
  // List items
  if (line.match(/^[-*]\s/)) {
    return <span className="text-[var(--fg-primary)]/90">{line}</span>;
  }
  
  // Numbered lists
  if (line.match(/^\d+\.\s/)) {
    return <span className="text-[var(--fg-primary)]/90">{line}</span>;
  }
  
  // Table rows
  if (line.includes('|')) {
    return <span className="text-blue-400 dark:text-blue-300">{line}</span>;
  }
  
  // Bold text
  if (line.includes('**')) {
    return <span className="text-[var(--fg-primary)]/90">{line}</span>;
  }
  
  // Links
  if (line.includes('[') && line.includes('](')) {
    return <span className="text-cyan-500 dark:text-cyan-400">{line}</span>;
  }
  
  // Comments/blockquotes
  if (line.startsWith('>')) {
    return <span className="text-[var(--fg-tertiary)] italic">{line}</span>;
  }
  
  // Directory structure
  if (line.includes('├──') || line.includes('└──') || line.includes('│')) {
    return <span className="text-yellow-600 dark:text-yellow-300">{line}</span>;
  }
  
  return line || ' ';
}

// Simple markdown preview renderer
function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLanguage = '';

  lines.forEach((line, index) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="bg-[var(--bg-tertiary)] rounded-lg p-4 overflow-x-auto my-4">
            <code className={`language-${codeLanguage}`}>
              {codeContent.join('\n')}
            </code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        codeLanguage = line.slice(3).trim();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('#### ')) {
      elements.push(<h4 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(5)}</h4>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-xl font-semibold mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-2xl font-bold mt-8 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>);
    }
    // List items
    else if (line.match(/^[-*]\s/)) {
      elements.push(<li key={index} className="ml-4 my-1">{line.slice(2)}</li>);
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '');
      elements.push(<li key={index} className="ml-4 my-1 list-decimal">{text}</li>);
    }
    // Blockquote
    else if (line.startsWith('>')) {
      elements.push(
        <blockquote key={index} className="border-l-4 border-[var(--border-brand)] pl-4 my-2 italic text-[var(--fg-secondary)]">
          {line.slice(1).trim()}
        </blockquote>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={index} className="h-4" />);
    }
    // Regular paragraph
    else {
      elements.push(<p key={index} className="my-2">{line}</p>);
    }
  });

  return <div className="text-[var(--fg-primary)]">{elements}</div>;
}

export default MarkdownEditor;

