/**
 * API Route for seeding brand documents from static markdown files
 * 
 * This endpoint reads markdown files from the public directory and seeds
 * them into the database. It only seeds documents that have empty content.
 * 
 * POST /api/brain/seed - Seed all documents
 * GET /api/brain/seed - Check if seeding is needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  needsSeeding,
  seedDocumentContent,
  getAllDocuments,
} from '@/lib/supabase/brand-documents-service';
import type { BrandDocumentCategory } from '@/lib/supabase/types';

// File mappings for each category
// All files are now read from .claude/ directory (the single source of truth for local files)
const FILE_MAPPINGS: Array<{
  category: BrandDocumentCategory;
  slug: string;
  filePath: string;
}> = [
  // Brand Identity (from .claude/brand-identity)
  {
    category: 'brand-identity',
    slug: 'brand-identity',
    filePath: '.claude/brand-identity/OS_brand identity.md',
  },
  {
    category: 'brand-identity',
    slug: 'brand-messaging',
    filePath: '.claude/brand-identity/OS_brand messaging.md',
  },
  {
    category: 'brand-identity',
    slug: 'art-direction',
    filePath: '.claude/brand-identity/OS_art direction.md',
  },
  // Writing Styles (from .claude/writing-styles)
  {
    category: 'writing-styles',
    slug: 'blog',
    filePath: '.claude/writing-styles/blog.md',
  },
  {
    category: 'writing-styles',
    slug: 'creative',
    filePath: '.claude/writing-styles/creative.md',
  },
  {
    category: 'writing-styles',
    slug: 'long-form',
    filePath: '.claude/writing-styles/long-form.md',
  },
  {
    category: 'writing-styles',
    slug: 'short-form',
    filePath: '.claude/writing-styles/short-form.md',
  },
  {
    category: 'writing-styles',
    slug: 'strategic',
    filePath: '.claude/writing-styles/strategic.md',
  },
  // Skills (from .claude/skills directory)
  {
    category: 'skills',
    slug: 'algorithmic-art',
    filePath: '.claude/skills/algorithmic-art/SKILL.md',
  },
  {
    category: 'skills',
    slug: 'artifacts-builder',
    filePath: '.claude/skills/artifacts-builder/SKILL.md',
  },
  {
    category: 'skills',
    slug: 'brand-guidelines',
    filePath: '.claude/skills/brand-guidelines/SKILL.md',
  },
  {
    category: 'skills',
    slug: 'canvas-design',
    filePath: '.claude/skills/canvas-design/SKILL.md',
  },
  {
    category: 'skills',
    slug: 'mcp-builder',
    filePath: '.claude/skills/mcp-builder/SKILL.md',
  },
  {
    category: 'skills',
    slug: 'skill-creator',
    filePath: '.claude/skills/skill-creator/SKILL.md',
  },
  {
    category: 'skills',
    slug: 'create-post-copy',
    filePath: '.claude/skills/create-post-copy/SKILL.md',
  },
];

/**
 * Read a file from the project directory
 */
async function readFileContent(relativePath: string): Promise<string | null> {
  try {
    const fullPath = join(process.cwd(), relativePath);
    const content = await readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`Failed to read file: ${relativePath}`, error);
    return null;
  }
}

// ============================================
// GET - Check if seeding is needed
// ============================================

export async function GET() {
  try {
    const needsSeed = await needsSeeding();
    const documents = await getAllDocuments();
    
    const emptyDocs = documents.filter(d => !d.content || d.content.trim() === '');
    
    return NextResponse.json({
      needsSeeding: needsSeed,
      totalDocuments: documents.length,
      emptyDocuments: emptyDocs.length,
      emptyDocumentSlugs: emptyDocs.map(d => `${d.category}/${d.slug}`),
    });
  } catch (error) {
    console.error('Error checking seed status:', error);
    return NextResponse.json(
      { error: 'Failed to check seed status' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Seed documents from files
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { force } = await request.json().catch(() => ({ force: false }));
    
    const results: Array<{
      category: string;
      slug: string;
      status: 'seeded' | 'skipped' | 'error';
      message?: string;
    }> = [];

    for (const mapping of FILE_MAPPINGS) {
      try {
        // Read file content
        const content = await readFileContent(mapping.filePath);
        
        if (!content) {
          results.push({
            category: mapping.category,
            slug: mapping.slug,
            status: 'error',
            message: `File not found: ${mapping.filePath}`,
          });
          continue;
        }

        // Seed the document
        const doc = await seedDocumentContent(mapping.category, mapping.slug, content);
        
        if (doc && doc.content === content) {
          results.push({
            category: mapping.category,
            slug: mapping.slug,
            status: 'seeded',
          });
        } else if (doc) {
          results.push({
            category: mapping.category,
            slug: mapping.slug,
            status: 'skipped',
            message: 'Document already has content',
          });
        } else {
          results.push({
            category: mapping.category,
            slug: mapping.slug,
            status: 'error',
            message: 'Document not found in database',
          });
        }
      } catch (err) {
        results.push({
          category: mapping.category,
          slug: mapping.slug,
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const seeded = results.filter(r => r.status === 'seeded').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        seeded,
        skipped,
        errors,
      },
      results,
    });
  } catch (error) {
    console.error('Error seeding documents:', error);
    return NextResponse.json(
      { error: 'Failed to seed documents' },
      { status: 500 }
    );
  }
}

