import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Authorization Endpoint
 * 
 * For MCP OAuth flow, this endpoint handles authorization requests.
 * Since we use API key authentication, we redirect back with a code
 * that the client can exchange for a token (which will be their API key).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const responseType = searchParams.get('response_type');

  // Validate required parameters
  if (!clientId || !redirectUri) {
    return NextResponse.json({
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_id, redirect_uri',
    }, { status: 400 });
  }

  // For authorization_code flow, we need to redirect with a code
  // Since we use API keys, we'll use a placeholder code that the token
  // endpoint will recognize
  if (responseType === 'code') {
    // Generate a temporary authorization code
    // In a real OAuth flow, this would be stored and validated later
    const code = `bos_auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Build redirect URL with code
    const redirect = new URL(redirectUri);
    redirect.searchParams.set('code', code);
    if (state) {
      redirect.searchParams.set('state', state);
    }
    
    return NextResponse.redirect(redirect.toString());
  }

  // For implicit flow (response_type=token), return error
  // as we don't support this - clients should use client_credentials
  return NextResponse.json({
    error: 'unsupported_response_type',
    error_description: 'Use client_credentials grant with your API key as the client_secret',
  }, { status: 400 });
}

// Support POST for authorization (some clients use POST)
export async function POST(request: NextRequest) {
  return GET(request);
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

