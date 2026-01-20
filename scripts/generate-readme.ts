/**
 * README Generator
 *
 * Generates a product-first README.md with:
 * - Static sections: vision, problems, users, MCP integration, quick start
 * - Dynamic sections: stats, features, API endpoints, tech stack
 *
 * Run with: bun run generate:readme
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'README.md');

// ============================================================================
// File System Helpers (shared with generate-architecture.ts)
// ============================================================================

const IGNORE_PATTERNS = ['node_modules', '.next', '.git', '.env', 'dist', 'build', '.turbo'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.sql'];

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.some(p => name === p) || name.startsWith('.');
}

function countLines(filePath: string): number {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n').length;
  } catch {
    return 0;
  }
}

function countFilesRecursive(dirPath: string): { files: number; lines: number } {
  let files = 0, lines = 0;
  if (!fs.existsSync(dirPath)) return { files, lines };

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const sub = countFilesRecursive(fullPath);
      files += sub.files;
      lines += sub.lines;
    } else if (SOURCE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files++;
      lines += countLines(fullPath);
    }
  }
  return { files, lines };
}

// ============================================================================
// Feature Discovery
// ============================================================================

interface FeatureInfo {
  name: string;
  path: string;
  description: string;
  category: 'brain' | 'brand-hub' | 'spaces' | 'core';
}

function discoverFeatures(): FeatureInfo[] {
  const features: FeatureInfo[] = [];
  const appDir = path.join(ROOT_DIR, 'app');

  // Brain features
  const brainDir = path.join(appDir, 'brain');
  if (fs.existsSync(brainDir)) {
    features.push({
      name: 'Brain Dashboard',
      path: '/brain',
      description: 'Centralized brand intelligence and documentation hub',
      category: 'brain',
    });

    const brainFeatures: Record<string, string> = {
      'brand-identity': 'Brand identity, messaging, and voice guidelines',
      'writing-styles': 'Writing style presets for different content types',
      'skills': 'AI skills and capabilities configuration',
      'plugins': 'Plugin management and marketplace',
      'agents': 'Autonomous AI agent workflows',
      'components': 'Component library documentation',
      'architecture': 'System architecture documentation',
    };

    for (const [folder, desc] of Object.entries(brainFeatures)) {
      if (fs.existsSync(path.join(brainDir, folder, 'page.tsx'))) {
        features.push({
          name: folder.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          path: `/brain/${folder}`,
          description: desc,
          category: 'brain',
        });
      }
    }
  }

  // Brand Hub features
  const brandHubDir = path.join(appDir, 'brand-hub');
  if (fs.existsSync(brandHubDir)) {
    features.push({
      name: 'Brand Hub',
      path: '/brand-hub',
      description: 'Brand asset management and guidelines',
      category: 'brand-hub',
    });

    const brandHubFeatures: Record<string, string> = {
      'colors': 'Color system with design tokens and usage guidelines',
      'fonts': 'Typography system (Neue Haas Grotesk, Offbit)',
      'logo': 'Logo variations and usage guidelines',
      'art-direction': 'Visual direction and photography guidelines',
      'guidelines': 'Comprehensive brand usage guidelines',
      'design-tokens': 'Design tokens for developers',
      'textures': 'Brand textures and patterns',
    };

    for (const [folder, desc] of Object.entries(brandHubFeatures)) {
      if (fs.existsSync(path.join(brandHubDir, folder, 'page.tsx'))) {
        features.push({
          name: folder.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          path: `/brand-hub/${folder}`,
          description: desc,
          category: 'brand-hub',
        });
      }
    }
  }

  // Core features
  if (fs.existsSync(path.join(appDir, 'spaces', 'page.tsx'))) {
    features.push({
      name: 'Spaces',
      path: '/spaces',
      description: 'Collaborative workspaces with files, links, and threaded chat',
      category: 'spaces',
    });
  }

  if (fs.existsSync(path.join(appDir, 'projects', 'page.tsx'))) {
    features.push({
      name: 'Projects',
      path: '/projects',
      description: 'Project workspaces with file attachments and task management',
      category: 'core',
    });
  }

  if (fs.existsSync(path.join(appDir, 'chats', 'page.tsx'))) {
    features.push({
      name: 'Chat History',
      path: '/chats',
      description: 'Saved conversations and message history',
      category: 'core',
    });
  }

  return features;
}

// ============================================================================
// API Endpoint Discovery
// ============================================================================

interface ApiInfo {
  path: string;
  methods: string[];
  description: string;
}

function discoverApis(apiDir: string, basePath: string = '/api'): ApiInfo[] {
  const apis: ApiInfo[] = [];
  if (!fs.existsSync(apiDir)) return apis;

  const entries = fs.readdirSync(apiDir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;
    const fullPath = path.join(apiDir, entry.name);

    if (entry.isDirectory()) {
      const segment = entry.name.startsWith('[') ? `:${entry.name.slice(1, -1)}` : entry.name;
      apis.push(...discoverApis(fullPath, `${basePath}/${segment}`));
    } else if (entry.name === 'route.ts') {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const methods: string[] = [];
      if (content.includes('function GET') || content.includes('export async function GET')) methods.push('GET');
      if (content.includes('function POST') || content.includes('export async function POST')) methods.push('POST');
      if (content.includes('function PUT') || content.includes('export async function PUT')) methods.push('PUT');
      if (content.includes('function DELETE') || content.includes('export async function DELETE')) methods.push('DELETE');

      apis.push({
        path: basePath,
        methods,
        description: inferApiDescription(basePath),
      });
    }
  }
  return apis;
}

function inferApiDescription(apiPath: string): string {
  const descriptions: Record<string, string> = {
    '/api/chat': 'Main AI conversation endpoint with streaming',
    '/api/generate-title': 'Generate conversation titles',
    '/api/related-questions': 'Generate follow-up suggestions',
    '/api/suggestions': 'Search autocomplete suggestions',
    '/api/summarize-thinking': 'Summarize extended thinking',
    '/api/brand': 'Brand configuration endpoint',
    '/api/search': 'Semantic search across brand knowledge',
    '/api/embed-message': 'Generate embeddings for messages',
    '/api/upload-attachment': 'File upload handling',
    '/api/brain/brand-identity': 'Brand identity CRUD',
    '/api/brain/writing-styles': 'Writing styles CRUD',
    '/api/brain/skills': 'AI skills CRUD',
    '/api/brain/plugins': 'Plugin management',
    '/api/brain/documents': 'Document management',
    '/api/mcp/authorize': 'MCP OAuth authorization',
    '/api/mcp/token': 'MCP token exchange',
    '/api/mcp/register': 'MCP client registration',
    '/api/:transport': 'MCP protocol endpoint',
  };
  return descriptions[apiPath] || 'API endpoint';
}

// ============================================================================
// MCP Tools Discovery
// ============================================================================

interface McpTool {
  name: string;
  description: string;
}

function getMcpTools(): McpTool[] {
  // These are defined in lib/mcp/tools.ts
  return [
    { name: 'search_brand_knowledge', description: 'Semantic search across brand documentation' },
    { name: 'get_brand_colors', description: 'Retrieve color palette with design tokens' },
    { name: 'get_brand_assets', description: 'List logos, fonts, and brand images' },
    { name: 'get_brand_guidelines', description: 'Fetch specific guideline documents' },
    { name: 'search_brand_assets', description: 'Semantic search for brand assets' },
  ];
}

// ============================================================================
// Tech Stack Discovery
// ============================================================================

interface TechItem {
  category: string;
  name: string;
  version?: string;
}

function getTechStack(): TechItem[] {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const tech: TechItem[] = [
    { category: 'Framework', name: 'Next.js', version: deps.next?.replace('^', '') },
    { category: 'Language', name: 'TypeScript', version: deps.typescript?.replace('^', '') },
    { category: 'UI', name: 'React', version: deps.react?.replace('^', '') },
    { category: 'UI Library', name: 'React Aria Components', version: deps['react-aria-components']?.replace('^', '') },
    { category: 'Styling', name: 'Tailwind CSS', version: deps.tailwindcss?.replace('^', '') },
    { category: 'State', name: 'Zustand', version: deps.zustand?.replace('^', '') },
    { category: 'Database', name: 'Supabase', version: deps['@supabase/supabase-js']?.replace('^', '') },
    { category: 'AI', name: 'Anthropic SDK', version: deps['@anthropic-ai/sdk']?.replace('^', '') },
    { category: 'Animation', name: 'Framer Motion', version: deps['framer-motion']?.replace('^', '') },
    { category: 'Animation', name: 'GSAP', version: deps.gsap?.replace('^', '') },
    { category: 'MCP', name: 'MCP SDK', version: deps['@modelcontextprotocol/sdk']?.replace('^', '') },
  ];

  return tech.filter(t => t.version);
}

// ============================================================================
// Markdown Generation
// ============================================================================

function generateMarkdown(): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));

  // Gather stats
  const appStats = countFilesRecursive(path.join(ROOT_DIR, 'app'));
  const componentStats = countFilesRecursive(path.join(ROOT_DIR, 'components'));
  const libStats = countFilesRecursive(path.join(ROOT_DIR, 'lib'));
  const totalStats = {
    files: appStats.files + componentStats.files + libStats.files,
    lines: appStats.lines + componentStats.lines + libStats.lines,
  };

  const features = discoverFeatures();
  const apis = discoverApis(path.join(ROOT_DIR, 'app', 'api'));
  const mcpTools = getMcpTools();
  const techStack = getTechStack();

  // Count pages
  const pageCount = fs.readdirSync(path.join(ROOT_DIR, 'app'), { recursive: true })
    .filter(f => f.toString().endsWith('page.tsx')).length;

  return `# Brand Operating System (BOS)

> **The brand context layer for humans and AI agents**

![Auto-updated](https://img.shields.io/badge/docs-auto--updated-blue)
![Version](https://img.shields.io/badge/version-${pkg.version}-green)
![License](https://img.shields.io/badge/license-AGPL--3.0-orange)

---

## The Problem

### For Humans

Brand resources are scattered across platforms—Figma files here, Google Docs there, outdated PDFs everywhere. Teams waste hours searching for the "right" logo or questioning if they're using the correct tone of voice. Brand consistency suffers at scale.

### For AI Agents

Consumer AI has no native brand context. When you ask ChatGPT or Claude to write copy for your brand, it has no idea about your voice, colors, or guidelines. You end up copy-pasting brand docs into every conversation, losing context between sessions.

---

## The Solution

**BOS is the brain**—a unified layer that stores, organizes, and serves all brand knowledge to both humans and AI systems.

- **For humans**: A modern dashboard to manage brand assets, guidelines, and documentation
- **For AI agents**: A semantic API that injects brand context into any AI workflow via MCP

---

## Connect Any AI Tool via MCP

BOS exposes brand knowledge through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), making it the portable brand context layer for any AI client.

### Available MCP Tools

| Tool | Description |
|------|-------------|
${mcpTools.map(t => `| \`${t.name}\` | ${t.description} |`).join('\n')}

### Quick Connect

\`\`\`bash
# Add BOS as an MCP server
claude mcp add --transport http bos "https://bos-3-0.vercel.app/api/mcp"

# Or in your MCP client config
{
  "mcpServers": {
    "bos": {
      "transport": "http",
      "url": "https://bos-3-0.vercel.app/api/mcp"
    }
  }
}
\`\`\`

Once connected, any AI conversation can query your brand's voice, colors, assets, and guidelines in real-time.

---

## Who It's For

| Audience | Use Case |
|----------|----------|
| **Brand Creators** | Marketing teams, designers, and agencies managing brand consistency |
| **Engineers** | Programmatic access to brand tokens, assets, and guidelines |
| **AI Builders** | Injecting brand context into AI agents, chatbots, and workflows |

---

## Features

### Brand Brain
${features.filter(f => f.category === 'brain').map(f => `- **[${f.name}](${f.path})** — ${f.description}`).join('\n')}

### Brand Hub
${features.filter(f => f.category === 'brand-hub').map(f => `- **[${f.name}](${f.path})** — ${f.description}`).join('\n')}

### Collaboration
${features.filter(f => f.category === 'spaces' || f.category === 'core').map(f => `- **[${f.name}](${f.path})** — ${f.description}`).join('\n')}

### AI Capabilities
- **Multi-Model Support** — Claude Sonnet 4, Claude Opus 4, Perplexity Sonar
- **Extended Thinking** — Deep reasoning with visible thought process
- **Auto-Routing** — Intelligent model selection based on query complexity
- **Brand-Aware Prompts** — Every response enriched with brand context

---

## Quick Start

\`\`\`bash
# Clone and install
git clone https://github.com/opensesh/bos-3.0.git
cd bos-3.0
bun install

# Configure environment
cp .env.example .env.local
# Add your API keys:
# - ANTHROPIC_API_KEY
# - PERPLEXITY_API_KEY
# - SUPABASE_URL + SUPABASE_ANON_KEY

# Run development server
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to start.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
${techStack.map(t => `| ${t.category} | ${t.name} ${t.version} |`).join('\n')}

---

## Stats

> Auto-updated: ${timestamp}

| Metric | Value |
|--------|-------|
| Version | ${pkg.version} |
| Pages | ${pageCount} |
| API Endpoints | ${apis.length} |
| Source Files | ~${totalStats.files.toLocaleString()} |
| Lines of Code | ~${totalStats.lines.toLocaleString()} |

---

## API Reference

Key endpoints (${apis.length} total):

| Endpoint | Methods | Description |
|----------|---------|-------------|
${apis.slice(0, 12).map(a => `| \`${a.path}\` | ${a.methods.join(', ')} | ${a.description} |`).join('\n')}

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

---

## Deep Dive

For technical architecture, data flows, and codebase navigation:

→ **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Auto-generated system documentation for developers and AI agents

---

## License

BOS is dual-licensed:

- **AGPL-3.0** — Free for open source use. If you modify and deploy BOS (especially as a network service), you must release your modifications under AGPL.

- **Commercial License** — For proprietary use without AGPL obligations. Contact [karim@opensession.co](mailto:karim@opensession.co) for licensing.

See [LICENSE](./LICENSE) for full terms.

---

## Contributing

This is a project by [OPEN SESSION](https://opensesh.com). Feedback and suggestions welcome!

---

<sub>Auto-generated by \`scripts/generate-readme.ts\` — ${timestamp}</sub>
`;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('📝 Generating README.md...\n');

  try {
    const markdown = generateMarkdown();

    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log('✅ README.md generated');

    const lines = markdown.split('\n').length;
    console.log(`📊 ${lines} lines of documentation`);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();
