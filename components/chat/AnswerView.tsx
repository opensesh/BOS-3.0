'use client';

import React from 'react';
import { InlineCitation } from './InlineCitation';
import { BrandResourceCardProps } from './BrandResourceCard';
import { InlineStreamingDisplay, StreamingTrailIndicator } from './InlineStreamingDisplay';
import { UserMessageBubble } from './UserMessageBubble';
import {
  BRAND_PAGE_ROUTES,
  BRAND_SOURCES,
} from '@/lib/brand-knowledge';
import type { QuickActionMetadata } from '@/hooks/useChat';

/**
 * Renders text with inline markdown formatting (bold, italic)
 * Converts **text** to <strong> and *text* to <em>
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Split by bold markers first (**text**)
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Regex to match **bold** text (non-greedy, no newlines)
  const boldRegex = /\*\*([^*\n]+)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the bold text with improved styling
    // Using font-bold for stronger emphasis and full opacity for contrast
    parts.push(
      <strong key={`bold-${match.index}`} className="font-bold text-[var(--fg-primary)]">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no formatting found, return original text
  if (parts.length === 0) {
    return text;
  }

  return <>{parts}</>;
}

export interface SourceInfo {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  title?: string;
  snippet?: string;
  // Extended for different source types
  type?: 'external' | 'brand-doc' | 'asset' | 'discover';
  path?: string;
  thumbnail?: string;
  // Discover-specific fields
  category?: string; // RSS category (e.g., 'design-ux', 'branding', 'ai-creative')
  publishedAt?: string;
}

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'list';
  content: string;
  level?: number; // For headings: 1, 2, 3
  citations?: SourceInfo[];
  items?: string[]; // For lists
}

// Message attachment interface
interface MessageAttachment {
  id: string;
  type: 'image';
  data: string;
  mimeType: string;
  name?: string;
}

interface AnswerViewProps {
  query: string;
  sections: ContentSection[];
  sources: SourceInfo[];
  isStreaming?: boolean;
  showCitations?: boolean;
  resourceCards?: BrandResourceCardProps[];
  /** Claude's thinking/reasoning content during extended thinking */
  thinking?: string;
  /** Attached images from user message */
  attachments?: MessageAttachment[];
  /** Hide the sources counter (when canvas shows it separately) */
  hideSourcesCounter?: boolean;
  /** Quick action metadata for form-based submissions */
  quickAction?: QuickActionMetadata;
}

export function AnswerView({
  query,
  sections,
  sources,
  isStreaming = false,
  showCitations = true,
  resourceCards = [],
  thinking,
  attachments,
  hideSourcesCounter = false,
  quickAction,
}: AnswerViewProps) {
  // Group sources by index for citation display
  const getSourcesForCitation = (citations?: SourceInfo[]): SourceInfo[] => {
    if (!citations || citations.length === 0) return [];
    return citations;
  };

  return (
    <div>
      {/* User Query Display - Right aligned bubble with show more */}
      <UserMessageBubble query={query} attachments={attachments} quickAction={quickAction} />

      {/* 
        IMPORTANT: Response Layout Structure
        
        The ThinkingBubble (reasoning) ALWAYS stays positioned ABOVE the response content.
        This is intentional UX - users see the reasoning first, then the response.
        The reasoning never moves to the bottom with other inline actions.
        
        Layout order:
        1. User message bubble (above)
        2. ThinkingBubble / reasoning display (if extended thinking is enabled)
        3. Response content sections (canvas is handled by ChatContent)
        4. Streaming indicator (only while text is arriving)
      */}
      
      {/* Reasoning Display - ALWAYS positioned above response content */}
      <InlineStreamingDisplay
        thinking={thinking}
        isStreaming={isStreaming}
        hasContent={sections.length > 0}
      />

      {/* Answer Content - Appears below reasoning and canvas */}
      <div className="space-y-3">
        {sections.map((section, idx) => {
          if (section.type === 'heading') {
            const level = section.level || 2;
            // Improved heading styles with subtle left border accent
            // Uses brand color for visual hierarchy without being overwhelming
            const baseStyles = 'font-bold text-[var(--fg-primary)]';
            const accentStyles = 'pl-3 border-l-2 border-[var(--fg-brand-primary)]/40';

            // H1: Largest, most prominent - with accent border
            if (level === 1) {
              return (
                <h1 key={idx} className={`${baseStyles} ${accentStyles} text-[18px] mt-6 mb-2`}>
                  {renderInlineMarkdown(section.content)}
                </h1>
              );
            }

            // H2: Secondary heading - with accent border
            if (level === 2) {
              return (
                <h2 key={idx} className={`${baseStyles} ${accentStyles} text-[17px] mt-5 mb-1.5`}>
                  {renderInlineMarkdown(section.content)}
                </h2>
              );
            }

            // H3: Tertiary heading - no border, just bold styling
            return (
              <h3 key={idx} className={`${baseStyles} text-[16px] mt-4 mb-1 text-[var(--fg-secondary)]`}>
                {renderInlineMarkdown(section.content)}
              </h3>
            );
          }

          if (section.type === 'list' && section.items) {
            return (
              <ul key={idx} className="space-y-0.5 pl-5 list-disc marker:text-[var(--fg-tertiary)]">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-[15px] leading-[1.6] text-[var(--fg-primary)]/90 pl-1">
                    {renderInlineMarkdown(item)}
                  </li>
                ))}
              </ul>
            );
          }

          // Paragraph with optional inline citations
          const sectionSources = getSourcesForCitation(section.citations);
          
          return (
            <p
              key={idx}
              className="text-[15px] leading-[1.6] text-[var(--fg-primary)]/90"
            >
              {renderInlineMarkdown(section.content)}
              {showCitations && sectionSources.length > 0 && (
                <>
                  {' '}
                  <InlineCitation
                    sources={sectionSources}
                    primarySource={sectionSources[0].name}
                    additionalCount={sectionSources.length - 1}
                  />
                </>
              )}
            </p>
          );
        })}
        
        {/* Streaming trail indicator - shows AFTER content while text is arriving */}
        <StreamingTrailIndicator
          isStreaming={isStreaming}
          hasContent={sections.length > 0}
        />
      </div>
    </div>
  );
}

// Helper function to parse markdown-like content into sections
export function parseContentToSections(
  content: string,
  sources: SourceInfo[] = []
): ContentSection[] {
  // Strip out any raw <thinking>...</thinking> tags that the model might output
  // This can happen when extended thinking is off but the model still outputs thinking-style text
  let cleanedContent = content
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<thinking>[\s\S]*/gi, '') // Handle unclosed tags (still streaming)
    .trim();

  // IMPORTANT: Ensure markdown heading markers are on their own lines
  // Claude sometimes outputs headings inline like "...text.## Heading" without newlines
  // This preprocessing ensures proper heading detection by adding newlines before # markers
  cleanedContent = cleanedContent
    // Add newline before heading markers that aren't already at line start
    // Pattern: any char (not newline) followed by 1-3 # and then space or capital letter
    .replace(/([^\n])(#{1,3})(\s*)([A-Z])/g, '$1\n$2 $4')
    // Normalize heading format: ensure space after # markers
    .replace(/^(#{1,3})([A-Z])/gm, '$1 $2')
    .trim();
  
  const lines = cleanedContent.split('\n');
  const sections: ContentSection[] = [];
  let currentParagraph = '';
  let currentList: string[] = [];
  let inList = false;

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      // Find numbered citation markers (e.g., [1], [2])
      const numberedCitationRegex = /\[(\d+)\]/g;
      // Find brand source citation markers (e.g., [source:brand_identity])
      const brandCitationRegex = /\[source:(\w+)\]/g;

      const citations: SourceInfo[] = [];

      // Process numbered citations
      const numberedMatches = currentParagraph.match(numberedCitationRegex);
      if (numberedMatches) {
        numberedMatches.forEach((match) => {
          const index = parseInt(match.replace(/[\[\]]/g, ''), 10) - 1;
          if (sources[index]) {
            citations.push({ ...sources[index], type: 'external' });
          }
        });
      }

      // Process brand source citations
      const brandMatches = currentParagraph.match(brandCitationRegex);
      if (brandMatches) {
        brandMatches.forEach((match) => {
          const sourceId = match.replace(/\[source:|]/g, '');
          const brandSource = BRAND_SOURCES[sourceId];
          if (brandSource) {
            citations.push({
              id: brandSource.id,
              name: brandSource.name,
              url: brandSource.path,
              title: brandSource.title,
              snippet: brandSource.snippet,
              type: 'brand-doc',
              path: brandSource.path,
            });
          }
        });
      }

      // Clean content of all citation and resource markers
      const resourceMarkerRegex = /\[resource:\w+(?:-\w+)?\]/g;
      const cleanContent = currentParagraph
        .replace(numberedCitationRegex, '')
        .replace(brandCitationRegex, '')
        .replace(resourceMarkerRegex, '')
        .trim();

      sections.push({
        type: 'paragraph',
        content: cleanContent,
        citations: citations.length > 0 ? citations : undefined,
      });
      currentParagraph = '';
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      // Convert bullet lists with 4+ items into prose paragraphs
      // This creates more readable, flowing text
      if (currentList.length >= 4 && !containsCodeOrPaths(currentList)) {
        // Join list items into a flowing paragraph
        const proseContent = convertListToProse(currentList);
        sections.push({
          type: 'paragraph',
          content: proseContent,
        });
      } else {
        // Keep as list for short lists or technical content
        sections.push({
          type: 'list',
          content: '',
          items: [...currentList],
        });
      }
      currentList = [];
      inList = false;
    }
  };

  for (const line of lines) {
    // Check for headings
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    
    // Check for list items
    const listMatch = line.match(/^[-*]\s+(.+)$/);
    const numberedListMatch = line.match(/^\d+\.\s+(.+)$/);

    // Helper to clean markers from any content
    const cleanMarkers = (text: string) => text
      .replace(/\[\d+\]/g, '')
      .replace(/\[source:\w+\]/g, '')
      .replace(/\[resource:\w+(?:-\w+)?\]/g, '')
      .trim();

    if (h1Match) {
      flushParagraph();
      flushList();
      sections.push({ type: 'heading', content: cleanMarkers(h1Match[1]), level: 1 });
    } else if (h2Match) {
      flushParagraph();
      flushList();
      sections.push({ type: 'heading', content: cleanMarkers(h2Match[1]), level: 2 });
    } else if (h3Match) {
      flushParagraph();
      flushList();
      sections.push({ type: 'heading', content: cleanMarkers(h3Match[1]), level: 3 });
    } else if (listMatch || numberedListMatch) {
      flushParagraph();
      inList = true;
      currentList.push(cleanMarkers((listMatch || numberedListMatch)![1]));
    } else if (line.trim() === '') {
      flushParagraph();
      flushList();
    } else {
      if (inList) {
        flushList();
      }
      currentParagraph += (currentParagraph ? ' ' : '') + line.trim();
    }
  }

  flushParagraph();
  flushList();
  return sections;
}

/**
 * Check if list items contain code, paths, or technical content that should remain as bullets
 */
function containsCodeOrPaths(items: string[]): boolean {
  const technicalPatterns = [
    /^\/[\w-]+/, // File paths starting with /
    /\.(svg|png|jpg|woff2?|ttf|css|js|tsx?)/, // File extensions
    /#[0-9A-Fa-f]{3,8}/, // Hex colors
    /^\d+(\.\d+)?px/, // Pixel values
    /^[A-Z][a-z]+:/, // Label: value format
    /`[^`]+`/, // Inline code
    /^\d+\.\s/, // Numbered steps
  ];
  
  return items.some(item => 
    technicalPatterns.some(pattern => pattern.test(item))
  );
}

/**
 * Convert a list of bullet points into flowing prose
 */
function convertListToProse(items: string[]): string {
  // Clean up items and join with appropriate connectors
  const cleaned = items.map(item => {
    // Remove leading bullet-like characters and clean up
    let text = item.trim();
    // Ensure first letter is lowercase for joining (unless it's a proper noun)
    if (text.length > 0 && text[0] === text[0].toUpperCase() && !isProperNoun(text)) {
      text = text[0].toLowerCase() + text.slice(1);
    }
    // Remove trailing periods for joining
    text = text.replace(/\.$/, '');
    return text;
  });

  // Build prose with varied connectors
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0] + '.';
  if (cleaned.length === 2) return `${capitalizeFirst(cleaned[0])} and ${cleaned[1]}.`;
  
  // For 3+ items, create flowing prose
  const connectors = ['Additionally,', 'Furthermore,', 'Also,', 'This includes', 'Moreover,'];
  let result = capitalizeFirst(cleaned[0]);
  
  for (let i = 1; i < cleaned.length; i++) {
    if (i === cleaned.length - 1) {
      // Last item
      result += `, and ${cleaned[i]}`;
    } else if (i % 3 === 0 && i < cleaned.length - 1) {
      // Every 3rd item, start a new sentence for readability
      result += `. ${connectors[i % connectors.length]} ${cleaned[i]}`;
    } else {
      result += `, ${cleaned[i]}`;
    }
  }
  
  return result + '.';
}

/**
 * Check if text starts with a proper noun (simple heuristic)
 */
function isProperNoun(text: string): boolean {
  const properNounPatterns = [
    /^(Open Session|OPEN SESSION|Neue Haas|OffBit|Brand OS|BOS)/i,
    /^[A-Z][a-z]+\s+[A-Z]/, // Two capitalized words
  ];
  return properNounPatterns.some(p => p.test(text));
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text[0].toUpperCase() + text.slice(1);
}

/**
 * Extract resource cards from AI response content
 * Parses [resource:topic] markers and returns card props
 */
export function extractResourceCards(content: string): BrandResourceCardProps[] {
  const resourceRegex = /\[resource:(\w+(?:-\w+)?)\]/g;
  const cards: BrandResourceCardProps[] = [];
  const seenHrefs = new Set<string>();
  let match;

  while ((match = resourceRegex.exec(content)) !== null) {
    const topic = match[1];
    const route = BRAND_PAGE_ROUTES[topic];

    if (route && !seenHrefs.has(route.href)) {
      seenHrefs.add(route.href);
      cards.push({
        title: route.title,
        description: route.description,
        href: route.href,
        icon: route.icon,
        thumbnail: route.thumbnail,
      });
    }
  }

  return cards;
}

/**
 * Remove resource markers from content for display
 */
export function cleanResourceMarkers(content: string): string {
  return content.replace(/\[resource:\w+(?:-\w+)?\]/g, '').trim();
}

/**
 * Valid asset types for carousels
 */
export type ParsedAssetType = 'logos' | 'fonts' | 'art-direction' | 'textures' | 'illustrations';

/**
 * Parse asset tags from AI response content
 * Looks for <asset type="..." /> tags and extracts the types
 * Returns array of asset types found (supports multiple)
 */
export function parseAssetTags(content: string): {
  assetTypes: ParsedAssetType[];
  cleanContent: string;
} {
  const validTypes: ParsedAssetType[] = ['logos', 'fonts', 'art-direction', 'textures', 'illustrations'];
  const assetTypes: ParsedAssetType[] = [];
  
  // Match both self-closing and regular tags
  // <asset type="logos" /> or <asset type="logos"></asset>
  const assetRegex = /<asset\s+type="([^"]+)"\s*\/?>/gi;
  let match;

  while ((match = assetRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase() as ParsedAssetType;
    if (validTypes.includes(type) && !assetTypes.includes(type)) {
      assetTypes.push(type);
    }
  }

  // Clean content by removing asset tags
  // This preserves the text before/between/after tags
  const cleanContent = content
    .replace(/<asset\s+type="[^"]+"\s*\/?>/gi, '')
    .replace(/<\/asset>/gi, '')
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();

  return { assetTypes, cleanContent };
}

/**
 * Check if content contains asset tags
 */
export function hasAssetTags(content: string): boolean {
  return /<asset\s+type="[^"]+"\s*\/?>/i.test(content);
}

/**
 * Canvas response format from AI
 */
export interface CanvasResponse {
  action: 'create' | 'update';
  title: string;
  content: string;
  /** Whether the canvas is still being streamed (no closing tag yet) */
  isStreaming?: boolean;
}

/**
 * Parse canvas response from AI content
 * Looks for <canvas> tags in the response
 * Handles both complete and streaming (partial) canvas tags
 */
export function parseCanvasResponse(content: string): { 
  canvas: CanvasResponse | null; 
  cleanContent: string;
  /** Text that appears before the canvas tag (acknowledgment) */
  preamble: string;
} {
  // First, try to match complete <canvas ...>content</canvas>
  const completeCanvasRegex = /<canvas\s+([^>]*)>([\s\S]*?)<\/canvas>/i;
  const completeMatch = content.match(completeCanvasRegex);

  if (completeMatch) {
    const [fullMatch, attributes, canvasContent] = completeMatch;

    // Parse title from attributes
    const titleMatch = attributes.match(/title="([^"]+)"/);
    const actionMatch = attributes.match(/action="(create|update)"/);

    if (!titleMatch) {
      // Canvas tag without title - treat as regular content
      return { canvas: null, cleanContent: content, preamble: '' };
    }

    const title = titleMatch[1];
    const action = actionMatch ? (actionMatch[1] as 'create' | 'update') : 'create';
    
    // Extract preamble (text before the canvas tag)
    const canvasStartIndex = content.indexOf('<canvas');
    const preamble = canvasStartIndex > 0 ? content.slice(0, canvasStartIndex).trim() : '';
    
    // Clean content is the preamble only (canvas is shown in bubble)
    const cleanContent = preamble;

    return {
      canvas: {
        action,
        title,
        content: canvasContent.trim(),
        isStreaming: false,
      },
      cleanContent,
      preamble,
    };
  }

  // Check for streaming/partial canvas tag (opening tag present but no closing tag)
  const partialCanvasRegex = /<canvas\s+([^>]*)>([\s\S]*)$/i;
  const partialMatch = content.match(partialCanvasRegex);

  if (partialMatch) {
    const [, attributes, canvasContent] = partialMatch;

    // Parse title from attributes
    const titleMatch = attributes.match(/title="([^"]+)"/);
    const actionMatch = attributes.match(/action="(create|update)"/);

    if (!titleMatch) {
      // Canvas tag without title - still streaming attributes, hide everything after <canvas
      const canvasStartIndex = content.indexOf('<canvas');
      const cleanContent = canvasStartIndex > 0 ? content.slice(0, canvasStartIndex).trim() : '';
      return { canvas: null, cleanContent, preamble: cleanContent };
    }

    const title = titleMatch[1];
    const action = actionMatch ? (actionMatch[1] as 'create' | 'update') : 'create';
    
    // Extract preamble (text before the canvas tag)
    const canvasStartIndex = content.indexOf('<canvas');
    const preamble = canvasStartIndex > 0 ? content.slice(0, canvasStartIndex).trim() : '';
    
    // Clean content is the preamble only
    const cleanContent = preamble;

    return {
      canvas: {
        action,
        title,
        content: canvasContent.trim(),
        isStreaming: true,
      },
      cleanContent,
      preamble,
    };
  }

  // No canvas tag found at all
  return { canvas: null, cleanContent: content, preamble: '' };
}

/**
 * Check if content contains a canvas response (complete or streaming)
 */
export function hasCanvasResponse(content: string): boolean {
  // Check for canvas tag with title attribute (in any position)
  return /<canvas\s+[^>]*title="[^"]+"[^>]*>/i.test(content);
}

/**
 * Check if content contains a streaming/partial canvas (opening tag but no closing)
 */
export function isStreamingCanvas(content: string): boolean {
  const hasOpeningTag = /<canvas\s+[^>]*title="[^"]+"[^>]*>/i.test(content);
  const hasClosingTag = /<\/canvas>/i.test(content);
  return hasOpeningTag && !hasClosingTag;
}
