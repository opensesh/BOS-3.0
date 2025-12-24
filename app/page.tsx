'use client';

import { Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { ChatInterface } from '@/components/ChatInterface';

export default function Home() {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <MainContent>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-[var(--fg-tertiary)]">Loading...</div></div>}>
          <ChatInterface />
        </Suspense>
      </MainContent>
    </div>
  );
}
