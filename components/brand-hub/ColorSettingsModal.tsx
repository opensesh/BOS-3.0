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
  Copy,
  Palette,
  AlertCircle,
} from 'lucide-react';
import { useBrandColors } from '@/hooks/useBrandColors';
import type { BrandColor, BrandColorGroup, BrandColorRole, BrandTextColor } from '@/lib/supabase/types';
import { ConfirmDialog } from './BrandHubSettingsModal';

interface ColorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// INLINE EDIT CELL COMPONENTS
// ============================================

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: 'text' | 'color';
  className?: string;
  placeholder?: string;
}

function EditableCell({ value, onChange, onBlur, type = 'text', className = '', placeholder }: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (type === 'color') {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-8 h-8 rounded cursor-pointer border border-[var(--border-primary)]"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`w-20 px-2 py-1 text-sm font-mono rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none ${className}`}
        />
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full px-2 py-1 text-sm rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none ${className}`}
    />
  );
}

// ============================================
// SELECT DROPDOWN FOR TEXT COLOR
// ============================================

interface TextColorSelectProps {
  value: BrandTextColor;
  onChange: (value: BrandTextColor) => void;
}

function TextColorSelect({ value, onChange }: TextColorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span 
          className={`w-3 h-3 rounded-full ${value === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-900'}`} 
        />
        <span className="text-[var(--fg-primary)] capitalize">{value}</span>
        <ChevronDown className="w-3 h-3 text-[var(--fg-tertiary)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-20 py-1 min-w-[100px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          >
            {(['light', 'dark'] as BrandTextColor[]).map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors ${
                  value === option ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-primary)]'
                }`}
              >
                <span 
                  className={`w-3 h-3 rounded-full ${option === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-900'}`} 
                />
                <span className="capitalize">{option}</span>
                {value === option && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COLOR GROUP SELECT
// ============================================

interface ColorGroupSelectProps {
  value: BrandColorGroup;
  onChange: (value: BrandColorGroup) => void;
}

function ColorGroupSelect({ value, onChange }: ColorGroupSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groups: { value: BrandColorGroup; label: string }[] = [
    { value: 'brand', label: 'Brand' },
    { value: 'mono-scale', label: 'Mono Scale' },
    { value: 'brand-scale', label: 'Brand Scale' },
    { value: 'custom', label: 'Custom' },
  ];

  const currentGroup = groups.find(g => g.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span className="text-[var(--fg-primary)]">{currentGroup?.label}</span>
        <ChevronDown className="w-3 h-3 text-[var(--fg-tertiary)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-20 py-1 min-w-[140px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          >
            {groups.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors ${
                  value === option.value ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-primary)]'
                }`}
              >
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
// TABLE ROW COMPONENT
// ============================================

interface ColorRowProps {
  color: BrandColor;
  isEditing: boolean;
  editValues: EditingColor | null;
  onStartEdit: () => void;
  onUpdateField: <K extends keyof EditingColor>(field: K, value: EditingColor[K]) => void;
  onSave: () => void;
  onDelete: () => void;
  onCopyHex: (hex: string) => void;
  isSaving: boolean;
}

interface EditingColor {
  name: string;
  hexValue: string;
  cssVariableName: string;
  textColor: BrandTextColor;
  colorGroup: BrandColorGroup;
}

function ColorRow({
  color,
  isEditing,
  editValues,
  onStartEdit,
  onUpdateField,
  onSave,
  onDelete,
  onCopyHex,
  isSaving,
}: ColorRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyHex(color.hexValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`group border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors ${
          isEditing ? 'bg-[var(--bg-secondary)]/30' : ''
        }`}
      >
        {/* Color Swatch */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            {isEditing && editValues ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editValues.hexValue}
                  onChange={(e) => onUpdateField('hexValue', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-[var(--border-primary)]"
                />
              </div>
            ) : (
              <button
                onClick={onStartEdit}
                className="w-10 h-10 rounded-lg border-2 border-[var(--border-primary)] shadow-sm hover:scale-105 transition-transform"
                style={{ backgroundColor: color.hexValue }}
                title="Click to edit"
              />
            )}
          </div>
        </td>

        {/* Name */}
        <td className="py-3 px-4">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className="w-full px-2 py-1 text-sm font-medium rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none"
            />
          ) : (
            <button
              onClick={onStartEdit}
              className="text-sm font-medium text-[var(--fg-primary)] hover:text-[var(--fg-brand-primary)] transition-colors text-left"
            >
              {color.name}
            </button>
          )}
        </td>

        {/* Hex Value */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {isEditing && editValues ? (
              <input
                type="text"
                value={editValues.hexValue.toUpperCase()}
                onChange={(e) => onUpdateField('hexValue', e.target.value)}
                className="w-24 px-2 py-1 text-sm font-mono rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none"
              />
            ) : (
              <>
                <span className="text-sm font-mono text-[var(--fg-secondary)]">
                  {color.hexValue.toUpperCase()}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 transition-all"
                  title="Copy hex value"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
                  )}
                </button>
              </>
            )}
          </div>
        </td>

        {/* CSS Variable */}
        <td className="py-3 px-4">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.cssVariableName}
              onChange={(e) => onUpdateField('cssVariableName', e.target.value)}
              placeholder="--color-name"
              className="w-full px-2 py-1 text-sm font-mono rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-tertiary)] focus:border-[var(--border-brand)] focus:outline-none"
            />
          ) : (
            <span className="text-sm font-mono text-[var(--fg-tertiary)]">
              {color.cssVariableName || '—'}
            </span>
          )}
        </td>

        {/* Text Color */}
        <td className="py-3 px-4">
          {isEditing && editValues ? (
            <TextColorSelect
              value={editValues.textColor}
              onChange={(value) => onUpdateField('textColor', value)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span 
                className={`w-4 h-4 rounded-full ${color.textColor === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-900'}`} 
              />
              <span className="text-sm text-[var(--fg-secondary)] capitalize">
                {color.textColor}
              </span>
            </div>
          )}
        </td>

        {/* Group */}
        <td className="py-3 px-4">
          {isEditing && editValues ? (
            <ColorGroupSelect
              value={editValues.colorGroup}
              onChange={(value) => onUpdateField('colorGroup', value)}
            />
          ) : (
            <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--bg-secondary)] text-[var(--fg-secondary)]">
              {color.colorGroup === 'mono-scale' ? 'Mono Scale' : 
               color.colorGroup === 'brand-scale' ? 'Brand Scale' : 
               color.colorGroup.charAt(0).toUpperCase() + color.colorGroup.slice(1)}
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3 px-4">
          <div className="flex items-center justify-end gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
                <button
                  onClick={onStartEdit}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--fg-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete color"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </motion.tr>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Delete Color"
        message={`Are you sure you want to delete "${color.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

// ============================================
// ADD NEW COLOR ROW
// ============================================

interface AddColorRowProps {
  onAdd: (color: { 
    name: string; 
    hexValue: string; 
    cssVariableName: string; 
    textColor: BrandTextColor;
    colorGroup: BrandColorGroup;
  }) => void;
  onCancel: () => void;
  isAdding: boolean;
}

function AddColorRow({ onAdd, onCancel, isAdding }: AddColorRowProps) {
  const [values, setValues] = useState({
    name: '',
    hexValue: '#000000',
    cssVariableName: '',
    textColor: 'light' as BrandTextColor,
    colorGroup: 'brand' as BrandColorGroup,
  });

  const handleSubmit = () => {
    if (!values.name.trim()) return;
    onAdd(values);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border-b border-[var(--border-brand)] bg-[var(--bg-brand-primary)]/5"
    >
      {/* Color Swatch */}
      <td className="py-3 px-4">
        <input
          type="color"
          value={values.hexValue}
          onChange={(e) => setValues(v => ({ ...v, hexValue: e.target.value }))}
          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-[var(--border-brand)]"
        />
      </td>

      {/* Name */}
      <td className="py-3 px-4">
        <input
          type="text"
          value={values.name}
          onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))}
          placeholder="Color name"
          autoFocus
          className="w-full px-2 py-1 text-sm font-medium rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Hex Value */}
      <td className="py-3 px-4">
        <input
          type="text"
          value={values.hexValue.toUpperCase()}
          onChange={(e) => setValues(v => ({ ...v, hexValue: e.target.value }))}
          className="w-24 px-2 py-1 text-sm font-mono rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* CSS Variable */}
      <td className="py-3 px-4">
        <input
          type="text"
          value={values.cssVariableName}
          onChange={(e) => setValues(v => ({ ...v, cssVariableName: e.target.value }))}
          placeholder="--color-name"
          className="w-full px-2 py-1 text-sm font-mono rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-tertiary)] focus:outline-none"
        />
      </td>

      {/* Text Color */}
      <td className="py-3 px-4">
        <TextColorSelect
          value={values.textColor}
          onChange={(value) => setValues(v => ({ ...v, textColor: value }))}
        />
      </td>

      {/* Group */}
      <td className="py-3 px-4">
        <ColorGroupSelect
          value={values.colorGroup}
          onChange={(value) => setValues(v => ({ ...v, colorGroup: value }))}
        />
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleSubmit}
            disabled={isAdding || !values.name.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] transition-colors disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Add
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================

export function ColorSettingsModal({ isOpen, onClose }: ColorSettingsModalProps) {
  const {
    colors,
    isLoading,
    addColor,
    editColor,
    removeColor,
  } = useBrandColors();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditingColor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleStartEdit = useCallback((color: BrandColor) => {
    if (editingId === color.id) {
      // Cancel editing
      setEditingId(null);
      setEditValues(null);
    } else {
      setEditingId(color.id);
      setEditValues({
        name: color.name,
        hexValue: color.hexValue,
        cssVariableName: color.cssVariableName || '',
        textColor: color.textColor,
        colorGroup: color.colorGroup,
      });
    }
  }, [editingId]);

  const handleUpdateField = useCallback(<K extends keyof EditingColor>(
    field: K,
    value: EditingColor[K]
  ) => {
    setEditValues(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editValues) return;

    setIsSaving(true);
    try {
      await editColor(editingId, {
        name: editValues.name,
        hex_value: editValues.hexValue,
        css_variable_name: editValues.cssVariableName || undefined,
        text_color: editValues.textColor,
        color_group: editValues.colorGroup,
      });
      setEditingId(null);
      setEditValues(null);
    } catch (error) {
      console.error('Error saving color:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editingId, editValues, editColor]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeColor(id);
    } catch (error) {
      console.error('Error deleting color:', error);
    }
  }, [removeColor]);

  const handleAddColor = useCallback(async (values: {
    name: string;
    hexValue: string;
    cssVariableName: string;
    textColor: BrandTextColor;
    colorGroup: BrandColorGroup;
  }) => {
    setIsSaving(true);
    try {
      await addColor({
        name: values.name,
        hex_value: values.hexValue,
        css_variable_name: values.cssVariableName || undefined,
        text_color: values.textColor,
        color_group: values.colorGroup,
      });
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error adding color:', error);
    } finally {
      setIsSaving(false);
    }
  }, [addColor]);

  const handleCopyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  }, []);

  // Sort colors by group, then sort order
  const sortedColors = [...colors].sort((a, b) => {
    const groupOrder = ['brand', 'mono-scale', 'brand-scale', 'custom'];
    const aGroup = groupOrder.indexOf(a.colorGroup);
    const bGroup = groupOrder.indexOf(b.colorGroup);
    if (aGroup !== bGroup) return aGroup - bGroup;
    return a.sortOrder - b.sortOrder;
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
            className="fixed inset-x-4 top-[5%] mx-auto max-w-5xl max-h-[90vh] overflow-hidden z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-brand-primary)]/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-[var(--fg-primary)]">
                    Manage Colors
                  </h2>
                  <p className="text-sm text-[var(--fg-tertiary)]">
                    {colors.length} color{colors.length !== 1 ? 's' : ''} in your brand palette
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddingNew(true)}
                  disabled={isAddingNew}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Color
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-auto max-h-[calc(90vh-8rem)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
                  <span className="text-[var(--fg-tertiary)]">Loading colors...</span>
                </div>
              ) : colors.length === 0 && !isAddingNew ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                    <Palette className="w-8 h-8 text-[var(--fg-tertiary)]" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--fg-primary)]">No colors yet</h3>
                  <p className="mt-1 text-sm text-[var(--fg-tertiary)] max-w-sm">
                    Add your brand colors to create a cohesive design system.
                  </p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Color
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[72px]">
                        Color
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[120px]">
                        Hex
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
                        Variable
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[120px]">
                        Text
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[140px]">
                        Group
                      </th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[140px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {isAddingNew && (
                        <AddColorRow
                          onAdd={handleAddColor}
                          onCancel={() => setIsAddingNew(false)}
                          isAdding={isSaving}
                        />
                      )}
                      {sortedColors.map((color) => (
                        <ColorRow
                          key={color.id}
                          color={color}
                          isEditing={editingId === color.id}
                          editValues={editingId === color.id ? editValues : null}
                          onStartEdit={() => handleStartEdit(color)}
                          onUpdateField={handleUpdateField}
                          onSave={handleSaveEdit}
                          onDelete={() => handleDelete(color.id)}
                          onCopyHex={handleCopyHex}
                          isSaving={isSaving}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
