import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Dynamic Client Registration (RFC 7591)
 * 
 * This endpoint allows OAuth clients to register dynamically.
 * For our API key-based auth, we accept any registration and tell 
 * the client to use their API key as the client_secret.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate a client ID for this registration
    const clientId = `bos_client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Return registration response
    // Tell the client to use their API key as the client_secret
    return NextResponse.json({
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      // We don't issue a client_secret - the user provides their API key
      token_endpoint_auth_method: 'client_secret_post',
      grant_types: ['client_credentials'],
      response_types: ['token'],
      client_name: body.client_name || 'MCP Client',
      // Include redirect URIs if provided
      redirect_uris: body.redirect_uris || [],
    }, { status: 201 });
    
  } catch {
    return NextResponse.json({
      error: 'invalid_client_metadata',
      error_description: 'Failed to process registration request',
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

