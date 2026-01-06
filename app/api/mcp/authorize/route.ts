/**
 * OAuth 2.0 Authorization Endpoint
 * 
 * For simplified OAuth (API key auth), we skip user consent
 * and immediately redirect back with an authorization code.
 * 
 * The client_id IS the API key for BOS MCP.
 */

import { NextRequest, NextResponse } from 'next/server';

// Generate a self-contained authorization code
// This encodes the client_id so we don't need server-side state
function generateCode(clientId: string): string {
  const payload = {
    cid: clientId,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    rnd: Math.random().toString(36).substring(2),
  };
  // Base64 URL-safe encoding
  return Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const responseType = url.searchParams.get('response_type');

  // Validate required parameters
  if (!clientId) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing client_id parameter' },
      { status: 400 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing redirect_uri parameter' },
      { status: 400 }
    );
  }

  if (responseType && responseType !== 'code') {
    return NextResponse.json(
      { error: 'unsupported_response_type', error_description: 'Only code response type is supported' },
      { status: 400 }
    );
  }

  // Generate authorization code (self-contained, encodes client_id)
  const code = generateCode(clientId);

  // Build redirect URL with code
  const redirect = new URL(redirectUri);
  redirect.searchParams.set('code', code);
  if (state) {
    redirect.searchParams.set('state', state);
  }

  // Redirect back to the client with the authorization code
  return NextResponse.redirect(redirect.toString(), 302);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

