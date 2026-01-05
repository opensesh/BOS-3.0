'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import { Mail, Plus, Trash2, Check, Link2, Unlink } from 'lucide-react';

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

// SSO Provider types
interface SSOProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  email?: string;
}

// Google icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Apple icon SVG
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export function EmailForm() {
  const t = useTranslations('settings.email');
  const [emails, setEmails] = useState<EmailAddress[]>(INITIAL_EMAILS);
  const [newEmail, setNewEmail] = useState('');
  const [showAddEmail, setShowAddEmail] = useState(false);
  
  // SSO Providers
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon />,
      connected: true,
      email: 'olivia.rhye@gmail.com',
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: <AppleIcon />,
      connected: false,
    },
  ]);
  
  // Email preferences
  const [productUpdates, setProductUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  
  const toggleSSOProvider = (providerId: string) => {
    setSsoProviders(prev =>
      prev.map(p =>
        p.id === providerId
          ? { ...p, connected: !p.connected, email: p.connected ? undefined : 'connected@example.com' }
          : p
      )
    );
  };

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
        title={t('title')}
        description={t('subtitle')}
      />

      {/* Single Sign-On */}
      <div className="py-5 border-b border-[var(--border-secondary)]">
        <h3 className="text-sm font-semibold text-[var(--fg-secondary)] mb-1">
          Single sign-on
        </h3>
        <p className="text-sm text-[var(--fg-tertiary)] mb-4">
          Link your account to sign in faster using Google or Apple.
        </p>
        
        <div className="space-y-3">
          {ssoProviders.map((provider) => (
            <div
              key={provider.id}
              className="
                flex items-center justify-between gap-4
                p-4
                bg-[var(--bg-primary)]
                border border-[var(--border-primary)]
                rounded-xl
              "
            >
              <div className="flex items-center gap-3">
                <div className="
                  w-10 h-10
                  bg-[var(--bg-secondary-alt)]
                  rounded-lg
                  flex items-center justify-center
                  text-[var(--fg-secondary)]
                ">
                  {provider.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--fg-primary)]">
                    Continue with {provider.name}
                  </p>
                  {provider.connected && provider.email && (
                    <p className="text-sm text-[var(--fg-tertiary)]">
                      {provider.email}
                    </p>
                  )}
                  {!provider.connected && (
                    <p className="text-sm text-[var(--fg-quaternary)]">
                      Not connected
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => toggleSSOProvider(provider.id)}
                className={`
                  flex items-center gap-2
                  px-3 py-1.5
                  rounded-lg
                  text-sm font-medium
                  transition-all duration-150
                  ${provider.connected
                    ? 'bg-transparent border border-[var(--border-secondary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-error-primary)] hover:border-[var(--border-error)]'
                    : 'bg-[var(--bg-brand-primary)] border border-[var(--border-brand)] text-[var(--fg-brand-primary)] hover:bg-[var(--bg-brand-primary-hover)]'
                  }
                `}
              >
                {provider.connected ? (
                  <>
                    <Unlink className="w-4 h-4" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Connect
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

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
                  px-4 py-2
                  bg-[var(--bg-brand-primary)]
                  border border-[var(--border-brand)]
                  rounded-lg
                  text-sm font-medium text-[var(--fg-brand-primary)]
                  hover:bg-[var(--bg-brand-primary-hover)]
                  transition-all duration-150
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
                  px-4 py-2
                  bg-transparent
                  border border-[var(--border-secondary)]
                  rounded-lg
                  text-sm font-medium text-[var(--fg-tertiary)]
                  hover:text-[var(--fg-secondary)]
                  hover:border-[var(--border-primary)]
                  transition-all duration-150
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
                text-sm font-medium text-[var(--fg-tertiary)]
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

