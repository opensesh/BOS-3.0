import { NextResponse } from 'next/server';

/**
 * Protected Resource Metadata (RFC 9728)
 *
 * When mcp-handler returns 401, it includes:
 *   WWW-Authenticate: Bearer resource_metadata="/.well-known/oauth-protected-resource"
 *
 * The client fetches this endpoint to discover which authorization server to use.
 * This completes the OAuth discovery chain:
 *   1. 401 → resource_metadata URL
 *   2. GET /.well-known/oauth-protected-resource → authorization_servers
 *   3. GET /.well-known/oauth-authorization-server → token_endpoint
 *   4. POST /api/mcp/token → access_token
 *   5. Retry original request with Bearer token
 */
export async function GET() {
  const baseUrl = 'https://bos-3-0.vercel.app';

  return NextResponse.json({
    resource: `${baseUrl}/api/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ['mcp:tools', 'mcp:resources'],
    bearer_methods_supported: ['header'],
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
