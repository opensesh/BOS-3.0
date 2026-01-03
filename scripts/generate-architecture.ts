/**
 * Architecture Document Generator
 * 
 * Automatically generates ARCHITECTURE.md by scanning the codebase.
 * This creates a "living document" that stays in sync with your code.
 * 
 * Run with: npm run generate:architecture
 * Auto-runs on: pre-commit (if husky is installed)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'public', 'claude-data', 'system', 'architecture.md');
const ROOT_OUTPUT_FILE = path.join(ROOT_DIR, 'ARCHITECTURE.md'); // Also write to root for Git visibility

// Directories to scan for structure
const SCAN_DIRS = ['app', 'components', 'hooks', 'lib', 'types', 'utils', 'scripts'];

// Directories/files to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  'dist',
  'build',
  '.turbo',
  '*.lock',
  'bun.lock',
  'package-lock.json',
];

// File extensions to count as source files
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.sql'];

interface FileInfo {
  name: string;
  path: string;
  extension: string;
  lines: number;
  isDirectory: boolean;
}

interface DirectoryStats {
  totalFiles: number;
  totalLines: number;
  filesByExtension: Record<string, number>;
  linesByExtension: Record<string, number>;
}

interface ComponentInfo {
  name: string;
  path: string;
  lines: number;
  description?: string;
}

// ============================================================================
// File System Helpers
// ============================================================================

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return name.endsWith(pattern.slice(1));
    }
    return name === pattern || name.startsWith('.');
  });
}

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName);
  return ext || 'no-ext';
}

function scanDirectory(dirPath: string, relativeTo: string = ROOT_DIR): FileInfo[] {
  const files: FileInfo[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(relativeTo, fullPath);

    if (entry.isDirectory()) {
      files.push({
        name: entry.name,
        path: relativePath,
        extension: '',
        lines: 0,
        isDirectory: true,
      });
      files.push(...scanDirectory(fullPath, relativeTo));
    } else {
      const ext = getFileExtension(entry.name);
      files.push({
        name: entry.name,
        path: relativePath,
        extension: ext,
        lines: SOURCE_EXTENSIONS.includes(ext) ? countLines(fullPath) : 0,
        isDirectory: false,
      });
    }
  }

  return files;
}

function getDirectoryStats(files: FileInfo[]): DirectoryStats {
  const stats: DirectoryStats = {
    totalFiles: 0,
    totalLines: 0,
    filesByExtension: {},
    linesByExtension: {},
  };

  for (const file of files) {
    if (file.isDirectory) continue;
    if (!SOURCE_EXTENSIONS.includes(file.extension)) continue;

    stats.totalFiles++;
    stats.totalLines += file.lines;
    stats.filesByExtension[file.extension] = (stats.filesByExtension[file.extension] || 0) + 1;
    stats.linesByExtension[file.extension] = (stats.linesByExtension[file.extension] || 0) + file.lines;
  }

  return stats;
}

// ============================================================================
// Component Discovery
// ============================================================================

function extractComponentDescription(filePath: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Look for JSDoc comment at top of file
    const jsdocMatch = content.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\//);
    if (jsdocMatch) {
      const comment = jsdocMatch[0]
        .replace(/\/\*\*|\*\//g, '')
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line && !line.startsWith('@'))
        .join(' ')
        .trim();
      
      if (comment.length > 10 && comment.length < 200) {
        return comment;
      }
    }

    // Look for a comment right before the component
    const componentCommentMatch = content.match(/\/\/\s*(.+)\nexport\s+(default\s+)?function/);
    if (componentCommentMatch) {
      return componentCommentMatch[1].trim();
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function discoverComponents(dirPath: string): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return components;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);

    if (entry.isDirectory()) {
      components.push(...discoverComponents(fullPath));
    } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
      components.push({
        name: entry.name.replace('.tsx', ''),
        path: relativePath,
        lines: countLines(fullPath),
        description: extractComponentDescription(fullPath),
      });
    }
  }

  return components;
}

// ============================================================================
// Route Discovery (Next.js App Router)
// ============================================================================

interface RouteInfo {
  path: string;
  filePath: string;
  hasLayout: boolean;
  hasLoading: boolean;
  hasError: boolean;
  hasPage: boolean;
}

function discoverRoutes(appDir: string, basePath: string = ''): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  if (!fs.existsSync(appDir)) {
    return routes;
  }

  const entries = fs.readdirSync(appDir, { withFileTypes: true });
  
  const hasPage = entries.some(e => e.name === 'page.tsx' || e.name === 'page.ts');
  const hasLayout = entries.some(e => e.name === 'layout.tsx' || e.name === 'layout.ts');
  const hasLoading = entries.some(e => e.name === 'loading.tsx' || e.name === 'loading.ts');
  const hasError = entries.some(e => e.name === 'error.tsx' || e.name === 'error.ts');

  if (hasPage) {
    routes.push({
      path: basePath || '/',
      filePath: path.relative(ROOT_DIR, appDir),
      hasLayout,
      hasLoading,
      hasError,
      hasPage,
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (shouldIgnore(entry.name)) continue;
    if (entry.name === 'api') continue; // Handle API routes separately

    // Handle route groups (parentheses)
    let routeSegment = entry.name;
    if (routeSegment.startsWith('(') && routeSegment.endsWith(')')) {
      // Route group - doesn't add to URL path
      routes.push(...discoverRoutes(path.join(appDir, entry.name), basePath));
    } else if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
      // Dynamic route
      const paramName = routeSegment.slice(1, -1);
      routes.push(...discoverRoutes(
        path.join(appDir, entry.name),
        `${basePath}/:${paramName}`
      ));
    } else {
      routes.push(...discoverRoutes(
        path.join(appDir, entry.name),
        `${basePath}/${routeSegment}`
      ));
    }
  }

  return routes;
}

// ============================================================================
// API Route Discovery
// ============================================================================

interface ApiRouteInfo {
  path: string;
  methods: string[];
  filePath: string;
}

function discoverApiRoutes(apiDir: string, basePath: string = '/api'): ApiRouteInfo[] {
  const routes: ApiRouteInfo[] = [];
  
  if (!fs.existsSync(apiDir)) {
    return routes;
  }

  const entries = fs.readdirSync(apiDir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;

    const fullPath = path.join(apiDir, entry.name);

    if (entry.isDirectory()) {
      let routeSegment = entry.name;
      if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
        const paramName = routeSegment.slice(1, -1);
        routes.push(...discoverApiRoutes(fullPath, `${basePath}/:${paramName}`));
      } else {
        routes.push(...discoverApiRoutes(fullPath, `${basePath}/${routeSegment}`));
      }
    } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const methods: string[] = [];
      
      if (content.includes('export async function GET') || content.includes('export function GET')) {
        methods.push('GET');
      }
      if (content.includes('export async function POST') || content.includes('export function POST')) {
        methods.push('POST');
      }
      if (content.includes('export async function PUT') || content.includes('export function PUT')) {
        methods.push('PUT');
      }
      if (content.includes('export async function DELETE') || content.includes('export function DELETE')) {
        methods.push('DELETE');
      }
      if (content.includes('export async function PATCH') || content.includes('export function PATCH')) {
        methods.push('PATCH');
      }

      routes.push({
        path: basePath,
        methods,
        filePath: path.relative(ROOT_DIR, fullPath),
      });
    }
  }

  return routes;
}

// ============================================================================
// Hook Discovery
// ============================================================================

interface HookInfo {
  name: string;
  path: string;
  lines: number;
  description?: string;
}

function discoverHooks(hooksDir: string): HookInfo[] {
  const hooks: HookInfo[] = [];
  
  if (!fs.existsSync(hooksDir)) {
    return hooks;
  }

  const entries = fs.readdirSync(hooksDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;

    const fullPath = path.join(hooksDir, entry.name);
    const hookName = entry.name.replace(/\.(ts|tsx)$/, '');

    hooks.push({
      name: hookName,
      path: path.relative(ROOT_DIR, fullPath),
      lines: countLines(fullPath),
      description: extractComponentDescription(fullPath),
    });
  }

  return hooks;
}

// ============================================================================
// Directory Tree Generator
// ============================================================================

function generateTreeView(dirPath: string, prefix: string = '', isLast: boolean = true, maxDepth: number = 3, currentDepth: number = 0): string {
  if (currentDepth >= maxDepth) return '';
  if (!fs.existsSync(dirPath)) return '';

  const dirName = path.basename(dirPath);
  let tree = '';

  if (currentDepth > 0) {
    tree += `${prefix}${isLast ? '└── ' : '├── '}${dirName}/\n`;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => !shouldIgnore(e.name))
    .sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const newPrefix = currentDepth > 0 ? `${prefix}${isLast ? '    ' : '│   '}` : '';

  entries.forEach((entry, index) => {
    const isLastEntry = index === entries.length - 1;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      tree += generateTreeView(fullPath, newPrefix, isLastEntry, maxDepth, currentDepth + 1);
    } else {
      tree += `${newPrefix}${isLastEntry ? '└── ' : '├── '}${entry.name}\n`;
    }
  });

  return tree;
}

// ============================================================================
// Markdown Generation
// ============================================================================

function generateMarkdown(): string {
  const timestamp = new Date().toISOString();
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));

  // Gather all data
  const allFiles = SCAN_DIRS.flatMap(dir => scanDirectory(path.join(ROOT_DIR, dir)));
  const stats = getDirectoryStats(allFiles);
  const routes = discoverRoutes(path.join(ROOT_DIR, 'app'));
  const apiRoutes = discoverApiRoutes(path.join(ROOT_DIR, 'app', 'api'));
  const components = discoverComponents(path.join(ROOT_DIR, 'components'));
  const hooks = discoverHooks(path.join(ROOT_DIR, 'hooks'));

  // Group components by directory
  const componentsByDir: Record<string, ComponentInfo[]> = {};
  for (const comp of components) {
    const dir = path.dirname(comp.path);
    if (!componentsByDir[dir]) {
      componentsByDir[dir] = [];
    }
    componentsByDir[dir].push(comp);
  }

  let md = `# ${pkg.name} Architecture

> **Auto-generated documentation** — Last updated: ${timestamp.split('T')[0]}
> 
> This file is automatically generated by \`npm run generate:architecture\`.
> Do not edit manually; changes will be overwritten.

## Overview

| Metric | Value |
|--------|-------|
| **Version** | ${pkg.version} |
| **Source Files** | ${stats.totalFiles.toLocaleString()} |
| **Lines of Code** | ${stats.totalLines.toLocaleString()} |
| **Pages/Routes** | ${routes.length} |
| **API Endpoints** | ${apiRoutes.length} |
| **Components** | ${components.length} |
| **Custom Hooks** | ${hooks.length} |

### File Distribution

| Extension | Files | Lines |
|-----------|-------|-------|
${Object.entries(stats.filesByExtension)
  .sort((a, b) => b[1] - a[1])
  .map(([ext, count]) => `| \`${ext}\` | ${count} | ${stats.linesByExtension[ext]?.toLocaleString() || 0} |`)
  .join('\n')}

---

## Directory Structure

\`\`\`
${pkg.name}/
${generateTreeView(ROOT_DIR, '', true, 3, 0)}
\`\`\`

---

## Pages & Routes

| Route | Path | Layout | Loading | Error |
|-------|------|--------|---------|-------|
${routes.length > 0 
  ? routes
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(r => `| \`${r.path}\` | \`${r.filePath}\` | ${r.hasLayout ? '✓' : '—'} | ${r.hasLoading ? '✓' : '—'} | ${r.hasError ? '✓' : '—'} |`)
      .join('\n')
  : '| *No routes discovered* | — | — | — | — |'}

---

## API Endpoints

| Endpoint | Methods | File |
|----------|---------|------|
${apiRoutes.length > 0
  ? apiRoutes
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(r => `| \`${r.path}\` | ${r.methods.map(m => `\`${m}\``).join(', ')} | \`${r.filePath}\` |`)
      .join('\n')
  : '| *No API routes discovered* | — | — |'}

---

## Components

`;

  // Add components grouped by directory
  const sortedDirs = Object.keys(componentsByDir).sort();
  for (const dir of sortedDirs) {
    const dirComponents = componentsByDir[dir].sort((a, b) => a.name.localeCompare(b.name));
    const dirName = dir === 'components' ? 'Root Components' : dir.replace('components/', '').replace(/\//g, ' → ');
    
    md += `### ${dirName}\n\n`;
    md += `| Component | Lines | Description |\n`;
    md += `|-----------|-------|-------------|\n`;
    
    for (const comp of dirComponents) {
      const desc = comp.description || '—';
      md += `| [\`${comp.name}\`](${comp.path}) | ${comp.lines} | ${desc} |\n`;
    }
    
    md += '\n';
  }

  md += `---

## Custom Hooks

| Hook | Lines | Description |
|------|-------|-------------|
${hooks.length > 0
  ? hooks
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(h => `| [\`${h.name}\`](${h.path}) | ${h.lines} | ${h.description || '—'} |`)
      .join('\n')
  : '| *No custom hooks discovered* | — | — |'}

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
${Object.entries(pkg.dependencies || {})
  .filter(([name]) => !name.startsWith('@types/'))
  .slice(0, 20)
  .map(([name, version]) => `| \`${name}\` | \`${version}\` | — |`)
  .join('\n')}

---

## Scripts

| Command | Description |
|---------|-------------|
${Object.entries(pkg.scripts || {})
  .map(([name, cmd]) => `| \`npm run ${name}\` | \`${cmd}\` |`)
  .join('\n')}

---

## Tech Stack

- **Framework**: Next.js ${pkg.dependencies?.next || 'latest'} (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: React Aria Components
- **State Management**: Zustand
- **Database**: Supabase
- **Animations**: Framer Motion, GSAP

---

<sub>Generated by \`scripts/generate-architecture.ts\` on ${timestamp}</sub>
`;

  return md;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('📝 Generating architecture.md...\n');

  try {
    const markdown = generateMarkdown();
    
    // Write to public folder (for web page)
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log('✅ Written to public/claude-data/system/architecture.md');
    
    // Also write to root (for Git visibility)
    fs.writeFileSync(ROOT_OUTPUT_FILE, markdown);
    console.log('✅ Written to ARCHITECTURE.md');
    
    // Count some stats for the log
    const lines = markdown.split('\n').length;
    console.log(`📊 ${lines} lines of documentation`);
  } catch (error) {
    console.error('❌ Failed to generate architecture:', error);
    process.exit(1);
  }
}

main();

