import { NextResponse } from 'next/server';

/**
 * OAuth Authorization Server Metadata (RFC 8414)
 *
 * Tells MCP clients how to authenticate with our server.
 * Supports authorization_code (with PKCE) and refresh_token grants.
 * Public clients only (token_endpoint_auth_methods: none).
 *
 * Served at: /.well-known/oauth-authorization-server (via rewrite)
 */
export async function GET() {
  const baseUrl = 'https://bos-3-0.vercel.app';

  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/token`,
    registration_endpoint: `${baseUrl}/api/mcp/register`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['read:brand'],
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

