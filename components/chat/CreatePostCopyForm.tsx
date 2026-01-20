'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Link as LinkIcon,
  Check,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/base/buttons/button';
import type {
  PostCopyFormData,
  Channel,
  ContentSubtype,
  Goal,
  ContentFormat,
  ReferenceFile,
  ReferenceUrl,
  VariationCount,
  HashtagPreference,
  CaptionLength,
  CtaPreference,
  OutputPreferences,
} from '@/lib/quick-actions';
import {
  CONTENT_FORMATS,
  VARIATION_OPTIONS,
  HASHTAG_OPTIONS,
  CAPTION_LENGTH_OPTIONS,
  CTA_OPTIONS,
  createInitialFormData,
  getChannelsForFormat,
  filterSubtypesByChannelAndFormat,
} from '@/lib/quick-actions';

// =============================================================================
// Types
// =============================================================================

interface CreatePostCopyFormProps {
  /** Initial form data (for editing/resuming) */
  initialData?: Partial<PostCopyFormData>;
  /** Called when form is submitted */
  onSubmit: (data: PostCopyFormData) => void;
  /** Called when form is cancelled */
  onCancel: () => void;
  /** Loading state during submission */
  isSubmitting?: boolean;
  /** Whether the form is expanded by default */
  defaultExpanded?: boolean;
  /** Configuration data from Supabase */
  channels: Channel[];
  contentSubtypes: ContentSubtype[];
  goals: Goal[];
  /** Quick action type for displaying badge in header */
  quickActionType?: string | null;
}

// =============================================================================
// Platform Icons (SVG)
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
    pinterest: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
      </svg>
    ),
    threads: (
      <svg className={className} viewBox="0 0 192 192" fill="currentColor">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
      </svg>
    ),
    snapchat: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
      </svg>
    ),
    twitch: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
      </svg>
    ),
    bereal: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.877 11.128H7.174V7.692a3.703 3.703 0 1 1 3.703 3.436zm1.246 5.18a3.703 3.703 0 1 1-3.703-3.435h3.703v3.436zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.949 16.308a4.948 4.948 0 0 1-4.826 4.945v-4.945h4.826zm0-5.18h-4.826V6.748a4.948 4.948 0 0 1 4.826 4.38z"/>
      </svg>
    ),
    reddit: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    ),
    discord: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
    medium: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
      </svg>
    ),
    substack: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
      </svg>
    ),
    spotify: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    mastodon: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
      </svg>
    ),
    bluesky: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
      </svg>
    ),
    tumblr: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.166z"/>
      </svg>
    ),
    'apple-podcasts': (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.34 0A5.328 5.328 0 0 0 0 5.34v13.32A5.328 5.328 0 0 0 5.34 24h13.32A5.328 5.328 0 0 0 24 18.66V5.34A5.328 5.328 0 0 0 18.66 0zm6.525 2.568c4.988 0 9.054 4.066 9.054 9.054 0 1.955-.616 3.773-1.666 5.253-.376.528-.392.634-.792.634-.27 0-.544-.18-.544-.544 0-.18.06-.42.18-.634.96-1.32 1.53-2.932 1.53-4.709 0-4.314-3.507-7.82-7.762-7.82-4.254 0-7.762 3.506-7.762 7.82 0 1.778.57 3.39 1.53 4.71.12.213.18.453.18.633 0 .365-.274.544-.544.544-.4 0-.416-.106-.792-.634a9.04 9.04 0 0 1-1.666-5.253c0-4.988 4.066-9.054 9.054-9.054zM12 7.08a4.503 4.503 0 0 0-4.496 4.496c0 .78.197 1.512.543 2.153.246.453.502.632.843.632.404 0 .662-.346.662-.77 0-.18-.062-.358-.15-.533a2.975 2.975 0 0 1-.318-1.32 2.932 2.932 0 0 1 2.916-2.915A2.932 2.932 0 0 1 14.916 11.738c0 .469-.105.909-.318 1.319-.088.175-.15.354-.15.532 0 .425.258.771.662.771.34 0 .597-.179.843-.632a4.503 4.503 0 0 0-4.953-6.648zM12 10.5a1.06 1.06 0 0 0-.748.31 1.054 1.054 0 0 0-.312.748c0 .167.032.343.08.517l.754 4.085c.059.31.312.456.528.456h.007c.215 0 .47-.146.528-.456l.754-4.085c.047-.175.08-.35.08-.517a1.063 1.063 0 0 0-1.06-1.058c-.218 0-.37.06-.611.06z"/>
      </svg>
    ),
    patreon: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003"/>
      </svg>
    ),
    skool: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c1.325 0 2.4 1.075 2.4 2.4s-1.075 2.4-2.4 2.4-2.4-1.075-2.4-2.4 1.075-2.4 2.4-2.4zm4.8 13.2H7.2v-1.2c0-1.325 1.075-2.4 2.4-2.4h.6c.663 0 1.263.27 1.8.6.537-.33 1.137-.6 1.8-.6h.6c1.325 0 2.4 1.075 2.4 2.4v1.2z"/>
      </svg>
    ),
    blog: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
    ),
  };

  const normalizedPlatform = platform?.toLowerCase().replace(/\s+/g, '-') || '';
  return <>{icons[normalizedPlatform] || <span className={`${className} inline-flex items-center justify-center text-[10px] font-semibold`}>?</span>}</>;
};

// =============================================================================
// Sub-components
// =============================================================================

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function Chip({ selected, onClick, children, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5
        rounded-md text-xs font-medium transition-all duration-150
        ${selected
          ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] ring-1 ring-[var(--border-brand-solid)]'
          : 'bg-[var(--bg-primary)] text-[var(--fg-secondary)] ring-1 ring-[var(--border-primary)] hover:ring-[var(--border-brand-solid)] hover:text-[var(--fg-primary)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {selected && <Check className="w-3 h-3 shrink-0" />}
      {children}
    </button>
  );
}

interface SegmentedControlProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function SegmentedControl<T extends string>({ options, value, onChange, disabled }: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--bg-tertiary)] p-0.5 ring-1 ring-[var(--border-secondary)]">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150
            ${value === option.id
              ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Tab Selector for Goals (scrollable with arrows, like SettingsTabs)
interface GoalTabSelectorProps {
  goals: Goal[];
  activeGoalId: string;
  onChange: (goalId: string) => void;
}

function GoalTabSelector({ goals, activeGoalId, onChange }: GoalTabSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  // Update sliding indicator position
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-goal-id="${activeGoalId}"]`) as HTMLButtonElement;
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
      if (!isInitialized) {
        requestAnimationFrame(() => setIsInitialized(true));
      }
    }
  }, [activeGoalId, goals, isInitialized]);

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 120;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <SectionHeader label="Goal" />
      <div className="relative flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1 ring-1 ring-[var(--border-secondary)]">
        {/* Left arrow - only render when needed */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              type="button"
              onClick={() => scroll('left')}
              className="
                flex-shrink-0
                w-6 h-6
                flex items-center justify-center
                rounded-md
                text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-quaternary)]
                transition-colors duration-150
              "
              aria-label="Scroll goals left"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Tabs scroll container */}
        <div
          ref={scrollContainerRef}
          className="
            relative flex-1 min-w-0
            flex items-center gap-0.5
            overflow-x-auto
            scrollbar-hide
            scroll-smooth
            touch-pan-x
            overscroll-x-contain
          "
          role="tablist"
          aria-label="Goal tabs"
          style={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Sliding indicator */}
          <motion.div
            className="absolute top-0 bottom-0 rounded-md bg-[var(--bg-primary)] shadow-sm"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 35,
              mass: 1,
            }}
            style={{ opacity: isInitialized ? 1 : 0 }}
            aria-hidden="true"
          />
          
          {/* Goal tabs */}
          {goals.map((goal) => {
            const isActive = activeGoalId === goal.id;
            return (
              <motion.button
                key={goal.id}
                data-goal-id={goal.id}
                type="button"
                onClick={() => onChange(goal.id)}
                role="tab"
                aria-selected={isActive}
                className="
                  relative z-10 
                  px-2.5 py-1.5
                  rounded-md
                  text-xs font-medium
                  whitespace-nowrap
                  cursor-pointer
                  select-none
                "
                animate={{
                  color: isActive 
                    ? 'var(--fg-primary)' 
                    : 'var(--fg-tertiary)',
                }}
                whileHover={!isActive ? { color: 'var(--fg-secondary)' } : {}}
                whileTap={{ scale: 0.98 }}
                transition={{
                  color: { duration: 0.15, ease: 'easeOut' },
                  scale: { type: 'spring', stiffness: 400, damping: 25 },
                }}
              >
                {goal.label}
              </motion.button>
            );
          })}
        </div>

        {/* Right arrow - only render when needed */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              type="button"
              onClick={() => scroll('right')}
              className="
                flex-shrink-0
                w-6 h-6
                flex items-center justify-center
                rounded-md
                text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]
                hover:bg-[var(--bg-quaternary)]
                transition-colors duration-150
              "
              aria-label="Scroll goals right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Channel chip with icon and full name (compact)
interface ChannelChipProps {
  channel: Channel;
  selected: boolean;
  onClick: () => void;
}

function ChannelChip({ channel, selected, onClick }: ChannelChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5
        rounded-md text-xs font-medium transition-all duration-150
        ${selected
          ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] ring-1 ring-[var(--border-brand-solid)]'
          : 'bg-[var(--bg-primary)] text-[var(--fg-secondary)] ring-1 ring-[var(--border-primary)] hover:ring-[var(--border-brand-solid)] hover:text-[var(--fg-primary)]'
        }
        cursor-pointer
      `}
    >
      <PlatformIcon platform={channel.icon || ''} className="w-3.5 h-3.5 shrink-0" />
      <span>{channel.label}</span>
      {selected && <Check className="w-3 h-3 shrink-0" />}
    </button>
  );
}

interface SectionHeaderProps {
  label: string;
}

function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div className="mb-2">
      <label className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
        {label}
      </label>
    </div>
  );
}

// Compact dropdown for output preferences (uses portal for proper z-index stacking)
interface CompactSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
  label: string;
}

function CompactSelect<T extends string | number>({ value, onChange, options, label }: CompactSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.id === value);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap below button
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    
    function updatePosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    }
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--fg-tertiary)] whitespace-nowrap">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1.5
            rounded-md text-xs font-medium
            bg-[var(--bg-primary)] text-[var(--fg-primary)]
            ring-1 transition-all duration-150 cursor-pointer
            ${isOpen 
              ? 'ring-2 ring-[var(--border-brand-solid)]' 
              : 'ring-[var(--border-primary)] hover:ring-[var(--border-brand-solid)]'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{selectedOption?.label || 'Select'}</span>
          <ChevronDown className={`w-3 h-3 text-[var(--fg-quaternary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Portal dropdown to body for highest z-index */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="
                  fixed
                  min-w-max
                  bg-[var(--bg-primary)] 
                  rounded-md shadow-lg
                  ring-1 ring-[var(--border-secondary)]
                  py-1 overflow-hidden
                "
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  minWidth: dropdownPosition.width,
                  zIndex: 99999, // Highest possible z-index
                }}
                role="listbox"
              >
                {options.map((option) => {
                  const isSelected = option.id === value;
                  return (
                    <button
                      key={String(option.id)}
                      type="button"
                      onClick={() => {
                        onChange(option.id);
                        setIsOpen(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                      className={`
                        w-full flex items-center justify-between gap-3
                        px-2.5 py-1.5 text-xs font-medium
                        transition-colors cursor-pointer
                        ${isSelected 
                          ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
                          : 'text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CreatePostCopyForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultExpanded = true,
  channels,
  contentSubtypes,
  goals,
  quickActionType,
}: CreatePostCopyFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  
  // Calculate max height to fit above the fold
  useEffect(() => {
    if (!isExpanded || !containerRef.current) return;
    
    const calculateMaxHeight = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Get viewport height
      const viewportHeight = window.innerHeight;
      // Get current top position (where the form starts)
      const topPosition = rect.top;
      // Reserve space for bottom padding and input area
      const bottomPadding = 120; // Space for chat input and padding
      
      // Calculate available height (from form top to bottom of viewport minus padding)
      const availableHeight = viewportHeight - topPosition - bottomPadding;
      
      // Set max height (ensure minimum of 400px, maximum of 600px for readability)
      setMaxHeight(Math.min(Math.max(400, availableHeight), 600));
    };
    
    // Calculate immediately
    calculateMaxHeight();
    
    // Recalculate on resize and scroll
    window.addEventListener('resize', calculateMaxHeight);
    window.addEventListener('scroll', calculateMaxHeight, true);
    
    // Small delay to ensure layout is settled
    const timeoutId = setTimeout(calculateMaxHeight, 100);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateMaxHeight);
      window.removeEventListener('scroll', calculateMaxHeight, true);
    };
  }, [isExpanded]);
  const [contentFormat, setContentFormat] = useState<ContentFormat>(initialData?.contentFormat || 'short_form');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(initialData?.channelId || null);
  const [contentSubtypeIds, setContentSubtypeIds] = useState<string[]>(initialData?.contentSubtypeIds || []);
  const [goalId, setGoalId] = useState<string>(initialData?.goalId || '');
  const [keyMessage, setKeyMessage] = useState(initialData?.keyMessage || '');
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>(initialData?.references?.files || []);
  const [referenceUrls, setReferenceUrls] = useState<ReferenceUrl[]>(initialData?.references?.urls || []);
  const [urlInput, setUrlInput] = useState('');
  const [showOutputPrefs, setShowOutputPrefs] = useState(false);
  
  // Output preferences state
  const [variations, setVariations] = useState<VariationCount>(initialData?.outputPreferences?.variations || 1);
  const [hashtags, setHashtags] = useState<HashtagPreference>(initialData?.outputPreferences?.hashtags || 'generated');
  const [captionLength, setCaptionLength] = useState<CaptionLength>(initialData?.outputPreferences?.captionLength || 'standard');
  const [includeCta, setIncludeCta] = useState<CtaPreference>(initialData?.outputPreferences?.includeCta || 'no');

  // Convert channels array to Channel type for helper functions
  const channelObjects = useMemo(() => {
    return channels.map(c => ({
      ...c,
      shortLabel: c.shortLabel,
      supportedFormats: c.supportedFormats,
      isDefault: c.isDefault,
      displayOrder: c.displayOrder,
      userId: c.userId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }, [channels]);

  // Filter channels by selected content format (format is the master filter)
  const availableChannels = useMemo(() => {
    return getChannelsForFormat(channelObjects, contentFormat);
  }, [channelObjects, contentFormat]);

  // Convert contentSubtypes to ContentSubtype type for helper functions
  const subtypeObjects = useMemo(() => {
    return contentSubtypes.map(s => ({
      ...s,
      channelIds: s.channelIds,
      isDefault: s.isDefault,
      displayOrder: s.displayOrder,
      userId: s.userId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }, [contentSubtypes]);

  // Available subtypes based on selected channel and format
  const availableSubtypes = useMemo(() => {
    return filterSubtypesByChannelAndFormat(subtypeObjects, selectedChannelId, contentFormat);
  }, [subtypeObjects, selectedChannelId, contentFormat]);

  // Reset channel selection when format changes (clear if channel doesn't support new format)
  useEffect(() => {
    if (selectedChannelId) {
      const availableChannelIds = new Set(availableChannels.map(c => c.id));
      if (!availableChannelIds.has(selectedChannelId)) {
        setSelectedChannelId(null);
      }
    }
  }, [availableChannels, selectedChannelId]);

  // Reset content subtypes if not available
  useEffect(() => {
    const availableSubtypeIds = new Set(availableSubtypes.map(s => s.id));
    const validSubtypeIds = contentSubtypeIds.filter(id => availableSubtypeIds.has(id));
    if (validSubtypeIds.length !== contentSubtypeIds.length) {
      setContentSubtypeIds(validSubtypeIds);
    }
  }, [availableSubtypes, contentSubtypeIds]);

  // Set default goal if none selected
  useEffect(() => {
    if (!goalId && goals.length > 0) {
      setGoalId(goals[0].id);
    }
  }, [goalId, goals]);

  // Handlers
  const selectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
  }, []);

  const toggleContentSubtype = useCallback((subtypeId: string) => {
    setContentSubtypeIds(prev =>
      prev.includes(subtypeId)
        ? prev.filter(id => id !== subtypeId)
        : [...prev, subtypeId]
    );
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: ReferenceFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
          preview: file.type.startsWith('image/') ? reader.result as string : undefined,
        };
        setReferenceFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }, []);

  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch {
      return;
    }

    const newUrl: ReferenceUrl = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: urlInput.trim(),
    };

    setReferenceUrls(prev => [...prev, newUrl]);
    setUrlInput('');
  }, [urlInput]);

  const handleSubmit = useCallback(() => {
    if (!selectedChannelId || !keyMessage.trim() || !goalId) return;

    const formData: PostCopyFormData = {
      channelId: selectedChannelId,
      contentFormat,
      contentSubtypeIds,
      goalId,
      keyMessage: keyMessage.trim(),
      writingStyleId: null, // Writing style is managed at chat level, not form level
      references: {
        files: referenceFiles,
        urls: referenceUrls,
      },
      outputPreferences: {
        variations,
        hashtags,
        captionLength,
        includeCta,
      },
      formId: initialData?.formId || createInitialFormData().formId,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSubmit(formData);
  }, [
    selectedChannelId,
    contentFormat,
    contentSubtypeIds,
    goalId,
    keyMessage,
    referenceFiles,
    referenceUrls,
    variations,
    hashtags,
    captionLength,
    includeCta,
    initialData,
    onSubmit,
  ]);

  const isValid = selectedChannelId && keyMessage.trim().length > 0 && goalId;

  return (
    <div className="w-full min-w-0" ref={containerRef} style={{ scrollbarGutter: 'stable' }}>
      {/* Collapsible Container */}
      <div className="rounded-xl bg-[var(--bg-secondary)] ring-1 ring-[var(--border-secondary)] shadow-sm overflow-hidden w-full min-w-0" style={{ scrollbarGutter: 'stable' }}>
        {/* Header - Always visible for better UX */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors min-w-0 rounded-t-xl"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Quick Action Badge */}
            {quickActionType && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--fg-primary)] border border-[var(--border-secondary)] flex-shrink-0">
                <Zap className="w-3 h-3" />
                Create Post
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-2"
          >
            <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
          </motion.div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden w-full min-w-0"
              style={{ willChange: 'height', maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
            >
              <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-secondary)] w-full min-w-0 overflow-y-auto custom-scrollbar" style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}>
                {/* Content Format Section - Master Filter (always visible) */}
                <div className="pt-4">
                  <SectionHeader label="Content Format" />
                  <SegmentedControl
                    options={CONTENT_FORMATS.map(f => ({
                      id: f.id,
                      label: f.label,
                    }))}
                    value={contentFormat}
                    onChange={(format) => setContentFormat(format)}
                  />
                </div>

                {/* Channels Section - Single-select, Filtered by Content Format */}
                <div>
                  <SectionHeader label="Channels" />
                  <div className="flex flex-wrap gap-2">
                    {availableChannels.map((channel) => (
                      <ChannelChip
                        key={channel.id}
                        channel={channel}
                        selected={selectedChannelId === channel.id}
                        onClick={() => selectChannel(channel.id)}
                      />
                    ))}
                    {availableChannels.length === 0 && (
                      <p className="text-xs text-[var(--fg-quaternary)] italic">
                        No channels available for this format
                      </p>
                    )}
                  </div>
                </div>

                {/* Content Type Section - Multi-select */}
                {selectedChannelId && availableSubtypes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SectionHeader label="Content Type" />
                    <div className="flex flex-wrap gap-2">
                      {availableSubtypes.map((subtype) => (
                        <Chip
                          key={subtype.id}
                          selected={contentSubtypeIds.includes(subtype.id)}
                          onClick={() => toggleContentSubtype(subtype.id)}
                        >
                          {subtype.label}
                        </Chip>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Goal Section - Tab Selector */}
                <GoalTabSelector
                  goals={goals}
                  activeGoalId={goalId}
                  onChange={setGoalId}
                />

                {/* Key Message */}
                <div>
                  <SectionHeader label="Key Message" />
                  <textarea
                    value={keyMessage}
                    onChange={(e) => setKeyMessage(e.target.value)}
                    placeholder="What's the core message or topic for this post?"
                    className="w-full px-3 py-2.5 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)] resize-none transition-shadow"
                    rows={3}
                  />
                </div>

                {/* Reference Materials - Always visible (optional) */}
                <div>
                  <SectionHeader label="Reference Materials (Optional)" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Uploaded items preview */}
                  {(referenceFiles.length > 0 || referenceUrls.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {referenceFiles.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] rounded-md text-xs text-[var(--fg-secondary)]"
                        >
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setReferenceFiles(prev => prev.filter(f => f.id !== file.id))}
                            className="text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {referenceUrls.map(url => (
                        <div
                          key={url.id}
                          className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] rounded-md text-xs text-[var(--fg-secondary)]"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{new URL(url.url).hostname}</span>
                          <button
                            type="button"
                            onClick={() => setReferenceUrls(prev => prev.filter(u => u.id !== url.id))}
                            className="text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload/URL input row */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] bg-[var(--bg-tertiary)] rounded-md ring-1 ring-[var(--border-secondary)] transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrl();
                          }
                        }}
                        placeholder="Paste URL..."
                        className="flex-1 px-3 py-1.5 bg-[var(--bg-primary)] rounded-md text-xs text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)]"
                      />
                      {urlInput && (
                        <button
                          type="button"
                          onClick={handleAddUrl}
                          className="p-1.5 text-[var(--fg-brand-primary)] hover:bg-[var(--bg-brand-primary)] rounded-md transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Output Preferences Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOutputPrefs(!showOutputPrefs)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
                >
                  {showOutputPrefs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>Output preferences</span>
                </button>

                {/* Output Preferences Section - Single row with compact dropdowns */}
                <AnimatePresence>
                  {showOutputPrefs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-visible py-1"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Variations */}
                        <CompactSelect
                          label="Variations"
                          value={variations}
                          onChange={(val) => setVariations(val as VariationCount)}
                          options={VARIATION_OPTIONS}
                        />

                        {/* Length */}
                        <CompactSelect
                          label="Length"
                          value={captionLength}
                          onChange={(val) => setCaptionLength(val as CaptionLength)}
                          options={CAPTION_LENGTH_OPTIONS}
                        />

                        {/* Hashtags */}
                        <CompactSelect
                          label="Hashtags"
                          value={hashtags}
                          onChange={(val) => setHashtags(val as HashtagPreference)}
                          options={HASHTAG_OPTIONS}
                        />

                        {/* CTA */}
                        <CompactSelect
                          label="CTA"
                          value={includeCta}
                          onChange={(val) => setIncludeCta(val as CtaPreference)}
                          options={CTA_OPTIONS}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    color="tertiary"
                    size="sm"
                    onClick={onCancel}
                    isDisabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={handleSubmit}
                    isDisabled={!isValid || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CreatePostCopyForm;
