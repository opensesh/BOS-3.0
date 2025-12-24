'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  FileText,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Edit3,
  Eye,
  Play,
  X,
} from 'lucide-react';

type ArtifactType = 'code' | 'diagram' | 'document' | 'chart' | 'html' | 'svg' | 'markdown' | 'json' | 'csv';

interface ArtifactRendererProps {
  /** Unique identifier for the artifact */
  id?: string;
  /** Type of artifact */
  type: ArtifactType;
  /** Title for the artifact */
  title?: string;
  /** The content to render */
  content: string;
  /** Programming language (for code artifacts) */
  language?: string;
  /** Whether the artifact can be edited */
  editable?: boolean;
  /** Whether to show in fullscreen mode */
  fullscreen?: boolean;
  /** Callback when artifact is edited */
  onEdit?: (newContent: string) => void;
  /** Callback when artifact is downloaded */
  onDownload?: () => void;
}

// Language to file extension mapping
const languageExtensions: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  html: 'html',
  css: 'css',
  json: 'json',
  markdown: 'md',
  mermaid: 'mmd',
  svg: 'svg',
  csv: 'csv',
};

// Type to icon mapping
const typeIcons: Record<ArtifactType, React.ComponentType<{ className?: string }>> = {
  code: Code,
  diagram: ImageIcon,
  document: FileText,
  chart: ImageIcon,
  html: Code,
  svg: ImageIcon,
  markdown: FileText,
  json: Code,
  csv: FileText,
};

/**
 * ArtifactRenderer Component
 * 
 * Renders different types of artifacts with preview, editing, and download capabilities.
 */
export function ArtifactRenderer({
  id,
  type,
  title,
  content,
  language,
  editable = false,
  fullscreen: initialFullscreen = false,
  onEdit,
  onDownload,
}: ArtifactRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [showPreview, setShowPreview] = useState(type === 'html' || type === 'svg');

  const Icon = typeIcons[type] || Code;
  const displayTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Artifact`;

  // Get file extension for download
  const fileExtension = useMemo(() => {
    if (language && languageExtensions[language]) {
      return languageExtensions[language];
    }
    return languageExtensions[type] || 'txt';
  }, [language, type]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  // Download artifact
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'artifact'}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, title, fileExtension, onDownload]);

  // Save edits
  const handleSaveEdit = useCallback(() => {
    if (onEdit) {
      onEdit(editContent);
    }
    setIsEditing(false);
  }, [editContent, onEdit]);

  // Cancel edits
  const handleCancelEdit = useCallback(() => {
    setEditContent(content);
    setIsEditing(false);
  }, [content]);

  // Render content based on type
  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full h-full min-h-[200px] p-4 font-mono text-sm bg-transparent text-[var(--fg-primary)] resize-none focus:outline-none"
          spellCheck={false}
        />
      );
    }

    // Preview for HTML/SVG
    if (showPreview && (type === 'html' || type === 'svg')) {
      return (
        <div className="w-full h-full min-h-[200px] bg-white p-4 rounded-lg">
          <div
            dangerouslySetInnerHTML={{ __html: content }}
            className="w-full h-full"
          />
        </div>
      );
    }

    // Code view
    return (
      <pre className="w-full h-full min-h-[200px] p-4 overflow-auto">
        <code className="font-mono text-sm text-[var(--fg-primary)] whitespace-pre-wrap">
          {content}
        </code>
      </pre>
    );
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[var(--bg-primary)]'
    : 'rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/50 overflow-hidden';

  return (
    <motion.div
      layout
      className={containerClass}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--bg-brand-primary)]/10">
            <Icon className="w-4 h-4 text-[var(--fg-brand-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--fg-primary)]">{displayTitle}</h3>
            {language && (
              <span className="text-xs text-[var(--fg-tertiary)]">{language}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Preview toggle for HTML/SVG */}
          {(type === 'html' || type === 'svg') && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
              title={showPreview ? 'Show code' : 'Show preview'}
            >
              {showPreview ? (
                <Code className="w-4 h-4 text-[var(--fg-tertiary)]" />
              ) : (
                <Eye className="w-4 h-4 text-[var(--fg-tertiary)]" />
              )}
            </button>
          )}

          {/* Edit button */}
          {editable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4 text-[var(--fg-tertiary)]" />
            </button>
          )}

          {/* Save/Cancel for editing */}
          {isEditing && (
            <>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-brand-solid)] text-white hover:opacity-90 transition-opacity"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4 text-[var(--fg-tertiary)]" />
              </button>
            </>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
            title="Copy"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--fg-success-primary)]" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--fg-tertiary)]" />
            )}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4 text-[var(--fg-tertiary)]" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[var(--fg-tertiary)]" />
            ) : (
              <Maximize2 className="w-4 h-4 text-[var(--fg-tertiary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-60px)]' : 'max-h-[400px]'} overflow-auto bg-[var(--bg-primary)]`}>
        {renderContent()}
      </div>
    </motion.div>
  );
}

/**
 * ArtifactList Component
 * 
 * Renders a list of artifacts.
 */
interface Artifact {
  id: string;
  type: ArtifactType;
  title?: string;
  content: string;
  language?: string;
}

export function ArtifactList({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) return null;

  return (
    <div className="space-y-4 my-4">
      {artifacts.map((artifact) => (
        <ArtifactRenderer
          key={artifact.id}
          id={artifact.id}
          type={artifact.type}
          title={artifact.title}
          content={artifact.content}
          language={artifact.language}
          editable={true}
        />
      ))}
    </div>
  );
}

/**
 * Compact Artifact Preview
 * Shows a small preview of an artifact that expands on click
 */
export function ArtifactPreview({ 
  artifact, 
  onClick 
}: { 
  artifact: Artifact; 
  onClick?: () => void;
}) {
  const Icon = typeIcons[artifact.type] || Code;
  const displayTitle = artifact.title || `${artifact.type} artifact`;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-secondary)] hover:border-[var(--border-brand-primary)] hover:bg-[var(--bg-brand-primary)]/5 transition-colors text-left w-full"
    >
      <div className="p-2 rounded-lg bg-[var(--bg-brand-primary)]/10">
        <Icon className="w-4 h-4 text-[var(--fg-brand-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[var(--fg-primary)] truncate">
          {displayTitle}
        </h4>
        <p className="text-xs text-[var(--fg-tertiary)] truncate">
          {artifact.language || artifact.type} • {artifact.content.length} chars
        </p>
      </div>
      <Maximize2 className="w-4 h-4 text-[var(--fg-tertiary)]" />
    </button>
  );
}

export default ArtifactRenderer;

