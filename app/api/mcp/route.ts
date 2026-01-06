/**
 * BOS MCP Server - Main Endpoint with SSE Transport
 * 
 * This endpoint acts as an MCP proxy:
 * - Receives JSON-RPC requests from Claude Desktop
 * - Forwards them to the Supabase Edge Function
 * - Returns responses via SSE for streaming support
 * 
 * Authentication:
 * - Bearer token in Authorization header (OAuth flow result)
 * - The token IS the BOS API key
 */

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_MCP_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bos-mcp-server`
  : 'https://bzpodfomunpczzpnimmz.supabase.co/functions/v1/bos-mcp-server';

// CORS headers for all responses
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };
}

// Extract API key from various auth methods
function extractApiKey(request: NextRequest): string | null {
  // Check X-API-Key header first
  const xApiKey = request.headers.get('X-API-Key');
  if (xApiKey) return xApiKey;

  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  // Bearer token (OAuth flow result)
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Basic auth (for compatibility)
  if (authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
      const [_clientId, clientSecret] = credentials.split(':');
      return clientSecret || null;
    } catch {
      return null;
    }
  }

  return null;
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() });
}

// Health check / capability discovery for GET requests
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const mcpUrl = `${origin}/api/mcp`;
  
  // Check for SSE accept header (for future streaming support)
  const acceptHeader = request.headers.get('Accept') || '';
  const wantsSSE = acceptHeader.includes('text/event-stream');

  // Check if this is an OAuth discovery request
  const oauthDiscovery = url.searchParams.get('oauth');
  if (oauthDiscovery === 'discovery') {
    return NextResponse.json(
      {
        issuer: origin,
        authorization_endpoint: `${origin}/authorize`,
        token_endpoint: `${origin}/token`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        code_challenge_methods_supported: ['S256', 'plain'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      },
      { headers: corsHeaders() }
    );
  }

  // Return server info as JSON
  // NOTE: OAuth endpoints are at root level (/authorize, /token)
  return NextResponse.json(
    {
      name: 'BOS MCP Server',
      version: '1.0.0',
      protocol: 'MCP',
      protocolVersion: '2024-11-05',
      description: 'Brand Operating System - AI-powered brand management',
      transport: wantsSSE ? 'sse' : 'http',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
      },
      oauth: {
        issuer: origin,
        authorization_endpoint: `${origin}/authorize`,
        token_endpoint: `${origin}/token`,
      },
      endpoints: {
        authorize: `${origin}/authorize`,
        token: `${origin}/token`,
        mcp: mcpUrl,
      },
    },
    { headers: corsHeaders() }
  );
}

// Main MCP handler - proxies to Supabase Edge Function
export async function POST(request: NextRequest) {
  const apiKey = extractApiKey(request);
  
  if (!apiKey) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Missing API key. Provide via Authorization: Bearer <key> or X-API-Key header.',
        },
        id: null,
      },
      { status: 401, headers: corsHeaders() }
    );
  }

  try {
    // Get the JSON-RPC request body
    const body = await request.json();

    // Forward to Supabase Edge Function
    const response = await fetch(SUPABASE_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    // Get response from Supabase
    const responseData = await response.json();

    // Return proxied response with CORS headers
    return NextResponse.json(responseData, {
      status: response.status,
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error('[MCP Proxy] Error:', error);
    
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: null,
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

