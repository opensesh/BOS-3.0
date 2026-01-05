'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/base/buttons/button';
import type { ContentFormat } from '@/lib/quick-actions';
import { CONTENT_FORMATS } from '@/lib/quick-actions';

// =============================================================================
// Types
// =============================================================================

export type FieldType = 'channel' | 'goal' | 'pillar';
export type EditorMode = 'add' | 'edit' | 'delete';

interface ChannelFormData {
  label: string;
  shortLabel: string;
  supportedFormats: ContentFormat[];
}

interface GoalFormData {
  label: string;
  description: string;
}

interface PillarFormData {
  label: string;
}

type FormData = ChannelFormData | GoalFormData | PillarFormData;

interface BaseItem {
  id: string;
  label: string;
  isDefault: boolean;
}

interface ChannelItem extends BaseItem {
  shortLabel: string;
  supportedFormats: ContentFormat[];
}

interface GoalItem extends BaseItem {
  description: string | null;
}

interface PillarItem extends BaseItem {}

type EditableItem = ChannelItem | GoalItem | PillarItem;

interface QuickActionFieldEditorProps {
  isOpen: boolean;
  onClose: () => void;
  fieldType: FieldType;
  mode: EditorMode;
  item?: EditableItem;
  onSave: (data: FormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function isChannelItem(item: EditableItem): item is ChannelItem {
  return 'shortLabel' in item;
}

function isGoalItem(item: EditableItem): item is GoalItem {
  return 'description' in item;
}

// =============================================================================
// Sub-components
// =============================================================================

interface FormatCheckboxProps {
  format: ContentFormat;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FormatCheckbox({ format, label, checked, onChange }: FormatCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--fg-brand-primary)] focus:ring-[var(--border-brand-solid)] focus:ring-offset-0"
      />
      <span className="text-sm text-[var(--fg-secondary)]">{label}</span>
    </label>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function QuickActionFieldEditor({
  isOpen,
  onClose,
  fieldType,
  mode,
  item,
  onSave,
  onDelete,
}: QuickActionFieldEditorProps) {
  // Form state
  const [label, setLabel] = useState('');
  const [shortLabel, setShortLabel] = useState('');
  const [description, setDescription] = useState('');
  const [supportedFormats, setSupportedFormats] = useState<ContentFormat[]>(['written']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when item changes
  useEffect(() => {
    if (mode === 'edit' && item) {
      setLabel(item.label);
      if (isChannelItem(item)) {
        setShortLabel(item.shortLabel);
        setSupportedFormats(item.supportedFormats);
      } else if (isGoalItem(item)) {
        setDescription(item.description || '');
      }
    } else {
      // Reset form for add mode
      setLabel('');
      setShortLabel('');
      setDescription('');
      setSupportedFormats(['written']);
    }
    setError(null);
  }, [mode, item, isOpen]);

  // Get field type labels
  const fieldLabels: Record<FieldType, { singular: string; plural: string }> = {
    channel: { singular: 'Channel', plural: 'Channels' },
    goal: { singular: 'Goal', plural: 'Goals' },
    pillar: { singular: 'Content Pillar', plural: 'Content Pillars' },
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    
    // Validate
    if (!label.trim()) {
      setError('Label is required');
      return;
    }

    if (fieldType === 'channel' && !shortLabel.trim()) {
      setError('Short label is required');
      return;
    }

    if (fieldType === 'channel' && supportedFormats.length === 0) {
      setError('At least one format must be selected');
      return;
    }

    setIsSubmitting(true);

    try {
      let data: FormData;

      switch (fieldType) {
        case 'channel':
          data = {
            label: label.trim(),
            shortLabel: shortLabel.trim().toUpperCase(),
            supportedFormats,
          };
          break;
        case 'goal':
          data = {
            label: label.trim(),
            description: description.trim(),
          };
          break;
        case 'pillar':
          data = {
            label: label.trim(),
          };
          break;
      }

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [fieldType, label, shortLabel, description, supportedFormats, onSave, onClose]);

  const handleDelete = useCallback(async () => {
    if (!item || !onDelete) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [item, onDelete, onClose]);

  const toggleFormat = useCallback((format: ContentFormat, checked: boolean) => {
    if (checked) {
      setSupportedFormats(prev => [...prev, format]);
    } else {
      setSupportedFormats(prev => prev.filter(f => f !== format));
    }
  }, []);

  const getTitle = () => {
    const { singular } = fieldLabels[fieldType];
    switch (mode) {
      case 'add':
        return `Add ${singular}`;
      case 'edit':
        return `Edit ${singular}`;
      case 'delete':
        return `Delete ${singular}`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[var(--bg-primary)] rounded-xl shadow-xl ring-1 ring-[var(--border-secondary)]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-secondary)]">
                <h3 className="text-base font-semibold text-[var(--fg-primary)]">
                  {getTitle()}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-4 space-y-4">
                {mode === 'delete' ? (
                  // Delete confirmation
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-[var(--bg-error-primary)] rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-[var(--fg-error-primary)] flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--fg-error-primary)]">
                          Delete &quot;{item?.label}&quot;?
                        </p>
                        <p className="text-sm text-[var(--fg-error-secondary)]">
                          This action cannot be undone. This will permanently delete this {fieldLabels[fieldType].singular.toLowerCase()}.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Add/Edit form
                  <>
                    {/* Label */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--fg-secondary)]">
                        Label <span className="text-[var(--fg-error-primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={`e.g., ${fieldType === 'channel' ? 'Instagram' : fieldType === 'goal' ? 'Brand Awareness' : 'Educational'}`}
                        className="w-full px-3 py-2 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)]"
                        autoFocus
                      />
                    </div>

                    {/* Channel-specific fields */}
                    {fieldType === 'channel' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-[var(--fg-secondary)]">
                            Short Label <span className="text-[var(--fg-error-primary)]">*</span>
                          </label>
                          <input
                            type="text"
                            value={shortLabel}
                            onChange={(e) => setShortLabel(e.target.value.toUpperCase())}
                            placeholder="e.g., IG"
                            maxLength={5}
                            className="w-full px-3 py-2 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)] uppercase"
                          />
                          <p className="text-xs text-[var(--fg-quaternary)]">
                            Short abbreviation shown in chips (max 5 characters)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--fg-secondary)]">
                            Supported Formats <span className="text-[var(--fg-error-primary)]">*</span>
                          </label>
                          <div className="space-y-2">
                            {CONTENT_FORMATS.map((format) => (
                              <FormatCheckbox
                                key={format.id}
                                format={format.id}
                                label={format.label}
                                checked={supportedFormats.includes(format.id)}
                                onChange={(checked) => toggleFormat(format.id, checked)}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Goal-specific fields */}
                    {fieldType === 'goal' && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[var(--fg-secondary)]">
                          Description
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g., Increase brand visibility and reach"
                          className="w-full px-3 py-2 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)]"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-sm text-[var(--fg-error-primary)]">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border-secondary)]">
                <Button
                  color="tertiary"
                  size="sm"
                  onClick={onClose}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                {mode === 'delete' ? (
                  <Button
                    color="primary-destructive"
                    size="sm"
                    onClick={handleDelete}
                    isDisabled={isSubmitting || item?.isDefault}
                    isLoading={isSubmitting}
                    iconLeading={Trash2}
                  >
                    Delete
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    size="sm"
                    onClick={handleSubmit}
                    isDisabled={isSubmitting}
                    isLoading={isSubmitting}
                    iconLeading={Check}
                  >
                    {mode === 'add' ? 'Add' : 'Save'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default QuickActionFieldEditor;

