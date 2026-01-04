'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  ChevronDown, 
  Loader2,
  Download,
  Image as ImageIcon,
  Upload,
  Lock,
  Shield,
} from 'lucide-react';
import { useBrandLogos, DEFAULT_LOGO_TYPES, DEFAULT_VARIANTS, DEFAULT_CATEGORIES } from '@/hooks/useBrandLogos';
import type { BrandLogo, BrandLogoMetadata, BrandLogoVariant, BrandLogoType, BrandLogoCategory } from '@/lib/supabase/types';
import { ConfirmDialog } from './BrandHubSettingsModal';

interface LogoSettingsTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// CUSTOM SELECT WITH "ADD NEW" OPTION
// ============================================

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowCustom?: boolean;
  formatLabel?: (value: string) => string;
}

function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...', 
  allowCustom = true,
  formatLabel = (v) => v.charAt(0).toUpperCase() + v.slice(1),
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  const handleAddNew = () => {
    if (newValue.trim()) {
      onChange(newValue.trim().toLowerCase().replace(/\s+/g, '-'));
      setNewValue('');
      setIsAddingNew(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors min-w-[80px]"
      >
        <span className="text-[var(--fg-primary)] truncate">
          {value ? formatLabel(value) : placeholder}
        </span>
        <ChevronDown className="w-3 h-3 text-[var(--fg-tertiary)] flex-shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-20 py-1 min-w-[140px] max-h-[200px] overflow-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  value === option ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-primary)]'
                }`}
              >
                <span>{formatLabel(option)}</span>
                {value === option && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
            
            {allowCustom && (
              <>
                <div className="border-t border-[var(--border-secondary)] my-1" />
                {isAddingNew ? (
                  <div className="px-2 py-1.5 flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNew();
                        if (e.key === 'Escape') {
                          setIsAddingNew(false);
                          setNewValue('');
                        }
                      }}
                      placeholder="New value..."
                      className="flex-1 px-2 py-1 text-xs rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--fg-primary)] focus:outline-none focus:border-[var(--border-brand)]"
                    />
                    <button
                      onClick={handleAddNew}
                      disabled={!newValue.trim()}
                      className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)] disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-brand-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add new</span>
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// LOGO ROW COMPONENT
// ============================================

interface LogoRowProps {
  logo: BrandLogo;
  onDownload: (logo: BrandLogo) => void;
  onDelete: (logo: BrandLogo) => void;
  canDelete: boolean;
}

function LogoRow({ logo, onDownload, onDelete, canDelete }: LogoRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const meta = logo.metadata as BrandLogoMetadata;

  // Determine category display
  const category = meta.logoCategory || (meta.isAccessory ? 'accessory' : 'main');
  const logoType = meta.logoType || 'other';
  const variant = logo.variant || meta.variant || 'default';

  const formatLabel = (value: string) => {
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <tr className="group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors">
        {/* Preview */}
        <td className="py-2 px-3 w-[60px]">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
            {logo.publicUrl ? (
              <img 
                src={logo.publicUrl} 
                alt={logo.name} 
                className="w-8 h-8 object-contain"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-[var(--fg-muted)]" />
            )}
          </div>
        </td>

        {/* Name */}
        <td className="py-2 px-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--fg-primary)]">
              {logo.name}
            </span>
            {logo.isSystem && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)]" title="System logo - cannot be deleted">
                <Shield className="w-2.5 h-2.5" />
                Protected
              </span>
            )}
          </div>
        </td>

        {/* Category */}
        <td className="py-2 px-3 w-[100px]">
          <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded ${
            category === 'main' 
              ? 'bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]' 
              : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]'
          }`}>
            {formatLabel(category)}
          </span>
        </td>

        {/* Type */}
        <td className="py-2 px-3 w-[100px]">
          <span className="text-xs text-[var(--fg-secondary)]">
            {formatLabel(logoType)}
          </span>
        </td>

        {/* Variant */}
        <td className="py-2 px-3 w-[100px]">
          <span className="text-xs text-[var(--fg-tertiary)]">
            {formatLabel(variant)}
          </span>
        </td>

        {/* Format */}
        <td className="py-2 px-3 w-[70px]">
          <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
            {logo.mimeType?.split('/')[1] || 'svg'}
          </span>
        </td>

        {/* Actions */}
        <td className="py-2 px-3 w-[80px]">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onDownload(logo)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] opacity-0 group-hover:opacity-100 transition-all"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {canDelete ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--fg-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span 
                className="p-1.5 text-[var(--fg-muted)] opacity-0 group-hover:opacity-30 cursor-not-allowed"
                title="Protected logo cannot be deleted"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </td>
      </tr>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(logo);
          setShowDeleteConfirm(false);
        }}
        title="Delete Logo"
        message={`Are you sure you want to delete "${logo.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

// ============================================
// ADD LOGO ROW COMPONENT
// ============================================

interface AddLogoRowProps {
  onAdd: (data: {
    file: File;
    name: string;
    category: BrandLogoCategory;
    logoType: string;
    variant: string;
  }) => void;
  onCancel: () => void;
  isAdding: boolean;
  availableTypes: string[];
  availableVariants: string[];
}

function AddLogoRow({ onAdd, onCancel, isAdding, availableTypes, availableVariants }: AddLogoRowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BrandLogoCategory>('main');
  const [logoType, setLogoType] = useState('brandmark');
  const [variant, setVariant] = useState('vanilla');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'image/svg+xml' || droppedFile.type === 'image/png')) {
      setFile(droppedFile);
      if (!name) {
        setName(droppedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  }, [name]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  }, [name]);

  const handleSubmit = () => {
    if (!file || !name.trim()) return;
    onAdd({
      file,
      name: name.trim(),
      category,
      logoType,
      variant,
    });
  };

  const formatLabel = (value: string) => {
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <tr className="border-b border-[var(--border-brand)] bg-[var(--bg-brand-primary)]/5">
      {/* File Upload */}
      <td className="py-3 px-3 w-[60px]">
        <label
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-[var(--border-brand)] bg-[var(--bg-brand-primary)]'
              : file
                ? 'border-[var(--border-brand)] bg-[var(--bg-secondary)]'
                : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-brand)]'
          }`}
        >
          {file ? (
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className="w-8 h-8 object-contain"
            />
          ) : (
            <Upload className="w-4 h-4 text-[var(--fg-tertiary)]" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/svg+xml,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </td>

      {/* Name */}
      <td className="py-3 px-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Logo name"
          autoFocus
          className="w-full px-2 py-1 text-sm rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Category */}
      <td className="py-3 px-3 w-[100px]">
        <CustomSelect
          value={category}
          onChange={(v) => setCategory(v as BrandLogoCategory)}
          options={DEFAULT_CATEGORIES}
          formatLabel={formatLabel}
          allowCustom={false}
        />
      </td>

      {/* Type */}
      <td className="py-3 px-3 w-[100px]">
        <CustomSelect
          value={logoType}
          onChange={setLogoType}
          options={availableTypes}
          formatLabel={formatLabel}
          allowCustom={true}
        />
      </td>

      {/* Variant */}
      <td className="py-3 px-3 w-[100px]">
        <CustomSelect
          value={variant}
          onChange={setVariant}
          options={availableVariants}
          formatLabel={formatLabel}
          allowCustom={true}
        />
      </td>

      {/* Format (shows file type) */}
      <td className="py-3 px-3 w-[70px]">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          {file ? file.type.split('/')[1] : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-3 w-[80px]">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={handleSubmit}
            disabled={isAdding || !file || !name.trim()}
            className="p-1.5 rounded-lg border border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] hover:bg-[var(--bg-brand-solid)] hover:text-white hover:border-[var(--bg-brand-solid)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add logo"
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================

export function LogoSettingsTableModal({ isOpen, onClose }: LogoSettingsTableModalProps) {
  const {
    logos,
    isLoading,
    uploadLogoFile,
    removeLogo,
    canDeleteLogo,
    availableTypes,
    availableVariants,
  } = useBrandLogos();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddLogo = useCallback(async (data: {
    file: File;
    name: string;
    category: BrandLogoCategory;
    logoType: string;
    variant: string;
  }) => {
    setIsSaving(true);
    setError(null);
    try {
      const metadata: BrandLogoMetadata = {
        logoCategory: data.category,
        logoType: data.logoType as BrandLogoType,
        variant: data.variant as BrandLogoVariant,
        isAccessory: data.category === 'accessory',
      };

      await uploadLogoFile(data.file, data.name, metadata);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to add logo');
    } finally {
      setIsSaving(false);
    }
  }, [uploadLogoFile]);

  const handleDeleteLogo = useCallback(async (logo: BrandLogo) => {
    try {
      setError(null);
      await removeLogo(logo.id);
    } catch (err) {
      console.error('Error deleting logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete logo');
    }
  }, [removeLogo]);

  const handleDownloadLogo = useCallback((logo: BrandLogo) => {
    if (logo.publicUrl) {
      const link = document.createElement('a');
      link.href = logo.publicUrl;
      link.download = logo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Sort logos: main first, then accessory; within each, by name
  const sortedLogos = [...logos].sort((a, b) => {
    const metaA = a.metadata as BrandLogoMetadata;
    const metaB = b.metadata as BrandLogoMetadata;
    const catA = metaA.logoCategory || (metaA.isAccessory ? 'accessory' : 'main');
    const catB = metaB.logoCategory || (metaB.isAccessory ? 'accessory' : 'main');
    
    if (catA !== catB) {
      return catA === 'main' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[5%] mx-auto max-w-4xl max-h-[90vh] overflow-hidden z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
              <div>
                <h2 className="text-lg font-display font-bold text-[var(--fg-primary)]">
                  Manage Logos
                </h2>
                <p className="text-sm text-[var(--fg-tertiary)]">
                  {logos.length} logo{logos.length !== 1 ? 's' : ''} in your brand library
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Add Logo Button */}
                <motion.button
                  onClick={() => setIsAddingNew(true)}
                  disabled={isAddingNew}
                  className="p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add new logo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                </motion.button>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Table Content */}
            <div className="overflow-auto max-h-[calc(90vh-5rem)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
                  <span className="text-[var(--fg-tertiary)]">Loading logos...</span>
                </div>
              ) : logos.length === 0 && !isAddingNew ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                    <ImageIcon className="w-7 h-7 text-[var(--fg-tertiary)]" />
                  </div>
                  <h3 className="text-base font-medium text-[var(--fg-primary)]">No logos yet</h3>
                  <p className="mt-1 text-sm text-[var(--fg-tertiary)] max-w-xs">
                    Add your brand logos. You can upload SVG or PNG files.
                  </p>
                  <motion.button
                    onClick={() => setIsAddingNew(true)}
                    className="mt-4 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Add first logo"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                  </motion.button>
                </div>
              ) : (
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)]">
                    <tr>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[60px]">
                        
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px]">
                        Category
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px]">
                        Type
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px]">
                        Variant
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[70px]">
                        Format
                      </th>
                      <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px]">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isAddingNew && (
                      <AddLogoRow
                        onAdd={handleAddLogo}
                        onCancel={() => setIsAddingNew(false)}
                        isAdding={isSaving}
                        availableTypes={availableTypes}
                        availableVariants={availableVariants}
                      />
                    )}
                    {sortedLogos.map((logo) => (
                      <LogoRow
                        key={logo.id}
                        logo={logo}
                        onDownload={handleDownloadLogo}
                        onDelete={handleDeleteLogo}
                        canDelete={canDeleteLogo(logo)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer info */}
            <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
              <p className="text-xs text-[var(--fg-muted)] flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected logos (marked with shield) cannot be deleted. Upload both SVG and PNG formats for best results.</span>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

