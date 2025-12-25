'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Share2,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  SquareSlash,
  FileText,
  FileCode,
  FileDown,
  Globe,
  Hexagon,
  Compass,
  Rss,
} from 'lucide-react';
import { SourceInfo } from './AnswerView';
import { BrandResourceCardProps } from './BrandResourceCard';
import { ShortcutModal } from './ShortcutModal';
import { SourcesDrawer } from './SourcesDrawer';

interface ResponseActionsProps {
  sources?: SourceInfo[];
  resourceCards?: BrandResourceCardProps[];
  content?: string;
  query?: string;
  onShare?: () => void;
  onRegenerate?: () => void;
  showSources?: boolean;
  modelUsed?: string;
}

// Custom Tooltip component
function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs text-[var(--fg-primary)] whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all pointer-events-none z-50 shadow-lg">
        {label}
      </div>
    </div>
  );
}

export function ResponseActions({
  sources = [],
  resourceCards = [],
  content = '',
  query = '',
  onShare,
  onRegenerate,
  showSources = false,
  modelUsed,
}: ResponseActionsProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      if (onShare) onShare();
      setTimeout(() => setShared(false), 3000);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const handleExport = async (format: 'pdf' | 'markdown' | 'docx') => {
    setShowExportMenu(false);
    
    if (format === 'markdown') {
      // Download as markdown
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'response.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // For PDF, we'll use the browser's print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Export</title></head>
            <body style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
              ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } else if (format === 'docx') {
      // For DOCX, download as text file (simplified)
      const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'response.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Check if Perplexity model is used
  const isPerplexityModel = modelUsed?.includes('sonar') || modelUsed?.includes('perplexity');
  
  // Separate sources by type
  const { discoverSources, webSources } = useMemo(() => {
    const discover: SourceInfo[] = [];
    const web: SourceInfo[] = [];
    
    sources.forEach(source => {
      if (source.type === 'discover') {
        discover.push(source);
      } else {
        web.push(source);
      }
    });
    
    return { discoverSources: discover, webSources: web };
  }, [sources]);

  const hasDiscoverSources = discoverSources.length > 0;
  const hasWebSources = webSources.length > 0;
  const hasBrandResources = resourceCards.length > 0;
  const totalSourcesCount = sources.length + resourceCards.length;
  const hasAnySourcesData = hasDiscoverSources || hasWebSources || hasBrandResources;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 py-3 mt-4">
        {/* Left side - action buttons */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* Share button */}
          <Tooltip label={shared ? 'Link copied!' : 'Share'}>
            <button
              onClick={handleShare}
              className={`
                p-2 rounded-lg transition-colors
                ${shared 
                  ? 'text-[var(--fg-success-primary)]' 
                  : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
            >
              {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </button>
          </Tooltip>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Tooltip label="Export">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${showExportMenu 
                    ? 'text-[var(--fg-primary)] bg-[var(--bg-secondary)]' 
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                <Download className="w-4 h-4" />
              </button>
            </Tooltip>

            {showExportMenu && (
              <div className="absolute left-0 top-full mt-1 w-40 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] shadow-xl z-50 py-1">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExport('markdown')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Markdown</span>
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--fg-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>DOCX</span>
                </button>
              </div>
            )}
          </div>

          {/* Regenerate */}
          <Tooltip label="Regenerate">
            <button
              onClick={onRegenerate}
              className="p-2 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Shortcut button - SquareSlash icon */}
          <Tooltip label="Save as shortcut">
            <button
              onClick={() => setShowShortcutModal(true)}
              className="p-2 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <SquareSlash className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Sources button - only interactive when sources exist */}
          {hasAnySourcesData ? (
            <button
              onClick={() => setShowSourcesDrawer(true)}
              className="flex items-center gap-2 ml-2 px-2.5 py-1.5 rounded-full bg-[var(--bg-secondary)]/80 hover:bg-[var(--bg-secondary)] border border-[var(--border-secondary)] transition-colors group"
            >
              {/* Stacked source icons - show up to 4 icons representing different source types */}
              <div className="flex -space-x-1">
                {/* Show discover source icons first (cyan) */}
                {discoverSources.slice(0, hasWebSources || hasBrandResources ? 1 : 2).map((source, idx) => (
                  <div
                    key={source.id || `discover-${idx}`}
                    className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center"
                  >
                    <Rss className="w-2.5 h-2.5 text-cyan-400" />
                  </div>
                ))}
                {/* Show web source favicons */}
                {webSources.slice(0, hasDiscoverSources ? 1 : (hasBrandResources ? 2 : 3)).map((source, idx) => (
                  <div
                    key={source.id || `web-${idx}`}
                    className="w-5 h-5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center"
                  >
                    {source.favicon ? (
                      <img src={source.favicon} alt="" className="w-3 h-3 rounded" />
                    ) : (
                      <Globe className="w-2.5 h-2.5 text-[var(--fg-tertiary)]" />
                    )}
                  </div>
                ))}
                {/* Show brand icon if we have brand resources */}
                {hasBrandResources && (
                  <div className="w-5 h-5 rounded-full bg-[var(--bg-brand-primary)] border border-[var(--border-brand)]/30 flex items-center justify-center">
                    <Hexagon className="w-2.5 h-2.5 text-[var(--fg-brand-primary)]" />
                  </div>
                )}
              </div>
              <span className="text-[13px] text-[var(--fg-tertiary)] group-hover:text-[var(--fg-primary)] transition-colors">
                {totalSourcesCount} {totalSourcesCount === 1 ? 'source' : 'sources'}
              </span>
            </button>
          ) : (
            /* Disabled icon when no sources - just the icon, no button styling */
            <Tooltip label="No related links">
              <div className="p-2 ml-2">
                <Globe className="w-4 h-4 text-[var(--fg-tertiary)]/50" />
              </div>
            </Tooltip>
          )}
        </div>

        {/* Right side - feedback and copy */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Tooltip label="Good response">
            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  feedback === 'up'
                    ? 'text-[var(--fg-brand-primary)] bg-[var(--bg-brand-primary)]'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip label="Poor response">
            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  feedback === 'down'
                    ? 'text-[var(--fg-error-primary)] bg-[var(--bg-error-primary)]'
                    : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip label={copied ? 'Copied!' : 'Copy'}>
            <button
              onClick={handleCopy}
              className="p-2 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[var(--fg-success-primary)]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Share toast notification */}
      {shared && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 shadow-xl animate-fade-in">
          <Check className="w-4 h-4 text-[var(--fg-success-primary)]" />
          <span className="text-sm text-[var(--fg-primary)]">Link copied. Paste to share</span>
        </div>
      )}

      {/* Shortcut Modal */}
      <ShortcutModal
        isOpen={showShortcutModal}
        onClose={() => setShowShortcutModal(false)}
        defaultInstructions=""
        defaultName={query ? `/${query.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '/new-shortcut'}
      />

      {/* Sources Drawer */}
      <SourcesDrawer
        isOpen={showSourcesDrawer}
        onClose={() => setShowSourcesDrawer(false)}
        sources={sources}
        resourceCards={resourceCards}
        query={query}
      />
    </>
  );
}
