/**
 * Constants and file mappings for the Claude configuration sync system
 *
 * This module defines the mapping between database documents and local files.
 * Supports both the legacy brand_documents table and new brain_* tables.
 */

import type { FileMappingConfig, SyncConfig } from './types';

/**
 * Brain table types for the new architecture
 */
export type BrainTableType = 
  | 'brain_brand_identity'
  | 'brain_writing_styles'
  | 'brain_plugins'
  | 'brain_skills'
  | 'brain_agents'
  | 'brain_commands'
  | 'brain_knowledge'
  | 'brain_system';

/**
 * Extended file mapping with brain table support
 */
export interface BrainFileMappingConfig extends FileMappingConfig {
  /** The brain table to sync to (new architecture) */
  brainTable?: BrainTableType;
  /** File type: 'markdown' or 'pdf' */
  fileType?: 'markdown' | 'pdf';
  /** For nested items: the parent plugin/skill/agent slug */
  parentSlug?: string;
  /** Path segments for nested items */
  pathSegments?: string[];
}

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
    filePath: '.claude/brand/identity/OS_brand identity.md',
    title: 'Brand Identity',
    icon: 'badge',
  },
  {
    category: 'brand-identity',
    slug: 'brand-messaging',
    filePath: '.claude/brand/identity/OS_brand messaging.md',
    title: 'Brand Messaging',
    icon: 'message-square',
  },
  {
    category: 'brand-identity',
    slug: 'art-direction',
    filePath: '.claude/brand/identity/OS_art direction.md',
    title: 'Art Direction',
    icon: 'palette',
  },

  // Writing Styles
  {
    category: 'writing-styles',
    slug: 'blog',
    filePath: '.claude/brand/writing/blog.md',
    title: 'Blog',
    icon: 'book-open',
  },
  {
    category: 'writing-styles',
    slug: 'creative',
    filePath: '.claude/brand/writing/creative.md',
    title: 'Creative',
    icon: 'wand-2',
  },
  {
    category: 'writing-styles',
    slug: 'long-form',
    filePath: '.claude/brand/writing/long-form.md',
    title: 'Long Form',
    icon: 'file-text',
  },
  {
    category: 'writing-styles',
    slug: 'short-form',
    filePath: '.claude/brand/writing/short-form.md',
    title: 'Short Form',
    icon: 'message-circle',
  },
  {
    category: 'writing-styles',
    slug: 'strategic',
    filePath: '.claude/brand/writing/strategic.md',
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

// ============================================
// NEW BRAIN TABLE MAPPINGS
// ============================================

/**
 * Mappings for the new brain_brand_identity table
 * Includes both Markdown and PDF files
 */
export const BRAIN_BRAND_IDENTITY_MAPPINGS: BrainFileMappingConfig[] = [
  // Markdown files
  {
    category: 'brand-identity',
    slug: 'brand-identity',
    filePath: '.claude/brand/identity/OS_brand identity.md',
    title: 'Brand Identity',
    icon: 'badge',
    brainTable: 'brain_brand_identity',
    fileType: 'markdown',
  },
  {
    category: 'brand-identity',
    slug: 'brand-messaging',
    filePath: '.claude/brand/identity/OS_brand messaging.md',
    title: 'Brand Messaging',
    icon: 'message-square',
    brainTable: 'brain_brand_identity',
    fileType: 'markdown',
  },
  {
    category: 'brand-identity',
    slug: 'art-direction',
    filePath: '.claude/brand/identity/OS_art direction.md',
    title: 'Art Direction',
    icon: 'palette',
    brainTable: 'brain_brand_identity',
    fileType: 'markdown',
  },
  // PDF files
  {
    category: 'brand-identity',
    slug: 'brand-identity-pdf',
    filePath: '.claude/brand/identity/OS_Brand Identity.pdf',
    title: 'Brand Identity (PDF)',
    icon: 'file-text',
    brainTable: 'brain_brand_identity',
    fileType: 'pdf',
  },
  {
    category: 'brand-identity',
    slug: 'brand-messaging-pdf',
    filePath: '.claude/brand/identity/OS_brand messaging.pdf',
    title: 'Brand Messaging (PDF)',
    icon: 'file-text',
    brainTable: 'brain_brand_identity',
    fileType: 'pdf',
  },
  {
    category: 'brand-identity',
    slug: 'art-direction-pdf',
    filePath: '.claude/brand/identity/OS_art direction.pdf',
    title: 'Art Direction (PDF)',
    icon: 'file-text',
    brainTable: 'brain_brand_identity',
    fileType: 'pdf',
  },
];

/**
 * Mappings for the new brain_writing_styles table
 */
export const BRAIN_WRITING_STYLES_MAPPINGS: BrainFileMappingConfig[] = [
  {
    category: 'writing-styles',
    slug: 'blog',
    filePath: '.claude/brand/writing/blog.md',
    title: 'Blog',
    icon: 'book-open',
    brainTable: 'brain_writing_styles',
    fileType: 'markdown',
  },
  {
    category: 'writing-styles',
    slug: 'creative',
    filePath: '.claude/brand/writing/creative.md',
    title: 'Creative',
    icon: 'wand-2',
    brainTable: 'brain_writing_styles',
    fileType: 'markdown',
  },
  {
    category: 'writing-styles',
    slug: 'long-form',
    filePath: '.claude/brand/writing/long-form.md',
    title: 'Long Form',
    icon: 'file-text',
    brainTable: 'brain_writing_styles',
    fileType: 'markdown',
  },
  {
    category: 'writing-styles',
    slug: 'short-form',
    filePath: '.claude/brand/writing/short-form.md',
    title: 'Short Form',
    icon: 'message-circle',
    brainTable: 'brain_writing_styles',
    fileType: 'markdown',
  },
  {
    category: 'writing-styles',
    slug: 'strategic',
    filePath: '.claude/brand/writing/strategic.md',
    title: 'Strategic',
    icon: 'target',
    brainTable: 'brain_writing_styles',
    fileType: 'markdown',
  },
];

/**
 * Get all brain mappings for a specific brain table
 */
export function getBrainMappingsByTable(
  table: BrainTableType
): BrainFileMappingConfig[] {
  const allMappings = [
    ...BRAIN_BRAND_IDENTITY_MAPPINGS,
    ...BRAIN_WRITING_STYLES_MAPPINGS,
  ];
  return allMappings.filter((m) => m.brainTable === table);
}

/**
 * Get brain mapping by file path
 */
export function getBrainMappingByPath(
  filePath: string
): BrainFileMappingConfig | undefined {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const allMappings = [
    ...BRAIN_BRAND_IDENTITY_MAPPINGS,
    ...BRAIN_WRITING_STYLES_MAPPINGS,
  ];
  return allMappings.find(
    (m) => normalizedPath.endsWith(m.filePath) || m.filePath === normalizedPath
  );
}

/**
 * Determine brain table from file path
 */
export function getBrainTableFromPath(
  filePath: string
): BrainTableType | undefined {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

  // New structure: .claude/brand/identity/
  if (normalizedPath.includes('/brand/identity/')) {
    return 'brain_brand_identity';
  }
  // New structure: .claude/brand/writing/
  if (normalizedPath.includes('/brand/writing/')) {
    return 'brain_writing_styles';
  }
  // CLI-required paths: .claude/plugins/
  if (normalizedPath.includes('.claude/plugins/')) {
    return 'brain_plugins';
  }
  // CLI-required paths: .claude/skills/
  if (normalizedPath.includes('.claude/skills/')) {
    return 'brain_skills';
  }
  // CLI-required paths: .claude/agents/
  if (normalizedPath.includes('.claude/agents/')) {
    return 'brain_agents';
  }
  // CLI-required paths: .claude/commands/
  if (normalizedPath.includes('.claude/commands/')) {
    return 'brain_commands';
  }

  return undefined;
}

/**
 * Check if a file path is a PDF
 */
export function isPdfFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.pdf');
}
