'use client';

import { useTranslations } from 'next-intl';

export function SettingsHeader() {
  const t = useTranslations('settings.header');

  return (
    <div className="flex flex-col gap-1">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">
        {t('title')}
      </h1>
      <p className="text-sm text-[var(--fg-tertiary)]">
        {t('subtitle')}
      </p>
    </div>
  );
}
