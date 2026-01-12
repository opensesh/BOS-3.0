/**
 * Constants and file mappings for the Claude configuration sync system
 *
 * This module defines the mapping between database documents and local files.
 */

import type { FileMappingConfig, SyncConfig } from './types';

/**
 * Mapping of database documents to local file paths
 *
 * Each entry maps a (category, slug) pair to its corresponding file in .claude/
 */
export const FILE_MAPPINGS: FileMappingConfig[] = [
  // Config files (root level)
  {
    category: 'config',
    slug: 'claude-md',
    filePath: '.claude/CLAUDE.md',
    title: 'CLAUDE.md',
    icon: 'settings',
  },
  // Commands
  {
    category: 'commands',
    slug: 'news-update',
    filePath: '.claude/commands/news-update.md',
    title: 'News Update',
    icon: 'newspaper',
  },
  {
    category: 'commands',
    slug: 'content-ideas',
    filePath: '.claude/commands/content-ideas.md',
    title: 'Content Ideas',
    icon: 'lightbulb',
  },

  // Data files
  {
    category: 'data',
    slug: 'news-sources',
    filePath: '.claude/data/news-sources.md',
    title: 'News Sources',
    icon: 'rss',
  },

  // Brand Identity (brand-identity)
  {
    category: 'brand-identity',
    slug: 'brand-identity',
    filePath: '.claude/brand-identity/OS_brand identity.md',
    title: 'Brand Identity',
    icon: 'badge',
  },
  {
    category: 'brand-identity',
    slug: 'brand-messaging',
    filePath: '.claude/brand-identity/OS_brand messaging.md',
    title: 'Brand Messaging',
    icon: 'message-square',
  },
  {
    category: 'brand-identity',
    slug: 'art-direction',
    filePath: '.claude/brand-identity/OS_art direction.md',
    title: 'Art Direction',
    icon: 'palette',
  },

  // Writing Styles
  {
    category: 'writing-styles',
    slug: 'blog',
    filePath: '.claude/writing-styles/blog.md',
    title: 'Blog',
    icon: 'book-open',
  },
  {
    category: 'writing-styles',
    slug: 'creative',
    filePath: '.claude/writing-styles/creative.md',
    title: 'Creative',
    icon: 'wand-2',
  },
  {
    category: 'writing-styles',
    slug: 'long-form',
    filePath: '.claude/writing-styles/long-form.md',
    title: 'Long Form',
    icon: 'file-text',
  },
  {
    category: 'writing-styles',
    slug: 'short-form',
    filePath: '.claude/writing-styles/short-form.md',
    title: 'Short Form',
    icon: 'message-circle',
  },
  {
    category: 'writing-styles',
    slug: 'strategic',
    filePath: '.claude/writing-styles/strategic.md',
    title: 'Strategic',
    icon: 'target',
  },

  // Skills
  {
    category: 'skills',
    slug: 'brand-guidelines',
    filePath: '.claude/skills/brand-guidelines/SKILL.md',
    title: 'Brand Guidelines',
    icon: 'book-marked',
  },
  {
    category: 'skills',
    slug: 'create-post-copy',
    filePath: '.claude/skills/create-post-copy/SKILL.md',
    title: 'Create Post Copy',
    icon: 'pen-tool',
  },
  {
    category: 'skills',
    slug: 'mcp-builder',
    filePath: '.claude/skills/mcp-builder/SKILL.md',
    title: 'MCP Builder',
    icon: 'plug',
  },
  {
    category: 'skills',
    slug: 'skill-creator',
    filePath: '.claude/skills/skill-creator/SKILL.md',
    title: 'Skill Creator',
    icon: 'wand-2',
  },
];

/**
 * Default sync configuration
 */
export const SYNC_CONFIG: SyncConfig = {
  debounceMs: 500,           // Wait 500ms before syncing after file change
  maxRetries: 3,             // Retry failed syncs up to 3 times
  retryDelayMs: 1000,        // Wait 1s between retries
  batchSize: 10,             // Process up to 10 sync operations at once
  watchPaths: ['.claude/**/*.md'],
  ignorePaths: ['**/node_modules/**', '**/.git/**', '**/plans/**'],
};

/**
 * Get file mapping by category and slug
 */
export function getFileMappingBySlug(
  category: string,
  slug: string
): FileMappingConfig | undefined {
  return FILE_MAPPINGS.find(
    (m) => m.category === category && m.slug === slug
  );
}

/**
 * Get file mapping by file path
 */
export function getFileMappingByPath(
  filePath: string
): FileMappingConfig | undefined {
  // Normalize path for comparison
  const normalizedPath = filePath.replace(/\\/g, '/');
  return FILE_MAPPINGS.find(
    (m) => normalizedPath.endsWith(m.filePath) || m.filePath === normalizedPath
  );
}

/**
 * Get all file mappings for a category
 */
export function getFileMappingsByCategory(
  category: string
): FileMappingConfig[] {
  return FILE_MAPPINGS.filter((m) => m.category === category);
}
