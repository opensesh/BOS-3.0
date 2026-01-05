'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';

/**
 * Mobile header for settings page with back navigation.
 * Only visible on tablet and mobile (< lg breakpoint).
 */
function MobileSettingsHeader() {
  const router = useRouter();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)]">
      <div className="flex items-center h-full px-4 gap-3">
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
    </header>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* Desktop: Show sidebar */}
      <Sidebar />
      
      {/* Mobile/Tablet: Show mobile header */}
      <MobileSettingsHeader />
      
      {/* Main Content - adjusts for both desktop sidebar and mobile header */}
      <MainContent className="overflow-hidden">
        {children}
      </MainContent>
    </div>
  );
}
