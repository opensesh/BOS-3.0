'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import { AvatarUpload } from './AvatarUpload';
import { RichTextEditor } from './RichTextEditor';
import type { UserProfile } from '@/lib/supabase/types';

interface ProfileFormProps {
  profile: UserProfile | null;
  isLoading: boolean;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

interface FormData {
  username: string;
  website: string;
  avatarUrl: string;
  bio: string;
  jobTitle: string;
  showJobTitle: boolean;
  altEmail: string;
}

export function ProfileForm({
  profile,
  isLoading,
  onUpdate,
}: ProfileFormProps) {
  const t = useTranslations('settings.profile');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    website: '',
    avatarUrl: '',
    bio: '',
    jobTitle: '',
    showJobTitle: true,
    altEmail: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        website: profile.website || '',
        avatarUrl: profile.avatarUrl || '',
        bio: profile.bio || '',
        jobTitle: profile.jobTitle || '',
        showJobTitle: profile.showJobTitle,
        altEmail: profile.altEmail || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      handleInputChange('avatarUrl', localUrl);
      
      // In production, this would upload to Supabase storage
      // const url = await uploadAvatar(profile?.userId, file);
      // handleInputChange('avatarUrl', url);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    handleInputChange('avatarUrl', '');
    // In production, this would delete from Supabase storage
    // await deleteAvatar(profile?.userId);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        website: profile.website || '',
        avatarUrl: profile.avatarUrl || '',
        bio: profile.bio || '',
        jobTitle: profile.jobTitle || '',
        showJobTitle: profile.showJobTitle,
        altEmail: profile.altEmail || '',
      });
      setIsDirty(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In production, this would call Supabase
      onUpdate({
        username: formData.username,
        website: formData.website,
        avatarUrl: formData.avatarUrl,
        bio: formData.bio,
        jobTitle: formData.jobTitle,
        showJobTitle: formData.showJobTitle,
        altEmail: formData.altEmail,
      });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--border-secondary)]">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-[var(--bg-tertiary)] rounded" />
            <div className="h-4 w-64 bg-[var(--bg-tertiary)] rounded" />
          </div>
        </div>
        
        {/* Field skeletons */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8 py-5 border-b border-[var(--border-secondary)]">
            <div className="lg:w-[280px]">
              <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded" />
            </div>
            <div className="flex-1 lg:max-w-[512px]">
              <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form
      className="max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <SettingsSectionHeader
        title={t('title')}
        description={t('subtitle')}
      />

      {/* Username Field */}
      <SettingsField label={t('username')} tooltip={t('username')}>
        <div className="flex">
          <span className="
            inline-flex items-center
            px-3.5 py-2.5
            bg-[var(--bg-secondary-alt)]
            border border-r-0 border-[var(--border-primary)]
            rounded-l-lg
            text-[var(--fg-tertiary)] text-base
          ">
            opensession.co/
          </span>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="olivia"
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

      {/* Website Field */}
      <SettingsField label={t('website')}>
        <div className="flex">
          <span className="
            inline-flex items-center
            px-3.5 py-2.5
            bg-[var(--bg-secondary-alt)]
            border border-r-0 border-[var(--border-primary)]
            rounded-l-lg
            text-[var(--fg-tertiary)] text-base
          ">
            http://
          </span>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="www.opensession.co"
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

      {/* Photo Field */}
      <SettingsField
        label={t('yourPhoto')}
        description={t('photoDescription')}
      >
        <AvatarUpload
          avatarUrl={formData.avatarUrl}
          displayName={profile?.displayName}
          onUpload={handleAvatarUpload}
          onDelete={handleAvatarDelete}
          isUploading={isUploading}
          deleteLabel={t('deletePhoto')}
          updateLabel={t('updatePhoto')}
        />
      </SettingsField>

      {/* Bio Field */}
      <SettingsField
        label={t('bio')}
        description={t('bioHint')}
      >
        <RichTextEditor
          value={formData.bio}
          onChange={(value) => handleInputChange('bio', value)}
          maxLength={275}
          placeholder={t('bioPlaceholder')}
        />
      </SettingsField>

      {/* Job Title Field */}
      <SettingsField label={t('jobTitle')}>
        <div className="space-y-3">
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            placeholder="e.g. Product Designer"
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showJobTitle}
              onChange={(e) => handleInputChange('showJobTitle', e.target.checked)}
              className="
                w-4 h-4
                rounded
                border-[var(--border-primary)]
                bg-[var(--bg-primary)]
                text-[var(--bg-brand-solid)]
                focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-0
              "
            />
            <span className="text-sm font-medium text-[var(--fg-secondary)]">
              {t('showJobTitle')}
            </span>
          </label>
        </div>
      </SettingsField>

      {/* Alternative Email Field */}
      <SettingsField
        label={t('altEmail')}
        description={t('altEmailHint')}
      >
        <input
          type="email"
          value={formData.altEmail}
          onChange={(e) => handleInputChange('altEmail', e.target.value)}
          placeholder="your@email.com"
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

      {/* Footer */}
      <SettingsSectionFooter
        onCancel={handleCancel}
        onSave={handleSave}
        isSaving={isSaving}
        isDisabled={!isDirty}
        saveLabel={t('saveChanges')}
      />
    </form>
  );
}
