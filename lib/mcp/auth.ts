/**
 * MCP Authentication Module
 * 
 * Validates API keys against the mcp_server_config table
 * and returns brand context for authorized requests.
 */

import { createClient } from '@supabase/supabase-js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// ============================================
// Types
// ============================================

export interface BrandAuthInfo extends AuthInfo {
  brandId: string;
  configId: string;
}

interface McpApiKey {
  key: string;
  name: string;
  is_active: boolean;
  last_used?: string;
}

interface McpServerConfig {
  id: string;
  brand_id: string;
  is_enabled: boolean;
  api_keys: McpApiKey[];
}

// ============================================
// Supabase Client
// ============================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

// ============================================
// API Key Validation
// ============================================

/**
 * Validate an API key and return brand context if valid
 */
export async function validateApiKey(
  apiKey: string
): Promise<BrandAuthInfo | null> {
  const supabase = getSupabaseAdmin();

  // Query all enabled MCP server configs
  const { data, error } = await supabase
    .from('mcp_server_config')
    .select('id, brand_id, is_enabled, api_keys')
    .eq('is_enabled', true);

  if (error || !data) {
    console.error('Error fetching MCP configs:', error);
    return null;
  }

  // Check each config for matching API key
  for (const config of data as McpServerConfig[]) {
    const apiKeys = config.api_keys || [];
    const matchingKey = apiKeys.find(
      (k) => k.key === apiKey && k.is_active !== false
    );

    if (matchingKey) {
      // Update last_used timestamp for the key
      const updatedKeys = apiKeys.map((k) =>
        k.key === apiKey ? { ...k, last_used: new Date().toISOString() } : k
      );

      await supabase
        .from('mcp_server_config')
        .update({ api_keys: updatedKeys })
        .eq('id', config.id);

      return {
        token: apiKey,
        clientId: `bos-mcp-${config.brand_id}`,
        scopes: ['read:brand', 'search:knowledge'],
        brandId: config.brand_id,
        configId: config.id,
      };
    }
  }

  return null;
}

/**
 * MCP Auth verification function for withMcpAuth middleware
 * Supports both Bearer token (header) and query parameter (?token=xxx) authentication
 */
export async function verifyMcpToken(
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  // First try Bearer token from header
  let token = bearerToken;
  
  // If no Bearer token, check for token in URL query parameter
  // This supports Claude Desktop's custom connector which can't send headers
  if (!token) {
    try {
      const url = new URL(req.url);
      token = url.searchParams.get('token') || undefined;
    } catch {
      // URL parsing failed, continue without token
    }
  }
  
  if (!token) {
    return undefined;
  }

  const authInfo = await validateApiKey(token);
  
  if (!authInfo) {
    return undefined;
  }

  return authInfo;
}

/**
 * Extract brand ID from auth info
 */
export function getBrandIdFromAuth(authInfo: AuthInfo | undefined): string | null {
  if (!authInfo || !('brandId' in authInfo)) {
    return null;
  }
  return (authInfo as BrandAuthInfo).brandId;
}

