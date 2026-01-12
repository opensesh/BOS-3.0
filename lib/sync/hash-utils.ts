/**
 * Hash utilities for change detection in the sync system
 *
 * Uses SHA-256 for content hashing to detect changes between
 * local files and database content.
 */

import { createHash } from 'crypto';

/**
 * Compute SHA-256 hash of content
 */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Check if content has changed based on hash comparison
 */
export function contentChanged(
  oldHash: string | null | undefined,
  newHash: string
): boolean {
  if (!oldHash) return true;
  return oldHash !== newHash;
}

/**
 * Normalize content for consistent hashing
 *
 * This ensures the same content produces the same hash regardless of:
 * - Line ending differences (CRLF vs LF)
 * - Trailing whitespace on lines
 * - Trailing newlines at end of file
 */
export function normalizeContent(content: string): string {
  return (
    content
      // Normalize line endings to LF
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove trailing whitespace from each line
      .replace(/[ \t]+$/gm, '')
      // Ensure single trailing newline
      .trim() + '\n'
  );
}

/**
 * Compute hash of normalized content
 *
 * This is the primary method for generating hashes that can be
 * compared between local files and database content.
 */
export function computeNormalizedHash(content: string): string {
  return computeContentHash(normalizeContent(content));
}

/**
 * Compare two content strings for equality (ignoring formatting differences)
 */
export function contentEquals(content1: string, content2: string): boolean {
  return normalizeContent(content1) === normalizeContent(content2);
}

/**
 * Generate a short hash for display purposes (first 8 characters)
 */
export function shortHash(hash: string): string {
  return hash.substring(0, 8);
}
