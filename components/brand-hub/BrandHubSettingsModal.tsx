'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Upload, Link, Loader2, Check, AlertCircle, GripVertical } from 'lucide-react';

// ============================================
// BASE MODAL COMPONENT
// ============================================

interface BrandHubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Width of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BrandHubSettingsModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'lg',
}: BrandHubSettingsModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

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
            className={`fixed inset-x-4 top-[5%] mx-auto ${sizeClasses[size]} max-h-[90vh] overflow-hidden z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[var(--border-primary)]">
              <div>
                <h2 className="text-2xl font-display font-bold text-[var(--fg-primary)]">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-[var(--fg-tertiary)]">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-8rem)] p-6 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SETTINGS ITEM COMPONENTS
// ============================================

interface SettingsItemProps {
  id: string;
  title: React.ReactNode;
  subtitle?: string;
  preview?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  isDraggable?: boolean;
}

export function SettingsItem({
  id,
  title,
  subtitle,
  preview,
  onEdit,
  onDelete,
  isDraggable = false,
}: SettingsItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] group"
    >
      {isDraggable && (
        <button className="cursor-grab active:cursor-grabbing text-[var(--fg-muted)] hover:text-[var(--fg-tertiary)]">
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {preview && (
        <div className="flex-shrink-0">
          {preview}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--fg-primary)] truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-[var(--fg-tertiary)] truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--fg-tertiary)] hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// ADD BUTTON COMPONENT
// ============================================

interface AddButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'upload' | 'link';
}

export function AddButton({ onClick, label = 'Add item', icon, variant = 'default' }: AddButtonProps) {
  const icons = {
    default: <Plus className="w-4 h-4" />,
    upload: <Upload className="w-4 h-4" />,
    link: <Link className="w-4 h-4" />,
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)] font-medium transition-colors"
    >
      {icon || icons[variant]}
      <span>{label}</span>
    </button>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4 text-[var(--fg-tertiary)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--fg-tertiary)] max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================
// SECTION COMPONENT
// ============================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Section({ title, description, children, actions }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-[var(--fg-primary)]">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--fg-tertiary)]">{description}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
      <span className="text-[var(--fg-tertiary)]">{message}</span>
    </div>
  );
}

// ============================================
// STATUS BADGE
// ============================================

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const classes = {
    success: 'bg-green-500/10 text-green-500',
    error: 'bg-red-500/10 text-red-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    info: 'bg-blue-500/10 text-blue-500',
  };

  const icons = {
    success: <Check className="w-3 h-3" />,
    error: <X className="w-3 h-3" />,
    warning: <AlertCircle className="w-3 h-3" />,
    info: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classes[status]}`}>
      {icons[status]}
      {label}
    </span>
  );
}

// ============================================
// FORM ELEMENTS
// ============================================

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--fg-secondary)]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:border-[var(--border-brand)] focus:ring-1 focus:ring-[var(--border-brand)] outline-none text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] transition-colors ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:border-[var(--border-brand)] focus:ring-1 focus:ring-[var(--border-brand)] outline-none text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] transition-colors resize-none ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:border-[var(--border-brand)] focus:ring-1 focus:ring-[var(--border-brand)] outline-none text-[var(--fg-primary)] transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// ============================================
// FILE UPLOAD ZONE
// ============================================

interface FileUploadZoneProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  description?: string;
}

export function FileUploadZone({
  onFileSelect,
  accept,
  multiple = false,
  label = 'Drop files here or click to upload',
  description,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        onFileSelect(e.dataTransfer.files);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        onFileSelect(e.target.files);
      }
    },
    [onFileSelect]
  );

  return (
    <label
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        isDragging
          ? 'border-[var(--border-brand)] bg-[var(--bg-brand-primary)]'
          : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'
      }`}
    >
      <Upload className="w-8 h-8 text-[var(--fg-tertiary)] mb-2" />
      <span className="text-sm font-medium text-[var(--fg-secondary)]">{label}</span>
      {description && (
        <span className="text-xs text-[var(--fg-muted)] mt-1">{description}</span>
      )}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />
    </label>
  );
}

// ============================================
// CONFIRM DIALOG
// ============================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-sm z-[60] p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl"
          >
            <h3 className="text-lg font-medium text-[var(--fg-primary)]">{title}</h3>
            <p className="mt-2 text-sm text-[var(--fg-tertiary)]">{message}</p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-secondary)] text-[var(--fg-brand-primary)]'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

