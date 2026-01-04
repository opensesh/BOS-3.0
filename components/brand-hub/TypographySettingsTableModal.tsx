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
  Type,
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useBrandFonts } from '@/hooks/useBrandFonts';
import type { BrandFont, BrandFontMetadata, FontWeight, FontFormat } from '@/lib/supabase/types';
import { ConfirmDialog } from './BrandHubSettingsModal';

// ============================================
// STATIC SYSTEM FONTS (Pre-populated from brand assets)
// ============================================

interface StaticFont {
  id: string;
  name: string;
  family: string;
  usage: 'display' | 'body' | 'accent';
  weight: FontWeight;
  format: FontFormat;
  path: string;
}

const STATIC_SYSTEM_FONTS: StaticFont[] = [
  // Neue Haas Grotesk Display - Display fonts
  {
    id: 'neue-haas-roman',
    name: 'Neue Haas Display Roman',
    family: 'Neue Haas Grotesk Display Pro',
    usage: 'display',
    weight: '400',
    format: 'woff2',
    path: '/fonts/NeueHaasDisplayRoman.woff2',
  },
  {
    id: 'neue-haas-medium',
    name: 'Neue Haas Display Medium',
    family: 'Neue Haas Grotesk Display Pro',
    usage: 'display',
    weight: '500',
    format: 'woff2',
    path: '/fonts/NeueHaasDisplayMedium.woff2',
  },
  {
    id: 'neue-haas-bold',
    name: 'Neue Haas Display Bold',
    family: 'Neue Haas Grotesk Display Pro',
    usage: 'display',
    weight: '700',
    format: 'woff2',
    path: '/fonts/NeueHaasDisplayBold.woff2',
  },
  // OffBit - Accent fonts
  {
    id: 'offbit-regular',
    name: 'OffBit Regular',
    family: 'OffBit',
    usage: 'accent',
    weight: '400',
    format: 'woff2',
    path: '/fonts/OffBit-Regular.woff2',
  },
  {
    id: 'offbit-bold',
    name: 'OffBit Bold',
    family: 'OffBit',
    usage: 'accent',
    weight: '700',
    format: 'woff2',
    path: '/fonts/OffBit-Bold.woff2',
  },
];

interface TypographySettingsTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// WEIGHT SELECT DROPDOWN
// ============================================

interface WeightSelectProps {
  value: FontWeight;
  onChange: (value: FontWeight) => void;
  disabled?: boolean;
}

const WEIGHT_OPTIONS: { value: FontWeight; label: string }[] = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

function WeightSelect({ value, onChange, disabled }: WeightSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentWeight = WEIGHT_OPTIONS.find(w => w.value === value) || WEIGHT_OPTIONS[3];

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const dropdownHeight = 280;
      
      if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-colors min-w-[90px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <span className="text-[var(--fg-primary)] truncate">{currentWeight.value}</span>
        <ChevronDown className={`w-3 h-3 text-[var(--fg-tertiary)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            className={`absolute left-0 z-[100] py-1 min-w-[140px] max-h-[260px] overflow-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl ${
              dropdownPosition === 'bottom' 
                ? 'top-full mt-1' 
                : 'bottom-full mb-1'
            }`}
          >
            {WEIGHT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  value === option.value ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-primary)]'
                }`}
              >
                <span className="w-7 font-mono text-[10px] text-[var(--fg-tertiary)]">{option.value}</span>
                <span>{option.label}</span>
                {value === option.value && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// USAGE SELECT DROPDOWN
// ============================================

interface UsageSelectProps {
  value: 'display' | 'body' | 'accent';
  onChange: (value: 'display' | 'body' | 'accent') => void;
  disabled?: boolean;
}

const USAGE_OPTIONS: { value: 'display' | 'body' | 'accent'; label: string; description: string }[] = [
  { value: 'display', label: 'Display', description: 'Headlines & titles' },
  { value: 'body', label: 'Body', description: 'Paragraphs & UI' },
  { value: 'accent', label: 'Accent', description: 'Decorative text' },
];

function UsageSelect({ value, onChange, disabled }: UsageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentUsage = USAGE_OPTIONS.find(u => u.value === value) || USAGE_OPTIONS[1];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const dropdownHeight = 140;
      
      if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUsageColor = (usage: string) => {
    switch (usage) {
      case 'display':
        return 'bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]';
      case 'body':
        return 'bg-blue-500/10 text-blue-500';
      case 'accent':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-colors min-w-[80px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getUsageColor(value)}`}>
          {currentUsage.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-[var(--fg-tertiary)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            className={`absolute left-0 z-[100] py-1 min-w-[160px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl ${
              dropdownPosition === 'bottom' 
                ? 'top-full mt-1' 
                : 'bottom-full mb-1'
            }`}
          >
            {USAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  value === option.value ? 'bg-[var(--bg-secondary)]/50' : ''
                }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getUsageColor(option.value)}`}>
                  {option.label}
                </span>
                <span className="text-[10px] text-[var(--fg-muted)]">{option.description}</span>
                {value === option.value && <Check className="w-3 h-3 ml-auto text-[var(--fg-brand-primary)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// STATIC FONT ROW (Pre-populated system fonts)
// ============================================

interface StaticFontRowProps {
  font: StaticFont;
  onDownload: (path: string, name: string) => void;
}

function StaticFontRow({ font, onDownload }: StaticFontRowProps) {
  const getWeightLabel = (weight: FontWeight): string => {
    const option = WEIGHT_OPTIONS.find(w => w.value === weight);
    return option?.label || weight;
  };

  const getUsageColor = (usage: string) => {
    switch (usage) {
      case 'display':
        return 'bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]';
      case 'body':
        return 'bg-blue-500/10 text-blue-500';
      case 'accent':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]';
    }
  };

  return (
    <tr className="group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors">
      {/* Preview */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div 
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden"
          style={{ fontWeight: parseInt(font.weight) }}
        >
          <span className="text-base sm:text-lg text-[var(--fg-primary)]">Aa</span>
        </div>
      </td>

      {/* Name */}
      <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
        <span className="text-xs sm:text-sm font-medium text-[var(--fg-primary)] truncate block">
          {font.name}
        </span>
      </td>

      {/* Family - hidden on mobile */}
      <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] hidden sm:table-cell">
        <span className="text-[10px] sm:text-xs text-[var(--fg-secondary)] truncate block" title={font.family}>
          {font.family}
        </span>
      </td>

      {/* Weight - hidden on mobile */}
      <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px] hidden sm:table-cell">
        <span className="text-[10px] sm:text-xs text-[var(--fg-tertiary)]">
          {font.weight} · {getWeightLabel(font.weight)}
        </span>
      </td>

      {/* Usage */}
      <td className="py-2 px-2 sm:px-3 w-[70px] sm:w-[90px]">
        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded capitalize ${getUsageColor(font.usage)}`}>
          {font.usage}
        </span>
      </td>

      {/* Format - hidden on mobile and tablet */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          {font.format}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="flex items-center justify-end">
          <button
            onClick={() => onDownload(font.path, `${font.id}.${font.format}`)}
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
// DYNAMIC FONT ROW (User-added fonts)
// ============================================

interface EditingFont {
  name: string;
  fontFamily: string;
  fontWeight: FontWeight;
  usage: 'display' | 'body' | 'accent';
}

interface FontRowProps {
  font: BrandFont;
  isEditing: boolean;
  editValues: EditingFont | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateField: <K extends keyof EditingFont>(field: K, value: EditingFont[K]) => void;
  onSave: () => void;
  onDelete: () => void;
  onDownload: (font: BrandFont) => void;
  isSaving: boolean;
}

function FontRow({
  font,
  isEditing,
  editValues,
  onStartEdit,
  onCancelEdit,
  onUpdateField,
  onSave,
  onDelete,
  onDownload,
  isSaving,
}: FontRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHoveringConfirm, setIsHoveringConfirm] = useState(false);

  // Editing is disabled until authentication is set up
  const EDITING_DISABLED = true;

  const meta = font.metadata as BrandFontMetadata;
  const fontWeight = meta.fontWeight || '400';
  const fontFamily = meta.fontFamily || font.name;
  const usage = (meta.usage as 'display' | 'body' | 'accent') || 'body';
  const format = meta.fontFormat || 'woff2';

  const getWeightLabel = (weight: FontWeight): string => {
    const option = WEIGHT_OPTIONS.find(w => w.value === weight);
    return option?.label || weight;
  };

  const getUsageColor = (usageType: string) => {
    switch (usageType) {
      case 'display':
        return 'bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]';
      case 'body':
        return 'bg-blue-500/10 text-blue-500';
      case 'accent':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]';
    }
  };

  return (
    <>
      <tr className={`group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors ${
        isEditing ? 'bg-[var(--bg-secondary)]/40' : ''
      }`}>
        {/* Preview */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden"
            style={{ fontWeight: parseInt(isEditing && editValues ? editValues.fontWeight : fontWeight) }}
          >
            <span className="text-base sm:text-lg text-[var(--fg-primary)]">Aa</span>
          </div>
        </td>

        {/* Name */}
        <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              disabled={EDITING_DISABLED}
              className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-xs sm:text-sm font-medium text-[var(--fg-primary)] truncate block">
              {font.name}
            </span>
          )}
        </td>

        {/* Family - hidden on mobile */}
        <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] hidden sm:table-cell">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.fontFamily}
              onChange={(e) => onUpdateField('fontFamily', e.target.value)}
              disabled={EDITING_DISABLED}
              className="w-full px-2 py-1 text-xs rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-[10px] sm:text-xs text-[var(--fg-secondary)] truncate block" title={fontFamily}>
              {fontFamily}
            </span>
          )}
        </td>

        {/* Weight - hidden on mobile */}
        <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px] hidden sm:table-cell">
          {isEditing && editValues ? (
            <WeightSelect
              value={editValues.fontWeight}
              onChange={(value) => onUpdateField('fontWeight', value)}
              disabled={EDITING_DISABLED}
            />
          ) : (
            <span className="text-[10px] sm:text-xs text-[var(--fg-tertiary)]">
              {fontWeight} · {getWeightLabel(fontWeight)}
            </span>
          )}
        </td>

        {/* Usage */}
        <td className="py-2 px-2 sm:px-3 w-[70px] sm:w-[90px]">
          {isEditing && editValues ? (
            <UsageSelect
              value={editValues.usage}
              onChange={(value) => onUpdateField('usage', value)}
              disabled={EDITING_DISABLED}
            />
          ) : (
            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded capitalize ${getUsageColor(usage)}`}>
              {usage}
            </span>
          )}
        </td>

        {/* Format - hidden on mobile and tablet */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
          <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
            {format}
          </span>
        </td>

        {/* Actions */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={onSave}
                  disabled={isSaving || EDITING_DISABLED}
                  onMouseEnter={() => setIsHoveringConfirm(true)}
                  onMouseLeave={() => setIsHoveringConfirm(false)}
                  className={`p-1 sm:p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isHoveringConfirm 
                      ? 'bg-[var(--bg-brand-solid)] border-[var(--bg-brand-solid)] text-white' 
                      : 'border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] bg-transparent'
                  }`}
                  title="Save"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                </button>
                <button
                  onClick={onCancelEdit}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                  title="Cancel"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onDownload(font)}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  title="Download"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={onStartEdit}
                  disabled={EDITING_DISABLED}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed sm:group-hover:disabled:opacity-30"
                  title={EDITING_DISABLED ? "Editing disabled" : "Edit"}
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={EDITING_DISABLED}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--fg-tertiary)] hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed sm:group-hover:disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--fg-tertiary)]"
                  title={EDITING_DISABLED ? "Deleting disabled" : "Delete"}
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Delete Font"
        message={`Are you sure you want to delete "${font.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

// ============================================
// ADD FONT ROW
// ============================================

interface AddFontRowProps {
  onAdd: (data: {
    file: File;
    name: string;
    fontFamily: string;
    fontWeight: FontWeight;
    usage: 'display' | 'body' | 'accent';
    format: FontFormat;
  }) => void;
  onCancel: () => void;
  isAdding: boolean;
}

function AddFontRow({ onAdd, onCancel, isAdding }: AddFontRowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [fontWeight, setFontWeight] = useState<FontWeight>('400');
  const [usage, setUsage] = useState<'display' | 'body' | 'accent'>('body');
  const [format, setFormat] = useState<FontFormat>('woff2');
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringConfirm, setIsHoveringConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Auto-detect format from file extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext && ['woff2', 'woff', 'ttf', 'otf', 'eot'].includes(ext)) {
      setFormat(ext as FontFormat);
    }
    
    // Auto-populate name and family from filename
    if (!name) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameWithoutExt.replace(/[-_]/g, ' ');
      setName(cleanName);
      
      // Try to extract family name (remove weight suffixes)
      const familyName = cleanName
        .replace(/\s*(Bold|Medium|Light|Regular|Thin|Black|Heavy|Semi\s*Bold|Extra\s*Bold|Extra\s*Light)\s*$/i, '')
        .trim();
      setFontFamily(familyName || cleanName);
      
      // Try to detect weight from filename
      const weightMatch = nameWithoutExt.match(/(thin|extralight|light|regular|medium|semibold|bold|extrabold|black|heavy)/i);
      if (weightMatch) {
        const weightMap: Record<string, FontWeight> = {
          thin: '100',
          extralight: '200',
          light: '300',
          regular: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
          extrabold: '800',
          black: '900',
          heavy: '900',
        };
        const detectedWeight = weightMap[weightMatch[1].toLowerCase().replace(/\s/g, '')];
        if (detectedWeight) {
          setFontWeight(detectedWeight);
        }
      }
    }
  };

  const handleSubmit = () => {
    if (!file || !name.trim() || !fontFamily.trim()) return;
    onAdd({
      file,
      name: name.trim(),
      fontFamily: fontFamily.trim(),
      fontWeight,
      usage,
      format,
    });
  };

  const isValid = file && name.trim() && fontFamily.trim();

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
            <Type className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fg-brand-primary)]" />
          ) : (
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--fg-tertiary)]" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".woff2,.woff,.ttf,.otf,.eot"
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
          placeholder="Font name"
          autoFocus
          className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Family - hidden on mobile */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[100px] sm:w-[140px] hidden sm:table-cell">
        <input
          type="text"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          placeholder="Font family"
          className="w-full px-2 py-1 text-xs rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Weight - hidden on mobile */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[80px] sm:w-[100px] hidden sm:table-cell">
        <WeightSelect
          value={fontWeight}
          onChange={setFontWeight}
        />
      </td>

      {/* Usage */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[70px] sm:w-[90px]">
        <UsageSelect
          value={usage}
          onChange={setUsage}
        />
      </td>

      {/* Format - hidden on mobile and tablet */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          {file ? format : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <button
            onClick={handleSubmit}
            disabled={isAdding || !isValid}
            onMouseEnter={() => setIsHoveringConfirm(true)}
            onMouseLeave={() => setIsHoveringConfirm(false)}
            className={`p-1 sm:p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isHoveringConfirm && isValid
                ? 'bg-[var(--bg-brand-solid)] border-[var(--bg-brand-solid)] text-white' 
                : 'border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] bg-transparent'
            }`}
            title="Add font"
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

export function TypographySettingsTableModal({ isOpen, onClose }: TypographySettingsTableModalProps) {
  const {
    fonts,
    isLoading,
    uploadFontFile,
    editFont,
    removeFont,
  } = useBrandFonts();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditingFont | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = useCallback((font: BrandFont) => {
    const meta = font.metadata as BrandFontMetadata;
    setEditingId(font.id);
    setEditValues({
      name: font.name,
      fontFamily: meta.fontFamily || font.name,
      fontWeight: meta.fontWeight || '400',
      usage: (meta.usage as 'display' | 'body' | 'accent') || 'body',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues(null);
  }, []);

  const handleUpdateField = useCallback(<K extends keyof EditingFont>(
    field: K,
    value: EditingFont[K]
  ) => {
    setEditValues(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editValues) return;

    setIsSaving(true);
    setError(null);
    try {
      await editFont(editingId, {
        name: editValues.name,
        metadata: {
          fontFamily: editValues.fontFamily,
          fontWeight: editValues.fontWeight,
          usage: editValues.usage,
        },
      });
      setEditingId(null);
      setEditValues(null);
    } catch (err) {
      console.error('Error saving font:', err);
      setError(err instanceof Error ? err.message : 'Failed to save font');
    } finally {
      setIsSaving(false);
    }
  }, [editingId, editValues, editFont]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await removeFont(id);
    } catch (err) {
      console.error('Error deleting font:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete font');
    } finally {
      setIsSaving(false);
    }
  }, [removeFont]);

  const handleAddFont = useCallback(async (data: {
    file: File;
    name: string;
    fontFamily: string;
    fontWeight: FontWeight;
    usage: 'display' | 'body' | 'accent';
    format: FontFormat;
  }) => {
    setIsSaving(true);
    setError(null);
    try {
      const metadata: BrandFontMetadata = {
        fontFamily: data.fontFamily,
        fontWeight: data.fontWeight,
        fontFormat: data.format,
        usage: data.usage,
      };

      await uploadFontFile(data.file, data.name, metadata);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding font:', err);
      setError(err instanceof Error ? err.message : 'Failed to add font');
    } finally {
      setIsSaving(false);
    }
  }, [uploadFontFile]);

  const handleDownloadFont = useCallback((font: BrandFont) => {
    if (font.publicUrl) {
      const link = document.createElement('a');
      link.href = font.publicUrl;
      link.download = font.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const handleDownloadStaticFont = useCallback((path: string, filename: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Sort fonts by usage (display, body, accent), then by name
  const sortedFonts = [...fonts].sort((a, b) => {
    const metaA = a.metadata as BrandFontMetadata;
    const metaB = b.metadata as BrandFontMetadata;
    const usageOrder = ['display', 'body', 'accent'];
    const usageA = usageOrder.indexOf(metaA.usage || 'body');
    const usageB = usageOrder.indexOf(metaB.usage || 'body');
    
    if (usageA !== usageB) {
      return usageA - usageB;
    }
    return a.name.localeCompare(b.name);
  });

  // Total count includes both static and dynamic fonts
  const totalFontCount = STATIC_SYSTEM_FONTS.length + fonts.length;

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
                    Manage Typography
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--fg-tertiary)]">
                    {totalFontCount} font{totalFontCount !== 1 ? 's' : ''} in your typography system
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Add Font Button */}
                  <motion.button
                    onClick={() => setIsAddingNew(true)}
                    disabled={isAddingNew}
                    className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add new font"
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
                <div className="mx-4 sm:mx-5 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Table Content - Scrollable area */}
              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
                    <span className="text-[var(--fg-tertiary)]">Loading fonts...</span>
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
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px] sm:w-[140px] hidden sm:table-cell">
                            Family
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px] sm:w-[100px] hidden sm:table-cell">
                            Weight
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[70px] sm:w-[90px]">
                            Usage
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px] hidden md:table-cell">
                            Format
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-right text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px]">
                            
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Add new font row (when active) */}
                        {isAddingNew && (
                          <AddFontRow
                            onAdd={handleAddFont}
                            onCancel={() => setIsAddingNew(false)}
                            isAdding={isSaving}
                          />
                        )}
                        
                        {/* Static system fonts (pre-populated) */}
                        {STATIC_SYSTEM_FONTS.map((font) => (
                          <StaticFontRow
                            key={`static-${font.id}`}
                            font={font}
                            onDownload={handleDownloadStaticFont}
                          />
                        ))}
                        
                        {/* Dynamic user-added fonts from Supabase */}
                        {sortedFonts.map((font) => (
                          <FontRow
                            key={font.id}
                            font={font}
                            isEditing={editingId === font.id}
                            editValues={editingId === font.id ? editValues : null}
                            onStartEdit={() => handleStartEdit(font)}
                            onCancelEdit={handleCancelEdit}
                            onUpdateField={handleUpdateField}
                            onSave={handleSaveEdit}
                            onDelete={() => handleDelete(font.id)}
                            onDownload={handleDownloadFont}
                            isSaving={isSaving}
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
                  <span className="hidden sm:inline">Upload fonts using the + button. Supported formats: WOFF2, WOFF, TTF, OTF, EOT.</span>
                  <span className="sm:hidden">Use + to add new fonts.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

