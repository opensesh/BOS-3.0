'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';

/**
 * Sub-header for settings page with back navigation.
 * This sits within the content area, below the main mobile header.
 * Only visible on tablet and mobile (< lg breakpoint).
 */
function SettingsSubHeader() {
  const router = useRouter();

  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
      <button
        onClick={() => router.back()}
        className="
          flex items-center justify-center
          w-10 h-10 -ml-2
          rounded-lg
          text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
          hover:bg-[var(--bg-tertiary)]
          active:bg-[var(--bg-quaternary)]
          transition-colors
        "
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-semibold text-[var(--fg-primary)]">
        Settings
      </h1>
    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* Desktop: Show sidebar, Mobile: Show mobile header */}
      <Sidebar />
      
      {/* Main Content - adjusts for both desktop sidebar and mobile header */}
      <MainContent className="overflow-hidden flex flex-col">
        {/* Mobile/Tablet: Show settings sub-header within content */}
        <SettingsSubHeader />
        
        {/* Settings page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </MainContent>
    </div>
  );
}
