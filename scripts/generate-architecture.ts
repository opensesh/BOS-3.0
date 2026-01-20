/**
 * Architecture Document Generator
 * 
 * Generates a high-level architecture guide for:
 * - AI agents/MCP tools navigating the codebase
 * - Developers onboarding to the project
 * - Other AI models understanding system patterns
 * 
 * This is NOT a component inventory—it's a conceptual guide explaining
 * HOW the system works and WHY decisions were made.
 * 
 * Run with: npm run generate:architecture
 * Auto-runs on: pre-commit
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
// Output to .claude/system/ directory (served via /api/claude/ route)
const OUTPUT_FILE = path.join(ROOT_DIR, '.claude', 'system', 'architecture.md');
const ROOT_OUTPUT_FILE = path.join(ROOT_DIR, 'ARCHITECTURE.md');

// ============================================================================
// File System Helpers
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
// Route Discovery
// ============================================================================

interface RouteInfo {
  path: string;
  purpose: string;
  features: string[];
}

function discoverRoutes(appDir: string, basePath: string = ''): RouteInfo[] {
  const routes: RouteInfo[] = [];
  if (!fs.existsSync(appDir)) return routes;

  const entries = fs.readdirSync(appDir, { withFileTypes: true });
  const hasPage = entries.some(e => e.name === 'page.tsx' || e.name === 'page.ts');
  const hasLayout = entries.some(e => e.name === 'layout.tsx');
  const hasLoading = entries.some(e => e.name === 'loading.tsx');
  const hasActions = entries.some(e => e.name === 'actions.ts');

  if (hasPage) {
    const features: string[] = [];
    if (hasLayout) features.push('custom layout');
    if (hasLoading) features.push('loading state');
    if (hasActions) features.push('server actions');
    
    routes.push({
      path: basePath || '/',
      purpose: inferRoutePurpose(basePath),
      features,
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || shouldIgnore(entry.name) || entry.name === 'api') continue;
    
    let segment = entry.name;
    if (segment.startsWith('(') && segment.endsWith(')')) {
      routes.push(...discoverRoutes(path.join(appDir, entry.name), basePath));
    } else if (segment.startsWith('[') && segment.endsWith(']')) {
      routes.push(...discoverRoutes(path.join(appDir, entry.name), `${basePath}/:${segment.slice(1, -1)}`));
    } else {
      routes.push(...discoverRoutes(path.join(appDir, entry.name), `${basePath}/${segment}`));
    }
  }
  return routes;
}

function inferRoutePurpose(routePath: string): string {
  const purposes: Record<string, string> = {
    '/': 'Main chat interface and home page',
    '/account': 'User account settings and profile management',
    '/brain': 'Brand Brain dashboard overview',
    '/brain/architecture': 'System architecture documentation (this page)',
    '/brain/brand-identity': 'Brand identity and messaging guidelines',
    '/brain/components': 'Component library documentation',
    '/brain/skills': 'AI skills and capabilities configuration',
    '/brain/writing-styles': 'Voice and tone guidelines',
    '/brand-hub': 'Brand assets hub overview',
    '/brand-hub/art-direction': 'Visual direction guidelines',
    '/brand-hub/colors': 'Color system and palette',
    '/brand-hub/design-tokens': 'Design token documentation',
    '/brand-hub/fonts': 'Typography system',
    '/brand-hub/guidelines': 'Brand usage guidelines',
    '/brand-hub/logo': 'Logo variations and usage',
    '/chats': 'Chat history and saved conversations',
    '/projects': 'Project workspaces listing',
    '/projects/:id': 'Individual project workspace with files and chat',
    '/spaces': 'Collaboration spaces listing',
    '/spaces/:slug': 'Individual space dashboard',
    '/spaces/:slug/chat/:threadId': 'Threaded discussion within a space',
    '/demo/loader': 'Brand loader component demo',
  };
  return purposes[routePath] || 'Page content';
}

// ============================================================================
// API Discovery
// ============================================================================

interface ApiInfo {
  path: string;
  methods: string[];
  purpose: string;
  requestShape?: string;
  responseShape?: string;
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
      if (content.includes('function GET')) methods.push('GET');
      if (content.includes('function POST')) methods.push('POST');
      if (content.includes('function PUT')) methods.push('PUT');
      if (content.includes('function DELETE')) methods.push('DELETE');
      
      apis.push({
        path: basePath,
        methods,
        purpose: inferApiPurpose(basePath),
        requestShape: extractRequestShape(content),
        responseShape: extractResponseShape(basePath),
      });
    }
  }
  return apis;
}

function inferApiPurpose(apiPath: string): string {
  const purposes: Record<string, string> = {
    '/api/chat': 'Main AI conversation endpoint with streaming responses',
    '/api/generate-title': 'Generate conversation titles from messages',
    '/api/related-questions': 'Generate follow-up question suggestions',
    '/api/suggestions': 'Search autocomplete suggestions',
    '/api/summarize-thinking': 'Summarize extended thinking content',
    '/api/test-env': 'Environment variable testing (dev only)',
  };
  return purposes[apiPath] || 'API endpoint';
}

function extractRequestShape(content: string): string | undefined {
  // Extract key request fields from the route handler
  if (content.includes('messages') && content.includes('model')) {
    return '{ messages, model?, context?, connectors?, options? }';
  }
  if (content.includes('query') || content.includes('q')) {
    return '{ query }';
  }
  return undefined;
}

function extractResponseShape(apiPath: string): string {
  const shapes: Record<string, string> = {
    '/api/chat': 'SSE stream: thinking | text | tool_use | sources | done',
    '/api/generate-title': '{ title: string }',
    '/api/related-questions': '{ questions: string[] }',
    '/api/suggestions': '{ suggestions: string[] }',
    '/api/summarize-thinking': '{ summary: string }',
  };
  return shapes[apiPath] || 'JSON response';
}

// ============================================================================
// Generate High-Level Directory Tree
// ============================================================================

function generateDirectoryOverview(): string {
  return `\`\`\`
BOS-3.0/
├── app/                    # Next.js App Router pages
│   ├── api/                # API route handlers
│   ├── brain/              # Brand Brain documentation pages
│   ├── brand-hub/          # Brand asset management pages
│   ├── projects/           # Project workspaces
│   ├── spaces/             # Collaboration spaces
│   └── page.tsx            # Home (main chat interface)
│
├── components/             # React components
│   ├── chat/               # Chat system (responses, citations, tools)
│   ├── brain/              # Brain-specific components
│   ├── brand-hub/          # Brand hub components
│   ├── home/               # Home page components
│   ├── projects/           # Project management components
│   ├── spaces/             # Space collaboration components
│   ├── settings/           # User settings forms
│   ├── mobile/             # Mobile-specific components
│   └── ui/                 # Design system primitives
│
├── hooks/                  # Custom React hooks
├── lib/                    # Core libraries
│   ├── ai/                 # AI provider system
│   ├── brand-knowledge/    # Brand context system
│   └── supabase/           # Database services
│
├── public/
│   ├── claude-data/        # AI-readable content & docs
│   └── assets/             # Static brand assets
│
└── types/                  # TypeScript definitions
\`\`\``;
}

// ============================================================================
// Main Markdown Generation
// ============================================================================

function generateMarkdown(): string {
  const timestamp = new Date().toISOString();
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  
  // Gather stats
  const appStats = countFilesRecursive(path.join(ROOT_DIR, 'app'));
  const componentStats = countFilesRecursive(path.join(ROOT_DIR, 'components'));
  const libStats = countFilesRecursive(path.join(ROOT_DIR, 'lib'));
  const totalStats = {
    files: appStats.files + componentStats.files + libStats.files,
    lines: appStats.lines + componentStats.lines + libStats.lines,
  };
  
  const routes = discoverRoutes(path.join(ROOT_DIR, 'app'));
  const apis = discoverApis(path.join(ROOT_DIR, 'app', 'api'));

  return `# Brand Operating System (BOS) 3.0 Architecture

> **Living documentation** — Auto-updated: ${timestamp.split('T')[0]}
>
> This document is auto-generated and provides high-level architectural guidance.
> It's designed to help AI agents, developers, and MCP tools navigate the codebase.
>
> **Looking for product overview?** See [README.md](./README.md) for vision, MCP integration, and quick start.

---

## What is BOS?

BOS (Brand Operating System) is an AI-powered brand management platform. It combines:

- **Multi-model AI chat** with Claude (Anthropic) and Perplexity integration
- **Brand knowledge system** that enriches AI responses with brand context
- **Collaborative workspaces** for projects and team spaces
- **Living documentation** for brand guidelines and assets

The platform serves both as a user-facing application AND as a well-structured resource for AI interpretation.

---

## Quick Reference

| Metric | Count |
|--------|-------|
| **Version** | ${pkg.version} |
| **Pages** | ${routes.length} |
| **API Endpoints** | ${apis.length} |
| **Source Files** | ~${totalStats.files} |
| **Lines of Code** | ~${totalStats.lines.toLocaleString()} |

---

## Directory Structure

${generateDirectoryOverview()}

---

## Core Systems

### 1. AI Provider System (\`lib/ai/\`)

The AI system supports multiple providers with intelligent routing:

**Available Models:**
- \`claude-sonnet\` — Claude Sonnet 4 (balanced, everyday tasks)
- \`claude-opus\` — Claude Opus 4 (complex reasoning, extended thinking)
- \`sonar\` / \`sonar-pro\` — Perplexity Sonar (web search, current info)
- \`auto\` — Automatic model selection based on query analysis

**Key Features:**
- **Extended Thinking**: Claude models can show their reasoning process
- **Tool Use**: Web search with citation attribution
- **Streaming**: Real-time token-by-token response display
- **Writing Styles**: Adaptable voice (concise, creative, learning, etc.)

**Architecture Pattern:**
\`\`\`
User Query → Auto-Router → Provider Selection → Stream Response
                ↓
         Analyzes: query complexity, length, search needs
                ↓
         Returns: optimal model for the task
\`\`\`

### 2. Brand Knowledge System (\`lib/brand-knowledge/\`)

Enriches every AI response with brand context:

- **System Prompt Builder**: Constructs brand-aware prompts dynamically
- **Brand Documentation**: Identity, messaging, voice guidelines
- **Asset Manifest**: Logo, color, typography references
- **Page Context**: Current page/space awareness injected into prompts

**When to use:** Any AI interaction should include brand context via \`buildBrandSystemPrompt()\`.

### 3. Database Services (\`lib/supabase/\`)

Supabase-powered persistence:

| Service | Purpose |
|---------|---------|
| \`chat-service.ts\` | Message history, conversations |
| \`artifact-service.ts\` | Generated code/content storage |
| \`file-service.ts\` | File uploads and management |
| \`projects-service.ts\` | Project/workspace management |
| \`tool-service.ts\` | Tool configurations |

### 4. State Management

**React Contexts:**
- \`chat-context.tsx\` — Active chat state, messages, streaming
- \`sidebar-context.tsx\` — Navigation state, collapse/expand
- \`breadcrumb-context.tsx\` — Navigation trail
- \`mobile-menu-context.tsx\` — Mobile navigation state

**Zustand Stores:** Used for global application state and persisted preferences.

### 5. Design System (\`components/ui/\`)

Built on **React Aria Components** for accessibility:

- Base primitives: Avatar, Button, Input, Select, Textarea, Tooltip
- Semantic tokens via CSS variables
- Full dark/light theme support
- WCAG compliance out of the box

---

## Pages & Their Purpose

${routes.map(r => `| \`${r.path}\` | ${r.purpose} |`).join('\n')}

---

## API Reference

${apis.map(api => `### \`${api.methods.join(', ')} ${api.path}\`

**Purpose:** ${api.purpose}

${api.requestShape ? `**Request:** \`${api.requestShape}\`\n` : ''}
**Response:** \`${api.responseShape}\`
`).join('\n')}

---

## Data Flow Patterns

### Chat Request Flow

\`\`\`
User Input (ChatInterface.tsx)
       ↓
useChat() hook prepares request
       ↓
POST /api/chat
       ↓
┌─────────────────────────────────────────────┐
│ 1. Parse request (messages, model, context) │
│ 2. Build brand system prompt                │
│ 3. Process any attachments                  │
│ 4. Auto-select provider if model="auto"     │
│ 5. Stream response with:                    │
│    - Extended thinking (if enabled)         │
│    - Tool use (web search)                  │
│    - Source citations                       │
└─────────────────────────────────────────────┘
       ↓
SSE Stream → ChatResponse.tsx renders chunks
\`\`\`

### Space Context Flow

\`\`\`
Space Page Load → useSpaces() hook
       ↓
Load space data: files, links, instructions, tasks
       ↓
Space context injected into system prompt
       ↓
AI responses become aware of:
  • Attached files & their contents
  • Linked resources
  • Custom instructions
  • Active tasks
\`\`\`

---

## Key Design Decisions

| Decision | Why | Benefit |
|----------|-----|---------|
| **Multi-model routing** | Different tasks need different capabilities | Best results without user config |
| **Brand-aware prompts** | Consistent voice across all AI interactions | AI respects brand guidelines |
| **React Aria Components** | First-class accessibility | WCAG compliance built-in |
| **CSS variable tokens** | Theme flexibility | Easy dark mode, theming |
| **Server-Sent Events** | Real-time streaming | Progressive rendering, better UX |

---

## For AI Agents & MCP Tools

### Navigating the Codebase

1. **To find a page's implementation**: Check \`app/[route]/page.tsx\`
2. **To find a component**: Check \`components/[category]/[ComponentName].tsx\`
3. **To understand an API**: Check \`app/api/[endpoint]/route.ts\`
4. **To find business logic**: Check \`lib/[system]/\` directories
5. **To find React hooks**: Check \`hooks/use[Name].ts\`

### Common Operations

| Task | Where to Look |
|------|---------------|
| Add a new page | \`app/[new-route]/page.tsx\` |
| Add a new API | \`app/api/[endpoint]/route.ts\` |
| Modify chat behavior | \`lib/ai/providers.ts\`, \`app/api/chat/route.ts\` |
| Update brand context | \`lib/brand-knowledge/\` |
| Add UI component | \`components/ui/\` for primitives, \`components/[feature]/\` for features |
| Modify database | \`lib/supabase/[service].ts\`, \`supabase/migrations/\` |

### Integration Points

- **Anthropic API**: Claude models (\`@anthropic-ai/sdk\`)
- **Perplexity API**: Sonar models for web search
- **Supabase**: Database, auth, file storage
- **Vercel**: Hosting, analytics, speed insights

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js ${pkg.dependencies?.next || '16+'} (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + CSS Variables |
| UI Library | React Aria Components |
| State | React Context + Zustand |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude, Perplexity Sonar |
| Animations | Framer Motion, GSAP |

---

## Development Commands

| Command | Purpose |
|---------|---------|
| \`npm run dev\` | Start development server |
| \`npm run build\` | Production build |
| \`npm run generate:architecture\` | Regenerate this document |
| \`npm run generate:brand-index\` | Rebuild brand knowledge index |

---

<sub>Auto-generated by \`scripts/generate-architecture.ts\` — ${timestamp}</sub>
`;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('📝 Generating architecture documentation...\n');

  try {
    const markdown = generateMarkdown();
    
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log('✅ .claude/system/architecture.md');
    
    fs.writeFileSync(ROOT_OUTPUT_FILE, markdown);
    console.log('✅ ARCHITECTURE.md');
    
    const lines = markdown.split('\n').length;
    console.log(`📊 ${lines} lines of high-level documentation`);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();
