'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  SettingsSectionHeader,
  SettingsSectionFooter,
} from './SettingsSection';

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  push: boolean;
  email: boolean;
  sms: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationCategory[] = [
  {
    id: 'comments',
    title: 'Comments',
    description: 'These are notifications for comments on your posts and replies to your comments.',
    push: true,
    email: true,
    sms: false,
  },
  {
    id: 'tags',
    title: 'Tags',
    description: 'These are notifications for when someone tags you in a comment, post or story.',
    push: true,
    email: false,
    sms: false,
  },
  {
    id: 'reminders',
    title: 'Reminders',
    description: 'These are notifications to remind you of updates you might have missed.',
    push: false,
    email: false,
    sms: false,
  },
  {
    id: 'activity',
    title: 'More activity about you',
    description: 'These are notifications for posts on your profile, likes and other reactions to your posts, and more.',
    push: false,
    email: false,
    sms: false,
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

export function NotificationsForm() {
  const t = useTranslations('settings.notifications');
  const [notifications, setNotifications] = useState<NotificationCategory[]>(INITIAL_NOTIFICATIONS);
  const [isSaving, setIsSaving] = useState(false);

  const updateNotification = (
    categoryId: string,
    channel: 'push' | 'email' | 'sms',
    enabled: boolean
  ) => {
    setNotifications(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, [channel]: enabled } : cat
      )
    );
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

      <div className="divide-y divide-[var(--border-secondary)]">
        {notifications.map((category) => (
          <div key={category.id} className="py-5">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
              {/* Label column */}
              <div className="flex-shrink-0 lg:w-[280px] lg:max-w-[280px]">
                <h3 className="text-sm font-semibold text-[var(--fg-secondary)]">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--fg-tertiary)]">
                  {category.description}
                </p>
              </div>

              {/* Toggle column */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Toggle
                    enabled={category.push}
                    onChange={(enabled) => updateNotification(category.id, 'push', enabled)}
                    label={`${category.title} push notifications`}
                  />
                  <span className="text-sm text-[var(--fg-secondary)]">Push</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    enabled={category.email}
                    onChange={(enabled) => updateNotification(category.id, 'email', enabled)}
                    label={`${category.title} email notifications`}
                  />
                  <span className="text-sm text-[var(--fg-secondary)]">Email</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    enabled={category.sms}
                    onChange={(enabled) => updateNotification(category.id, 'sms', enabled)}
                    label={`${category.title} SMS notifications`}
                  />
                  <span className="text-sm text-[var(--fg-secondary)]">SMS</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SettingsSectionFooter
        onCancel={() => setNotifications(INITIAL_NOTIFICATIONS)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}

