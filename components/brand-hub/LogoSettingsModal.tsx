'use client';

import React, { useState, useCallback } from 'react';
import { Image as ImageIcon, Palette, Trash2 } from 'lucide-react';
import { useBrandLogos } from '@/hooks/useBrandLogos';
import type { BrandLogo, BrandLogoMetadata, BrandLogoVariant, BrandLogoType } from '@/lib/supabase/types';
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

interface LogoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoSettingsModal({ isOpen, onClose }: LogoSettingsModalProps) {
  const {
    mainLogos,
    accessoryLogos,
    isLoading,
    uploadLogoFile,
    editLogo,
    removeLogo,
    refresh,
  } = useBrandLogos();

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingLogo, setEditingLogo] = useState<BrandLogo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    logoType: 'brandmark' as BrandLogoType,
    variant: 'vanilla' as BrandLogoVariant,
    isAccessory: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      logoType: 'brandmark',
      variant: 'vanilla',
      isAccessory: false,
    });
    setSelectedFile(null);
    setIsAddMode(false);
    setEditingLogo(null);
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
      const metadata: BrandLogoMetadata = {
        logoType: formData.logoType,
        variant: formData.variant,
        isAccessory: formData.isAccessory,
      };

      await uploadLogoFile(selectedFile, formData.name, metadata);
      resetForm();
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, formData, uploadLogoFile, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await removeLogo(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting logo:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [removeLogo]);

  const handleEdit = useCallback((logo: BrandLogo) => {
    setEditingLogo(logo);
    const meta = logo.metadata as BrandLogoMetadata;
    setFormData({
      name: logo.name,
      logoType: meta.logoType || 'brandmark',
      variant: (logo.variant as BrandLogoVariant) || meta.variant || 'vanilla',
      isAccessory: meta.isAccessory || false,
    });
    setIsAddMode(true);
  }, []);

  const renderLogoPreview = (logo: BrandLogo) => (
    <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
      {logo.publicUrl ? (
        <img src={logo.publicUrl} alt={logo.name} className="w-10 h-10 object-contain" />
      ) : (
        <ImageIcon className="w-6 h-6 text-[var(--fg-muted)]" />
      )}
    </div>
  );

  return (
    <>
      <BrandHubSettingsModal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="Manage Logos"
        description="Add, edit, or remove brand logos and variants"
        size="lg"
      >
        {isLoading ? (
          <LoadingState message="Loading logos..." />
        ) : isAddMode ? (
          <div className="space-y-6">
            <FormField label="Logo Name" required>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Primary Brandmark"
              />
            </FormField>

            <FormField label="Logo Type">
              <Select
                value={formData.logoType}
                onChange={e => setFormData(prev => ({ ...prev, logoType: e.target.value as BrandLogoType }))}
              >
                <option value="brandmark">Brandmark</option>
                <option value="combo">Combo Logo</option>
                <option value="stacked">Stacked Logo</option>
                <option value="horizontal">Horizontal Logo</option>
                <option value="core">Core</option>
                <option value="outline">Outline</option>
                <option value="filled">Filled</option>
              </Select>
            </FormField>

            <FormField label="Color Variant">
              <Select
                value={formData.variant}
                onChange={e => setFormData(prev => ({ ...prev, variant: e.target.value as BrandLogoVariant }))}
              >
                <option value="vanilla">Vanilla (Light)</option>
                <option value="glass">Glass (Gradient)</option>
                <option value="charcoal">Charcoal (Dark)</option>
              </Select>
            </FormField>

            <FormField label="Category">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAccessory}
                  onChange={e => setFormData(prev => ({ ...prev, isAccessory: e.target.checked }))}
                  className="rounded border-[var(--border-primary)]"
                />
                <span className="text-sm text-[var(--fg-secondary)]">This is an accessory logo</span>
              </label>
            </FormField>

            {!editingLogo && (
              <FormField label="Upload File" required>
                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  accept="image/svg+xml,image/png"
                  label={selectedFile ? selectedFile.name : 'Drop SVG or PNG file here'}
                  description="Recommended: SVG format for scalability"
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
                disabled={isSubmitting || (!editingLogo && !selectedFile) || !formData.name}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingLogo ? 'Update Logo' : 'Add Logo'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Main Logos */}
            <Section
              title="Main Logos"
              description="Primary brand logos in various formats"
              actions={<AddButton onClick={() => setIsAddMode(true)} label="Add Logo" />}
            >
              {mainLogos.length === 0 ? (
                <EmptyState
                  icon={<ImageIcon className="w-6 h-6" />}
                  title="No main logos yet"
                  description="Upload your primary brand logos"
                  action={<AddButton onClick={() => setIsAddMode(true)} label="Add Logo" />}
                />
              ) : (
                <div className="space-y-2">
                  {mainLogos.map(logo => (
                    <SettingsItem
                      key={logo.id}
                      id={logo.id}
                      title={logo.name}
                      subtitle={`${(logo.metadata as BrandLogoMetadata).logoType || 'logo'} • ${logo.variant || 'default'}`}
                      preview={renderLogoPreview(logo)}
                      onEdit={() => handleEdit(logo)}
                      onDelete={() => setDeleteConfirm(logo.id)}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* Accessory Logos */}
            <Section
              title="Accessory Logos"
              description="Secondary brand marks and icons"
              actions={
                <AddButton
                  onClick={() => {
                    setFormData(prev => ({ ...prev, isAccessory: true }));
                    setIsAddMode(true);
                  }}
                  label="Add Accessory"
                />
              }
            >
              {accessoryLogos.length === 0 ? (
                <EmptyState
                  icon={<Palette className="w-6 h-6" />}
                  title="No accessory logos yet"
                  description="Upload secondary marks and icons"
                />
              ) : (
                <div className="space-y-2">
                  {accessoryLogos.map(logo => (
                    <SettingsItem
                      key={logo.id}
                      id={logo.id}
                      title={logo.name}
                      subtitle={`${(logo.metadata as BrandLogoMetadata).logoType || 'accessory'} • ${logo.variant || 'default'}`}
                      preview={renderLogoPreview(logo)}
                      onEdit={() => handleEdit(logo)}
                      onDelete={() => setDeleteConfirm(logo.id)}
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
        title="Delete Logo"
        message="Are you sure you want to delete this logo? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

