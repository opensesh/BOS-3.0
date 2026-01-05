'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { MyDetailsForm } from '@/components/settings/MyDetailsForm';
import { PasswordForm } from '@/components/settings/PasswordForm';
import { TeamForm } from '@/components/settings/TeamForm';
import { PlanForm } from '@/components/settings/PlanForm';
import { BillingForm } from '@/components/settings/BillingForm';
import { EmailForm } from '@/components/settings/EmailForm';
import { NotificationsForm } from '@/components/settings/NotificationsForm';
import { IntegrationsForm } from '@/components/settings/IntegrationsForm';
import { APIForm } from '@/components/settings/APIForm';
import type { UserProfile } from '@/lib/supabase/types';

// Tab IDs - used for routing and state
const TAB_IDS = [
  'my-details',
  'profile',
  'password',
  'team',
  'plan',
  'billing',
  'email',
  'notifications',
  'integrations',
  'api',
] as const;

type TabId = typeof TAB_IDS[number];

export default function AccountPage() {
  const t = useTranslations('settings.tabs');
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Build translated tabs array
  const settingsTabs = useMemo(() => [
    { id: 'my-details' as const, label: t('myDetails') },
    { id: 'profile' as const, label: t('profile') },
    { id: 'password' as const, label: t('password') },
    { id: 'team' as const, label: t('team') },
    { id: 'plan' as const, label: t('plan') },
    { id: 'billing' as const, label: t('billing') },
    { id: 'email' as const, label: t('email') },
    { id: 'notifications' as const, label: t('notifications'), badge: '2' },
    { id: 'integrations' as const, label: t('integrations') },
    { id: 'api' as const, label: t('api') },
  ], [t]);

  // Mock user data for now (will be replaced with Supabase auth)
  useEffect(() => {
    // Simulate loading profile
    const mockProfile: UserProfile = {
      id: '1',
      userId: 'mock-user-id',
      username: 'olivia',
      displayName: 'Olivia Rhye',
      email: 'olivia@opensession.co',
      altEmail: '',
      website: 'www.opensession.co',
      avatarUrl: '/assets/avatars/olivia.jpg',
      bio: "I'm a Product Designer based in Melbourne, Australia. I specialise in UX/UI design, brand strategy, and Webflow development.",
      jobTitle: 'Product Designer',
      showJobTitle: true,
      timezone: 'Australia/Melbourne',
      locale: 'en',
      notificationPreferences: {
        email_marketing: true,
        email_updates: true,
        email_security: true,
        push_enabled: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setProfile(mockProfile);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-details':
        return <MyDetailsForm />;
      case 'profile':
        return (
          <ProfileForm
            profile={profile}
            isLoading={isLoading}
            onUpdate={handleProfileUpdate}
          />
        );
      case 'password':
        return <PasswordForm />;
      case 'team':
        return <TeamForm />;
      case 'plan':
        return <PlanForm />;
      case 'billing':
        return <BillingForm />;
      case 'email':
        return <EmailForm />;
      case 'notifications':
        return <NotificationsForm />;
      case 'integrations':
        return <IntegrationsForm />;
      case 'api':
        return <APIForm />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header Area */}
      <div className="flex-shrink-0 pt-6 lg:pt-8 pb-0 px-4 sm:px-6 lg:px-8">
        <SettingsHeader />
        
        <div className="mt-5">
          <SettingsTabs
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as TabId)}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
