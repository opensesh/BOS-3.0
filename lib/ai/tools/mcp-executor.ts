/**
 * MCP Tool Executor
 * 
 * Handles execution of tools from external MCP servers.
 * This module bridges BOS's tool system with external MCP-compatible servers.
 */

import { createClient } from '@/lib/supabase/server';
import type { McpConnection, McpTool } from '@/lib/supabase/types';
import type { ToolResult } from './index';

// ============================================
// Types
// ============================================

interface McpToolCall {
  connectionId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

interface McpJsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    content?: Array<{ type: string; text: string }>;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ============================================
// MCP Connection Fetcher
// ============================================

async function getConnectionById(connectionId: string): Promise<McpConnection | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('mcp_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id || undefined,
    name: data.name,
    description: data.description || undefined,
    serverUrl: data.server_url,
    serverType: data.server_type,
    authType: data.auth_type,
    authConfig: data.auth_config || {},
    isActive: data.is_active,
    availableTools: data.available_tools || undefined,
    lastHealthCheck: data.last_health_check || undefined,
    healthStatus: data.health_status,
    createdAt: data.created_at,
    lastUsed: data.last_used || undefined,
  };
}

async function updateConnectionLastUsed(connectionId: string): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('mcp_connections')
    .update({ last_used: new Date().toISOString() })
    .eq('id', connectionId);
}

// ============================================
// MCP Tool Executor
// ============================================

/**
 * Execute a tool on an external MCP server
 */
export async function executeMcpTool(
  toolCall: McpToolCall
): Promise<ToolResult> {
  const { connectionId, toolName, arguments: args } = toolCall;

  // Fetch connection details
  const connection = await getConnectionById(connectionId);
  
  if (!connection) {
    return {
      success: false,
      error: `MCP connection not found: ${connectionId}`,
    };
  }

  if (!connection.isActive) {
    return {
      success: false,
      error: `MCP connection is disabled: ${connection.name}`,
    };
  }

  // Only HTTP/HTTPS remote connections are supported
  if (connection.serverType !== 'remote' || !connection.serverUrl.startsWith('http')) {
    return {
      success: false,
      error: `Unsupported MCP server type: ${connection.serverType}`,
    };
  }

  try {
    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    if (connection.authType === 'bearer' && connection.authConfig.token) {
      headers['Authorization'] = `Bearer ${connection.authConfig.token}`;
    } else if (connection.authType === 'api_key' && connection.authConfig.apiKey) {
      const headerName = connection.authConfig.apiKeyHeader || 'X-API-Key';
      headers[headerName] = connection.authConfig.apiKey;
    }

    // Make JSON-RPC request to MCP server
    const response = await fetch(connection.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `MCP server error (${response.status}): ${errorText}`,
      };
    }

    const data: McpJsonRpcResponse = await response.json();

    // Handle JSON-RPC error
    if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Unknown MCP error',
      };
    }

    // Update last used timestamp
    await updateConnectionLastUsed(connectionId);

    // Extract result content
    const content = data.result?.content;
    
    if (!content || content.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    // Parse text content
    const textContent = content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(textContent);
      return {
        success: true,
        data: parsed,
      };
    } catch {
      // Return as plain text if not JSON
      return {
        success: true,
        data: textContent,
      };
    }
  } catch (err) {
    console.error('MCP tool execution error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error executing MCP tool',
    };
  }
}

/**
 * Get all available tools from active MCP connections
 */
export async function getAvailableMcpTools(
  userId?: string
): Promise<Array<McpTool & { connectionId: string; connectionName: string }>> {
  const supabase = await createClient();

  let query = supabase
    .from('mcp_connections')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { data: connections, error } = await query;

  if (error || !connections) {
    console.error('Error fetching MCP connections:', error);
    return [];
  }

  const tools: Array<McpTool & { connectionId: string; connectionName: string }> = [];

  for (const conn of connections) {
    const availableTools = conn.available_tools as McpTool[] | null;
    
    if (availableTools && Array.isArray(availableTools)) {
      for (const tool of availableTools) {
        tools.push({
          ...tool,
          connectionId: conn.id,
          connectionName: conn.name,
        });
      }
    }
  }

  return tools;
}

/**
 * Convert MCP tools to Anthropic tool format
 */
export function mcpToolsToAnthropic(
  mcpTools: Array<McpTool & { connectionId: string; connectionName: string }>
): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  _mcp_connection_id?: string;
}> {
  return mcpTools.map((tool) => ({
    // Prefix tool name with connection to avoid conflicts
    name: `mcp_${tool.connectionId.slice(0, 8)}_${tool.name}`,
    description: `[${tool.connectionName}] ${tool.description || tool.name}`,
    input_schema: tool.inputSchema || {
      type: 'object',
      properties: {},
    },
    // Store connection ID for routing
    _mcp_connection_id: tool.connectionId,
  }));
}

/**
 * Check if a tool name is an MCP tool
 */
export function isMcpTool(toolName: string): boolean {
  return toolName.startsWith('mcp_');
}

/**
 * Parse MCP tool name to extract connection ID and original tool name
 */
export function parseMcpToolName(toolName: string): {
  connectionId: string;
  originalToolName: string;
} | null {
  if (!isMcpTool(toolName)) {
    return null;
  }

  // Format: mcp_{connectionIdPrefix}_{originalToolName}
  const match = toolName.match(/^mcp_([a-f0-9]{8})_(.+)$/);
  
  if (!match) {
    return null;
  }

  return {
    connectionId: match[1], // This is just the prefix, we need to look up the full ID
    originalToolName: match[2],
  };
}

/**
 * Find full connection ID from prefix
 */
export async function findConnectionByPrefix(
  prefix: string,
  userId?: string
): Promise<string | null> {
  const supabase = await createClient();

  let query = supabase
    .from('mcp_connections')
    .select('id')
    .eq('is_active', true)
    .ilike('id', `${prefix}%`);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Execute an MCP tool by its prefixed name
 */
export async function executeMcpToolByName(
  toolName: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<ToolResult> {
  const parsed = parseMcpToolName(toolName);
  
  if (!parsed) {
    return {
      success: false,
      error: `Invalid MCP tool name: ${toolName}`,
    };
  }

  // Find full connection ID
  const connectionId = await findConnectionByPrefix(parsed.connectionId, userId);
  
  if (!connectionId) {
    return {
      success: false,
      error: `MCP connection not found for tool: ${toolName}`,
    };
  }

  return executeMcpTool({
    connectionId,
    toolName: parsed.originalToolName,
    arguments: args,
  });
}

