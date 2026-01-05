/**
 * Utility functions for text processing
 */

/**
 * Strip markdown formatting from text to create clean preview text
 * Removes headers, bold, italic, links, code blocks, etc.
 * 
 * Think of this like removing all the "style layers" from your text in Figma
 * - It removes the visual formatting while keeping the actual content
 * - Perfect for creating preview snippets that don't show markdown symbols
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove headers (# ## ### etc)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // Remove inline code (`code`)
    .replace(/`(.+?)`/g, '$1')
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove list markers (- or * or 1. etc)
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove HTML tags (just in case)
    .replace(/<[^>]+>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Create a preview snippet from text
 * Strips markdown and limits to specified length
 * 
 * @param text - The full text content
 * @param maxLength - Maximum length of preview (default: 100)
 * @returns Clean preview text without markdown formatting
 */
export function createPreview(text: string, maxLength: number = 100): string {
  const cleaned = stripMarkdown(text);
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate at word boundary if possible
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    // If we found a space in the last 20% of the text, use it
    return truncated.slice(0, lastSpace);
  }
  
  return truncated;
}

