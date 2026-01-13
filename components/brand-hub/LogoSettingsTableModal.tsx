'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Check, 
  ChevronDown, 
  Loader2,
  Download,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useBrandLogos, DEFAULT_LOGO_TYPES, DEFAULT_VARIANTS, DEFAULT_CATEGORIES } from '@/hooks/useBrandLogos';
import type { BrandLogo, BrandLogoMetadata, BrandLogoVariant, BrandLogoType, BrandLogoCategory } from '@/lib/supabase/types';

// ============================================
// STATIC SYSTEM LOGOS (Pre-populated from brand assets)
// ============================================

interface StaticLogo {
  id: string;
  name: string;
  category: 'main' | 'accessory';
  logoType: string;
  variants: { variant: string; path: string }[];
}

// Supabase storage URL helper
function getLogoUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/brand-assets/open-session/logos/${filename}`;
}

const STATIC_SYSTEM_LOGOS: StaticLogo[] = [
  // Main Logos
  {
    id: 'brandmark',
    name: 'Brandmark',
    category: 'main',
    logoType: 'brandmark',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('brandmark-vanilla.svg') },
      { variant: 'glass', path: getLogoUrl('brandmark-glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('brandmark-charcoal.svg') },
    ],
  },
  {
    id: 'combo',
    name: 'Combo',
    category: 'main',
    logoType: 'combo',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('logo_main_combo_vanilla.svg') },
      { variant: 'glass', path: getLogoUrl('logo_main_combo_glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('logo_main_combo_charcoal.svg') },
    ],
  },
  {
    id: 'stacked',
    name: 'Stacked',
    category: 'main',
    logoType: 'stacked',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('stacked-vanilla.svg') },
      { variant: 'glass', path: getLogoUrl('stacked-glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('stacked-charcoal.svg') },
    ],
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    category: 'main',
    logoType: 'horizontal',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('horizontal-vanilla.svg') },
      { variant: 'glass', path: getLogoUrl('horizontal-glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('horizontal-charcoal.svg') },
    ],
  },
  // Accessory Logos
  {
    id: 'core',
    name: 'Core',
    category: 'accessory',
    logoType: 'core',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('core.svg') },
      { variant: 'glass', path: getLogoUrl('core-glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('core-charcoal.svg') },
    ],
  },
  {
    id: 'outline',
    name: 'Outline',
    category: 'accessory',
    logoType: 'outline',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('outline.svg') },
      { variant: 'glass', path: getLogoUrl('outline-glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('outline-charcoal.svg') },
    ],
  },
  {
    id: 'filled',
    name: 'Filled',
    category: 'accessory',
    logoType: 'filled',
    variants: [
      { variant: 'vanilla', path: getLogoUrl('filled.svg') },
      { variant: 'glass', path: getLogoUrl('filled-glass.svg') },
      { variant: 'charcoal', path: getLogoUrl('filled-charcoal.svg') },
    ],
  },
];

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
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 220; // Approximate max height of dropdown
      
      // Position above if not enough space below and more space above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors min-w-[80px]"
      >
        <span className="text-[var(--fg-primary)] truncate">
          {value ? formatLabel(value) : placeholder}
        </span>
        <ChevronDown className={`w-3 h-3 text-[var(--fg-tertiary)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            className={`absolute left-0 z-[100] py-1 min-w-[160px] max-h-[200px] overflow-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl ${
              dropdownPosition === 'bottom' 
                ? 'top-full mt-1' 
                : 'bottom-full mb-1'
            }`}
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
                      title="Save"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewValue('');
                      }}
                      className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
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

// ============================================
// STATIC SYSTEM LOGO ROW (Pre-populated logos)
// ============================================

interface StaticLogoRowProps {
  logo: StaticLogo;
  onDownload: (path: string, name: string) => void;
}

function StaticLogoRow({ logo, onDownload }: StaticLogoRowProps) {
  const formatLabel = (value: string) => {
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Show first variant's image as preview
  const previewPath = logo.variants[0]?.path || '';
  const variantCount = logo.variants.length;

  return (
    <tr className="group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors">
      {/* Preview */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--color-charcoal)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
          <img 
            src={previewPath} 
            alt={logo.name} 
            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
          />
        </div>
      </td>

      {/* Name */}
      <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
        <span className="text-xs sm:text-sm font-medium text-[var(--fg-primary)] truncate block">
          {logo.name}
        </span>
      </td>

      {/* Category */}
      <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px]">
        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded ${
          logo.category === 'main' 
            ? 'bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]' 
            : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]'
        }`}>
          {formatLabel(logo.category)}
        </span>
      </td>

      {/* Type */}
      <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px]">
        <span className="text-[10px] sm:text-xs text-[var(--fg-secondary)]">
          {formatLabel(logo.logoType)}
        </span>
      </td>

      {/* Variant - hidden on mobile */}
      <td className="py-2 px-2 sm:px-3 w-[70px] sm:w-[90px] hidden sm:table-cell">
        <span className="text-[10px] sm:text-xs text-[var(--fg-tertiary)]">
          {variantCount} variant{variantCount !== 1 ? 's' : ''}
        </span>
      </td>

      {/* Format - hidden on mobile and tablet */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          svg
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="flex items-center justify-end">
          <button
            onClick={() => onDownload(previewPath, `${logo.id}-vanilla.svg`)}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            title="Download"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// DYNAMIC LOGO ROW COMPONENT (User-added logos)
// ============================================

interface LogoRowProps {
  logo: BrandLogo;
  onDownload: (logo: BrandLogo) => void;
}

function LogoRow({ logo, onDownload }: LogoRowProps) {
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
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
            {logo.publicUrl ? (
              <img 
                src={logo.publicUrl} 
                alt={logo.name} 
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
              />
            ) : (
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fg-muted)]" />
            )}
          </div>
        </td>

        {/* Name */}
        <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
          <span className="text-xs sm:text-sm font-medium text-[var(--fg-primary)] truncate block">
            {logo.name}
          </span>
        </td>

        {/* Category */}
        <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px]">
          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded ${
            category === 'main' 
              ? 'bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]' 
              : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]'
          }`}>
            {formatLabel(category)}
          </span>
        </td>

        {/* Type */}
        <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px]">
          <span className="text-[10px] sm:text-xs text-[var(--fg-secondary)]">
            {formatLabel(logoType)}
          </span>
        </td>

        {/* Variant - hidden on mobile */}
        <td className="py-2 px-2 sm:px-3 w-[70px] sm:w-[90px] hidden sm:table-cell">
          <span className="text-[10px] sm:text-xs text-[var(--fg-tertiary)] truncate block" title={formatLabel(variant)}>
            {formatLabel(variant)}
          </span>
        </td>

        {/* Format - hidden on mobile and tablet */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
          <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
            {logo.mimeType?.split('/')[1] || 'svg'}
          </span>
        </td>

        {/* Actions */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
          <div className="flex items-center justify-end">
            <button
              onClick={() => onDownload(logo)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all"
              title="Download"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </td>
      </tr>
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
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <label
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed transition-colors ${
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
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
            />
          ) : (
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--fg-tertiary)]" />
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
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Logo name"
          autoFocus
          className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Category */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[80px] sm:w-[100px]">
        <CustomSelect
          value={category}
          onChange={(v) => setCategory(v as BrandLogoCategory)}
          options={DEFAULT_CATEGORIES}
          formatLabel={formatLabel}
          allowCustom={true}
        />
      </td>

      {/* Type */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[80px] sm:w-[100px]">
        <CustomSelect
          value={logoType}
          onChange={setLogoType}
          options={availableTypes}
          formatLabel={formatLabel}
          allowCustom={true}
        />
      </td>

      {/* Variant - hidden on mobile */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[70px] sm:w-[90px] hidden sm:table-cell">
        <CustomSelect
          value={variant}
          onChange={setVariant}
          options={availableVariants}
          formatLabel={formatLabel}
          allowCustom={true}
        />
      </td>

      {/* Format (shows file type) - hidden on mobile and tablet */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          {file ? file.type.split('/')[1] : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <button
            onClick={handleSubmit}
            disabled={isAdding || !file || !name.trim()}
            className="p-1 sm:p-1.5 rounded-lg border border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] hover:bg-[var(--bg-brand-solid)] hover:text-white hover:border-[var(--bg-brand-solid)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add logo"
          >
            {isAdding ? (
              <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            ) : (
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </button>
          <button
            onClick={onCancel}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            title="Cancel"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

  // Download static logo from path
  const handleDownloadStaticLogo = useCallback((path: string, filename: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Total count includes both static and dynamic logos
  const totalLogoCount = STATIC_SYSTEM_LOGOS.length + logos.length;

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

          {/* Modal container - Full screen flex for centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[65vh] overflow-hidden rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl flex flex-col pointer-events-auto"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-primary)] shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-[var(--fg-primary)]">
                  Manage Logos
                </h2>
                <p className="text-xs sm:text-sm text-[var(--fg-tertiary)]">
                  {totalLogoCount} logo{totalLogoCount !== 1 ? 's' : ''} in your brand library
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Add Logo Button */}
                <motion.button
                  onClick={() => setIsAddingNew(true)}
                  disabled={isAddingNew}
                  className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add new logo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                </motion.button>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Table Content - Scrollable area */}
            <div className="flex-1 overflow-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
                  <span className="text-[var(--fg-tertiary)]">Loading logos...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)] z-10">
                      <tr>
                        <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px]">
                          
                        </th>
                        <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px] sm:w-[140px] md:w-[180px]">
                          Name
                        </th>
                        <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px] sm:w-[100px]">
                          Category
                        </th>
                        <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px] sm:w-[100px]">
                          Type
                        </th>
                        <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[70px] sm:w-[90px] hidden sm:table-cell">
                          Variant
                        </th>
                        <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px] hidden md:table-cell">
                          Format
                        </th>
                        <th className="py-2.5 px-2 sm:px-3 text-right text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px]">
                          
                        </th>
                      </tr>
                    </thead>
                  <tbody>
                    {/* Add new logo row (when active) */}
                    {isAddingNew && (
                      <AddLogoRow
                        onAdd={handleAddLogo}
                        onCancel={() => setIsAddingNew(false)}
                        isAdding={isSaving}
                        availableTypes={availableTypes}
                        availableVariants={availableVariants}
                      />
                    )}
                    
                    {/* Static system logos (pre-populated) */}
                    {STATIC_SYSTEM_LOGOS.map((logo) => (
                      <StaticLogoRow
                        key={`static-${logo.id}`}
                        logo={logo}
                        onDownload={handleDownloadStaticLogo}
                      />
                    ))}
                    
                    {/* Dynamic user-added logos from Supabase */}
                    {sortedLogos.map((logo) => (
                      <LogoRow
                        key={logo.id}
                        logo={logo}
                        onDownload={handleDownloadLogo}
                      />
                    ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="p-3 sm:p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 shrink-0">
              <p className="text-[10px] sm:text-xs text-[var(--fg-muted)]">
                <span className="hidden sm:inline">Add new logos using the + button. Upload both SVG and PNG formats for best results.</span>
                <span className="sm:hidden">Use + to add new logos.</span>
              </p>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

