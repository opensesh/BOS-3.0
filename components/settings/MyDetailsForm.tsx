'use client';

import { useState } from 'react';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import { ChevronDown } from 'lucide-react';

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

export function MyDetailsForm() {
  const [firstName, setFirstName] = useState('Olivia');
  const [lastName, setLastName] = useState('Rhye');
  const [email, setEmail] = useState('olivia@opensession.co');
  const [phone, setPhone] = useState('+1 (555) 000-0000');
  const [timezone, setTimezone] = useState('Australia/Melbourne');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <SettingsSectionHeader
        title="Personal info"
        description="Update your personal details here."
      />

      {/* First Name */}
      <SettingsField label="First name" required>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter your first name"
          className="
            w-full
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
      </SettingsField>

      {/* Last Name */}
      <SettingsField label="Last name" required>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter your last name"
          className="
            w-full
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
      </SettingsField>

      {/* Email */}
      <SettingsField
        label="Email address"
        description="This is the email address associated with your account."
        required
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="
            w-full
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
      </SettingsField>

      {/* Phone */}
      <SettingsField label="Phone number">
        <div className="flex">
          <button className="
            inline-flex items-center gap-1.5
            px-3.5 py-2.5
            bg-[var(--bg-secondary-alt)]
            border border-r-0 border-[var(--border-primary)]
            rounded-l-lg
            text-[var(--fg-secondary)] text-base
          ">
            US
            <ChevronDown className="w-4 h-4 text-[var(--fg-quaternary)]" />
          </button>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="
              flex-1 min-w-0
              px-3.5 py-2.5
              bg-[var(--bg-primary)]
              border border-[var(--border-primary)]
              rounded-r-lg
              text-[var(--fg-primary)] text-base
              placeholder:text-[var(--fg-placeholder)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
              shadow-xs
            "
          />
        </div>
      </SettingsField>

      {/* Timezone */}
      <SettingsField label="Timezone">
        <div className="relative">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="
              w-full
              appearance-none
              px-3.5 py-2.5 pr-10
              bg-[var(--bg-primary)]
              border border-[var(--border-primary)]
              rounded-lg
              text-[var(--fg-primary)] text-base
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
              shadow-xs
              cursor-pointer
            "
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="w-5 h-5 text-[var(--fg-quaternary)]" />
          </div>
        </div>
      </SettingsField>

      {/* Date Format */}
      <SettingsField label="Date format">
        <div className="flex flex-wrap gap-3">
          {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((format) => (
            <label
              key={format}
              className={`
                flex items-center gap-2
                px-4 py-2.5
                border rounded-lg
                cursor-pointer
                transition-all
                ${dateFormat === format
                  ? 'border-[var(--border-brand)] bg-[var(--bg-brand-primary)] text-[var(--fg-brand-secondary)]'
                  : 'border-[var(--border-primary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary-alt)]'
                }
              `}
            >
              <input
                type="radio"
                name="dateFormat"
                value={format}
                checked={dateFormat === format}
                onChange={(e) => setDateFormat(e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{format}</span>
            </label>
          ))}
        </div>
      </SettingsField>

      <SettingsSectionFooter
        onCancel={() => {}}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}

