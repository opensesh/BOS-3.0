'use client';

import React, { useState, useCallback } from 'react';
import { Image as ImageIcon, Tag, Grid3X3 } from 'lucide-react';
import { useBrandArtDirection } from '@/hooks/useBrandArtDirection';
import type { BrandArtImage, BrandArtImageMetadata, ArtDirectionCategory } from '@/lib/supabase/types';
import { ART_DIRECTION_CATEGORIES } from '@/lib/supabase/brand-art-service';
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
} from './BrandHubSettingsModal';

interface ArtDirectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArtDirectionSettingsModal({ isOpen, onClose }: ArtDirectionSettingsModalProps) {
  const {
    images,
    imagesByCategory,
    counts,
    categories,
    isLoading,
    uploadImageFile,
    editImage,
    removeImage,
  } = useBrandArtDirection();

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingImage, setEditingImage] = useState<BrandArtImage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCategory, setViewCategory] = useState<ArtDirectionCategory | 'All'>('All');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    artCategory: 'Auto' as ArtDirectionCategory,
    altText: '',
    photographer: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      artCategory: 'Auto',
      altText: '',
      photographer: '',
      tags: '',
    });
    setSelectedFile(null);
    setIsAddMode(false);
    setEditingImage(null);
  }, []);

  const handleFileSelect = useCallback((files: FileList) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate name from filename
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        }));
      }
    }
  }, [formData.name]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !formData.name) return;

    setIsSubmitting(true);
    try {
      const metadata: BrandArtImageMetadata = {
        artCategory: formData.artCategory,
        altText: formData.altText || undefined,
        photographer: formData.photographer || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      };

      await uploadImageFile(selectedFile, formData.name, metadata);
      resetForm();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, formData, uploadImageFile, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await removeImage(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [removeImage]);

  const handleEdit = useCallback((image: BrandArtImage) => {
    setEditingImage(image);
    const meta = image.metadata as BrandArtImageMetadata;
    setFormData({
      name: image.name,
      artCategory: meta.artCategory || 'Auto',
      altText: meta.altText || '',
      photographer: meta.photographer || '',
      tags: meta.tags?.join(', ') || '',
    });
    setIsAddMode(true);
  }, []);

  const renderImagePreview = (image: BrandArtImage) => (
    <div className="w-16 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
      {image.publicUrl ? (
        <img src={image.publicUrl} alt={image.name} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="w-6 h-6 text-[var(--fg-muted)]" />
      )}
    </div>
  );

  // Get images for current view
  const displayImages = viewCategory === 'All'
    ? images
    : (imagesByCategory.get(viewCategory) || []);

  return (
    <>
      <BrandHubSettingsModal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="Manage Art Direction"
        description="Add, edit, or remove art direction images"
        size="xl"
      >
        {isLoading ? (
          <LoadingState message="Loading images..." />
        ) : isAddMode ? (
          <div className="space-y-6">
            <FormField label="Image Name" required>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Audi Quattro Urban Portrait"
              />
            </FormField>

            <FormField label="Category" required>
              <Select
                value={formData.artCategory}
                onChange={e => setFormData(prev => ({ ...prev, artCategory: e.target.value as ArtDirectionCategory }))}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.id} - {cat.title}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Alt Text">
              <Textarea
                value={formData.altText}
                onChange={e => setFormData(prev => ({ ...prev, altText: e.target.value }))}
                placeholder="Describe the image for accessibility..."
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Photographer">
                <Input
                  value={formData.photographer}
                  onChange={e => setFormData(prev => ({ ...prev, photographer: e.target.value }))}
                  placeholder="e.g., John Smith"
                />
              </FormField>

              <FormField label="Tags">
                <Input
                  value={formData.tags}
                  onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="urban, night, motion (comma-separated)"
                />
              </FormField>
            </div>

            {!editingImage && (
              <FormField label="Upload Image" required>
                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  label={selectedFile ? selectedFile.name : 'Drop image file here'}
                  description="Recommended: High-resolution JPG or PNG"
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
                disabled={isSubmitting || (!editingImage && !selectedFile) || !formData.name}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingImage ? 'Update Image' : 'Add Image'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-primary)]">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Filter by:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewCategory === 'All'
                      ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  All ({counts.All})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setViewCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewCategory === cat.id
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {cat.id} ({counts[cat.id] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <Section
              title={viewCategory === 'All' ? 'All Images' : `${viewCategory} Images`}
              description={`${displayImages.length} image${displayImages.length !== 1 ? 's' : ''}`}
              actions={
                <AddButton
                  onClick={() => {
                    if (viewCategory !== 'All') {
                      setFormData(prev => ({ ...prev, artCategory: viewCategory }));
                    }
                    setIsAddMode(true);
                  }}
                  label="Add Image"
                  variant="upload"
                />
              }
            >
              {displayImages.length === 0 ? (
                <EmptyState
                  icon={<Grid3X3 className="w-6 h-6" />}
                  title="No images yet"
                  description="Upload your first art direction image"
                  action={<AddButton onClick={() => setIsAddMode(true)} label="Add Image" variant="upload" />}
                />
              ) : (
                <div className="space-y-2">
                  {displayImages.map(image => {
                    const meta = image.metadata as BrandArtImageMetadata;
                    return (
                      <SettingsItem
                        key={image.id}
                        id={image.id}
                        title={image.name}
                        subtitle={`${meta.artCategory || 'Uncategorized'}${meta.photographer ? ` • ${meta.photographer}` : ''}`}
                        preview={renderImagePreview(image)}
                        onEdit={() => handleEdit(image)}
                        onDelete={() => setDeleteConfirm(image.id)}
                      />
                    );
                  })}
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
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

