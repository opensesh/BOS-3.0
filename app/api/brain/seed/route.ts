/**
 * API Route: Seed Brain Tables
 *
 * Seeds the new brain_* tables with data from the local .claude/ directory.
 * This endpoint migrates existing content to the new architecture.
 * Uses admin client to bypass RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Get admin client for bypassing RLS
const getAdminSupabase = () => createAdminClient();

// Admin versions of create functions
async function createBrandIdentityDoc(data: Record<string, unknown>) {
  const supabase = getAdminSupabase();
  const { data: result, error } = await supabase
    .from('brain_brand_identity')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

async function createWritingStyle(data: Record<string, unknown>) {
  const supabase = getAdminSupabase();
  const { data: result, error } = await supabase
    .from('brain_writing_styles')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

async function createPluginItem(data: Record<string, unknown>) {
  const supabase = getAdminSupabase();
  const { data: result, error } = await supabase
    .from('brain_plugins')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

async function createSkillItem(data: Record<string, unknown>) {
  const supabase = getAdminSupabase();
  const { data: result, error } = await supabase
    .from('brain_skills')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

// Default brand ID - in production this would come from auth context
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';
const CLAUDE_DIR = path.join(process.cwd(), '.claude');

interface SeedResult {
  table: string;
  seeded: number;
  errors: string[];
}

/**
 * Ensure the default brand exists in the brands table
 */
async function ensureBrandExists(brandId: string): Promise<void> {
  const supabase = getAdminSupabase();

  // Check if brand exists
  const { data: existingBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brandId)
    .single();

  if (existingBrand) {
    return; // Brand already exists
  }

  // Create the default brand with minimal fields
  const { error } = await supabase.from('brands').insert({
    id: brandId,
    name: 'Default Brand',
    slug: 'default',
  });

  if (error && error.code !== '23505') {
    // Ignore duplicate key errors (23505) - brand was created by another request
    throw new Error(`Failed to create default brand: ${error.message}`);
  }
}

/**
 * POST /api/brain/seed
 *
 * Seeds all brain tables from local .claude/ files
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;
    const dryRun = searchParams.get('dryRun') === 'true';

    // Ensure the brand exists before seeding
    if (!dryRun) {
      await ensureBrandExists(brandId);
    }

    const results: SeedResult[] = [];

    // Seed brand identity documents
    const brandIdentityResult = await seedBrandIdentity(brandId, dryRun);
    results.push(brandIdentityResult);

    // Seed writing styles
    const writingStylesResult = await seedWritingStyles(brandId, dryRun);
    results.push(writingStylesResult);

    // Seed plugins
    const pluginsResult = await seedPlugins(brandId, dryRun);
    results.push(pluginsResult);

    // Seed skills
    const skillsResult = await seedSkills(brandId, dryRun);
    results.push(skillsResult);

    const totalSeeded = results.reduce((sum, r) => sum + r.seeded, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: totalErrors === 0,
      dryRun,
      results,
      summary: {
        totalSeeded,
        totalErrors,
      },
    });
  } catch (error) {
    console.error('Error seeding brain tables:', error);
    return NextResponse.json(
      { error: 'Failed to seed brain tables', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Seed brain_brand_identity table
 */
async function seedBrandIdentity(
  brandId: string,
  dryRun: boolean
): Promise<SeedResult> {
  const result: SeedResult = { table: 'brain_brand_identity', seeded: 0, errors: [] };
  const brandIdentityDir = path.join(CLAUDE_DIR, 'brand-identity');

  try {
    const exists = await fs.stat(brandIdentityDir).catch(() => null);
    if (!exists) {
      result.errors.push('brand-identity directory not found');
      return result;
    }

    const files = await fs.readdir(brandIdentityDir);
    
    for (const file of files) {
      const filePath = path.join(brandIdentityDir, file);
      const stat = await fs.stat(filePath);
      
      if (!stat.isFile()) continue;

      const ext = path.extname(file).toLowerCase();
      if (ext !== '.md' && ext !== '.pdf') continue;

      try {
        const fileType = ext === '.pdf' ? 'pdf' : 'markdown';
        const slug = generateSlug(file);
        const title = formatTitle(file);

        if (dryRun) {
          console.log(`[DRY RUN] Would seed brand identity: ${title} (${fileType})`);
          result.seeded++;
          continue;
        }

        if (fileType === 'markdown') {
          const content = await fs.readFile(filePath, 'utf-8');
          const hash = computeHash(content);

          await createBrandIdentityDoc({
            brand_id: brandId,
            slug,
            title,
            content,
            file_type: 'markdown',
            file_path: `.claude/brand-identity/${file}`,
            file_hash: hash,
            sync_status: 'synced',
            sort_order: result.seeded,
          });
        } else {
          // For PDFs, we store metadata only (file stays in .claude/)
          await createBrandIdentityDoc({
            brand_id: brandId,
            slug,
            title,
            content: '',
            file_type: 'pdf',
            file_path: `.claude/brand-identity/${file}`,
            file_size: stat.size,
            mime_type: 'application/pdf',
            sort_order: result.seeded,
          });
        }

        result.seeded++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        result.errors.push(`Failed to seed ${file}: ${errorMsg}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    result.errors.push(`Error reading brand-identity directory: ${errorMsg}`);
  }

  return result;
}

/**
 * Seed brain_writing_styles table
 */
async function seedWritingStyles(
  brandId: string,
  dryRun: boolean
): Promise<SeedResult> {
  const result: SeedResult = { table: 'brain_writing_styles', seeded: 0, errors: [] };
  const stylesDir = path.join(CLAUDE_DIR, 'writing-styles');

  try {
    const exists = await fs.stat(stylesDir).catch(() => null);
    if (!exists) {
      result.errors.push('writing-styles directory not found');
      return result;
    }

    const files = await fs.readdir(stylesDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(stylesDir, file);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;

      try {
        const slug = generateSlug(file);
        const title = formatTitle(file);

        if (dryRun) {
          console.log(`[DRY RUN] Would seed writing style: ${title}`);
          result.seeded++;
          continue;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const hash = computeHash(content);

        await createWritingStyle({
          brand_id: brandId,
          slug,
          title,
          content,
          file_path: `.claude/writing-styles/${file}`,
          file_hash: hash,
          sync_status: 'synced',
          sort_order: result.seeded,
        });

        result.seeded++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        result.errors.push(`Failed to seed ${file}: ${errorMsg}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    result.errors.push(`Error reading writing-styles directory: ${errorMsg}`);
  }

  return result;
}

/**
 * Seed brain_plugins table with nested structure
 */
async function seedPlugins(
  brandId: string,
  dryRun: boolean
): Promise<SeedResult> {
  const result: SeedResult = { table: 'brain_plugins', seeded: 0, errors: [] };
  const pluginsDir = path.join(CLAUDE_DIR, 'plugins');

  try {
    const exists = await fs.stat(pluginsDir).catch(() => null);
    if (!exists) {
      result.errors.push('plugins directory not found');
      return result;
    }

    const plugins = await fs.readdir(pluginsDir, { withFileTypes: true });
    
    for (const pluginEntry of plugins) {
      if (!pluginEntry.isDirectory() || pluginEntry.name.startsWith('.')) continue;

      const pluginSlug = pluginEntry.name;
      const pluginPath = path.join(pluginsDir, pluginSlug);

      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would seed plugin: ${pluginSlug}`);
          result.seeded++;
          // Count nested items
          const nestedCount = await countNestedItems(pluginPath);
          result.seeded += nestedCount;
          continue;
        }

        // Create root plugin folder
        const rootPlugin = await createPluginItem({
          brand_id: brandId,
          slug: pluginSlug,
          title: formatTitle(pluginSlug),
          item_type: 'folder',
          plugin_slug: pluginSlug,
          path_segments: [],
          sort_order: result.seeded,
        });

        result.seeded++;

        // Recursively seed nested items
        const nested = await seedPluginFolder(
          brandId,
          pluginSlug,
          pluginPath,
          rootPlugin.id,
          [],
          dryRun
        );
        result.seeded += nested.seeded;
        result.errors.push(...nested.errors);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        result.errors.push(`Failed to seed plugin ${pluginSlug}: ${errorMsg}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    result.errors.push(`Error reading plugins directory: ${errorMsg}`);
  }

  return result;
}

/**
 * Recursively seed a plugin folder
 */
async function seedPluginFolder(
  brandId: string,
  pluginSlug: string,
  folderPath: string,
  parentId: string,
  pathSegments: string[],
  dryRun: boolean
): Promise<{ seeded: number; errors: string[] }> {
  const result = { seeded: 0, errors: [] as string[] };

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    let sortOrder = 0;

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const entryPath = path.join(folderPath, entry.name);
      const entrySegments = [...pathSegments, entry.name];

      try {
        if (entry.isDirectory()) {
          // Create folder item
          const folder = await createPluginItem({
            brand_id: brandId,
            parent_id: parentId,
            slug: entry.name,
            title: formatTitle(entry.name),
            item_type: 'folder',
            plugin_slug: pluginSlug,
            path_segments: entrySegments,
            sort_order: sortOrder++,
          });

          result.seeded++;

          // Recursively seed subfolder
          const nested = await seedPluginFolder(
            brandId,
            pluginSlug,
            entryPath,
            folder.id,
            entrySegments,
            dryRun
          );
          result.seeded += nested.seeded;
          result.errors.push(...nested.errors);
        } else if (entry.name.endsWith('.md')) {
          // Create file item
          const content = await fs.readFile(entryPath, 'utf-8');
          const hash = computeHash(content);
          const relativePath = `.claude/plugins/${pluginSlug}/${entrySegments.join('/')}`;

          await createPluginItem({
            brand_id: brandId,
            parent_id: parentId,
            slug: entry.name,
            title: formatTitle(entry.name),
            item_type: 'file',
            content,
            plugin_slug: pluginSlug,
            path_segments: entrySegments,
            sort_order: sortOrder++,
            file_path: relativePath,
            file_hash: hash,
            sync_status: 'synced',
          });

          result.seeded++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        result.errors.push(`Failed to seed ${entry.name}: ${errorMsg}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    result.errors.push(`Error reading folder: ${errorMsg}`);
  }

  return result;
}

/**
 * Seed brain_skills table with nested structure
 */
async function seedSkills(
  brandId: string,
  dryRun: boolean
): Promise<SeedResult> {
  const result: SeedResult = { table: 'brain_skills', seeded: 0, errors: [] };
  const skillsDir = path.join(CLAUDE_DIR, 'skills');

  try {
    const exists = await fs.stat(skillsDir).catch(() => null);
    if (!exists) {
      result.errors.push('skills directory not found');
      return result;
    }

    const skills = await fs.readdir(skillsDir, { withFileTypes: true });
    
    for (const skillEntry of skills) {
      if (!skillEntry.isDirectory() || skillEntry.name.startsWith('.')) continue;

      const skillSlug = skillEntry.name;
      const skillPath = path.join(skillsDir, skillSlug);

      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would seed skill: ${skillSlug}`);
          result.seeded++;
          continue;
        }

        // Create root skill folder
        const rootSkill = await createSkillItem({
          brand_id: brandId,
          slug: skillSlug,
          title: formatTitle(skillSlug),
          item_type: 'folder',
          skill_slug: skillSlug,
          path_segments: [],
          sort_order: result.seeded,
        });

        result.seeded++;

        // Seed skill files (usually SKILL.md)
        const files = await fs.readdir(skillPath);
        let sortOrder = 0;

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(skillPath, file);
          const stat = await fs.stat(filePath);
          if (!stat.isFile()) continue;

          const content = await fs.readFile(filePath, 'utf-8');
          const hash = computeHash(content);
          const relativePath = `.claude/skills/${skillSlug}/${file}`;

          await createSkillItem({
            brand_id: brandId,
            parent_id: rootSkill.id,
            slug: file,
            title: formatTitle(file),
            item_type: 'file',
            content,
            skill_slug: skillSlug,
            path_segments: [file],
            sort_order: sortOrder++,
            file_path: relativePath,
            file_hash: hash,
            sync_status: 'synced',
          });

          result.seeded++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        result.errors.push(`Failed to seed skill ${skillSlug}: ${errorMsg}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    result.errors.push(`Error reading skills directory: ${errorMsg}`);
  }

  return result;
}

/**
 * Count nested items in a directory
 */
async function countNestedItems(dirPath: string): Promise<number> {
  let count = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      count++;
      if (entry.isDirectory()) {
        count += await countNestedItems(path.join(dirPath, entry.name));
      }
    }
  } catch {
    // Ignore errors
  }

  return count;
}

/**
 * Generate a slug from a filename
 */
function generateSlug(filename: string): string {
  return filename
    .replace(/\.(md|pdf)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format a filename as a title
 */
function formatTitle(filename: string): string {
  // Remove extension
  const withoutExt = filename.replace(/\.(md|pdf)$/i, '');
  
  // Remove OS_ prefix if present
  const withoutPrefix = withoutExt.replace(/^OS_/i, '');
  
  // Format kebab-case or snake_case
  return withoutPrefix
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Compute hash of content
 */
function computeHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}
