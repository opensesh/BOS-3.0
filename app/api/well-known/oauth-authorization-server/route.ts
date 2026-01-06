/**
 * OAuth 2.0 Authorization Server Metadata Endpoint
 * 
 * This is served via a rewrite from /.well-known/oauth-authorization-server
 * Claude Desktop and other MCP clients use this to discover OAuth endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  
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

