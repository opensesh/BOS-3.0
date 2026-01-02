'use client';

import { useState } from 'react';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import { Mail, Plus, Trash2, Check } from 'lucide-react';

interface EmailAddress {
  id: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
}

const INITIAL_EMAILS: EmailAddress[] = [
  {
    id: '1',
    email: 'olivia@opensession.co',
    isPrimary: true,
    isVerified: true,
  },
  {
    id: '2',
    email: 'olivia.rhye@gmail.com',
    isPrimary: false,
    isVerified: true,
  },
  {
    id: '3',
    email: 'olivia@company.co',
    isPrimary: false,
    isVerified: false,
  },
];

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

export function EmailForm() {
  const [emails, setEmails] = useState<EmailAddress[]>(INITIAL_EMAILS);
  const [newEmail, setNewEmail] = useState('');
  const [showAddEmail, setShowAddEmail] = useState(false);
  
  // Email preferences
  const [productUpdates, setProductUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    
    setEmails(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        email: newEmail,
        isPrimary: false,
        isVerified: false,
      },
    ]);
    setNewEmail('');
    setShowAddEmail(false);
  };

  const handleRemoveEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    setEmails(prev => prev.map(e => ({
      ...e,
      isPrimary: e.id === id,
    })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <SettingsSectionHeader
        title="Email settings"
        description="Manage your email addresses and preferences."
      />

      {/* Email Addresses */}
      <SettingsField
        label="Email addresses"
        description="Add or remove email addresses for your account."
      >
        <div className="space-y-3">
          {emails.map((emailItem) => (
            <div
              key={emailItem.id}
              className="
                flex items-center justify-between gap-3
                p-4
                bg-[var(--bg-primary)]
                border border-[var(--border-primary)]
                rounded-xl
              "
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="
                  w-10 h-10
                  bg-[var(--bg-secondary-alt)]
                  rounded-lg
                  flex items-center justify-center
                ">
                  <Mail className="w-5 h-5 text-[var(--fg-tertiary)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--fg-primary)] truncate">
                      {emailItem.email}
                    </p>
                    {emailItem.isPrimary && (
                      <span className="
                        px-2 py-0.5
                        bg-[var(--bg-brand-primary)]
                        rounded-full
                        text-xs font-medium text-[var(--fg-brand-primary)]
                      ">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--fg-tertiary)]">
                    {emailItem.isVerified ? (
                      <span className="flex items-center gap-1 text-[var(--fg-success-primary)]">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[var(--fg-warning-primary)]">
                        Pending verification
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!emailItem.isPrimary && emailItem.isVerified && (
                  <button
                    onClick={() => handleSetPrimary(emailItem.id)}
                    className="
                      text-sm font-medium text-[var(--fg-tertiary)]
                      hover:text-[var(--fg-secondary)]
                      transition-colors
                    "
                  >
                    Make primary
                  </button>
                )}
                {!emailItem.isPrimary && (
                  <button
                    onClick={() => handleRemoveEmail(emailItem.id)}
                    className="
                      p-2
                      text-[var(--fg-quaternary)]
                      hover:text-[var(--fg-error-primary)]
                      transition-colors
                    "
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Email */}
          {showAddEmail ? (
            <div className="flex gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address"
                className="
                  flex-1
                  px-3.5 py-2.5
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
                onClick={handleAddEmail}
                className="
                  px-4 py-2.5
                  bg-[var(--bg-brand-solid)]
                  rounded-lg
                  text-sm font-semibold text-white
                  hover:bg-[var(--bg-brand-solid-hover)]
                  transition-colors
                "
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddEmail(false);
                  setNewEmail('');
                }}
                className="
                  px-4 py-2.5
                  border border-[var(--border-primary)]
                  rounded-lg
                  text-sm font-semibold text-[var(--fg-secondary)]
                  hover:bg-[var(--bg-secondary-alt)]
                  transition-colors
                "
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddEmail(true)}
              className="
                flex items-center gap-2
                text-sm font-semibold text-[var(--fg-tertiary)]
                hover:text-[var(--fg-secondary)]
                transition-colors
              "
            >
              <Plus className="w-4 h-4" />
              Add email address
            </button>
          )}
        </div>
      </SettingsField>

      {/* Email Preferences */}
      <div className="mt-8 pt-8 border-t border-[var(--border-secondary)]">
        <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
          Email preferences
        </h3>
        <p className="text-sm text-[var(--fg-tertiary)] mb-5">
          Choose what emails you want to receive.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-secondary)]">
            <div>
              <p className="text-sm font-medium text-[var(--fg-secondary)]">Product updates</p>
              <p className="text-sm text-[var(--fg-tertiary)]">News about product and feature updates.</p>
            </div>
            <Toggle
              enabled={productUpdates}
              onChange={setProductUpdates}
              label="Product updates emails"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-[var(--border-secondary)]">
            <div>
              <p className="text-sm font-medium text-[var(--fg-secondary)]">Security alerts</p>
              <p className="text-sm text-[var(--fg-tertiary)]">Important security notifications.</p>
            </div>
            <Toggle
              enabled={securityAlerts}
              onChange={setSecurityAlerts}
              label="Security alerts emails"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-[var(--border-secondary)]">
            <div>
              <p className="text-sm font-medium text-[var(--fg-secondary)]">Marketing emails</p>
              <p className="text-sm text-[var(--fg-tertiary)]">Tips, tutorials, and promotional content.</p>
            </div>
            <Toggle
              enabled={marketingEmails}
              onChange={setMarketingEmails}
              label="Marketing emails"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[var(--fg-secondary)]">Weekly digest</p>
              <p className="text-sm text-[var(--fg-tertiary)]">A weekly summary of your activity.</p>
            </div>
            <Toggle
              enabled={weeklyDigest}
              onChange={setWeeklyDigest}
              label="Weekly digest emails"
            />
          </div>
        </div>
      </div>

      <SettingsSectionFooter
        onCancel={() => {}}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}

