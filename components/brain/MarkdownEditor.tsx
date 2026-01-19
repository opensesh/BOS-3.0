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
  Undo2,
  Redo2,
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
  /** Called when editing state changes (enter/exit edit mode) */
  onEditingChange?: (isEditing: boolean) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

type ViewMode = 'preview' | 'source';

// Consistent icon button styles
const iconButtonBase = "p-2 rounded-lg transition-all duration-200 group hover:bg-[var(--bg-tertiary)]";
const iconBase = "w-4 h-4 transition-colors duration-200";
const iconDefault = `${iconBase} text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)]`;
const iconDanger = `${iconBase} text-[var(--fg-tertiary)] group-hover:text-[var(--fg-error-primary)]`;

// Animation variants
const buttonVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const contentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function MarkdownEditor({ 
  documentId,
  filename, 
  content: initialContent, 
  className = '', 
  maxLines = 22,
  onSave,
  onDelete,
  onViewHistory,
  onEditingChange,
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
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef(initialContent);
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

  // Reset undo/redo when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setUndoStack([]);
      setRedoStack([]);
      lastContentRef.current = editContent;
    }
  }, [isEditing]);

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        // Cmd/Ctrl + S to save
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        // Cmd/Ctrl + Z to undo
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
        // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y to redo
        if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          handleRedo();
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
  }, [isEditing, editContent, undoStack, redoStack]);

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
    setUndoStack([]);
    setRedoStack([]);
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
      setUndoStack([]);
      setRedoStack([]);
      localStorage.removeItem(draftKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [editContent, onSave, draftKey]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Save to undo stack (debounced - only if content changed significantly)
    if (Math.abs(newContent.length - lastContentRef.current.length) > 10 || 
        newContent.split('\n').length !== lastContentRef.current.split('\n').length) {
      setUndoStack(prev => [...prev.slice(-50), lastContentRef.current]);
      setRedoStack([]);
      lastContentRef.current = newContent;
    }
    
    setEditContent(newContent);
    setHasUnsavedChanges(newContent !== content);
  }, [content]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousContent = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, editContent]);
    setUndoStack(prev => prev.slice(0, -1));
    setEditContent(previousContent);
    lastContentRef.current = previousContent;
    setHasUnsavedChanges(previousContent !== content);
  }, [undoStack, editContent, content]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextContent = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, editContent]);
    setRedoStack(prev => prev.slice(0, -1));
    setEditContent(nextContent);
    lastContentRef.current = nextContent;
    setHasUnsavedChanges(nextContent !== content);
  }, [redoStack, editContent, content]);

  const handleRestoreDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setEditContent(savedDraft);
      setHasUnsavedChanges(true);
      setIsEditing(true);
    }
  }, [draftKey]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const showUndoRedo = isEditing && hasUnsavedChanges;

  return (
    <motion.div 
      className={`rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)] ${className}`}
      layout
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-sans text-[var(--fg-tertiary)]">
            {filename}
          </span>
          <AnimatePresence mode="wait">
            {isEditing && (
              <motion.span 
                key="editing-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="px-2 py-0.5 text-xs font-medium rounded-md bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] border border-[var(--border-primary)]/40"
              >
                Editing
              </motion.span>
            )}
          </AnimatePresence>
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
        
        <div className="flex items-center gap-1">
          {/* Action buttons with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="edit-actions"
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Delete button */}
                {onDelete && (
                  <motion.button
                    onClick={onDelete}
                    className={iconButtonBase}
                    title="Delete"
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className={iconDanger} />
                  </motion.button>
                )}

                {/* Undo/Redo - appear delightfully after typing */}
                <AnimatePresence>
                  {showUndoRedo && (
                    <>
                      <motion.button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={`${iconButtonBase} disabled:opacity-30 disabled:cursor-not-allowed`}
                        title="Undo (⌘Z)"
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.15, delay: 0 }}
                        whileHover={canUndo ? { scale: 1.05 } : {}}
                        whileTap={canUndo ? { scale: 0.95 } : {}}
                      >
                        <Undo2 className={iconDefault} />
                      </motion.button>
                      <motion.button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className={`${iconButtonBase} disabled:opacity-30 disabled:cursor-not-allowed`}
                        title="Redo (⌘⇧Z)"
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.15, delay: 0.05 }}
                        whileHover={canRedo ? { scale: 1.05 } : {}}
                        whileTap={canRedo ? { scale: 0.95 } : {}}
                      >
                        <Redo2 className={iconDefault} />
                      </motion.button>
                    </>
                  )}
                </AnimatePresence>

                {/* Separator */}
                {(onDelete || showUndoRedo) && (
                  <div className="w-px h-5 bg-[var(--border-primary)] mx-1" />
                )}

                {/* Version history */}
                {onViewHistory && (
                  <motion.button
                    onClick={onViewHistory}
                    className={iconButtonBase}
                    title="Version History"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <History className={iconDefault} />
                  </motion.button>
                )}

                {/* Exit button */}
                <motion.button
                  onClick={handleCancel}
                  className={iconButtonBase}
                  title="Exit (Esc)"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className={iconDefault} />
                </motion.button>

                {/* Save button */}
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`${iconButtonBase} bg-[var(--bg-brand-solid)] hover:bg-[var(--bg-brand-solid\_hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-brand-solid)]`}
                  title="Save (⌘S)"
                  whileHover={!isSaving && hasUnsavedChanges ? { scale: 1.05 } : {}}
                  whileTap={!isSaving && hasUnsavedChanges ? { scale: 0.95 } : {}}
                >
                  {isSaving ? (
                    <motion.span
                      className="block w-4 h-4 text-[var(--fg-white)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⟳
                    </motion.span>
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                key="view-actions"
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Download button */}
                <motion.button
                  onClick={handleDownload}
                  className={iconButtonBase}
                  title="Download"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className={iconDefault} />
                </motion.button>

                {/* Copy button */}
                <motion.button
                  onClick={handleCopy}
                  className={iconButtonBase}
                  title={copied ? 'Copied!' : 'Copy'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-4 h-4 text-[var(--fg-success-primary)]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className={iconDefault} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Edit button */}
                {!readOnly && (
                  <motion.button
                    onClick={handleEdit}
                    disabled={isLoading}
                    className={`${iconButtonBase} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Edit"
                    whileHover={!isLoading ? { scale: 1.05 } : {}}
                    whileTap={!isLoading ? { scale: 0.95 } : {}}
                  >
                    <Pencil className={iconDefault} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Separator before toggle */}
          <div className="w-px h-5 bg-[var(--border-primary)] mx-2" />

          {/* View mode toggle - always visible with animated indicator */}
          <div className="relative flex items-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/50 p-0.5">
            {/* Animated background indicator */}
            <motion.div
              className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--bg-tertiary)]"
              initial={false}
              animate={{
                left: viewMode === 'source' ? '2px' : 'calc(50% + 1px)',
                width: 'calc(50% - 3px)',
                height: 'calc(100% - 4px)',
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <button
              onClick={() => setViewMode('source')}
              className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200 ${
                viewMode === 'source' 
                  ? 'text-[var(--fg-primary)]' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }`}
              title="Source view"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-200 ${
                viewMode === 'preview' 
                  ? 'text-[var(--fg-primary)]' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }`}
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
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

      {/* Content with transition */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={`${isEditing}-${viewMode}`}
          className="overflow-auto custom-scrollbar"
          style={{ maxHeight: `${maxHeight}px` }}
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15 }}
        >
          {isEditing && viewMode === 'source' ? (
            // Edit mode with source view - editable textarea
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleContentChange}
              className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-transparent text-[var(--fg-primary)] resize-none focus:outline-none"
              style={{ minHeight: `${maxHeight}px` }}
              placeholder="Enter markdown content..."
              spellCheck={false}
            />
          ) : isEditing && viewMode === 'preview' ? (
            // Edit mode with preview - show preview of edit content
            <div className="p-4 prose prose-invert max-w-none">
              <MarkdownPreview content={editContent} />
            </div>
          ) : viewMode === 'preview' ? (
            // View mode with preview - rendered markdown
            <div className="p-4 prose prose-invert max-w-none">
              <MarkdownPreview content={content} />
            </div>
          ) : (
            // View mode with source - syntax highlighted view
            <div className="p-4 font-sans text-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-[var(--fg-tertiary)]">
                  <motion.span 
                    className="mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⟳
                  </motion.span>
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
        </motion.div>
      </AnimatePresence>

      {/* Footer with keyboard shortcuts */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-2 bg-[var(--bg-tertiary)]/30 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--fg-tertiary)]"
          >
            <span>
              {hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}
            </span>
            <div className="flex items-center gap-4">
              <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">⌘Z</kbd> Undo</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">⌘S</kbd> Save</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">Esc</kbd> Cancel</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
