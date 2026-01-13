/**
 * API Route for serving brand style files
 *
 * This route serves files from the lib/brand-styles/ directory,
 * allowing download of design tokens, CSS, and fonts without
 * requiring a public folder.
 *
 * GET /api/styles/tokens.json
 * GET /api/styles/brand.css
 * GET /api/styles/fonts/NeueHaasDisplayBold.woff2
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

// Content type mapping for different file extensions
const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ts': 'text/typescript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

// Security: Allowed file extensions
const ALLOWED_EXTENSIONS = new Set(['.json', '.css', '.ts', '.md', '.woff2', '.woff', '.ttf', '.otf']);

// Security: Blocked path patterns
const BLOCKED_PATTERNS = [
  /\.\./, // Path traversal
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

    // Build full path within lib/brand-styles directory
    const fullPath = join(process.cwd(), 'lib', 'brand-styles', relativePath);

    // Verify the resolved path is still within lib/brand-styles (prevent path traversal)
    const stylesDir = join(process.cwd(), 'lib', 'brand-styles');
    if (!fullPath.startsWith(stylesDir)) {
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
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving style file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
