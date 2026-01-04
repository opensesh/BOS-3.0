'use client';

import { createClient } from './client';
import type {
  DbMcpConnection,
  McpConnectionInsert,
  McpConnectionUpdate,
  McpConnection,
  McpTool,
  McpServerType,
  McpAuthType,
  McpHealthStatus,
  DbMcpServerConfig,
  McpServerConfig,
  McpServerConfigUpdate,
  McpApiKey,
  McpUsageStats,
} from './types';
import { dbMcpServerConfigToApp } from './types';

// Re-export types and converter
export { dbMcpConnectionToApp, dbMcpServerConfigToApp } from './types';
export type { 
  McpConnection, 
  McpTool, 
  McpServerType, 
  McpAuthType, 
  McpHealthStatus,
  McpServerConfig,
  McpApiKey,
  McpUsageStats,
};

// Track if tables are available
let tablesChecked = false;
let tablesAvailable = true;

/**
 * Check if mcp_connections table is available
 */
async function checkTablesAvailable(): Promise<boolean> {
  if (tablesChecked) return tablesAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase.from('mcp_connections').select('id').limit(1);

    tablesChecked = true;

    if (!error) {
      tablesAvailable = true;
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTableMissing =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorCode === '42P01' ||
      errorCode === 'PGRST116';

    tablesAvailable = false;

    if (isTableMissing) {
      console.info('MCP Connections: Table not available. MCP management disabled.');
    }

    return false;
  } catch {
    tablesChecked = true;
    tablesAvailable = false;
    return false;
  }
}

/**
 * Convert database MCP connection to app format
 */
function toAppMcpConnection(db: DbMcpConnection): McpConnection {
  return {
    id: db.id,
    userId: db.user_id || undefined,
    name: db.name,
    description: db.description || undefined,
    serverUrl: db.server_url,
    serverType: db.server_type,
    authType: db.auth_type,
    authConfig: db.auth_config || {},
    isActive: db.is_active,
    availableTools: db.available_tools || undefined,
    lastHealthCheck: db.last_health_check || undefined,
    healthStatus: db.health_status,
    createdAt: db.created_at,
    lastUsed: db.last_used || undefined,
  };
}

/**
 * MCP Connection Service
 * Manages Model Context Protocol server configurations
 */
export const mcpService = {
  /**
   * Create a new MCP connection
   */
  async createConnection(connection: McpConnectionInsert): Promise<McpConnection | null> {
    if (!(await checkTablesAvailable())) {
      console.warn('MCP connection storage not available');
      return null;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('mcp_connections')
        .insert(connection)
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating MCP connection:', error);
        return null;
      }

      return toAppMcpConnection(data);
    } catch (error) {
      console.error('Error in createConnection:', error);
      return null;
    }
  },

  /**
   * Get MCP connection by ID
   */
  async getConnection(id: string): Promise<McpConnection | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('mcp_connections')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching MCP connection:', error);
        return null;
      }

      return toAppMcpConnection(data);
    } catch (error) {
      console.error('Error in getConnection:', error);
      return null;
    }
  },

  /**
   * Get all active MCP connections
   */
  async getActiveConnections(userId?: string): Promise<McpConnection[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      let query = supabase
        .from('mcp_connections')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      // Filter by user if provided, otherwise get global connections
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('Error fetching active MCP connections:', error);
        return [];
      }

      return data.map(toAppMcpConnection);
    } catch (error) {
      console.error('Error in getActiveConnections:', error);
      return [];
    }
  },

  /**
   * Get all MCP connections (active and inactive)
   */
  async getAllConnections(userId?: string): Promise<McpConnection[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      let query = supabase
        .from('mcp_connections')
        .select('*')
        .order('name', { ascending: true });

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('Error fetching MCP connections:', error);
        return [];
      }

      return data.map(toAppMcpConnection);
    } catch (error) {
      console.error('Error in getAllConnections:', error);
      return [];
    }
  },

  /**
   * Update an MCP connection
   */
  async updateConnection(id: string, updates: McpConnectionUpdate): Promise<McpConnection | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('mcp_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating MCP connection:', error);
        return null;
      }

      return toAppMcpConnection(data);
    } catch (error) {
      console.error('Error in updateConnection:', error);
      return null;
    }
  },

  /**
   * Toggle connection active status
   */
  async toggleActive(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      // Get current status
      const { data: current } = await supabase
        .from('mcp_connections')
        .select('is_active')
        .eq('id', id)
        .single();

      if (!current) return false;

      // Toggle
      const { error } = await supabase
        .from('mcp_connections')
        .update({ is_active: !current.is_active })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Delete an MCP connection
   */
  async deleteConnection(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase.from('mcp_connections').delete().eq('id', id);

      if (error) {
        console.error('Error deleting MCP connection:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteConnection:', error);
      return false;
    }
  },

  /**
   * Update cached tools for a connection
   */
  async updateAvailableTools(id: string, tools: McpTool[]): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('mcp_connections')
        .update({
          available_tools: tools,
          last_health_check: new Date().toISOString(),
          health_status: 'healthy',
        })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Update health status
   */
  async updateHealthStatus(id: string, status: McpHealthStatus): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('mcp_connections')
        .update({
          health_status: status,
          last_health_check: new Date().toISOString(),
        })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Mark connection as used
   */
  async markUsed(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('mcp_connections')
        .update({ last_used: new Date().toISOString() })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Get all available tools from active connections
   */
  async getAllAvailableTools(userId?: string): Promise<Array<McpTool & { connectionId: string; connectionName: string }>> {
    const connections = await this.getActiveConnections(userId);
    const tools: Array<McpTool & { connectionId: string; connectionName: string }> = [];

    for (const conn of connections) {
      if (conn.availableTools) {
        for (const tool of conn.availableTools) {
          tools.push({
            ...tool,
            connectionId: conn.id,
            connectionName: conn.name,
          });
        }
      }
    }

    return tools;
  },

  /**
   * Create default/preset MCP connections
   * Call this to seed common MCP servers
   */
  async createPresetConnections(): Promise<void> {
    const presets: McpConnectionInsert[] = [
      {
        name: 'Perplexity Search',
        description: 'Web search and research via Perplexity AI',
        server_url: 'perplexity://search',
        server_type: 'remote',
        auth_type: 'api_key',
        is_active: true,
        available_tools: [
          {
            name: 'perplexity_search',
            description: 'Search the web using Perplexity',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
              },
              required: ['query'],
            },
          },
          {
            name: 'perplexity_research',
            description: 'Deep research on a topic',
            inputSchema: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Research topic' },
              },
              required: ['topic'],
            },
          },
        ],
      },
      {
        name: 'File System',
        description: 'Access local file system (read/write files)',
        server_url: 'stdio://filesystem',
        server_type: 'stdio',
        auth_type: 'none',
        is_active: false, // Disabled by default for security
        available_tools: [
          {
            name: 'read_file',
            description: 'Read contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path to read' },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path to write' },
                content: { type: 'string', description: 'Content to write' },
              },
              required: ['path', 'content'],
            },
          },
        ],
      },
    ];

    for (const preset of presets) {
      // Check if already exists
      const existing = await this.getAllConnections();
      const exists = existing.some((c) => c.name === preset.name);

      if (!exists) {
        await this.createConnection(preset);
      }
    }
  },

  /**
   * Build MCP server configuration for Anthropic API
   * Returns the format expected by the mcp_servers parameter
   */
  async buildMcpConfig(userId?: string): Promise<Array<{ url: string; auth?: { token?: string } }>> {
    const connections = await this.getActiveConnections(userId);

    return connections
      .filter((conn) => conn.serverType === 'remote' && conn.serverUrl.startsWith('http'))
      .map((conn) => ({
        url: conn.serverUrl,
        ...(conn.authConfig.token ? { auth: { token: conn.authConfig.token } } : {}),
      }));
  },

  /**
   * Test an MCP connection by attempting to list tools
   */
  async testConnection(id: string): Promise<{ success: boolean; tools?: McpTool[]; error?: string }> {
    const connection = await this.getConnection(id);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // For remote HTTP connections, try to make a tools/list request
      if (connection.serverType === 'remote' && connection.serverUrl.startsWith('http')) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add auth headers based on type
        if (connection.authType === 'bearer' && connection.authConfig.token) {
          headers['Authorization'] = `Bearer ${connection.authConfig.token}`;
        } else if (connection.authType === 'api_key' && connection.authConfig.apiKey) {
          const headerName = connection.authConfig.apiKeyHeader || 'X-API-Key';
          headers[headerName] = connection.authConfig.apiKey;
        }

        const response = await fetch(connection.serverUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
          }),
        });

        if (!response.ok) {
          await this.updateHealthStatus(id, 'unhealthy');
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const data = await response.json();
        
        if (data.error) {
          await this.updateHealthStatus(id, 'unhealthy');
          return { success: false, error: data.error.message || 'Unknown error' };
        }

        const tools = data.result?.tools || [];
        await this.updateAvailableTools(id, tools);
        
        return { success: true, tools };
      }

      // For non-HTTP connections, we can't easily test them
      return { success: true, tools: connection.availableTools || [] };
    } catch (err) {
      await this.updateHealthStatus(id, 'unhealthy');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Connection test failed' 
      };
    }
  },

  /**
   * Discover tools from an MCP server
   */
  async discoverTools(serverUrl: string, authConfig?: { token?: string; apiKey?: string }): Promise<McpTool[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authConfig?.token) {
        headers['Authorization'] = `Bearer ${authConfig.token}`;
      } else if (authConfig?.apiKey) {
        headers['X-API-Key'] = authConfig.apiKey;
      }

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.result?.tools || [];
    } catch {
      return [];
    }
  },

  // ============================================
  // MCP SERVER CONFIG (BOS as MCP Server)
  // ============================================

  /**
   * Get MCP server config for a brand
   */
  async getServerConfig(brandId: string): Promise<McpServerConfig | null> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('mcp_server_config')
        .select('*')
        .eq('brand_id', brandId)
        .single();

      if (error || !data) {
        // If not found, create default config
        if (error?.code === 'PGRST116') {
          return this.createServerConfig(brandId);
        }
        console.error('Error fetching MCP server config:', error);
        return null;
      }

      return dbMcpServerConfigToApp(data as DbMcpServerConfig);
    } catch (err) {
      console.error('Error in getServerConfig:', err);
      return null;
    }
  },

  /**
   * Create a new MCP server config for a brand
   */
  async createServerConfig(brandId: string): Promise<McpServerConfig | null> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('mcp_server_config')
        .insert({
          brand_id: brandId,
          is_enabled: true,
          allowed_tools: [
            'search_brand_knowledge',
            'get_brand_colors',
            'get_brand_assets',
            'get_brand_guidelines',
            'search_brand_assets',
          ],
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating MCP server config:', error);
        return null;
      }

      return dbMcpServerConfigToApp(data as DbMcpServerConfig);
    } catch (err) {
      console.error('Error in createServerConfig:', err);
      return null;
    }
  },

  /**
   * Update MCP server config
   */
  async updateServerConfig(configId: string, updates: McpServerConfigUpdate): Promise<McpServerConfig | null> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('mcp_server_config')
        .update(updates)
        .eq('id', configId)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating MCP server config:', error);
        return null;
      }

      return dbMcpServerConfigToApp(data as DbMcpServerConfig);
    } catch (err) {
      console.error('Error in updateServerConfig:', err);
      return null;
    }
  },

  /**
   * Generate a new API key for MCP server access
   */
  async generateApiKey(configId: string, keyName: string, createdBy?: string): Promise<McpApiKey | null> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('add_mcp_api_key', {
        p_config_id: configId,
        p_key_name: keyName,
        p_created_by: createdBy || null,
      });

      if (error || !data) {
        console.error('Error generating API key:', error);
        return null;
      }

      return data as McpApiKey;
    } catch (err) {
      console.error('Error in generateApiKey:', err);
      return null;
    }
  },

  /**
   * Revoke an API key
   */
  async revokeApiKey(configId: string, key: string): Promise<boolean> {
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc('revoke_mcp_api_key', {
        p_config_id: configId,
        p_key: key,
      });

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Get usage statistics for MCP server
   */
  async getUsageStats(configId: string, days = 30): Promise<McpUsageStats | null> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('get_mcp_usage_stats', {
        p_config_id: configId,
        p_days: days,
      });

      if (error || !data || data.length === 0) {
        console.error('Error fetching usage stats:', error);
        return null;
      }

      const stats = data[0];
      return {
        totalRequests: stats.total_requests || 0,
        successfulRequests: stats.successful_requests || 0,
        failedRequests: stats.failed_requests || 0,
        avgResponseTime: stats.avg_response_time || 0,
        requestsByTool: stats.requests_by_tool || {},
        requestsByDay: stats.requests_by_day || [],
      };
    } catch (err) {
      console.error('Error in getUsageStats:', err);
      return null;
    }
  },

  /**
   * Get MCP server endpoint URL
   */
  getMcpServerUrl(): string {
    // This would be your Supabase Edge Function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/bos-mcp-server`;
  },
};



