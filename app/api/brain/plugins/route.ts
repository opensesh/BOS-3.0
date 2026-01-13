/**
 * API Route: Brain Plugins
 * 
 * Handles CRUD operations for plugins with nested folder structure
 * from the brain_plugins table (new architecture).
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getPlugins,
  getPluginItems,
  getPluginTree,
  getPluginItemById,
  createPluginItem,
  createPlugin,
  updatePluginItem,
  deletePluginItem,
} from '@/lib/supabase/brain-plugins-service';

// Temporary default brand ID - in production this would come from auth
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/brain/plugins
 * 
 * Query params:
 * - id: Get a specific item by ID
 * - pluginSlug: Get all items in a plugin (flat list)
 * - pluginSlug + tree=true: Get plugin as tree structure
 * - (none): Get all root-level plugins
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pluginSlug = searchParams.get('pluginSlug');
    const asTree = searchParams.get('tree') === 'true';
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;

    // Get by ID
    if (id) {
      const item = await getPluginItemById(id);
      if (!item) {
        return NextResponse.json(
          { error: 'Plugin item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(item);
    }

    // Get plugin items (flat or tree)
    if (pluginSlug) {
      if (asTree) {
        const tree = await getPluginTree(brandId, pluginSlug);
        if (!tree) {
          return NextResponse.json(
            { error: 'Plugin not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(tree);
      }
      
      const items = await getPluginItems(brandId, pluginSlug);
      return NextResponse.json(items);
    }

    // Get all root-level plugins
    const plugins = await getPlugins(brandId);
    return NextResponse.json(plugins);
  } catch (error) {
    console.error('Error fetching plugins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brain/plugins
 * 
 * Create a new plugin or plugin item
 * 
 * For root plugin: { slug, title, metadata? }
 * For item: { slug, title, parentId?, itemType, content?, pluginSlug, pathSegments? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brandId = body.brandId || DEFAULT_BRAND_ID;

    // Create root plugin (folder without parent)
    if (body.isRootPlugin) {
      const plugin = await createPlugin(
        brandId,
        body.slug,
        body.title,
        body.metadata
      );
      return NextResponse.json(plugin, { status: 201 });
    }

    // Create plugin item
    const item = await createPluginItem({
      brand_id: brandId,
      parent_id: body.parentId,
      slug: body.slug,
      title: body.title,
      item_type: body.itemType || 'file',
      content: body.content || '',
      plugin_slug: body.pluginSlug,
      path_segments: body.pathSegments || [],
      sort_order: body.sortOrder || 0,
      metadata: body.metadata,
      file_path: body.filePath,
      file_hash: body.fileHash,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating plugin item:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/brain/plugins
 * 
 * Update a plugin item
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plugin item ID is required' },
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

    const item = await updatePluginItem(id, dbUpdates);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating plugin item:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brain/plugins
 * 
 * Soft delete a plugin item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Plugin item ID is required' },
        { status: 400 }
      );
    }

    await deletePluginItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plugin item:', error);
    return NextResponse.json(
      { error: 'Failed to delete plugin item' },
      { status: 500 }
    );
  }
}
