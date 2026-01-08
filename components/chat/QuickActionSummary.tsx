'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { QuickActionMetadata } from '@/hooks/useChat';

// =============================================================================
// Platform Icons (copied from CreatePostCopyForm for consistency)
// =============================================================================

const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className = 'w-4 h-4' }) => {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    tiktok: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    youtube: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    facebook: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    linkedin: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    threads: (
      <svg className={className} viewBox="0 0 192 192" fill="currentColor">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
      </svg>
    ),
  };

  const normalizedPlatform = platform?.toLowerCase().replace(/\s+/g, '-') || '';
  return <>{icons[normalizedPlatform] || <span className={`${className} inline-flex items-center justify-center text-[10px] font-semibold`}>?</span>}</>;
};

// =============================================================================
// Component
// =============================================================================

interface QuickActionSummaryProps {
  /** The quick action metadata from the message */
  quickAction: QuickActionMetadata;
  /** Maximum height for the brief before truncation */
  maxBriefLength?: number;
}

/**
 * QuickActionSummary Component
 * 
 * Displays a compact, visual summary of quick action form inputs.
 * This replaces the raw markdown prompt in the chat history.
 * 
 * Shows:
 * - Platform icon and name
 * - Format badge
 * - Goal tag
 * - Brief preview (expandable)
 * - Brand voice indicator (if available)
 */
export function QuickActionSummary({ 
  quickAction,
  maxBriefLength = 150,
}: QuickActionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { formData, brandVoice } = quickAction;
  
  const briefIsTruncated = formData.keyMessage.length > maxBriefLength;
  const displayBrief = isExpanded 
    ? formData.keyMessage 
    : formData.keyMessage.slice(0, maxBriefLength) + (briefIsTruncated ? '...' : '');

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl overflow-hidden max-w-[85%]">
      {/* Header Row - Platform + Quick Action Type */}
      <div className="px-4 py-3 border-b border-[var(--border-secondary)]">
        <div className="flex items-center gap-3">
          {/* Platform Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">
            <PlatformIcon platform={formData.channelIcon || formData.channelLabel} className="w-5 h-5" />
          </div>
          
          {/* Title and Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--fg-primary)]">
                Create Post
              </span>
              {brandVoice?.hasVoiceContext && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-brand-primary)]/10 text-[var(--fg-brand-primary)]">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Brand Voice</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--fg-tertiary)]">
              {formData.channelLabel} • {formData.contentFormatLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-4 py-3 space-y-3">
        {/* Tags Row */}
        <div className="flex flex-wrap gap-2">
          {/* Goal Tag */}
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--fg-secondary)]">
            {formData.goalLabel}
          </span>
          
          {/* Content Types */}
          {formData.contentSubtypeLabels.map((subtype, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-xs text-[var(--fg-tertiary)]"
            >
              {subtype}
            </span>
          ))}
        </div>

        {/* Brief/Key Message */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
            Brief
          </p>
          <p className="text-sm text-[var(--fg-primary)] leading-relaxed">
            {displayBrief}
          </p>
          
          {/* Show more/less toggle */}
          {briefIsTruncated && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
            >
              <span>{isExpanded ? 'Show less' : 'Show more'}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
          )}
        </div>

        {/* Output Preferences (collapsed by default, shown on expand) */}
        <AnimatePresence>
          {isExpanded && formData.outputPreferences && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-[var(--border-secondary)]">
                <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-2">
                  Preferences
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--fg-tertiary)]">
                  <span>Variations: {formData.outputPreferences.variations}</span>
                  <span>Length: {formData.outputPreferences.captionLength}</span>
                  <span>Hashtags: {formData.outputPreferences.hashtags}</span>
                  <span>CTA: {formData.outputPreferences.includeCta}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QuickActionSummary;

