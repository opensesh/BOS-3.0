/**
 * API Route for downloading brand style files as a ZIP bundle
 *
 * GET /api/styles/bundle → returns brand-styles.zip
 * GET /api/styles/bundle?include_fonts=true → includes font files
 *
 * Bundle includes:
 * - tokens.json (machine-readable design tokens)
 * - tailwind.config.ts (ready-to-use Tailwind configuration)
 * - brand.css (CSS custom properties + base styles)
 * - README.md (documentation)
 * - AI-CONTEXT.md (AI code generation guidance)
 * - fonts/ (optional: font files)
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import JSZip from 'jszip';

// Files to include in the base bundle (no fonts)
const BUNDLE_FILES = [
  'tokens.json',
  'tailwind.config.ts',
  'brand.css',
  'README.md',
  'AI-CONTEXT.md',
];

// Allowed font extensions
const FONT_EXTENSIONS = new Set(['.woff2', '.woff', '.ttf', '.otf']);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeFonts = searchParams.get('include_fonts') === 'true';

    const zip = new JSZip();
    const stylesDir = join(process.cwd(), 'lib', 'brand-styles');

    // Add base files
    for (const filename of BUNDLE_FILES) {
      const filePath = join(stylesDir, filename);
      try {
        const content = await readFile(filePath);
        zip.file(filename, content);
      } catch {
        // Skip files that don't exist
        console.warn(`Bundle: skipping missing file ${filename}`);
      }
    }

    // Optionally add font files
    if (includeFonts) {
      const fontsDir = join(stylesDir, 'fonts');
      try {
        const fontFiles = await readdir(fontsDir);
        const fontsFolder = zip.folder('fonts');

        for (const fontFile of fontFiles) {
          const ext = extname(fontFile).toLowerCase();
          if (!FONT_EXTENSIONS.has(ext)) continue;

          const fontPath = join(fontsDir, fontFile);
          const fontStat = await stat(fontPath);
          if (!fontStat.isFile()) continue;

          const content = await readFile(fontPath);
          fontsFolder?.file(fontFile, content);
        }
      } catch {
        // Fonts directory doesn't exist or can't be read
        console.warn('Bundle: fonts directory not accessible');
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Create filename with timestamp for versioning
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `brand-styles-${timestamp}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error creating style bundle:', error);
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    );
  }
}
