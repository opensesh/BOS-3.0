'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Link as LinkIcon, Upload, ExternalLink, Star, StarOff, Figma } from 'lucide-react';
import { useBrandGuidelines } from '@/hooks/useBrandGuidelines';
import type { BrandGuideline, BrandGuidelineType } from '@/lib/supabase/types';
import { isValidFigmaUrl } from '@/lib/supabase/brand-guidelines-service';
import {
  BrandHubSettingsModal,
  Section,
  SettingsItem,
  AddButton,
  EmptyState,
  LoadingState,
  FormField,
  Input,
  Select,
  Textarea,
  FileUploadZone,
  ConfirmDialog,
  StatusBadge,
} from './BrandHubSettingsModal';

interface GuidelinesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuidelinesSettingsModal({ isOpen, onClose }: GuidelinesSettingsModalProps) {
  const {
    guidelines,
    primaryGuideline,
    counts,
    isLoading,
    addGuideline,
    addFigmaGuideline,
    editGuideline,
    removeGuideline,
    uploadGuidelineFile,
    setAsPrimary,
  } = useBrandGuidelines();

  const [isAddMode, setIsAddMode] = useState(false);
  const [addType, setAddType] = useState<'figma' | 'upload' | 'link'>('figma');
  const [editingGuideline, setEditingGuideline] = useState<BrandGuideline | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'brand-identity',
    isPrimary: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlError, setUrlError] = useState('');

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      url: '',
      description: '',
      category: 'brand-identity',
      isPrimary: false,
    });
    setSelectedFile(null);
    setIsAddMode(false);
    setEditingGuideline(null);
    setUrlError('');
    setAddType('figma');
  }, []);

  const handleFileSelect = useCallback((files: FileList) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate title from filename
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        }));
      }
    }
  }, [formData.title]);

  const validateFigmaUrl = useCallback((url: string) => {
    if (addType === 'figma' && url && !isValidFigmaUrl(url)) {
      setUrlError('Please enter a valid Figma URL (figma.com/file/... or figma.com/proto/...)');
      return false;
    }
    setUrlError('');
    return true;
  }, [addType]);

  const handleSubmit = useCallback(async () => {
    if (!formData.title) return;
    if (addType === 'figma' && !validateFigmaUrl(formData.url)) return;

    setIsSubmitting(true);
    try {
      if (editingGuideline) {
        await editGuideline(editingGuideline.id, {
          title: formData.title,
          url: formData.url || undefined,
          description: formData.description || undefined,
          category: formData.category || undefined,
          is_primary: formData.isPrimary,
        });
      } else if (addType === 'figma' && formData.url) {
        await addFigmaGuideline(formData.url, {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category || undefined,
          isPrimary: formData.isPrimary,
        });
      } else if (addType === 'upload' && selectedFile) {
        await uploadGuidelineFile(selectedFile, {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category || undefined,
          isPrimary: formData.isPrimary,
        });
      } else if (addType === 'link' && formData.url) {
        await addGuideline({
          title: formData.title,
          guideline_type: 'link',
          url: formData.url,
          description: formData.description || undefined,
          category: formData.category || undefined,
          is_primary: formData.isPrimary,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving guideline:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addType, selectedFile, editingGuideline, addFigmaGuideline, addGuideline, uploadGuidelineFile, editGuideline, validateFigmaUrl, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await removeGuideline(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting guideline:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [removeGuideline]);

  const handleSetPrimary = useCallback(async (id: string) => {
    try {
      await setAsPrimary(id);
    } catch (error) {
      console.error('Error setting primary guideline:', error);
    }
  }, [setAsPrimary]);

  const handleEdit = useCallback((guideline: BrandGuideline) => {
    setEditingGuideline(guideline);
    setFormData({
      title: guideline.title,
      url: guideline.url || guideline.embedUrl || '',
      description: guideline.description || '',
      category: guideline.category || 'brand-identity',
      isPrimary: guideline.isPrimary,
    });
    setAddType(guideline.guidelineType === 'figma' ? 'figma' : guideline.storagePath ? 'upload' : 'link');
    setIsAddMode(true);
  }, []);

  const getTypeIcon = (type: BrandGuidelineType) => {
    switch (type) {
      case 'figma':
        return <Figma className="w-4 h-4" />;
      case 'pdf':
      case 'pptx':
      case 'ppt':
        return <FileText className="w-4 h-4" />;
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  const renderGuidelinePreview = (guideline: BrandGuideline) => (
    <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--fg-tertiary)]">
      {getTypeIcon(guideline.guidelineType)}
    </div>
  );

  // Group guidelines by type
  const figmaGuidelines = guidelines.filter(g => g.guidelineType === 'figma');
  const fileGuidelines = guidelines.filter(g => ['pdf', 'pptx', 'ppt'].includes(g.guidelineType));
  const linkGuidelines = guidelines.filter(g => ['link', 'notion', 'google-doc'].includes(g.guidelineType));

  return (
    <>
      <BrandHubSettingsModal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="Manage Guidelines"
        description="Add Figma prototypes, upload documents, or link external resources"
        size="lg"
      >
        {isLoading ? (
          <LoadingState message="Loading guidelines..." />
        ) : isAddMode ? (
          <div className="space-y-6">
            {/* Add Type Selector */}
            {!editingGuideline && (
              <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-xl">
                <button
                  onClick={() => setAddType('figma')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    addType === 'figma'
                      ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                      : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                  }`}
                >
                  <Figma className="w-4 h-4" />
                  Figma
                </button>
                <button
                  onClick={() => setAddType('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    addType === 'upload'
                      ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                      : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <button
                  onClick={() => setAddType('link')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    addType === 'link'
                      ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                      : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Link
                </button>
              </div>
            )}

            <FormField label="Title" required>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Brand Guidelines 2024"
              />
            </FormField>

            {(addType === 'figma' || addType === 'link') && (
              <FormField
                label={addType === 'figma' ? 'Figma URL' : 'URL'}
                required={!editingGuideline}
                error={urlError}
              >
                <Input
                  value={formData.url}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, url: e.target.value }));
                    if (urlError) validateFigmaUrl(e.target.value);
                  }}
                  onBlur={e => validateFigmaUrl(e.target.value)}
                  placeholder={
                    addType === 'figma'
                      ? 'https://figma.com/proto/...'
                      : 'https://...'
                  }
                />
              </FormField>
            )}

            {addType === 'upload' && !editingGuideline && (
              <FormField label="Upload Document" required>
                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.pptx,.ppt"
                  label={selectedFile ? selectedFile.name : 'Drop PDF or PowerPoint file here'}
                  description="Supported: PDF, PPTX, PPT"
                />
              </FormField>
            )}

            <FormField label="Description">
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this guideline..."
                rows={2}
              />
            </FormField>

            <FormField label="Category">
              <Select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="brand-identity">Brand Identity</option>
                <option value="messaging">Messaging</option>
                <option value="art-direction">Art Direction</option>
                <option value="ai-guidance">AI Guidance</option>
                <option value="design-system">Design System</option>
                <option value="other">Other</option>
              </Select>
            </FormField>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={e => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="rounded border-[var(--border-primary)]"
              />
              <span className="text-sm text-[var(--fg-secondary)]">Set as primary guideline</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !formData.title ||
                  (addType === 'upload' && !editingGuideline && !selectedFile) ||
                  ((addType === 'figma' || addType === 'link') && !editingGuideline && !formData.url)
                }
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingGuideline ? 'Update' : 'Add Guideline'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Figma Guidelines */}
            <Section
              title="Figma Prototypes"
              description={`${counts.figma} embedded Figma prototype${counts.figma !== 1 ? 's' : ''}`}
              actions={
                <AddButton
                  onClick={() => {
                    setAddType('figma');
                    setIsAddMode(true);
                  }}
                  label="Add Figma"
                />
              }
            >
              {figmaGuidelines.length === 0 ? (
                <EmptyState
                  icon={<Figma className="w-6 h-6" />}
                  title="No Figma prototypes yet"
                  description="Embed Figma prototypes for interactive guidelines"
                />
              ) : (
                <div className="space-y-2">
                  {figmaGuidelines.map(guideline => (
                    <SettingsItem
                      key={guideline.id}
                      id={guideline.id}
                      title={
                        <span className="flex items-center gap-2">
                          {guideline.title}
                          {guideline.isPrimary && (
                            <StatusBadge status="success" label="Primary" />
                          )}
                        </span>
                      }
                      subtitle={guideline.category || 'Uncategorized'}
                      preview={renderGuidelinePreview(guideline)}
                      onEdit={() => handleEdit(guideline)}
                      onDelete={() => setDeleteConfirm(guideline.id)}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* File Guidelines */}
            <Section
              title="Documents"
              description={`${counts.pdf + counts.pptx + counts.ppt} uploaded document${(counts.pdf + counts.pptx + counts.ppt) !== 1 ? 's' : ''}`}
              actions={
                <AddButton
                  onClick={() => {
                    setAddType('upload');
                    setIsAddMode(true);
                  }}
                  label="Upload"
                  variant="upload"
                />
              }
            >
              {fileGuidelines.length === 0 ? (
                <EmptyState
                  icon={<FileText className="w-6 h-6" />}
                  title="No documents yet"
                  description="Upload PDF or PowerPoint guidelines"
                />
              ) : (
                <div className="space-y-2">
                  {fileGuidelines.map(guideline => (
                    <SettingsItem
                      key={guideline.id}
                      id={guideline.id}
                      title={
                        <span className="flex items-center gap-2">
                          {guideline.title}
                          {guideline.isPrimary && (
                            <StatusBadge status="success" label="Primary" />
                          )}
                        </span>
                      }
                      subtitle={`${guideline.guidelineType.toUpperCase()} • ${guideline.category || 'Uncategorized'}`}
                      preview={renderGuidelinePreview(guideline)}
                      onEdit={() => handleEdit(guideline)}
                      onDelete={() => setDeleteConfirm(guideline.id)}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* Link Guidelines */}
            <Section
              title="External Links"
              description={`${counts.link + counts.notion + counts['google-doc']} external link${(counts.link + counts.notion + counts['google-doc']) !== 1 ? 's' : ''}`}
              actions={
                <AddButton
                  onClick={() => {
                    setAddType('link');
                    setIsAddMode(true);
                  }}
                  label="Add Link"
                  variant="link"
                />
              }
            >
              {linkGuidelines.length === 0 ? (
                <EmptyState
                  icon={<LinkIcon className="w-6 h-6" />}
                  title="No external links yet"
                  description="Link to Notion, Google Docs, or other resources"
                />
              ) : (
                <div className="space-y-2">
                  {linkGuidelines.map(guideline => (
                    <SettingsItem
                      key={guideline.id}
                      id={guideline.id}
                      title={
                        <span className="flex items-center gap-2">
                          {guideline.title}
                          {guideline.isPrimary && (
                            <StatusBadge status="success" label="Primary" />
                          )}
                        </span>
                      }
                      subtitle={guideline.category || 'Uncategorized'}
                      preview={renderGuidelinePreview(guideline)}
                      onEdit={() => handleEdit(guideline)}
                      onDelete={() => setDeleteConfirm(guideline.id)}
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </BrandHubSettingsModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Guideline"
        message="Are you sure you want to delete this guideline? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

