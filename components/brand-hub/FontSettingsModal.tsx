'use client';

import React, { useState, useCallback } from 'react';
import { Type, Upload } from 'lucide-react';
import { useBrandFonts } from '@/hooks/useBrandFonts';
import type { BrandFont, BrandFontMetadata, FontWeight, FontFormat } from '@/lib/supabase/types';
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
  FileUploadZone,
  ConfirmDialog,
} from './BrandHubSettingsModal';

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FontSettingsModal({ isOpen, onClose }: FontSettingsModalProps) {
  const {
    displayFonts,
    bodyFonts,
    accentFonts,
    isLoading,
    uploadFontFile,
    editFont,
    removeFont,
  } = useBrandFonts();

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingFont, setEditingFont] = useState<BrandFont | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    fontFamily: '',
    fontWeight: '400' as FontWeight,
    usage: 'body' as 'display' | 'body' | 'accent',
    fontFormat: 'woff2' as FontFormat,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      fontFamily: '',
      fontWeight: '400',
      usage: 'body',
      fontFormat: 'woff2',
    });
    setSelectedFile(null);
    setIsAddMode(false);
    setEditingFont(null);
  }, []);

  const handleFileSelect = useCallback((files: FileList) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect format from file
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ['woff2', 'woff', 'ttf', 'otf', 'eot'].includes(ext)) {
        setFormData(prev => ({ ...prev, fontFormat: ext as FontFormat }));
      }
      // Auto-populate name from filename
      if (!formData.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({
          ...prev,
          name: nameWithoutExt.replace(/[-_]/g, ' '),
          fontFamily: nameWithoutExt.split('-')[0].replace(/[-_]/g, ' '),
        }));
      }
    }
  }, [formData.name]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !formData.name || !formData.fontFamily) return;

    setIsSubmitting(true);
    try {
      const metadata: BrandFontMetadata = {
        fontFamily: formData.fontFamily,
        fontWeight: formData.fontWeight,
        fontFormat: formData.fontFormat,
        usage: formData.usage,
      };

      await uploadFontFile(selectedFile, formData.name, metadata);
      resetForm();
    } catch (error) {
      console.error('Error uploading font:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, formData, uploadFontFile, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await removeFont(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting font:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [removeFont]);

  const handleEdit = useCallback((font: BrandFont) => {
    setEditingFont(font);
    const meta = font.metadata as BrandFontMetadata;
    setFormData({
      name: font.name,
      fontFamily: meta.fontFamily || '',
      fontWeight: meta.fontWeight || '400',
      usage: (meta.usage as 'display' | 'body' | 'accent') || 'body',
      fontFormat: meta.fontFormat || 'woff2',
    });
    setIsAddMode(true);
  }, []);

  const renderFontPreview = (font: BrandFont) => {
    const meta = font.metadata as BrandFontMetadata;
    return (
      <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center">
        <span
          className="text-lg font-medium text-[var(--fg-primary)]"
          style={{ fontWeight: parseInt(meta.fontWeight || '400') }}
        >
          Aa
        </span>
      </div>
    );
  };

  const getWeightLabel = (weight: FontWeight): string => {
    const labels: Record<FontWeight, string> = {
      '100': 'Thin',
      '200': 'Extra Light',
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semi Bold',
      '700': 'Bold',
      '800': 'Extra Bold',
      '900': 'Black',
    };
    return labels[weight] || weight;
  };

  const renderFontSection = (
    title: string,
    description: string,
    fonts: BrandFont[],
    usage: 'display' | 'body' | 'accent'
  ) => (
    <Section
      title={title}
      description={description}
      actions={
        <AddButton
          onClick={() => {
            setFormData(prev => ({ ...prev, usage }));
            setIsAddMode(true);
          }}
          label="Add"
          variant="upload"
        />
      }
    >
      {fonts.length === 0 ? (
        <EmptyState
          icon={<Type className="w-6 h-6" />}
          title={`No ${title.toLowerCase()} yet`}
          description={`Upload your ${title.toLowerCase()}`}
        />
      ) : (
        <div className="space-y-2">
          {fonts.map(font => {
            const meta = font.metadata as BrandFontMetadata;
            return (
              <SettingsItem
                key={font.id}
                id={font.id}
                title={font.name}
                subtitle={`${meta.fontFamily || 'Unknown'} • ${getWeightLabel(meta.fontWeight || '400')}`}
                preview={renderFontPreview(font)}
                onEdit={() => handleEdit(font)}
                onDelete={() => setDeleteConfirm(font.id)}
              />
            );
          })}
        </div>
      )}
    </Section>
  );

  return (
    <>
      <BrandHubSettingsModal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="Manage Typography"
        description="Add, edit, or remove brand fonts"
        size="lg"
      >
        {isLoading ? (
          <LoadingState message="Loading fonts..." />
        ) : isAddMode ? (
          <div className="space-y-6">
            <FormField label="Font Name" required>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Neue Haas Grotesk Display Bold"
              />
            </FormField>

            <FormField label="Font Family" required>
              <Input
                value={formData.fontFamily}
                onChange={e => setFormData(prev => ({ ...prev, fontFamily: e.target.value }))}
                placeholder="e.g., Neue Haas Grotesk Display"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Font Weight">
                <Select
                  value={formData.fontWeight}
                  onChange={e => setFormData(prev => ({ ...prev, fontWeight: e.target.value as FontWeight }))}
                >
                  <option value="100">100 - Thin</option>
                  <option value="200">200 - Extra Light</option>
                  <option value="300">300 - Light</option>
                  <option value="400">400 - Regular</option>
                  <option value="500">500 - Medium</option>
                  <option value="600">600 - Semi Bold</option>
                  <option value="700">700 - Bold</option>
                  <option value="800">800 - Extra Bold</option>
                  <option value="900">900 - Black</option>
                </Select>
              </FormField>

              <FormField label="Usage">
                <Select
                  value={formData.usage}
                  onChange={e => setFormData(prev => ({ ...prev, usage: e.target.value as 'display' | 'body' | 'accent' }))}
                >
                  <option value="display">Display</option>
                  <option value="body">Body</option>
                  <option value="accent">Accent</option>
                </Select>
              </FormField>
            </div>

            {!editingFont && (
              <FormField label="Upload Font File" required>
                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  accept=".woff2,.woff,.ttf,.otf,.eot"
                  label={selectedFile ? selectedFile.name : 'Drop font file here'}
                  description="Supported: WOFF2, WOFF, TTF, OTF, EOT"
                />
              </FormField>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!editingFont && !selectedFile) || !formData.name || !formData.fontFamily}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingFont ? 'Update Font' : 'Add Font'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {renderFontSection('Display Fonts', 'Fonts for headlines and large text', displayFonts, 'display')}
            {renderFontSection('Body Fonts', 'Fonts for paragraphs and UI text', bodyFonts, 'body')}
            {renderFontSection('Accent Fonts', 'Decorative and specialty fonts', accentFonts, 'accent')}
          </div>
        )}
      </BrandHubSettingsModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Font"
        message="Are you sure you want to delete this font? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

