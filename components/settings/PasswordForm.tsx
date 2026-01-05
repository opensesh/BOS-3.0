'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import { Eye, EyeOff, Check, X, Shield, Smartphone, Key, Copy } from 'lucide-react';

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

// Toggle component for 2FA
function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
        rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2
        ${enabled ? 'bg-[var(--bg-brand-solid)]' : 'bg-[var(--bg-quaternary)]'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform
          rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export function PasswordForm() {
  const t = useTranslations('settings.password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Two-factor authentication state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Mock backup codes
  const backupCodes = [
    'ABCD-1234-EFGH',
    'IJKL-5678-MNOP',
    'QRST-9012-UVWX',
    'YZAB-3456-CDEF',
    'GHIJ-7890-KLMN',
  ];

  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const isValid = PASSWORD_REQUIREMENTS.every(req => req.test(newPassword)) && passwordsMatch;
  
  const copyBackupCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
        title={t('title')}
        description={t('subtitle')}
      />

      {/* Current Password */}
      <SettingsField label={t('currentPassword')} required>
        <PasswordInput
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder={t('currentPassword')}
          label={t('currentPassword')}
        />
      </SettingsField>

      {/* New Password */}
      <SettingsField label={t('newPassword')} required>
        <div className="space-y-3">
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            placeholder={t('newPassword')}
            label={t('newPassword')}
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
      <SettingsField label={t('confirmPassword')} required>
        <div className="space-y-2">
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t('confirmPassword')}
            label={t('confirmPassword')}
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
        saveLabel={t('updatePassword')}
      />

      {/* Two-Factor Authentication Section */}
      <div className="mt-8 pt-8 border-t border-[var(--border-secondary)]">
        <div className="flex items-start gap-4 mb-6">
          <div className="
            w-10 h-10
            bg-[var(--bg-secondary-alt)]
            rounded-lg
            flex items-center justify-center
            flex-shrink-0
          ">
            <Shield className="w-5 h-5 text-[var(--fg-tertiary)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
              Two-factor authentication
            </h3>
            <p className="text-sm text-[var(--fg-tertiary)] mt-0.5">
              Add an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>
          </div>
        </div>

        {/* 2FA Toggle */}
        <div className="
          p-4
          bg-[var(--bg-primary)]
          border border-[var(--border-primary)]
          rounded-xl
          mb-4
        ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="
                w-10 h-10
                bg-[var(--bg-secondary-alt)]
                rounded-lg
                flex items-center justify-center
              ">
                <Smartphone className="w-5 h-5 text-[var(--fg-tertiary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--fg-primary)]">
                  Authenticator app
                </p>
                <p className="text-sm text-[var(--fg-tertiary)]">
                  {twoFactorEnabled
                    ? 'Enabled — Use an authenticator app to generate verification codes'
                    : 'Use an app like Google Authenticator or 1Password'
                  }
                </p>
              </div>
            </div>
            <Toggle
              enabled={twoFactorEnabled}
              onChange={setTwoFactorEnabled}
              label="Toggle two-factor authentication"
            />
          </div>
        </div>

        {/* Backup Codes Section - Only shown when 2FA is enabled */}
        {twoFactorEnabled && (
          <div className="
            p-4
            bg-[var(--bg-primary)]
            border border-[var(--border-primary)]
            rounded-xl
          ">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="
                  w-10 h-10
                  bg-[var(--bg-secondary-alt)]
                  rounded-lg
                  flex items-center justify-center
                ">
                  <Key className="w-5 h-5 text-[var(--fg-tertiary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--fg-primary)]">
                    Backup codes
                  </p>
                  <p className="text-sm text-[var(--fg-tertiary)]">
                    Use these codes if you lose access to your authenticator app
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="
                  px-3 py-1.5
                  bg-transparent
                  border border-[var(--border-secondary)]
                  rounded-lg
                  text-sm font-medium text-[var(--fg-tertiary)]
                  hover:text-[var(--fg-secondary)]
                  hover:border-[var(--border-primary)]
                  transition-all duration-150
                "
              >
                {showBackupCodes ? 'Hide codes' : 'View codes'}
              </button>
            </div>

            {showBackupCodes && (
              <div className="
                mt-4 pt-4
                border-t border-[var(--border-secondary)]
              ">
                <p className="text-xs text-[var(--fg-quaternary)] mb-3">
                  Store these codes securely. Each code can only be used once.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {backupCodes.map((code) => (
                    <div
                      key={code}
                      className="
                        flex items-center justify-between
                        px-3 py-2
                        bg-[var(--bg-secondary-alt)]
                        border border-[var(--border-secondary)]
                        rounded-lg
                        font-mono text-xs text-[var(--fg-secondary)]
                      "
                    >
                      <span>{code}</span>
                      <button
                        onClick={() => copyBackupCode(code)}
                        className="
                          ml-2 p-1
                          text-[var(--fg-quaternary)]
                          hover:text-[var(--fg-tertiary)]
                          transition-colors
                        "
                        title="Copy code"
                      >
                        {copiedCode === code ? (
                          <Check className="w-3 h-3 text-[var(--fg-success-primary)]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="
                    mt-4
                    text-sm font-medium text-[var(--fg-brand-primary)]
                    hover:text-[var(--fg-brand-primary-hover)]
                    transition-colors
                  "
                >
                  Generate new codes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
