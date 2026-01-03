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
  Pencil,
  Palette,
} from 'lucide-react';
import { useBrandColors } from '@/hooks/useBrandColors';
import type { BrandColor, BrandColorGroup, BrandColorRole, BrandTextColor } from '@/lib/supabase/types';
import { ConfirmDialog } from './BrandHubSettingsModal';

interface ColorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span 
          className={`w-2.5 h-2.5 rounded-full ${value === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-900'}`} 
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
            className="absolute top-full mt-1 left-0 z-20 py-1 min-w-[90px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          >
            {(['light', 'dark'] as BrandTextColor[]).map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors ${
                  value === option ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-primary)]'
                }`}
              >
                <span 
                  className={`w-2.5 h-2.5 rounded-full ${option === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-900'}`} 
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
  disabled?: boolean;
}

function ColorGroupSelect({ value, onChange, disabled }: ColorGroupSelectProps) {
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <span className="text-[var(--fg-primary)]">{currentGroup?.label}</span>
        <ChevronDown className="w-3 h-3 text-[var(--fg-tertiary)]" />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-20 py-1 min-w-[120px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          >
            {groups.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors ${
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
// COLOR ROLE SELECT (Primary/Secondary/Accent)
// ============================================

interface ColorRoleSelectProps {
  value: BrandColorRole | undefined;
  onChange: (value: BrandColorRole | undefined) => void;
  disabled?: boolean;
}

function ColorRoleSelect({ value, onChange, disabled }: ColorRoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roles: { value: BrandColorRole | undefined; label: string }[] = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'accent', label: 'Accent' },
    { value: 'neutral', label: 'Neutral' },
    { value: undefined, label: 'None' },
  ];

  const currentRole = roles.find(r => r.value === value) || roles[roles.length - 1];

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <span className="text-[var(--fg-primary)]">{currentRole.label}</span>
        <ChevronDown className="w-3 h-3 text-[var(--fg-tertiary)]" />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-20 py-1 min-w-[100px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          >
            {roles.map((option, idx) => (
              <button
                key={option.value ?? 'none'}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors ${
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
  onCancelEdit: () => void;
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
  colorRole: BrandColorRole | undefined;
}

function ColorRow({
  color,
  isEditing,
  editValues,
  onStartEdit,
  onCancelEdit,
  onUpdateField,
  onSave,
  onDelete,
  onCopyHex,
  isSaving,
}: ColorRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHoveringConfirm, setIsHoveringConfirm] = useState(false);

  // Editing is disabled until authentication is set up
  const EDITING_DISABLED = true;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyHex(color.hexValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const groupLabels: Record<BrandColorGroup, string> = {
    'brand': 'Brand',
    'mono-scale': 'Mono',
    'brand-scale': 'Scale',
    'custom': 'Custom',
  };

  const roleLabels: Record<string, string> = {
    'primary': 'Primary',
    'secondary': 'Secondary',
    'accent': 'Accent',
    'neutral': 'Neutral',
  };

  return (
    <>
      {/* Subtle row divider using border-secondary */}
      <tr className={`group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors ${
        isEditing ? 'bg-[var(--bg-secondary)]/40' : ''
      }`}>
        {/* Color Swatch - with proper radius when editing */}
        <td className="py-2 px-3 w-[52px]">
          {isEditing && editValues ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-primary)]">
              <input
                type="color"
                value={editValues.hexValue}
                onChange={(e) => onUpdateField('hexValue', e.target.value)}
                disabled={EDITING_DISABLED}
                className="w-10 h-10 -m-1 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg border border-[var(--border-primary)]/50 shadow-sm"
              style={{ backgroundColor: color.hexValue }}
            />
          )}
        </td>

        {/* Name */}
        <td className="py-2 px-3">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              disabled={EDITING_DISABLED}
              className="w-full px-2 py-1 text-sm rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-sm font-medium text-[var(--fg-primary)]">
              {color.name}
            </span>
          )}
        </td>

        {/* Hex Value */}
        <td className="py-2 px-3 w-[100px]">
          <div className="flex items-center gap-1">
            {isEditing && editValues ? (
              <input
                type="text"
                value={editValues.hexValue.toUpperCase()}
                onChange={(e) => onUpdateField('hexValue', e.target.value)}
                disabled={EDITING_DISABLED}
                className="w-20 px-2 py-1 text-xs font-mono rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ) : (
              <>
                <span className="text-xs font-mono text-[var(--fg-secondary)]">
                  {color.hexValue.toUpperCase()}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 transition-all"
                  title="Copy hex"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-[var(--fg-tertiary)]" />
                  )}
                </button>
              </>
            )}
          </div>
        </td>

        {/* Role (for brand colors) */}
        <td className="py-2 px-3 w-[90px]">
          {isEditing && editValues ? (
            <ColorRoleSelect
              value={editValues.colorRole}
              onChange={(value) => onUpdateField('colorRole', value)}
              disabled={EDITING_DISABLED}
            />
          ) : (
            color.colorRole ? (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]">
                {roleLabels[color.colorRole]}
              </span>
            ) : (
              <span className="text-xs text-[var(--fg-quaternary)]">—</span>
            )
          )}
        </td>

        {/* CSS Variable */}
        <td className="py-2 px-3">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.cssVariableName}
              onChange={(e) => onUpdateField('cssVariableName', e.target.value)}
              disabled={EDITING_DISABLED}
              placeholder="--color-name"
              className="w-full px-2 py-1 text-xs font-mono rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-tertiary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-xs font-mono text-[var(--fg-tertiary)]">
              {color.cssVariableName || '—'}
            </span>
          )}
        </td>

        {/* Text Color */}
        <td className="py-2 px-3 w-[80px]">
          {isEditing && editValues ? (
            <TextColorSelect
              value={editValues.textColor}
              onChange={(value) => onUpdateField('textColor', value)}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span 
                className={`w-3 h-3 rounded-full ${color.textColor === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-900'}`} 
              />
              <span className="text-xs text-[var(--fg-secondary)] capitalize">
                {color.textColor}
              </span>
            </div>
          )}
        </td>

        {/* Group */}
        <td className="py-2 px-3 w-[80px]">
          {isEditing && editValues ? (
            <ColorGroupSelect
              value={editValues.colorGroup}
              onChange={(value) => onUpdateField('colorGroup', value)}
              disabled={EDITING_DISABLED}
            />
          ) : (
            <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">
              {groupLabels[color.colorGroup]}
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="py-2 px-3 w-[70px]">
          <div className="flex items-center justify-end gap-1">
            {isEditing ? (
              <>
                {/* Save button - outline style with fill on hover (Aperol themed) */}
                <button
                  onClick={onSave}
                  disabled={isSaving || EDITING_DISABLED}
                  onMouseEnter={() => setIsHoveringConfirm(true)}
                  onMouseLeave={() => setIsHoveringConfirm(false)}
                  className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isHoveringConfirm 
                      ? 'bg-[var(--bg-brand-solid)] border-[var(--bg-brand-solid)] text-white' 
                      : 'border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] bg-transparent'
                  }`}
                  title="Save"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={onCancelEdit}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {/* Edit button - disabled but visible */}
                <button
                  onClick={onStartEdit}
                  disabled={EDITING_DISABLED}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:disabled:opacity-30"
                  title={EDITING_DISABLED ? "Editing disabled" : "Edit"}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {/* Delete button - disabled but visible */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={EDITING_DISABLED}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--fg-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--fg-tertiary)]"
                  title={EDITING_DISABLED ? "Deleting disabled" : "Delete"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

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
    colorRole: BrandColorRole | undefined;
  }) => void;
  onCancel: () => void;
  isAdding: boolean;
}

function AddColorRow({ onAdd, onCancel, isAdding }: AddColorRowProps) {
  // Adding is disabled until authentication is set up
  const ADDING_DISABLED = true;
  const [isHoveringConfirm, setIsHoveringConfirm] = useState(false);

  const [values, setValues] = useState({
    name: '',
    hexValue: '#000000',
    cssVariableName: '',
    textColor: 'light' as BrandTextColor,
    colorGroup: 'brand' as BrandColorGroup,
    colorRole: 'primary' as BrandColorRole | undefined,
  });

  const handleSubmit = () => {
    if (!values.name.trim() || ADDING_DISABLED) return;
    onAdd(values);
  };

  return (
    <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-brand-primary)]/5">
      {/* Color Swatch */}
      <td className="py-2 px-3 w-[52px]">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-brand)]">
          <input
            type="color"
            value={values.hexValue}
            onChange={(e) => setValues(v => ({ ...v, hexValue: e.target.value }))}
            disabled={ADDING_DISABLED}
            className="w-10 h-10 -m-1 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </td>

      {/* Name */}
      <td className="py-2 px-3">
        <input
          type="text"
          value={values.name}
          onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))}
          placeholder="Color name"
          autoFocus
          disabled={ADDING_DISABLED}
          className="w-full px-2 py-1 text-sm rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </td>

      {/* Hex Value */}
      <td className="py-2 px-3 w-[100px]">
        <input
          type="text"
          value={values.hexValue.toUpperCase()}
          onChange={(e) => setValues(v => ({ ...v, hexValue: e.target.value }))}
          disabled={ADDING_DISABLED}
          className="w-20 px-2 py-1 text-xs font-mono rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </td>

      {/* Role */}
      <td className="py-2 px-3 w-[90px]">
        <ColorRoleSelect
          value={values.colorRole}
          onChange={(value) => setValues(v => ({ ...v, colorRole: value }))}
          disabled={ADDING_DISABLED}
        />
      </td>

      {/* CSS Variable */}
      <td className="py-2 px-3">
        <input
          type="text"
          value={values.cssVariableName}
          onChange={(e) => setValues(v => ({ ...v, cssVariableName: e.target.value }))}
          placeholder="--color-name"
          disabled={ADDING_DISABLED}
          className="w-full px-2 py-1 text-xs font-mono rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-tertiary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </td>

      {/* Text Color */}
      <td className="py-2 px-3 w-[80px]">
        <TextColorSelect
          value={values.textColor}
          onChange={(value) => setValues(v => ({ ...v, textColor: value }))}
        />
      </td>

      {/* Group */}
      <td className="py-2 px-3 w-[80px]">
        <ColorGroupSelect
          value={values.colorGroup}
          onChange={(value) => setValues(v => ({ ...v, colorGroup: value }))}
          disabled={ADDING_DISABLED}
        />
      </td>

      {/* Actions */}
      <td className="py-2 px-3 w-[70px]">
        <div className="flex items-center justify-end gap-1">
          {/* Save button - outline style with fill on hover */}
          <button
            onClick={handleSubmit}
            disabled={isAdding || !values.name.trim() || ADDING_DISABLED}
            onMouseEnter={() => setIsHoveringConfirm(true)}
            onMouseLeave={() => setIsHoveringConfirm(false)}
            className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isHoveringConfirm && !ADDING_DISABLED
                ? 'bg-[var(--bg-brand-solid)] border-[var(--bg-brand-solid)] text-white' 
                : 'border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] bg-transparent'
            }`}
            title={ADDING_DISABLED ? "Adding disabled" : "Add"}
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

  const handleStartEdit = useCallback((color: BrandColor) => {
    setEditingId(color.id);
    setEditValues({
      name: color.name,
      hexValue: color.hexValue,
      cssVariableName: color.cssVariableName || '',
      textColor: color.textColor,
      colorGroup: color.colorGroup,
      colorRole: color.colorRole,
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues(null);
  }, []);

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
        color_role: editValues.colorRole || null,
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
    colorRole: BrandColorRole | undefined;
  }) => {
    setIsSaving(true);
    try {
      await addColor({
        name: values.name,
        hex_value: values.hexValue,
        css_variable_name: values.cssVariableName || undefined,
        text_color: values.textColor,
        color_group: values.colorGroup,
        color_role: values.colorRole || null,
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
            className="fixed inset-x-4 top-[5%] mx-auto max-w-4xl max-h-[90vh] overflow-hidden z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl"
          >
            {/* Header - NO ICON, just title + subtitle + actions */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
              <div>
                <h2 className="text-lg font-display font-bold text-[var(--fg-primary)]">
                  Manage Colors
                </h2>
                <p className="text-sm text-[var(--fg-tertiary)]">
                  {colors.length} color{colors.length !== 1 ? 's' : ''} in your brand palette
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Add Color - Icon only, styled like page header buttons (disabled until auth) */}
                <motion.button
                  onClick={() => setIsAddingNew(true)}
                  disabled={true}
                  className="p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-secondary)] disabled:hover:border-[var(--border-primary)]"
                  title="Adding colors is disabled"
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

            {/* Table Content */}
            <div className="overflow-auto max-h-[calc(90vh-5rem)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
                  <span className="text-[var(--fg-tertiary)]">Loading colors...</span>
                </div>
              ) : colors.length === 0 && !isAddingNew ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                    <Palette className="w-7 h-7 text-[var(--fg-tertiary)]" />
                  </div>
                  <h3 className="text-base font-medium text-[var(--fg-primary)]">No colors yet</h3>
                  <p className="mt-1 text-sm text-[var(--fg-tertiary)] max-w-xs">
                    Add your brand colors to create a cohesive design system.
                  </p>
                  <motion.button
                    onClick={() => setIsAddingNew(true)}
                    className="mt-4 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group"
                    title="Add first color"
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
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[52px]">
                        
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px]">
                        Hex
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[90px]">
                        Role
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
                        Variable
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px]">
                        Text
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px]">
                        Group
                      </th>
                      <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[70px]">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody>
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
                        onCancelEdit={handleCancelEdit}
                        onUpdateField={handleUpdateField}
                        onSave={handleSaveEdit}
                        onDelete={() => handleDelete(color.id)}
                        onCopyHex={handleCopyHex}
                        isSaving={isSaving}
                      />
                    ))}
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
