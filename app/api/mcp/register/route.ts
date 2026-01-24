import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Dynamic Client Registration (RFC 7591)
 *
 * Claude Desktop registers itself as an OAuth client before starting the
 * authorization flow. We accept any registration and return a client_id.
 * The actual authentication happens via the API key entered in the
 * authorize form.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate a client ID for this registration
    const clientId = `bos_client_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      token_endpoint_auth_method: body.token_endpoint_auth_method || 'none',
      grant_types: body.grant_types || ['authorization_code'],
      response_types: body.response_types || ['code'],
      client_name: body.client_name || 'MCP Client',
      redirect_uris: body.redirect_uris || [],
      scope: body.scope || 'mcp:tools mcp:resources',
    }, { status: 201 });

  } catch {
    return NextResponse.json({
      error: 'invalid_client_metadata',
      error_description: 'Failed to process registration request',
    }, { status: 400 });
  }
}

// CORS preflight
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
