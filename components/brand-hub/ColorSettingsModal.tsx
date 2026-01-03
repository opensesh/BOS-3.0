'use client';

import React, { useState, useCallback } from 'react';
import { Palette, Plus, Droplet, Trash2, Copy } from 'lucide-react';
import { useBrandColors } from '@/hooks/useBrandColors';
import type { BrandColor, BrandColorGroup, BrandColorRole } from '@/lib/supabase/types';
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
  ConfirmDialog,
} from './BrandHubSettingsModal';

interface ColorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ColorSettingsModal({ isOpen, onClose }: ColorSettingsModalProps) {
  const {
    brandColors,
    monoColors,
    brandScaleColors,
    customColors,
    isLoading,
    addColor,
    editColor,
    removeColor,
    duplicateExistingColor,
  } = useBrandColors();

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingColor, setEditingColor] = useState<BrandColor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    hexValue: '#000000',
    colorGroup: 'brand' as BrandColorGroup,
    colorRole: '' as BrandColorRole | '',
    description: '',
    usageGuidelines: '',
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      hexValue: '#000000',
      colorGroup: 'brand',
      colorRole: '',
      description: '',
      usageGuidelines: '',
    });
    setIsAddMode(false);
    setEditingColor(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.hexValue) return;

    setIsSubmitting(true);
    try {
      if (editingColor) {
        await editColor(editingColor.id, {
          name: formData.name,
          hex_value: formData.hexValue,
          color_group: formData.colorGroup,
          color_role: formData.colorRole || undefined,
          description: formData.description || undefined,
          usage_guidelines: formData.usageGuidelines || undefined,
        });
      } else {
        await addColor({
          name: formData.name,
          hex_value: formData.hexValue,
          color_group: formData.colorGroup,
          color_role: formData.colorRole || undefined,
          description: formData.description || undefined,
          usage_guidelines: formData.usageGuidelines || undefined,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving color:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingColor, addColor, editColor, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await removeColor(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting color:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [removeColor]);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      await duplicateExistingColor(id);
    } catch (error) {
      console.error('Error duplicating color:', error);
    }
  }, [duplicateExistingColor]);

  const handleEdit = useCallback((color: BrandColor) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      hexValue: color.hexValue,
      colorGroup: color.colorGroup,
      colorRole: color.colorRole || '',
      description: color.description || '',
      usageGuidelines: color.usageGuidelines || '',
    });
    setIsAddMode(true);
  }, []);

  const renderColorPreview = (color: BrandColor) => (
    <div
      className="w-10 h-10 rounded-lg border border-[var(--border-primary)] shadow-sm"
      style={{ backgroundColor: color.hexValue }}
    />
  );

  const renderColorSection = (
    title: string,
    description: string,
    colors: BrandColor[],
    group: BrandColorGroup
  ) => (
    <Section
      title={title}
      description={description}
      actions={
        <AddButton
          onClick={() => {
            setFormData(prev => ({ ...prev, colorGroup: group }));
            setIsAddMode(true);
          }}
          label="Add"
        />
      }
    >
      {colors.length === 0 ? (
        <EmptyState
          icon={<Droplet className="w-6 h-6" />}
          title={`No ${title.toLowerCase()} yet`}
          description={`Add your first ${title.toLowerCase()}`}
        />
      ) : (
        <div className="space-y-2">
          {colors.map(color => (
            <SettingsItem
              key={color.id}
              id={color.id}
              title={color.name}
              subtitle={color.hexValue.toUpperCase()}
              preview={renderColorPreview(color)}
              onEdit={() => handleEdit(color)}
              onDelete={() => setDeleteConfirm(color.id)}
            />
          ))}
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
        title="Manage Colors"
        description="Add, edit, or remove brand colors and palettes"
        size="lg"
      >
        {isLoading ? (
          <LoadingState message="Loading colors..." />
        ) : isAddMode ? (
          <div className="space-y-6">
            <div className="flex gap-4">
              {/* Color Preview */}
              <div
                className="w-24 h-24 rounded-xl border-2 border-[var(--border-primary)] shadow-lg flex-shrink-0"
                style={{ backgroundColor: formData.hexValue }}
              />

              <div className="flex-1 space-y-4">
                <FormField label="Color Name" required>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Primary Blue"
                  />
                </FormField>

                <FormField label="Hex Value" required>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.hexValue}
                      onChange={e => setFormData(prev => ({ ...prev, hexValue: e.target.value }))}
                      className="w-12 h-10 rounded-lg border border-[var(--border-primary)] cursor-pointer"
                    />
                    <Input
                      value={formData.hexValue}
                      onChange={e => setFormData(prev => ({ ...prev, hexValue: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1 font-mono"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            <FormField label="Color Group">
              <Select
                value={formData.colorGroup}
                onChange={e => setFormData(prev => ({ ...prev, colorGroup: e.target.value as BrandColorGroup }))}
              >
                <option value="brand">Brand Colors</option>
                <option value="mono-scale">Grayscale</option>
                <option value="brand-scale">Brand Scale</option>
                <option value="custom">Custom</option>
              </Select>
            </FormField>

            <FormField label="Color Role">
              <Select
                value={formData.colorRole}
                onChange={e => setFormData(prev => ({ ...prev, colorRole: e.target.value as BrandColorRole }))}
              >
                <option value="">None</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="accent">Accent</option>
                <option value="background">Background</option>
                <option value="foreground">Foreground</option>
                <option value="border">Border</option>
                <option value="text">Text</option>
                <option value="muted">Muted</option>
              </Select>
            </FormField>

            <FormField label="Description">
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Primary brand color used for CTAs"
              />
            </FormField>

            <FormField label="Usage Guidelines">
              <Textarea
                value={formData.usageGuidelines}
                onChange={e => setFormData(prev => ({ ...prev, usageGuidelines: e.target.value }))}
                placeholder="Describe when and how to use this color..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name || !formData.hexValue}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingColor ? 'Update Color' : 'Add Color'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {renderColorSection('Brand Colors', 'Primary and secondary brand colors', brandColors, 'brand')}
            {renderColorSection('Grayscale', 'Neutral and monochromatic colors', monoColors, 'mono-scale')}
            {renderColorSection('Brand Scale', 'Extended brand color palette', brandScaleColors, 'brand-scale')}
            {renderColorSection('Custom Colors', 'Additional custom colors', customColors, 'custom')}
          </div>
        )}
      </BrandHubSettingsModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Color"
        message="Are you sure you want to delete this color? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

