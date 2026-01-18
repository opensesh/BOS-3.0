/**
 * API Route: Brain Skills
 *
 * Handles CRUD operations for skills with nested folder structure
 * from the brain_skills table (new architecture).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSkills,
  getSkillItems,
  getSkillTree,
  getSkillItemById,
  createSkillItem,
  createSkill,
  updateSkillItem,
  deleteSkillItem,
} from '@/lib/supabase/brain-skills-service';

// Temporary default brand ID - in production this would come from auth
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/brain/skills
 *
 * Query params:
 * - id: Get a specific item by ID
 * - skillSlug: Get all items in a skill (flat list)
 * - skillSlug + tree=true: Get skill as tree structure
 * - (none): Get all root-level skills
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const skillSlug = searchParams.get('skillSlug');
    const asTree = searchParams.get('tree') === 'true';
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;

    // Get by ID
    if (id) {
      const item = await getSkillItemById(id);
      if (!item) {
        return NextResponse.json(
          { error: 'Skill item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(item);
    }

    // Get skill items (flat or tree)
    if (skillSlug) {
      if (asTree) {
        const tree = await getSkillTree(brandId, skillSlug);
        if (!tree) {
          return NextResponse.json(
            { error: 'Skill not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(tree);
      }

      const items = await getSkillItems(brandId, skillSlug);
      return NextResponse.json(items);
    }

    // Get all root-level skills
    const skills = await getSkills(brandId);
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brain/skills
 *
 * Create a new skill or skill item
 *
 * For root skill: { slug, title, metadata?, isRootSkill: true }
 * For item: { slug, title, parentId?, itemType, content?, skillSlug, pathSegments? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brandId = body.brandId || DEFAULT_BRAND_ID;

    // Create root skill (folder without parent)
    if (body.isRootSkill) {
      const skill = await createSkill(
        brandId,
        body.slug,
        body.title,
        body.metadata
      );
      return NextResponse.json(skill, { status: 201 });
    }

    // Create skill item
    const item = await createSkillItem({
      brand_id: brandId,
      parent_id: body.parentId,
      slug: body.slug,
      title: body.title,
      item_type: body.itemType || 'file',
      content: body.content || '',
      skill_slug: body.skillSlug,
      path_segments: body.pathSegments || [],
      sort_order: body.sortOrder || 0,
      metadata: body.metadata,
      file_path: body.filePath,
      file_hash: body.fileHash,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating skill item:', error);
    return NextResponse.json(
      { error: 'Failed to create skill item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/brain/skills
 *
 * Update a skill item
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Skill item ID is required' },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
    if (updates.itemType !== undefined) dbUpdates.item_type = updates.itemType;
    if (updates.pathSegments !== undefined) dbUpdates.path_segments = updates.pathSegments;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.filePath !== undefined) dbUpdates.file_path = updates.filePath;
    if (updates.fileHash !== undefined) dbUpdates.file_hash = updates.fileHash;
    if (updates.syncStatus !== undefined) dbUpdates.sync_status = updates.syncStatus;

    const item = await updateSkillItem(id, dbUpdates);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating skill item:', error);
    return NextResponse.json(
      { error: 'Failed to update skill item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brain/skills
 *
 * Soft delete a skill item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Skill item ID is required' },
        { status: 400 }
      );
    }

    await deleteSkillItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill item:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill item' },
      { status: 500 }
    );
  }
}
