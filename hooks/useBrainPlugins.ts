/**
 * Hook for managing Brain Plugins with nested folder structure
 * 
 * Fetches from the new brain_plugins table which supports
 * hierarchical folder/file structures.
 */

import { useState, useEffect, useCallback } from 'react';
import type { BrainPlugin } from '@/lib/supabase/types';
import type { TreeItem } from '@/components/brain/FolderTreeNav';

interface UseBrainPluginsOptions {
  /** Brand ID to filter by (uses default if not provided) */
  brandId?: string;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseBrainPluginsReturn {
  /** All root-level plugins */
  plugins: BrainPlugin[];
  /** Plugin tree for the currently selected plugin */
  pluginTree: TreeItem | null;
  /** All items in the currently selected plugin (flat list) */
  pluginItems: BrainPlugin[];
  /** Currently selected plugin slug */
  activePluginSlug: string | null;
  /** Set the active plugin */
  setActivePluginSlug: (slug: string | null) => void;
  /** Currently selected item */
  activeItem: BrainPlugin | null;
  /** Set the active item */
  setActiveItem: (item: BrainPlugin | null) => void;
  /** Whether plugins are loading */
  isLoading: boolean;
  /** Whether plugin tree is loading */
  isTreeLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch plugins from API */
  fetchPlugins: () => Promise<void>;
  /** Fetch plugin tree */
  fetchPluginTree: (pluginSlug: string) => Promise<void>;
}

// Default brand ID - in production this would come from auth context
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Convert BrainPlugin to TreeItem for FolderTreeNav
 */
function brainPluginToTreeItem(plugin: BrainPlugin): TreeItem {
  return {
    id: plugin.id,
    slug: plugin.slug,
    title: plugin.title,
    itemType: plugin.itemType,
    pathSegments: plugin.pathSegments,
    children: plugin.children?.map(brainPluginToTreeItem),
  };
}

export function useBrainPlugins(
  options: UseBrainPluginsOptions = {}
): UseBrainPluginsReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [plugins, setPlugins] = useState<BrainPlugin[]>([]);
  const [pluginTree, setPluginTree] = useState<TreeItem | null>(null);
  const [pluginItems, setPluginItems] = useState<BrainPlugin[]>([]);
  const [activePluginSlug, setActivePluginSlug] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<BrainPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all root-level plugins
  const fetchPlugins = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brain/plugins?brandId=${brandId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plugins');
      }

      const data = await response.json();
      setPlugins(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching plugins:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Fetch plugin tree for a specific plugin
  const fetchPluginTree = useCallback(async (pluginSlug: string) => {
    setIsTreeLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/brain/plugins?brandId=${brandId}&pluginSlug=${pluginSlug}&tree=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch plugin tree');
      }

      const data: BrainPlugin = await response.json();
      setPluginTree(brainPluginToTreeItem(data));

      // Also fetch flat list for easier lookup
      const itemsResponse = await fetch(
        `/api/brain/plugins?brandId=${brandId}&pluginSlug=${pluginSlug}`
      );
      
      if (itemsResponse.ok) {
        const items = await itemsResponse.json();
        setPluginItems(items);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching plugin tree:', err);
    } finally {
      setIsTreeLoading(false);
    }
  }, [brandId]);

  // Auto-fetch plugins on mount
  useEffect(() => {
    if (autoFetch) {
      fetchPlugins();
    }
  }, [autoFetch, fetchPlugins]);

  // Fetch tree when active plugin changes
  useEffect(() => {
    if (activePluginSlug) {
      fetchPluginTree(activePluginSlug);
    } else {
      setPluginTree(null);
      setPluginItems([]);
    }
  }, [activePluginSlug, fetchPluginTree]);

  // Update active item when selection changes
  const handleSetActiveItem = useCallback((item: BrainPlugin | null) => {
    setActiveItem(item);
  }, []);

  return {
    plugins,
    pluginTree,
    pluginItems,
    activePluginSlug,
    setActivePluginSlug,
    activeItem,
    setActiveItem: handleSetActiveItem,
    isLoading,
    isTreeLoading,
    error,
    fetchPlugins,
    fetchPluginTree,
  };
}

export default useBrainPlugins;
