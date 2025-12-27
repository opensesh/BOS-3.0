'use client';

import { useState, useEffect } from 'react';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ProfileForm } from '@/components/settings/ProfileForm';
import type { UserProfile } from '@/lib/supabase/types';

// Tab configuration
const SETTINGS_TABS = [
  { id: 'my-details', label: 'My details' },
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password' },
  { id: 'team', label: 'Team' },
  { id: 'plan', label: 'Plan' },
  { id: 'billing', label: 'Billing' },
  { id: 'email', label: 'Email' },
  { id: 'notifications', label: 'Notifications', badge: '2' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'api', label: 'API' },
] as const;

type TabId = typeof SETTINGS_TABS[number]['id'];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user data for now (will be replaced with Supabase auth)
  useEffect(() => {
    // Simulate loading profile
    const mockProfile: UserProfile = {
      id: '1',
      userId: 'mock-user-id',
      username: 'olivia',
      displayName: 'Olivia Rhye',
      email: 'olivia@untitledui.com',
      altEmail: '',
      website: 'www.untitledui.com',
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
      case 'profile':
        return (
          <ProfileForm
            profile={profile}
            isLoading={isLoading}
            onUpdate={handleProfileUpdate}
          />
        );
      case 'my-details':
      case 'password':
      case 'team':
      case 'plan':
      case 'billing':
      case 'email':
      case 'notifications':
      case 'integrations':
      case 'api':
        return (
          <div className="flex items-center justify-center h-64 text-[var(--fg-tertiary)]">
            <p className="text-sm">{SETTINGS_TABS.find(t => t.id === activeTab)?.label} settings coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header Area */}
      <div className="flex-shrink-0 pt-6 lg:pt-8 pb-0 px-4 sm:px-6 lg:px-8">
        <SettingsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <div className="mt-5">
          <SettingsTabs
            tabs={SETTINGS_TABS}
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

