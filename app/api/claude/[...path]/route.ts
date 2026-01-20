/**
 * API Route for serving .claude/ files
 *
 * This route serves files from the .claude/ directory to the browser,
 * replacing direct /claude-data/ fetches. This allows .claude/ to be
 * the single source of truth for local Claude configuration.
 *
 * Examples:
 * GET /api/claude/brand/identity/OS_brand%20identity.md
 * GET /api/claude/brand/writing/blog.md
 * GET /api/claude/tools/skills/algorithmic-art/SKILL.md
 * GET /api/claude/tools/plugins/feature-dev/PLUGIN.md
 * GET /api/claude/reference/design-system.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

// Content type mapping for different file extensions
const CONTENT_TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.ipynb': 'application/json; charset=utf-8',
};

// Security: Allowed file extensions
const ALLOWED_EXTENSIONS = new Set(['.md', '.json', '.txt', '.pdf', '.ipynb']);

// Security: Blocked path patterns
const BLOCKED_PATTERNS = [
  /\.\./, // Path traversal
  /^settings\.local\.json$/, // Local settings with potential secrets
  /node_modules/,
  /\.git/,
  /\.env/,
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Reconstruct the path from segments
    const relativePath = pathSegments.join('/');

    // Security checks
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(relativePath)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Check file extension
    const ext = extname(relativePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type not allowed: ${ext}` },
        { status: 403 }
      );
    }

    // Build full path within .claude directory
    const fullPath = join(process.cwd(), '.claude', relativePath);

    // Verify the resolved path is still within .claude (prevent path traversal)
    const claudeDir = join(process.cwd(), '.claude');
    if (!fullPath.startsWith(claudeDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      const fileStat = await stat(fullPath);
      if (!fileStat.isFile()) {
        return NextResponse.json(
          { error: 'Not a file' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read and return the file
    const content = await readFile(fullPath);
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving .claude file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
