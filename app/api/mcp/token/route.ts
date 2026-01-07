import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Token Endpoint
 * 
 * Supports both authorization_code and client_credentials grants.
 * For client_credentials, the client_secret is the API key.
 * For authorization_code, the code is exchanged for an access token.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let grantType: string | null = null;
    let clientId: string | null = null;
    let clientSecret: string | null = null;
    let code: string | null = null;
    let codeVerifier: string | null = null;
    
    // Parse body based on content type
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      grantType = params.get('grant_type');
      clientId = params.get('client_id');
      clientSecret = params.get('client_secret');
      code = params.get('code');
      codeVerifier = params.get('code_verifier');
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      grantType = body.grant_type;
      clientId = body.client_id;
      clientSecret = body.client_secret;
      code = body.code;
      codeVerifier = body.code_verifier;
    }
    
    // Also check Authorization header for client credentials
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [id, secret] = credentials.split(':');
      clientId = clientId || id;
      clientSecret = clientSecret || secret;
    }
    
    // Handle authorization_code grant
    if (grantType === 'authorization_code' && code) {
      // For our API key auth, the authorization code flow still requires
      // the user to have an API key. We accept any valid-looking code
      // and return a token that indicates the client needs to provide
      // their API key via the MCP_HEADERS environment variable.
      
      // In production, you'd validate the code here
      if (code.startsWith('bos_auth_')) {
        return NextResponse.json({
          access_token: clientSecret || 'PROVIDE_YOUR_API_KEY_VIA_MCP_HEADERS',
          token_type: 'Bearer',
          expires_in: 31536000, // 1 year
          scope: 'mcp:tools mcp:resources',
        });
      }
    }
    
    // For client_credentials grant, the client_secret IS the API key
    if (grantType === 'client_credentials' && clientSecret) {
      // Return the API key as the access token
      // The client will use this as a Bearer token
      return NextResponse.json({
        access_token: clientSecret,
        token_type: 'Bearer',
        expires_in: 31536000, // 1 year
        scope: 'mcp:tools mcp:resources',
      });
    }
    
    // Missing credentials
    if (!clientSecret && grantType === 'client_credentials') {
      return NextResponse.json({
        error: 'invalid_client',
        error_description: 'Missing client_secret. Use your BOS API key as the client_secret.',
      }, { status: 401 });
    }
    
    // Unsupported grant type
    return NextResponse.json({
      error: 'unsupported_grant_type',
      error_description: 'Supported grant types: client_credentials, authorization_code. Use your API key as the client_secret.',
    }, { status: 400 });
    
  } catch (err) {
    console.error('Token endpoint error:', err);
    return NextResponse.json({
      error: 'invalid_request',
      error_description: 'Failed to process token request',
    }, { status: 400 });
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

