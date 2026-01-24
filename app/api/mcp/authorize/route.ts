import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Authorization Endpoint
 *
 * Claude Desktop opens this URL in a browser window. The user enters their
 * BOS API key, which gets encoded into the authorization code. The token
 * endpoint then decodes it to produce the access_token.
 *
 * Flow:
 *   1. GET  → Renders HTML form for API key entry
 *   2. POST → Encodes API key + PKCE challenge into auth code, redirects back
 *   3. Client exchanges code at /api/mcp/token with code_verifier
 *   4. Token endpoint verifies PKCE and returns API key as access_token
 */

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * GET: Serve the authorization form
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope');

  if (!clientId || !redirectUri) {
    return NextResponse.json({
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_id, redirect_uri',
    }, { status: 400 });
  }

  if (responseType !== 'code') {
    return NextResponse.json({
      error: 'unsupported_response_type',
      error_description: 'Only response_type=code is supported',
    }, { status: 400 });
  }

  // Render the authorization form
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BOS - Authorize MCP Connection</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #191919;
      color: #FFFAEE;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #222;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
    }
    .logo {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #FE5102;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #999;
      font-size: 14px;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #ccc;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      background: #191919;
      border: 1px solid #444;
      border-radius: 8px;
      color: #FFFAEE;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="password"]:focus {
      border-color: #FE5102;
    }
    .hint {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #FE5102;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error {
      background: #3a1515;
      border: 1px solid #5a2020;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      color: #ff6b6b;
      margin-bottom: 20px;
      display: none;
    }
    .client-info {
      font-size: 12px;
      color: #555;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">BOS</div>
    <h1>Authorize Connection</h1>
    <p class="subtitle">
      Enter your BOS API key to connect this MCP client to your brand knowledge.
    </p>
    <div class="error" id="error"></div>
    <form method="POST" id="authForm">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="state" value="${escapeHtml(state || '')}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge || '')}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod || '')}" />
      <input type="hidden" name="response_type" value="code" />
      <input type="hidden" name="scope" value="${escapeHtml(scope || 'mcp:tools mcp:resources')}" />
      <label for="api_key">API Key</label>
      <input
        type="password"
        id="api_key"
        name="api_key"
        placeholder="bos_key_..."
        required
        autocomplete="off"
      />
      <p class="hint">Find your API key in BOS Settings &rarr; API Keys</p>
      <button type="submit" id="submitBtn">Authorize</button>
    </form>
    <p class="client-info">Client: ${escapeHtml(clientId)}</p>
  </div>
  <script>
    document.getElementById('authForm').addEventListener('submit', function(e) {
      const key = document.getElementById('api_key').value.trim();
      if (!key) {
        e.preventDefault();
        const err = document.getElementById('error');
        err.textContent = 'Please enter your API key.';
        err.style.display = 'block';
        return;
      }
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('submitBtn').textContent = 'Authorizing...';
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * POST: Process the form submission, encode API key into auth code, redirect
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  let clientId: string | null = null;
  let redirectUri: string | null = null;
  let state: string | null = null;
  let codeChallenge: string | null = null;
  let codeChallengeMethod: string | null = null;
  let apiKey: string | null = null;

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    clientId = params.get('client_id');
    redirectUri = params.get('redirect_uri');
    state = params.get('state');
    codeChallenge = params.get('code_challenge');
    codeChallengeMethod = params.get('code_challenge_method');
    apiKey = params.get('api_key');
  } else if (contentType.includes('application/json')) {
    const body = await request.json();
    clientId = body.client_id;
    redirectUri = body.redirect_uri;
    state = body.state;
    codeChallenge = body.code_challenge;
    codeChallengeMethod = body.code_challenge_method;
    apiKey = body.api_key;
  }

  if (!clientId || !redirectUri) {
    return NextResponse.json({
      error: 'invalid_request',
      error_description: 'Missing required parameters',
    }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      error: 'invalid_request',
      error_description: 'API key is required',
    }, { status: 400 });
  }

  // Encode the API key and PKCE challenge into the authorization code
  // This is stateless — the token endpoint will decode it
  const codePayload = JSON.stringify({
    key: apiKey,
    challenge: codeChallenge || '',
    method: codeChallengeMethod || 'S256',
    ts: Date.now(),
  });
  const code = base64UrlEncode(codePayload);

  // Redirect back to the client with the authorization code
  // Use raw Response with Location header because NextResponse.redirect()
  // cannot redirect to a different origin (e.g., http://localhost:PORT)
  const redirect = new URL(redirectUri);
  redirect.searchParams.set('code', code);
  if (state) {
    redirect.searchParams.set('state', state);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirect.toString(),
    },
  });
}

/**
 * OPTIONS: CORS preflight
 */
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
