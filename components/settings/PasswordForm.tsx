'use client';

import { useState } from 'react';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'One special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

function PasswordInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="
          w-full
          px-3.5 py-2.5 pr-10
          bg-[var(--bg-primary)]
          border border-[var(--border-primary)]
          rounded-lg
          text-[var(--fg-primary)] text-base
          placeholder:text-[var(--fg-placeholder)]
          focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
          shadow-xs
        "
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="
          absolute inset-y-0 right-0 pr-3
          flex items-center
          text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)]
          transition-colors
        "
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const isValid = PASSWORD_REQUIREMENTS.every(req => req.test(newPassword)) && passwordsMatch;

  const handleSave = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl">
      <SettingsSectionHeader
        title="Password"
        description="Please enter your current password to change your password."
      />

      {/* Current Password */}
      <SettingsField label="Current password" required>
        <PasswordInput
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Enter current password"
          label="Current password"
        />
      </SettingsField>

      {/* New Password */}
      <SettingsField label="New password" required>
        <div className="space-y-3">
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter new password"
            label="New password"
          />

          {/* Password Requirements */}
          {newPassword && (
            <div className="grid grid-cols-2 gap-2">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const isMet = req.test(newPassword);
                return (
                  <div
                    key={req.id}
                    className={`
                      flex items-center gap-2
                      text-sm
                      ${isMet ? 'text-[var(--fg-success-primary)]' : 'text-[var(--fg-tertiary)]'}
                    `}
                  >
                    {isMet ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {req.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SettingsField>

      {/* Confirm Password */}
      <SettingsField label="Confirm new password" required>
        <div className="space-y-2">
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            label="Confirm new password"
          />
          
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-[var(--fg-error-primary)]">
              Passwords do not match
            </p>
          )}
          {passwordsMatch && confirmPassword && (
            <p className="text-sm text-[var(--fg-success-primary)] flex items-center gap-1">
              <Check className="w-4 h-4" />
              Passwords match
            </p>
          )}
        </div>
      </SettingsField>

      <SettingsSectionFooter
        onCancel={() => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        onSave={handleSave}
        isSaving={isSaving}
        isDisabled={!isValid || !currentPassword}
      />
    </div>
  );
}

