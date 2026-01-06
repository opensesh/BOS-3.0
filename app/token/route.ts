/**
 * OAuth 2.0 Token Endpoint (Root Level)
 * 
 * Claude Desktop Custom Connectors send token requests to /token at the domain root.
 * This route exchanges authorization codes for access tokens.
 * 
 * For simplified OAuth, the access_token is the API key.
 */

import { NextRequest, NextResponse } from 'next/server';

// Parse self-contained authorization code
function parseCode(code: string): { clientId: string; expiresAt: number } | null {
  try {
    let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    if (!payload.cid || !payload.exp) {
      return null;
    }
    return { clientId: payload.cid, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function POST(request: NextRequest) {
  let code: string | null = null;
  let clientId: string | null = null;
  let clientSecret: string | null = null;

  const contentType = request.headers.get('Content-Type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.text();
    const params = new URLSearchParams(formData);
    code = params.get('code');
    clientId = params.get('client_id');
    clientSecret = params.get('client_secret');
  } else if (contentType.includes('application/json')) {
    const json = await request.json();
    code = json.code;
    clientId = json.client_id;
    clientSecret = json.client_secret;
  }

  // Also check Basic Auth for client credentials
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
      const [id, secret] = credentials.split(':');
      clientId = clientId || id;
      clientSecret = clientSecret || secret;
    } catch {
      // Invalid base64
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing authorization code' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const codeData = parseCode(code);
  if (!codeData) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid authorization code format' },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (codeData.expiresAt < Date.now()) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code has expired' },
      { status: 400, headers: corsHeaders() }
    );
  }

  // The API key is the client_secret (or client_id if no secret provided)
  const apiKey = clientSecret || codeData.clientId;

  return NextResponse.json(
    {
      access_token: apiKey,
      token_type: 'Bearer',
      expires_in: 31536000, // 1 year
    },
    { status: 200, headers: corsHeaders() }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() });
}

