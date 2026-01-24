import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * OAuth Token Endpoint
 *
 * Supports two grant types:
 *   - authorization_code: Decodes the auth code (from /authorize) to extract
 *     the API key, verifies PKCE, and returns it as the access_token.
 *   - refresh_token: Reissues an access token from the refresh token.
 */

function base64UrlDecode(str: string): string {
  // Restore base64 padding and characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean {
  if (!codeChallenge) {
    // No PKCE required — allow
    return true;
  }

  if (method === 'S256') {
    const hash = createHash('sha256').update(codeVerifier).digest();
    const computed = hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return computed === codeChallenge;
  }

  // Plain method (not recommended but supported)
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let grantType: string | null = null;
    let clientId: string | null = null;
    let clientSecret: string | null = null;
    let code: string | null = null;
    let codeVerifier: string | null = null;
    let redirectUri: string | null = null;
    let refreshToken: string | null = null;

    // Parse body based on content type
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      grantType = params.get('grant_type');
      clientId = params.get('client_id');
      clientSecret = params.get('client_secret');
      code = params.get('code');
      codeVerifier = params.get('code_verifier');
      redirectUri = params.get('redirect_uri');
      refreshToken = params.get('refresh_token');
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      grantType = body.grant_type;
      clientId = body.client_id;
      clientSecret = body.client_secret;
      code = body.code;
      codeVerifier = body.code_verifier;
      redirectUri = body.redirect_uri;
      refreshToken = body.refresh_token;
    }

    // Also check Authorization header for client credentials (Basic auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [id, secret] = credentials.split(':');
      clientId = clientId || id;
      clientSecret = clientSecret || secret;
    }

    // Handle authorization_code grant (Claude Desktop flow)
    if (grantType === 'authorization_code' && code) {
      try {
        // Decode the authorization code to extract the API key
        const decoded = base64UrlDecode(code);
        const payload = JSON.parse(decoded);

        if (!payload.key) {
          return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Authorization code is invalid or expired',
          }, { status: 400 });
        }

        // Verify PKCE if a code_verifier was provided
        if (codeVerifier && payload.challenge) {
          const pkceValid = verifyPkce(codeVerifier, payload.challenge, payload.method || 'S256');
          if (!pkceValid) {
            return NextResponse.json({
              error: 'invalid_grant',
              error_description: 'PKCE verification failed',
            }, { status: 400 });
          }
        }

        // Check code expiry (10 minutes)
        if (payload.ts && Date.now() - payload.ts > 10 * 60 * 1000) {
          return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Authorization code has expired',
          }, { status: 400 });
        }

        // Return the API key as the access token
        return NextResponse.json({
          access_token: payload.key,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: payload.key,
          scope: 'read:brand',
        });
      } catch {
        return NextResponse.json({
          error: 'invalid_grant',
          error_description: 'Failed to decode authorization code',
        }, { status: 400 });
      }
    }

    // Handle refresh_token grant (reissue access token)
    if (grantType === 'refresh_token' && refreshToken) {
      // The refresh token IS the API key in our system
      return NextResponse.json({
        access_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: 'read:brand',
      });
    }

    // Unsupported grant type
    return NextResponse.json({
      error: 'unsupported_grant_type',
      error_description: 'Supported: authorization_code, refresh_token',
    }, { status: 400 });

  } catch (err) {
    console.error('Token endpoint error:', err);
    return NextResponse.json({
      error: 'invalid_request',
      error_description: 'Failed to process token request',
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
