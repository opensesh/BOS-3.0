'use client';

import { ReactNode } from 'react';
import { HelpCircle, MoreVertical } from 'lucide-react';

interface SettingsSectionHeaderProps {
  title: string;
  description?: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export function SettingsSectionHeader({
  title,
  description,
  showMenu = false,
  onMenuClick,
}: SettingsSectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--border-secondary)]">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--fg-tertiary)] truncate">
            {description}
          </p>
        )}
      </div>
      {showMenu && (
        <button
          onClick={onMenuClick}
          className="
            p-1.5 -m-1.5
            text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)]
            transition-colors
          "
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

interface SettingsFieldProps {
  label: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  description,
  tooltip,
  required = false,
  children,
  className = '',
}: SettingsFieldProps) {
  return (
    <div className={`
      flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8
      py-5 border-b border-[var(--border-secondary)]
      ${className}
    `}>
      {/* Label column */}
      <div className="flex-shrink-0 lg:w-[280px] lg:max-w-[280px]">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-[var(--fg-secondary)]">
            {label}
          </span>
          {required && (
            <span className="text-[var(--fg-brand-primary)]">*</span>
          )}
          {tooltip && (
            <div className="relative group">
              <button
                type="button"
                className="p-0.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] transition-colors"
                aria-label={tooltip}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {/* Tooltip */}
              <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                px-3 py-2
                bg-[var(--bg-primary-solid,#0a0d12)] dark:bg-[var(--bg-secondary)]
                text-xs font-semibold text-white dark:text-[var(--fg-primary)]
                rounded-lg
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-150
                whitespace-nowrap
                z-50
                shadow-lg
              ">
                {tooltip}
                {/* Arrow */}
                <div className="
                  absolute top-full left-1/2 -translate-x-1/2
                  border-4 border-transparent border-t-[var(--bg-primary-solid,#0a0d12)] dark:border-t-[var(--bg-secondary)]
                " />
              </div>
            </div>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-[var(--fg-tertiary)]">
            {description}
          </p>
        )}
      </div>

      {/* Input column */}
      <div className="flex-1 min-w-0 lg:max-w-[512px]">
        {children}
      </div>
    </div>
  );
}

interface SettingsSectionFooterProps {
  onCancel?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDisabled?: boolean;
}

export function SettingsSectionFooter({
  onCancel,
  onSave,
  isSaving = false,
  isDisabled = false,
}: SettingsSectionFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-5 border-t border-[var(--border-secondary)]">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="
          px-4 py-2.5
          bg-[var(--bg-primary)]
          border border-[var(--border-primary)]
          rounded-lg
          text-sm font-semibold text-[var(--fg-secondary)]
          shadow-xs
          hover:bg-[var(--bg-primary-hover)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={onSave}
        disabled={isDisabled || isSaving}
        className="
          px-4 py-2.5
          bg-[var(--bg-brand-solid)]
          border-2 border-white/12
          rounded-lg
          text-sm font-semibold text-white
          shadow-xs
          hover:bg-[var(--bg-brand-solid-hover)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

interface SettingsDividerProps {
  className?: string;
}

export function SettingsDivider({ className = '' }: SettingsDividerProps) {
  return (
    <div className={`h-px bg-[var(--border-secondary)] ${className}`} />
  );
}

