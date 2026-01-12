'use server';

import fs from 'fs/promises';
import path from 'path';

const AGENTS_DIR = path.join(process.cwd(), '.claude/agents');

export async function getAgentContent(agentId: string): Promise<string> {
  try {
    const agentPath = path.join(AGENTS_DIR, agentId, 'README.md');
    const content = await fs.readFile(agentPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading agent ${agentId}:`, error);
    return `# ${agentId}\n\nError loading agent content. Please ensure .claude/agents/${agentId}/README.md exists.`;
  }
}

export async function listAgents(): Promise<{ id: string; label: string }[]> {
  try {
    const entries = await fs.readdir(AGENTS_DIR, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({
        id: e.name,
        label: formatAgentName(e.name),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('Error listing agents:', error);
    return [];
  }
}

function formatAgentName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
