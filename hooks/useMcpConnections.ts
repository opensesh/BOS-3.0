'use client';

import { useState, useEffect, useCallback } from 'react';
import { mcpService } from '@/lib/supabase/mcp-service';
import type { McpConnection, McpServerConfig, McpApiKey, McpUsageStats } from '@/lib/supabase/types';

// ============================================
// MCP Client Connections Hook
// ============================================

interface UseMcpConnectionsReturn {
  connections: McpConnection[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createConnection: (data: {
    name: string;
    description?: string;
    serverUrl: string;
    serverType?: 'remote' | 'local' | 'stdio';
    authType?: 'none' | 'bearer' | 'api_key' | 'oauth';
    authConfig?: { token?: string; apiKey?: string };
  }) => Promise<McpConnection | null>;
  updateConnection: (id: string, updates: Partial<McpConnection>) => Promise<boolean>;
  deleteConnection: (id: string) => Promise<boolean>;
  toggleConnection: (id: string) => Promise<boolean>;
  testConnection: (id: string) => Promise<{ success: boolean; tools?: unknown[]; error?: string }>;
}

export function useMcpConnections(userId?: string): UseMcpConnectionsReturn {
  const [connections, setConnections] = useState<McpConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mcpService.getAllConnections(userId);
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createConnection = useCallback(async (data: {
    name: string;
    description?: string;
    serverUrl: string;
    serverType?: 'remote' | 'local' | 'stdio';
    authType?: 'none' | 'bearer' | 'api_key' | 'oauth';
    authConfig?: { token?: string; apiKey?: string };
  }) => {
    try {
      const connection = await mcpService.createConnection({
        name: data.name,
        description: data.description,
        server_url: data.serverUrl,
        server_type: data.serverType || 'remote',
        auth_type: data.authType || 'none',
        auth_config: data.authConfig || {},
        user_id: userId,
        is_active: true,
      });
      
      if (connection) {
        setConnections(prev => [...prev, connection]);
      }
      return connection;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
      return null;
    }
  }, [userId]);

  const updateConnection = useCallback(async (id: string, updates: Partial<McpConnection>) => {
    try {
      const updated = await mcpService.updateConnection(id, {
        name: updates.name,
        description: updates.description,
        server_url: updates.serverUrl,
        server_type: updates.serverType,
        auth_type: updates.authType,
        auth_config: updates.authConfig,
        is_active: updates.isActive,
      });
      
      if (updated) {
        setConnections(prev => prev.map(c => c.id === id ? updated : c));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const deleteConnection = useCallback(async (id: string) => {
    try {
      const success = await mcpService.deleteConnection(id);
      if (success) {
        setConnections(prev => prev.filter(c => c.id !== id));
      }
      return success;
    } catch {
      return false;
    }
  }, []);

  const toggleConnection = useCallback(async (id: string) => {
    try {
      const success = await mcpService.toggleActive(id);
      if (success) {
        setConnections(prev => prev.map(c => 
          c.id === id ? { ...c, isActive: !c.isActive } : c
        ));
      }
      return success;
    } catch {
      return false;
    }
  }, []);

  const testConnection = useCallback(async (id: string) => {
    try {
      return await mcpService.testConnection(id);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Test failed' };
    }
  }, []);

  return {
    connections,
    isLoading,
    error,
    refresh,
    createConnection,
    updateConnection,
    deleteConnection,
    toggleConnection,
    testConnection,
  };
}

// ============================================
// MCP Server Config Hook (BOS as MCP Server)
// ============================================

interface UseMcpServerConfigReturn {
  config: McpServerConfig | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateConfig: (updates: Partial<McpServerConfig>) => Promise<boolean>;
  generateApiKey: (name: string) => Promise<McpApiKey | null>;
  revokeApiKey: (key: string) => Promise<boolean>;
  getUsageStats: (days?: number) => Promise<McpUsageStats | null>;
}

export function useMcpServerConfig(brandId?: string): UseMcpServerConfigReturn {
  const [config, setConfig] = useState<McpServerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await mcpService.getServerConfig(brandId);
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateConfig = useCallback(async (updates: Partial<McpServerConfig>) => {
    if (!config) return false;
    
    try {
      const updated = await mcpService.updateServerConfig(config.id, {
        is_enabled: updates.isEnabled,
        allowed_tools: updates.allowedTools,
        rate_limit_per_minute: updates.rateLimitPerMinute,
        rate_limit_per_day: updates.rateLimitPerDay,
      });
      
      if (updated) {
        setConfig(updated);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [config]);

  const generateApiKey = useCallback(async (name: string) => {
    if (!config) return null;
    
    try {
      const newKey = await mcpService.generateApiKey(config.id, name);
      if (newKey) {
        // Refresh to get updated config with new key
        await refresh();
      }
      return newKey;
    } catch {
      return null;
    }
  }, [config, refresh]);

  const revokeApiKey = useCallback(async (key: string) => {
    if (!config) return false;
    
    try {
      const success = await mcpService.revokeApiKey(config.id, key);
      if (success) {
        await refresh();
      }
      return success;
    } catch {
      return false;
    }
  }, [config, refresh]);

  const getUsageStats = useCallback(async (days = 30) => {
    if (!config) return null;
    
    try {
      return await mcpService.getUsageStats(config.id, days);
    } catch {
      return null;
    }
  }, [config]);

  return {
    config,
    isLoading,
    error,
    refresh,
    updateConfig,
    generateApiKey,
    revokeApiKey,
    getUsageStats,
  };
}

// ============================================
// Available MCP Tools Hook
// ============================================

interface McpToolWithSource {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  connectionId: string;
  connectionName: string;
}

interface UseAvailableMcpToolsReturn {
  tools: McpToolWithSource[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useAvailableMcpTools(userId?: string): UseAvailableMcpToolsReturn {
  const [tools, setTools] = useState<McpToolWithSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTools = await mcpService.getAllAvailableTools(userId);
      setTools(allTools);
    } catch {
      setTools([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tools, isLoading, refresh };
}

