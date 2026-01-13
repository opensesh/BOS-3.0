'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BrandHubLayout } from '@/components/brand-hub/BrandHubLayout';
import { TypographySettingsTableModal } from '@/components/brand-hub/TypographySettingsTableModal';
import { RefreshCw, Download, ChevronDown, Monitor, Globe, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { useBrandFonts } from '@/hooks/useBrandFonts';
import type { BrandFont } from '@/lib/supabase/types';

type FontFormat = 'desktop' | 'web';

interface TypographyStyle {
  name: string;
  value: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  lineHeight: string;
}

interface TypographySection {
  id: string;
  label: string;
  styles: TypographyStyle[];
  defaultText: string;
  fontClass: string;
  fontPath: string;
  fontFamilyPattern: string; // Pattern to match fonts by name
}

const typographySections: TypographySection[] = [
  {
    id: 'display',
    label: 'Display',
    fontClass: 'font-display',
    fontPath: 'neue-haas-grotesk display',
    fontFamilyPattern: 'NeueHaasDisplay',
    defaultText: 'Brand OS™',
    styles: [
      { name: 'Display 1', value: 'display-1', fontSize: '72px', fontWeight: '700', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.1' },
      { name: 'Display 2', value: 'display-2', fontSize: '56px', fontWeight: '700', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.1' },
      { name: 'Display 3', value: 'display-3', fontSize: '48px', fontWeight: '700', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.1' },
    ],
  },
  {
    id: 'heading',
    label: 'Heading',
    fontClass: 'font-display',
    fontPath: 'neue-haas-grotesk display',
    fontFamilyPattern: 'NeueHaasDisplay',
    defaultText: 'We aspire to be creative problem solvers',
    styles: [
      { name: 'Heading 1', value: 'heading-1', fontSize: '40px', fontWeight: '700', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.2' },
      { name: 'Heading 2', value: 'heading-2', fontSize: '32px', fontWeight: '700', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.2' },
      { name: 'Heading 3', value: 'heading-3', fontSize: '24px', fontWeight: '600', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.3' },
      { name: 'Heading 4', value: 'heading-4', fontSize: '20px', fontWeight: '600', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.3' },
    ],
  },
  {
    id: 'accent',
    label: 'Accent',
    fontClass: 'font-mono',
    fontPath: 'offbit',
    fontFamilyPattern: 'OffBit',
    defaultText: 'Born to Create, Made to Make',
    styles: [
      { name: 'Heading 5', value: 'heading-5', fontSize: '18px', fontWeight: '700', fontFamily: 'OffBit', lineHeight: '1.4' },
      { name: 'Heading 6', value: 'heading-6', fontSize: '14px', fontWeight: '700', fontFamily: 'OffBit', lineHeight: '1.4' },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    fontClass: 'font-sans',
    fontPath: 'neue-haas-grotesk text',
    fontFamilyPattern: 'NeueHaasText',
    defaultText: 'Figma serves as the core design system that integrates essential brand elements. It\'s filled with a rich base of variables for global and semantic tokens that can be translated into multiple styling options.',
    styles: [
      { name: 'Body 1', value: 'body-1', fontSize: '18px', fontWeight: '400', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.6' },
      { name: 'Body 2', value: 'body-2', fontSize: '16px', fontWeight: '400', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.6' },
      { name: 'Body 3', value: 'body-3', fontSize: '14px', fontWeight: '400', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.5' },
      { name: 'Caption', value: 'caption', fontSize: '12px', fontWeight: '400', fontFamily: 'Neue Haas Grotesk Display Pro', lineHeight: '1.5' },
    ],
  },
];

// Helper to filter fonts by format (desktop = ttf/otf, web = woff2)
function filterFontsByFormat(fonts: BrandFont[], format: FontFormat): BrandFont[] {
  const extensions = format === 'desktop' ? ['.ttf', '.otf'] : ['.woff2', '.woff'];
  return fonts.filter(font => {
    const filename = font.filename.toLowerCase();
    return extensions.some(ext => filename.endsWith(ext));
  });
}

// Helper to filter fonts by family pattern
function filterFontsByFamily(fonts: BrandFont[], familyPattern: string): BrandFont[] {
  return fonts.filter(font => {
    const name = font.name.toLowerCase();
    const filename = font.filename.toLowerCase();
    const pattern = familyPattern.toLowerCase();
    return name.includes(pattern) || filename.includes(pattern);
  });
}

function TypographyCard({ 
  section, 
  fonts,
  onRegisterReset 
}: { 
  section: TypographySection;
  fonts: BrandFont[];
  onRegisterReset?: (resetFn: () => void) => void;
}) {
  const [selectedStyle, setSelectedStyle] = useState(section.styles[0]);
  const [text, setText] = useState(section.defaultText);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<FontFormat>('desktop');
  const [isDownloading, setIsDownloading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get fonts for this section filtered by format
  const sectionFonts = useMemo(() => {
    const familyFonts = filterFontsByFamily(fonts, section.fontFamilyPattern);
    return filterFontsByFormat(familyFonts, selectedFormat);
  }, [fonts, section.fontFamilyPattern, selectedFormat]);

  // Auto-resize textarea to hug content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text, selectedStyle]);

  const resetText = () => {
    setText(section.defaultText);
    setSelectedStyle(section.styles[0]);
  };

  // Register reset function with parent (only run once on mount)
  useEffect(() => {
    onRegisterReset?.(resetText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadAll = async () => {
    if (sectionFonts.length === 0) {
      console.warn('No fonts available for download');
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const formatLabel = selectedFormat === 'desktop' ? 'Desktop' : 'Web';
      const folderName = `${section.label}-${formatLabel}`;
      const folder = zip.folder(folderName);

      if (!folder) {
        throw new Error('Failed to create zip folder');
      }

      // Fetch all font files and add to zip
      await Promise.all(
        sectionFonts.map(async (font) => {
          if (!font.publicUrl) return;
          
          try {
            const response = await fetch(font.publicUrl);
            const blob = await response.blob();
            folder.file(font.filename, blob);
          } catch (error) {
            console.error(`Failed to fetch ${font.filename}:`, error);
          }
        })
      );

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${section.id}-fonts-${selectedFormat}.zip`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-brand-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-6 sm:py-8 border-b border-[var(--border-primary)]">
        {/* Left side - Section Label & Reset */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <span className="text-base sm:text-lg font-display font-medium text-[var(--fg-primary)]">
            {section.label}
          </span>
          <button
            onClick={resetText}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-xs sm:text-sm text-[var(--fg-tertiary)]"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Right side - Style Selector, Format Toggle, Download */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Style Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-xs sm:text-sm text-[var(--fg-tertiary)]"
            >
              {selectedStyle.name}
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-36 sm:w-40 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-xl z-10 overflow-hidden">
                {section.styles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      setSelectedStyle(style);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm transition-colors ${
                      style.value === selectedStyle.value
                        ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                        : 'text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Format Toggle - Desktop/Web */}
          <div className="flex items-center rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] p-0.5 sm:p-1">
            <button
              onClick={() => setSelectedFormat('desktop')}
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                selectedFormat === 'desktop'
                  ? 'bg-[var(--bg-brand-solid)] text-[var(--fg-white)]'
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
              }`}
              title="Desktop fonts (TTF/OTF)"
            >
              <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden lg:inline">Desktop</span>
            </button>
            <button
              onClick={() => setSelectedFormat('web')}
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                selectedFormat === 'web'
                  ? 'bg-[var(--bg-brand-solid)] text-[var(--fg-white)]'
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
              }`}
              title="Web fonts (WOFF2)"
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden lg:inline">Web</span>
            </button>
          </div>

          {/* Download All Button */}
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading || sectionFonts.length === 0}
            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-colors ${
              isDownloading || sectionFonts.length === 0
                ? 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--fg-tertiary)] cursor-not-allowed'
                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:border-[var(--border-brand)] hover:bg-[var(--bg-brand-primary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)]'
            }`}
            title={sectionFonts.length > 0 
              ? `Download ${sectionFonts.length} ${section.label} fonts (${selectedFormat === 'desktop' ? 'TTF/OTF' : 'WOFF2'})`
              : 'No fonts available'
            }
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Text Preview */}
      <div className="p-4">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`
            w-full bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] 
            outline-none resize-none rounded-brand-lg
            text-[var(--fg-primary)] ${section.fontClass}
            placeholder:text-[var(--fg-tertiary)]
            px-4 py-4 overflow-hidden
          `}
          style={{
            fontSize: selectedStyle.fontSize,
            fontWeight: selectedStyle.fontWeight,
            lineHeight: selectedStyle.lineHeight,
          }}
          placeholder="Type to preview..."
        />
      </div>

      {/* Style Info */}
      <div className="px-10 pb-8">
        <div className="flex flex-wrap gap-4 text-xs text-[var(--fg-tertiary)] font-mono">
          <span>Family: {selectedStyle.fontFamily}</span>
          <span>Size: {selectedStyle.fontSize}</span>
          <span>Weight: {selectedStyle.fontWeight}</span>
          <span>Line Height: {selectedStyle.lineHeight}</span>
          {sectionFonts.length > 0 && (
            <span className="text-[var(--fg-brand-primary)]">
              {sectionFonts.length} {selectedFormat === 'desktop' ? 'TTF/OTF' : 'WOFF2'} files
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FontsPage() {
  const [cardRefs, setCardRefs] = useState<Record<string, (() => void) | null>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Fetch fonts from Supabase
  const { fonts, isLoading, error, refresh } = useBrandFonts();

  const resetAllSections = () => {
    Object.values(cardRefs).forEach((reset) => reset?.());
  };

  const handleDownloadAll = async () => {
    if (fonts.length === 0) {
      console.warn('No fonts available for download');
      return;
    }

    setIsDownloadingAll(true);

    try {
      const zip = new JSZip();

      // Create folders for Desktop and Web fonts
      const desktopFolder = zip.folder('Desktop');
      const webFolder = zip.folder('Web');

      if (!desktopFolder || !webFolder) {
        throw new Error('Failed to create zip folders');
      }

      // Separate fonts by format
      const desktopFonts = filterFontsByFormat(fonts, 'desktop');
      const webFonts = filterFontsByFormat(fonts, 'web');

      // Download desktop fonts
      await Promise.all(
        desktopFonts.map(async (font) => {
          if (!font.publicUrl) return;
          
          try {
            const response = await fetch(font.publicUrl);
            const blob = await response.blob();
            desktopFolder.file(font.filename, blob);
          } catch (error) {
            console.error(`Failed to fetch ${font.filename}:`, error);
          }
        })
      );

      // Download web fonts
      await Promise.all(
        webFonts.map(async (font) => {
          if (!font.publicUrl) return;
          
          try {
            const response = await fetch(font.publicUrl);
            const blob = await response.blob();
            webFolder.file(font.filename, blob);
          } catch (error) {
            console.error(`Failed to fetch ${font.filename}:`, error);
          }
        })
      );

      // Add a readme file
      const readme = `
BRAND OS™ Typography System
============================

This package contains all font families used in the Brand OS design system.

CONTENTS:
---------

/Desktop/ - Desktop font files (TTF/OTF)
  - ${desktopFonts.length} files

/Web/ - Web font files (WOFF2)
  - ${webFonts.length} files

FONT FAMILIES INCLUDED:
-----------------------

1. NEUE HAAS GROTESK DISPLAY PRO
   Usage: Display text, headings (H1-H4)
   Weights: Various (Light to Black)

2. NEUE HAAS GROTESK TEXT PRO
   Usage: Body copy, paragraphs, captions
   Weights: Various (Light to Bold)

3. OFFBIT
   Usage: Accent text, subheadings (H5-H6), code
   Weights: Regular, Bold

USAGE NOTES:
------------
- Display fonts are for large text (40px+)
- Text fonts are for body copy (12-18px)
- OffBit should be used sparingly (max 2 instances per viewport)
- Minimum 2 size steps between hierarchy levels
`.trim();

      zip.file('README.txt', readme);

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brand-os-typography-system.zip';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
        <Sidebar />
        <BrandHubLayout
          title="Typography"
          description="Our type system uses Neue Haas Grotesk for display and body text, paired with OffBit for accent and monospace needs."
        >
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" />
            <span className="ml-2 text-[var(--fg-tertiary)]">Loading fonts...</span>
          </div>
        </BrandHubLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
        <Sidebar />
        <BrandHubLayout
          title="Typography"
          description="Our type system uses Neue Haas Grotesk for display and body text, paired with OffBit for accent and monospace needs."
        >
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[var(--fg-error-primary)] mb-4">Failed to load fonts</p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </BrandHubLayout>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      <BrandHubLayout
        title="Typography"
        description="Our type system uses Neue Haas Grotesk for display and body text, paired with OffBit for accent and monospace needs."
        onSettingsClick={() => setIsSettingsOpen(true)}
        settingsTooltip="Manage brand fonts"
      >
        {/* Header with Reset All & Download All */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--fg-tertiary)]">
              {typographySections.length} font families • {fonts.length} font files
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || fonts.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs ${
                isDownloadingAll || fonts.length === 0
                  ? 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--fg-tertiary)] cursor-not-allowed'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-brand)] text-[var(--fg-tertiary)]'
              }`}
            >
              {isDownloadingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download All
            </button>
            <button
              onClick={resetAllSections}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-xs text-[var(--fg-tertiary)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {typographySections.map((section) => (
            <TypographyCard
              key={section.id}
              section={section}
              fonts={fonts}
              onRegisterReset={(resetFn) => {
                setCardRefs((prev) => ({ ...prev, [section.id]: resetFn }));
              }}
            />
          ))}
        </div>
      </BrandHubLayout>

      {/* Typography Settings Table Modal */}
      <TypographySettingsTableModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
