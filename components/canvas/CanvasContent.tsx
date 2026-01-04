'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { CanvasViewMode } from '@/lib/canvas-context';

interface CanvasContentProps {
  /** Markdown content */
  content: string;
  /** View mode */
  viewMode: CanvasViewMode;
  /** Whether content is being streamed */
  isStreaming?: boolean;
  /** Whether editing is enabled */
  isEditable?: boolean;
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Custom CSS variables for theming */
  themeStyles?: React.CSSProperties;
}

export function CanvasContent({
  content,
  viewMode,
  isStreaming = false,
  isEditable = true,
  onChange,
  themeStyles = {},
}: CanvasContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  // Handle content change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  // Render source view (editable)
  if (viewMode === 'source') {
    return (
      <div 
        className="flex-1 overflow-hidden bg-[var(--bg-primary)]"
        style={themeStyles}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          readOnly={!isEditable}
          className="w-full h-full p-6 font-mono text-sm bg-transparent text-[var(--fg-primary)] resize-none focus:outline-none"
          placeholder="Start typing..."
          spellCheck={false}
        />
        {isStreaming && (
          <motion.span
            className="inline-block w-[2px] h-4 bg-[var(--fg-brand-primary)] ml-0.5"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>
    );
  }

  // Render preview view (rendered markdown)
  return (
    <div 
      ref={previewRef}
      className="flex-1 overflow-auto bg-[var(--bg-primary)]"
      style={themeStyles}
    >
      <div className="w-full max-w-3xl mx-auto p-6">
        <MarkdownRenderer 
          content={content} 
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}

/**
 * Simple markdown renderer
 * Renders markdown content with proper styling
 */
function MarkdownRenderer({ 
  content, 
  isStreaming
}: { 
  content: string; 
  isStreaming?: boolean;
}) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLanguage = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];

  const processInlineMarkdown = (text: string): React.ReactNode => {
    // Process bold, italic, inline code, and links
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Bold **text**
    remaining = remaining.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
      parts.push(<strong key={key++} className="font-semibold">{content}</strong>);
      return '\u0000';
    });

    // Italic *text*
    remaining = remaining.replace(/\*([^*]+)\*/g, (_, content) => {
      parts.push(<em key={key++} className="italic">{content}</em>);
      return '\u0000';
    });

    // Inline code `text`
    remaining = remaining.replace(/`([^`]+)`/g, (_, content) => {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono text-sm">
          {content}
        </code>
      );
      return '\u0000';
    });

    // Links [text](url)
    remaining = remaining.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--fg-brand-primary)] hover:underline"
        >
          {linkText}
        </a>
      );
      return '\u0000';
    });

    // Em dash
    remaining = remaining.replace(/—/g, '—');

    // Build final parts
    if (parts.length === 0) {
      return text;
    }

    const splitParts = remaining.split('\u0000');
    const result: React.ReactNode[] = [];
    
    splitParts.forEach((part, i) => {
      if (part) result.push(part);
      if (i < parts.length) result.push(parts[i]);
    });

    return <>{result}</>;
  };

  lines.forEach((line, index) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre 
            key={`code-${index}`} 
            className="my-4 p-4 rounded-xl bg-[var(--bg-tertiary)] overflow-x-auto w-full"
          >
            <code className={`language-${codeLanguage} font-mono text-sm text-[var(--fg-primary)] block`}>
              {codeContent.join('\n')}
            </code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        codeLanguage = line.slice(3).trim();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    // Table handling
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        return;
      }

      // Skip separator row
      if (cells.every(c => c.match(/^[-:]+$/))) {
        return;
      }

      tableRows.push(cells);
      return;
    } else if (inTable) {
      // End of table, render it
      elements.push(
        <div key={`table-${index}`} className="my-4 overflow-x-auto -mx-2 px-2">
          <table className="w-full min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                {tableHeader.map((cell, i) => (
                  <th 
                    key={i} 
                    className="px-3 py-2 text-left text-sm font-semibold text-[var(--fg-secondary)] whitespace-nowrap"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="border-b border-[var(--border-secondary)]"
                >
                  {row.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className="px-3 py-2 text-sm text-[var(--fg-primary)]"
                    >
                      {processInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }

    // Headers
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={index} className="text-base font-semibold text-[var(--fg-primary)] mt-6 mb-2">
          {processInlineMarkdown(line.slice(5))}
        </h4>
      );
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-semibold text-[var(--fg-primary)] mt-6 mb-2">
          {processInlineMarkdown(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-bold text-[var(--fg-primary)] mt-8 mb-3">
          {processInlineMarkdown(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold text-[var(--fg-primary)] mt-8 mb-4">
          {processInlineMarkdown(line.slice(2))}
        </h1>
      );
      return;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(
        <hr key={index} className="my-6 border-[var(--border-primary)]" />
      );
      return;
    }

    // Unordered list items
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <li key={index} className="ml-4 my-1 text-[var(--fg-primary)] list-disc">
          {processInlineMarkdown(line.slice(2))}
        </li>
      );
      return;
    }

    // Numbered list items
    if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={index} className="ml-4 my-1 text-[var(--fg-primary)] list-decimal">
          {processInlineMarkdown(text)}
        </li>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('>')) {
      elements.push(
        <blockquote
          key={index}
          className="border-l-4 border-[var(--border-brand-primary)] pl-4 my-4 italic text-[var(--fg-secondary)]"
        >
          {processInlineMarkdown(line.slice(1).trim())}
        </blockquote>
      );
      return;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={index} className="h-4" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="my-2 text-[var(--fg-primary)] leading-relaxed">
        {processInlineMarkdown(line)}
      </p>
    );
  });

  // Handle unclosed table at end
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="table-end" className="my-4 overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              {tableHeader.map((cell, i) => (
                <th 
                  key={i} 
                  className="px-3 py-2 text-left text-sm font-semibold text-[var(--fg-secondary)] whitespace-nowrap"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="border-b border-[var(--border-secondary)]"
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className="px-3 py-2 text-sm text-[var(--fg-primary)]"
                  >
                    {processInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="canvas-content w-full">
      {elements}
      {isStreaming && (
        <motion.span
          className="inline-block w-[2px] h-4 bg-[var(--fg-brand-primary)] ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
}

export default CanvasContent;

