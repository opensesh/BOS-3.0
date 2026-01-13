'use server';

import fs from 'fs/promises';
import path from 'path';
import type { TreeItem } from '@/components/brain/FolderTreeNav';

const PLUGINS_DIR = path.join(process.cwd(), '.claude/plugins');

/**
 * Get content of a specific file within a plugin
 * @param pluginId - The plugin folder name
 * @param filePath - Optional path within the plugin (defaults to README.md)
 */
export async function getPluginContent(
  pluginId: string, 
  filePath?: string
): Promise<string> {
  try {
    // Default to README.md if no file path provided
    const targetFile = filePath || 'README.md';
    const fullPath = path.join(PLUGINS_DIR, pluginId, targetFile);
    
    // Security check: ensure we're still within the plugins directory
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(PLUGINS_DIR)) {
      throw new Error('Invalid file path');
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading plugin file ${pluginId}/${filePath}:`, error);
    return `# Error\n\nUnable to load file content. The file may not exist.`;
  }
}

/**
 * List all root-level plugins
 */
export async function listPlugins(): Promise<{ id: string; label: string }[]> {
  try {
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({
        id: e.name,
        label: formatPluginName(e.name),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('Error listing plugins:', error);
    return [];
  }
}

/**
 * Get the full folder structure of a plugin as a tree
 */
export async function getPluginStructure(pluginId: string): Promise<TreeItem | null> {
  try {
    const pluginPath = path.join(PLUGINS_DIR, pluginId);
    
    // Check if plugin exists
    const stats = await fs.stat(pluginPath);
    if (!stats.isDirectory()) {
      return null;
    }
    
    // Build tree recursively
    const tree = await buildTreeItem(pluginPath, pluginId, []);
    return tree;
  } catch (error) {
    console.error(`Error reading plugin structure ${pluginId}:`, error);
    return null;
  }
}

/**
 * Recursively build a tree structure from a directory
 */
async function buildTreeItem(
  dirPath: string, 
  name: string, 
  pathSegments: string[]
): Promise<TreeItem> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  // Sort: folders first, then files alphabetically
  const sortedEntries = entries
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => {
      // Folders before files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      // README.md first among files
      if (a.name.toLowerCase() === 'readme.md') return -1;
      if (b.name.toLowerCase() === 'readme.md') return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  
  const children: TreeItem[] = [];
  
  for (const entry of sortedEntries) {
    const entryPath = path.join(dirPath, entry.name);
    const entrySegments = [...pathSegments, entry.name];
    
    if (entry.isDirectory()) {
      // Recursively build subfolder
      const subTree = await buildTreeItem(
        entryPath, 
        entry.name, 
        entrySegments
      );
      children.push(subTree);
    } else if (isMarkdownFile(entry.name)) {
      // Only include markdown files
      children.push({
        id: `${pathSegments.join('/')}-${entry.name}`.replace(/^-/, ''),
        slug: entry.name,
        title: formatFileName(entry.name),
        itemType: 'file',
        pathSegments: entrySegments,
      });
    }
  }
  
  return {
    id: pathSegments.length === 0 ? name : pathSegments.join('/'),
    slug: name,
    title: formatPluginName(name),
    itemType: 'folder',
    pathSegments,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Check if a file is a markdown file
 */
function isMarkdownFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}

/**
 * Format a plugin/folder name for display
 */
function formatPluginName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format a filename for display (remove extension, format nicely)
 */
function formatFileName(filename: string): string {
  // Remove extension
  const withoutExt = filename.replace(/\.(md|markdown)$/i, '');
  
  // Special cases
  if (withoutExt.toUpperCase() === 'README') return 'README';
  if (withoutExt.toUpperCase() === 'SKILL') return 'SKILL';
  
  // Format kebab-case or snake_case
  return withoutExt
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
