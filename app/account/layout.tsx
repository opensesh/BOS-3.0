'use client';

import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <MainContent className="overflow-hidden">
        {children}
      </MainContent>
    </div>
  );
}

