'use server';

import fs from 'fs/promises';
import path from 'path';

const PLUGINS_DIR = path.join(process.cwd(), '.claude/plugins');

export async function getPluginContent(pluginId: string): Promise<string> {
  try {
    const pluginPath = path.join(PLUGINS_DIR, pluginId, 'README.md');
    const content = await fs.readFile(pluginPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading plugin ${pluginId}:`, error);
    return `# ${pluginId}\n\nError loading plugin content. Please ensure .claude/plugins/${pluginId}/README.md exists.`;
  }
}

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

function formatPluginName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
