'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageTransition, MotionItem } from '@/lib/motion';

interface BrandHubLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export function BrandHubLayout({
  children,
  title,
  description,
  showBackButton = true
}: BrandHubLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pt-14 lg:pt-10 lg:pl-12">
      <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
        {/* Back Button */}
        {showBackButton && (
          <MotionItem className="mb-8">
            <Link
              href="/brand-hub"
              className="group inline-flex items-center gap-2 text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium">Back to Brand Hub</span>
            </Link>
          </MotionItem>
        )}

        {/* Page Header */}
        <MotionItem className="flex flex-col gap-2 mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              {description}
            </p>
          )}
        </MotionItem>

        {/* Content */}
        <MotionItem>
          {children}
        </MotionItem>
      </PageTransition>
    </div>
  );
}
