import { NextResponse } from 'next/server';

/**
 * OAuth Authorization Server Metadata (RFC 8414)
 * 
 * This endpoint tells OAuth clients about our server's authorization capabilities.
 * Since we use simple Bearer token authentication (API keys), we return metadata
 * that indicates clients should use client_credentials grant with their API key.
 * 
 * Served at: /.well-known/oauth-authorization-server (via rewrite)
 * 
 * IMPORTANT: We always use the production URL to avoid Vercel's Deployment Protection
 * on preview deployments, which returns HTML instead of JSON and breaks mcp-remote.
 */
export async function GET() {
  // Always use production URL to avoid preview deployment protection issues
  // Preview deployments have Vercel Authentication enabled which intercepts
  // requests and returns HTML, breaking mcp-remote's JSON parser
  const baseUrl = 'https://bos-3-0.vercel.app';

  // Return OAuth metadata that indicates Bearer token auth is supported
  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/token`,
    registration_endpoint: `${baseUrl}/api/mcp/register`,
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    grant_types_supported: ['client_credentials', 'authorization_code'],
    response_types_supported: ['code', 'token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['mcp:tools', 'mcp:resources'],
    // Tell clients the MCP endpoint location
    mcp_endpoint: `${baseUrl}/api/mcp`,
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

