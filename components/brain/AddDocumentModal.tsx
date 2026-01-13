'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ClipboardPaste,
  Wand2,
  AlertCircle,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { BrandDocumentCategory } from '@/lib/supabase/types';
import { GuidedInputFlow } from './GuidedInputFlow';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BrandDocumentCategory;
  onAddDocument: (title: string, content: string) => Promise<void>;
}

type InputMode = 'select' | 'paste' | 'guided';

const CATEGORY_LABELS: Record<BrandDocumentCategory, string> = {
  'brand-identity': 'Brand Identity',
  'writing-styles': 'Writing Style',
  'skills': 'Skill',
  'commands': 'Command',
  'data': 'Data',
  'config': 'Config',
};

const CATEGORY_DESCRIPTIONS: Record<BrandDocumentCategory, string> = {
  'brand-identity': 'Add brand guidelines, values, or identity documentation',
  'writing-styles': 'Add voice and tone guidelines for different content types',
  'skills': 'Add AI capability definitions and instructions',
  'commands': 'Add slash command definitions',
  'data': 'Add reference data and lookup tables',
  'config': 'Add configuration settings',
};

const PASTE_PLACEHOLDERS: Record<BrandDocumentCategory, string> = {
  'brand-identity': `# Brand Name

## Mission Statement
Your brand's purpose and why it exists...

## Core Values
- Value 1: Description
- Value 2: Description
- Value 3: Description

## Brand Personality
Describe how your brand should feel and communicate...`,
  'writing-styles': `# Writing Style Name

## Quick Reference
- Platform: Blog / Social / Email
- Tone: Casual / Professional / Playful
- Audience: Target reader description

## Voice Guidelines
### DO:
- Write in active voice
- Keep sentences concise
- Use inclusive language

### DON'T:
- Use jargon without explanation
- Be overly formal
- Forget your audience`,
  'skills': `# Skill Name

## Description
What this skill enables the AI to do...

## When to Use
Trigger conditions and appropriate contexts...

## Inputs
- Required input 1
- Required input 2

## Outputs
Expected results or artifacts...

## Example
A practical demonstration of this skill in action...`,
  'commands': `# /command-name

## Description
What this command does...

## Arguments
- arg1: Description
- arg2: Description

## Example
\`/command-name arg1 arg2\``,
  'data': `# Data Name

## Purpose
What this data is used for...

## Format
| Field | Type | Description |
|-------|------|-------------|
| field1 | string | Description |

## Entries
...`,
  'config': `# Configuration Name

## Purpose
What this configuration controls...

## Settings
- setting1: value
- setting2: value

## Notes
Any additional information...`,
};

export function AddDocumentModal({
  isOpen,
  onClose,
  category,
  onAddDocument,
}: AddDocumentModalProps) {
  const [mode, setMode] = useState<InputMode>('select');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('select');
      setTitle('');
      setContent('');
      setError(null);
    }
  }, [isOpen]);

  const handlePasteSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!content.trim()) {
      setError('Please enter content');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddDocument(title.trim(), content.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, content, onAddDocument, onClose]);

  const handleGuidedComplete = useCallback(async (generatedTitle: string, generatedContent: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onAddDocument(generatedTitle, generatedContent);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
    } finally {
      setIsSubmitting(false);
    }
  }, [onAddDocument, onClose]);

  const handleBack = useCallback(() => {
    setMode('select');
    setError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${mode === 'guided' ? 'max-w-3xl' : 'max-w-2xl'} max-h-[85vh] flex flex-col rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              {mode !== 'select' && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-[var(--fg-tertiary)]" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-display font-semibold text-[var(--fg-primary)]">
                  Add {CATEGORY_LABELS[category]}
                </h2>
                <p className="text-sm text-[var(--fg-tertiary)]">
                  {mode === 'select' && CATEGORY_DESCRIPTIONS[category]}
                  {mode === 'paste' && 'Paste your existing content'}
                  {mode === 'guided' && 'Answer questions to generate content'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--fg-tertiary)]" />
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 py-3 bg-[var(--bg-error-subtle)] border-b border-[var(--border-error)] flex items-center gap-2 text-sm text-[var(--fg-error-primary)]"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {mode === 'select' && (
              <ModeSelector
                onSelectPaste={() => setMode('paste')}
                onSelectGuided={() => setMode('guided')}
              />
            )}

            {mode === 'paste' && (
              <PasteMode
                title={title}
                content={content}
                placeholder={PASTE_PLACEHOLDERS[category]}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onSubmit={handlePasteSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
              />
            )}

            {mode === 'guided' && (
              <GuidedInputFlow
                category={category}
                onComplete={handleGuidedComplete}
                onCancel={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Mode selection UI
interface ModeSelectorProps {
  onSelectPaste: () => void;
  onSelectGuided: () => void;
}

function ModeSelector({ onSelectPaste, onSelectGuided }: ModeSelectorProps) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paste Mode Card */}
        <button
          onClick={onSelectPaste}
          className="group relative p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] hover:bg-secondary-hover transition-all text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <ClipboardPaste className="w-6 h-6 text-[var(--fg-tertiary)]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-lg font-display font-semibold text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors mb-2">
            Manual
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <p className="text-sm text-[var(--fg-tertiary)] flex-1">
              Already have content? Paste it directly and we&apos;ll add it to your knowledge base.
            </p>
            <div className="text-xs text-[var(--fg-quaternary)] whitespace-nowrap sm:mt-0">
              Fastest option
            </div>
          </div>
        </button>

        {/* Guided Mode Card */}
        <button
          onClick={onSelectGuided}
          className="group relative p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] hover:bg-secondary-hover transition-all text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <Wand2 className="w-6 h-6 text-[var(--fg-tertiary)]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--fg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-lg font-display font-semibold text-[var(--fg-primary)] group-hover:text-[var(--fg-brand-primary)] transition-colors mb-2">
            Guided
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <p className="text-sm text-[var(--fg-tertiary)] flex-1">
              Answer a few questions and we&apos;ll help you create structured, well-formatted content.
            </p>
            <div className="text-xs text-[var(--fg-quaternary)] whitespace-nowrap sm:mt-0">
              AI-assisted
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Paste mode UI
interface PasteModeProps {
  title: string;
  content: string;
  placeholder: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function PasteMode({
  title,
  content,
  placeholder,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: PasteModeProps) {
  return (
    <div className="p-6 space-y-4">
      {/* Title Input */}
      <div>
        <label htmlFor="doc-title" className="block text-sm font-medium text-[var(--fg-secondary)] mb-2">
          Document Title
        </label>
        <input
          id="doc-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Social Media Voice Guide"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:border-[var(--border-brand)] focus:ring-1 focus:ring-[var(--border-brand)] outline-none transition-colors text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)]"
        />
      </div>

      {/* Content Textarea */}
      <div>
        <label htmlFor="doc-content" className="block text-sm font-medium text-[var(--fg-secondary)] mb-2">
          Content (Markdown)
        </label>
        <textarea
          id="doc-content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:border-[var(--border-brand)] focus:ring-1 focus:ring-[var(--border-brand)] outline-none transition-colors text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] font-mono text-sm resize-none custom-scrollbar"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg text-[var(--fg-secondary)] hover:bg-primary_hover transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⟳</span>
              Creating...
            </>
          ) : (
            'Create'
          )}
        </button>
      </div>
    </div>
  );
}

export default AddDocumentModal;

