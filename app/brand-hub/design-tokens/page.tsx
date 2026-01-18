'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BrandHubLayout } from '@/components/brand-hub/BrandHubLayout';
import { TabSelector } from '@/components/brain/TabSelector';
import { MarkdownCodeViewer } from '@/components/brain/MarkdownCodeViewer';
import { ColorSettingsModal } from '@/components/brand-hub/ColorSettingsModal';
import { TypographySettingsTableModal } from '@/components/brand-hub/TypographySettingsTableModal';
import {
  TokenPreviewSection,
  ColorTokensPreview,
  TypographyTokensPreview,
  SpacingTokensPreview,
  AssetsPreview,
} from '@/components/brand-hub/design-tokens';
import { Download } from 'lucide-react';
import tokens from '@/lib/brand-styles/tokens.json';

// Tab configuration for code files
const tabs = [
  { id: 'tokens', label: 'tokens.json' },
  { id: 'tailwind', label: 'tailwind.config.ts' },
  { id: 'css', label: 'brand.css' },
  { id: 'readme', label: 'README.md' },
  { id: 'ai-context', label: 'AI-CONTEXT.md' },
];

// Map tab IDs to file paths
const filePathMap: Record<string, string> = {
  'tokens': 'tokens.json',
  'tailwind': 'tailwind.config.ts',
  'css': 'brand.css',
  'readme': 'README.md',
  'ai-context': 'AI-CONTEXT.md',
};

// File list for download
const downloadFiles = [
  { path: '/api/styles/tokens.json', name: 'tokens.json' },
  { path: '/api/styles/tailwind.config.ts', name: 'tailwind.config.ts' },
  { path: '/api/styles/brand.css', name: 'brand.css' },
  { path: '/api/styles/README.md', name: 'README.md' },
  { path: '/api/styles/AI-CONTEXT.md', name: 'AI-CONTEXT.md' },
  { path: '/api/styles/fonts/NeueHaasDisplayBold.woff2', name: 'fonts/NeueHaasDisplayBold.woff2' },
  { path: '/api/styles/fonts/NeueHaasDisplayMedium.woff2', name: 'fonts/NeueHaasDisplayMedium.woff2' },
  { path: '/api/styles/fonts/NeueHaasDisplayRoman.woff2', name: 'fonts/NeueHaasDisplayRoman.woff2' },
  { path: '/api/styles/fonts/OffBit-Bold.woff2', name: 'fonts/OffBit-Bold.woff2' },
  { path: '/api/styles/fonts/OffBit-Regular.woff2', name: 'fonts/OffBit-Regular.woff2' },
];

export default function DesignTokensPage() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Modal states
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);

  // Fetch file content when tab changes
  const fetchContent = useCallback(async (tabId: string) => {
    setIsLoading(true);
    try {
      const filename = filePathMap[tabId];
      const response = await fetch(`/api/styles/${filename}`);
      if (response.ok) {
        const text = await response.text();
        setContent(text);
      } else {
        setContent('// Failed to load file content');
      }
    } catch (error) {
      console.error('Error fetching file:', error);
      setContent('// Error loading file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch content on mount and tab change
  useEffect(() => {
    fetchContent(activeTab);
  }, [activeTab, fetchContent]);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Fetch and add each file
      for (const file of downloadFiles) {
        try {
          const response = await fetch(file.path);
          if (response.ok) {
            const fileContent = file.path.endsWith('.woff2')
              ? await response.arrayBuffer()
              : await response.text();
            zip.file(file.name, fileContent);
          }
        } catch (err) {
          console.warn(`Failed to fetch ${file.path}:`, err);
        }
      }

      // Generate and download zip
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brand-os-styles.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      <BrandHubLayout
        title="Tokens"
        description="Your brand packaged into Tailwind code, ready to work with AI models across Webflow, Shopify, Framer, and more."
        headerActions={
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download"
          >
            <Download className={`w-5 h-5 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors ${downloading ? 'animate-pulse' : ''}`} />
          </button>
        }
      >
        <div className="space-y-6">
          {/* Token Preview Sections */}
          <section className="space-y-3">
            {/* Colors */}
            <TokenPreviewSection
              title="Colors"
              badge="3 core + semantic"
              onEdit={() => setIsColorModalOpen(true)}
            >
              <ColorTokensPreview colors={tokens.colors} />
            </TokenPreviewSection>

            {/* Typography */}
            <TokenPreviewSection
              title="Typography"
              badge="2 families, 8 scales"
              onEdit={() => setIsTypographyModalOpen(true)}
            >
              <TypographyTokensPreview typography={tokens.typography} />
            </TokenPreviewSection>

            {/* Spacing */}
            <TokenPreviewSection
              title="Spacing"
              badge="12-step scale"
            >
              <SpacingTokensPreview spacing={tokens.spacing} />
            </TokenPreviewSection>

            {/* Assets */}
            <TokenPreviewSection
              title="Assets"
              badge="5 font files"
            >
              <AssetsPreview fontFiles={tokens.typography.fontFiles} />
            </TokenPreviewSection>
          </section>

          {/* Code Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-[var(--fg-primary)] mb-1">
                Code
              </h2>
              <p className="text-sm text-[var(--fg-tertiary)]">
                Generated Tailwind configuration based on your brand settings. Use these files with AI tools like Claude, Cursor, or Copilot.
              </p>
            </div>

            {/* Tabs */}
            <TabSelector
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            {/* Code Viewer */}
            {isLoading ? (
              <div className="h-[500px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center">
                <div className="text-[var(--fg-tertiary)] text-sm">Loading...</div>
              </div>
            ) : (
              <MarkdownCodeViewer
                filename={filePathMap[activeTab]}
                content={content}
                maxLines={30}
              />
            )}
          </section>
        </div>
      </BrandHubLayout>

      {/* Color Settings Modal */}
      <ColorSettingsModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
      />

      {/* Typography Settings Modal */}
      <TypographySettingsTableModal
        isOpen={isTypographyModalOpen}
        onClose={() => setIsTypographyModalOpen(false)}
      />
    </div>
  );
}
