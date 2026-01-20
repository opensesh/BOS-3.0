'use server';

import fs from 'fs/promises';
import path from 'path';

const BRAND_IDENTITY_DIR = path.join(process.cwd(), '.claude/brand/identity');

export interface BrandIdentityFile {
  id: string;
  slug: string;
  title: string;
  fileType: 'markdown' | 'pdf';
  filename: string;
}

/**
 * List all brand identity files from the .claude/brand-identity directory
 */
export async function listBrandIdentityFiles(): Promise<BrandIdentityFile[]> {
  try {
    const files = await fs.readdir(BRAND_IDENTITY_DIR);
    
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.pdf'))
      .map(file => {
        const ext = path.extname(file).toLowerCase();
        const basename = path.basename(file, ext);
        // Remove OS_ prefix if present
        const cleanName = basename.replace(/^OS_/i, '');
        const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        return {
          id: slug,
          slug,
          title: cleanName.replace(/[-_]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          fileType: ext === '.pdf' ? 'pdf' as const : 'markdown' as const,
          filename: file,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error('Error listing brand identity files:', error);
    return [];
  }
}

/**
 * Get the content of a brand identity markdown file
 */
export async function getBrandIdentityContent(slug: string): Promise<string> {
  try {
    const files = await fs.readdir(BRAND_IDENTITY_DIR);
    
    // Find the file that matches the slug
    const matchingFile = files.find(file => {
      if (!file.endsWith('.md')) return false;
      const basename = path.basename(file, '.md');
      const cleanName = basename.replace(/^OS_/i, '');
      const fileSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return fileSlug === slug;
    });
    
    if (!matchingFile) {
      return `Error: File not found for slug "${slug}"`;
    }
    
    const filePath = path.join(BRAND_IDENTITY_DIR, matchingFile);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading brand identity file ${slug}:`, error);
    return `Error loading brand identity content for ${slug}`;
  }
}

/**
 * Get the path to a brand identity PDF file for serving
 */
export async function getBrandIdentityPdfPath(slug: string): Promise<string | null> {
  try {
    const files = await fs.readdir(BRAND_IDENTITY_DIR);
    
    // Find the PDF file that matches the slug
    const matchingFile = files.find(file => {
      if (!file.endsWith('.pdf')) return false;
      const basename = path.basename(file, '.pdf');
      const cleanName = basename.replace(/^OS_/i, '');
      const fileSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return fileSlug === slug;
    });
    
    if (!matchingFile) {
      return null;
    }
    
    // Return the relative path for the API route
    return `.claude/brand/identity/${matchingFile}`;
  } catch (error) {
    console.error(`Error finding brand identity PDF ${slug}:`, error);
    return null;
  }
}
