/**
 * Supabase Edge Function: bos-mcp-server
 * 
 * Implements the Model Context Protocol (MCP) to expose BOS brand data
 * to external AI tools like Cursor, Claude Desktop, etc.
 * 
 * Protocol: MCP uses JSON-RPC 2.0 over HTTP
 * 
 * Tools exposed:
 * - search_brand_knowledge: Semantic search across brand documents
 * - get_brand_colors: Retrieve color palette with usage guidelines
 * - get_brand_assets: List and filter brand assets
 * - get_brand_guidelines: Fetch specific guideline documents
 * - search_brand_assets: Semantic search for assets by description
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================
// Types
// ============================================

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
  };
}

// ============================================
// MCP Tool Definitions
// ============================================

const MCP_TOOLS: McpTool[] = [
  {
    name: "search_brand_knowledge",
    description: "Search the brand knowledge base using semantic similarity. Returns relevant brand documentation, guidelines, and context based on your query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query - describe what brand information you're looking for",
        },
        category: {
          type: "string",
          enum: ["brand-identity", "writing-styles", "skills", "all"],
          description: "Category to search within (default: all)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 5, max: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_brand_colors",
    description: "Retrieve the brand color palette including primary, secondary, and accent colors with hex values and usage guidelines.",
    inputSchema: {
      type: "object",
      properties: {
        group: {
          type: "string",
          enum: ["brand", "mono-scale", "brand-scale", "custom", "all"],
          description: "Filter by color group (default: all)",
        },
        include_guidelines: {
          type: "boolean",
          description: "Include usage guidelines for each color (default: true)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_brand_assets",
    description: "List brand assets such as logos, fonts, illustrations, and images. Can filter by category.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["logos", "fonts", "illustrations", "images", "textures", "icons", "all"],
          description: "Asset category to retrieve (default: all)",
        },
        variant: {
          type: "string",
          description: "Filter by variant (e.g., 'light', 'dark', 'mono')",
        },
        limit: {
          type: "number",
          description: "Maximum number of assets to return (default: 20, max: 100)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_brand_guidelines",
    description: "Fetch specific brand guideline documents including visual direction, usage rules, and brand standards.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Specific guideline document slug to retrieve",
        },
        category: {
          type: "string",
          description: "Filter guidelines by category",
        },
      },
      required: [],
    },
  },
  {
    name: "search_brand_assets",
    description: "Semantic search for brand assets by description. Use natural language to find logos, images, or other visual assets.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language description of the asset you're looking for",
        },
        category: {
          type: "string",
          enum: ["logos", "fonts", "illustrations", "images", "textures", "icons"],
          description: "Limit search to specific category",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10, max: 50)",
        },
      },
      required: ["query"],
    },
  },
];

// ============================================
// Server Info
// ============================================

const SERVER_INFO: McpServerInfo = {
  name: "Brand Operating System",
  version: "1.0.0",
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
  },
};

// ============================================
// Tool Executors
// ============================================

async function searchBrandKnowledge(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<unknown> {
  const { query, category = "all", limit = 5 } = params;
  const effectiveLimit = Math.min(limit, 20);

  // Generate embedding for the query using OpenAI
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    throw new Error("OpenAI API key not configured for semantic search");
  }

  const cleanKey = openaiKey.replace(/^["']|["'],?$/g, "").trim();
  
  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: query,
    }),
  });

  if (!embeddingResponse.ok) {
    throw new Error("Failed to generate query embedding");
  }

  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.data[0].embedding;

  // Use the match_document_chunks function for semantic search
  const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    match_threshold: 0.7,
    match_count: effectiveLimit,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  // Filter by category if specified
  let results = chunks || [];
  if (category !== "all") {
    results = results.filter((c: { document_category: string }) => 
      c.document_category === category
    );
  }

  return {
    query,
    results: results.map((chunk: {
      content: string;
      document_title: string;
      document_category: string;
      heading_hierarchy: string[];
      similarity: number;
    }) => ({
      content: chunk.content,
      document: chunk.document_title,
      category: chunk.document_category,
      section: chunk.heading_hierarchy?.join(" > ") || "",
      relevance: Math.round(chunk.similarity * 100) / 100,
    })),
    total: results.length,
  };
}

async function getBrandColors(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  params: { group?: string; include_guidelines?: boolean }
): Promise<unknown> {
  const { group = "all", include_guidelines = true } = params;

  let query = supabase
    .from("brand_colors")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("sort_order");

  if (group !== "all") {
    query = query.eq("color_group", group);
  }

  const { data: colors, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch colors: ${error.message}`);
  }

  return {
    colors: (colors || []).map((color: {
      name: string;
      slug: string;
      hex_value: string;
      rgb_value: string;
      color_group: string;
      color_role: string;
      text_color: string;
      description: string;
      usage_guidelines: string;
      css_variable_name: string;
    }) => ({
      name: color.name,
      slug: color.slug,
      hex: color.hex_value,
      rgb: color.rgb_value,
      group: color.color_group,
      role: color.color_role,
      textColor: color.text_color,
      ...(include_guidelines && {
        description: color.description,
        usage: color.usage_guidelines,
      }),
      cssVariable: color.css_variable_name,
    })),
    total: colors?.length || 0,
  };
}

async function getBrandAssets(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  params: { category?: string; variant?: string; limit?: number }
): Promise<unknown> {
  const { category = "all", variant, limit = 20 } = params;
  const effectiveLimit = Math.min(limit, 100);

  let query = supabase
    .from("brand_assets")
    .select("id, name, filename, description, category, variant, storage_path, mime_type, metadata")
    .eq("brand_id", brandId)
    .limit(effectiveLimit);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (variant) {
    query = query.eq("variant", variant);
  }

  const { data: assets, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch assets: ${error.message}`);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  return {
    assets: (assets || []).map((asset: {
      id: string;
      name: string;
      filename: string;
      description: string;
      category: string;
      variant: string;
      storage_path: string;
      mime_type: string;
      metadata: Record<string, unknown>;
    }) => ({
      id: asset.id,
      name: asset.name,
      filename: asset.filename,
      description: asset.description,
      category: asset.category,
      variant: asset.variant,
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.storage_path}`,
      mimeType: asset.mime_type,
      metadata: asset.metadata,
    })),
    total: assets?.length || 0,
  };
}

async function getBrandGuidelines(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  params: { slug?: string; category?: string }
): Promise<unknown> {
  const { slug, category } = params;

  let query = supabase
    .from("brand_guidelines")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("sort_order");

  if (slug) {
    query = query.eq("slug", slug);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data: guidelines, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch guidelines: ${error.message}`);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  return {
    guidelines: (guidelines || []).map((guide: {
      id: string;
      title: string;
      slug: string;
      guideline_type: string;
      url: string;
      embed_url: string;
      storage_path: string;
      description: string;
      category: string;
      thumbnail_url: string;
      is_primary: boolean;
    }) => ({
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      type: guide.guideline_type,
      url: guide.url || (guide.storage_path 
        ? `${supabaseUrl}/storage/v1/object/public/brand-guidelines/${guide.storage_path}`
        : null),
      embedUrl: guide.embed_url,
      description: guide.description,
      category: guide.category,
      thumbnail: guide.thumbnail_url,
      isPrimary: guide.is_primary,
    })),
    total: guidelines?.length || 0,
  };
}

async function searchBrandAssets(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<unknown> {
  const { query, category, limit = 10 } = params;
  const effectiveLimit = Math.min(limit, 50);

  // Generate embedding for semantic search
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    throw new Error("OpenAI API key not configured for semantic search");
  }

  const cleanKey = openaiKey.replace(/^["']|["'],?$/g, "").trim();

  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: query,
    }),
  });

  if (!embeddingResponse.ok) {
    throw new Error("Failed to generate query embedding");
  }

  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.data[0].embedding;

  // Use the match_assets function
  const { data: assets, error } = await supabase.rpc("match_assets", {
    query_embedding: queryEmbedding,
    p_brand_id: brandId,
    p_category: category || null,
    match_threshold: 0.6,
    match_count: effectiveLimit,
  });

  if (error) {
    throw new Error(`Asset search failed: ${error.message}`);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  return {
    query,
    results: (assets || []).map((asset: {
      id: string;
      name: string;
      filename: string;
      description: string;
      category: string;
      variant: string;
      storage_path: string;
      mime_type: string;
      similarity: number;
    }) => ({
      id: asset.id,
      name: asset.name,
      filename: asset.filename,
      description: asset.description,
      category: asset.category,
      variant: asset.variant,
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.storage_path}`,
      mimeType: asset.mime_type,
      relevance: Math.round(asset.similarity * 100) / 100,
    })),
    total: assets?.length || 0,
  };
}

// ============================================
// MCP Protocol Handlers
// ============================================

async function handleInitialize(_params: unknown): Promise<McpServerInfo> {
  return SERVER_INFO;
}

async function handleListTools(): Promise<{ tools: McpTool[] }> {
  return { tools: MCP_TOOLS };
}

async function handleCallTool(
  supabase: ReturnType<typeof createClient>,
  brandId: string,
  params: { name: string; arguments?: Record<string, unknown> }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { name, arguments: args = {} } = params;

  let result: unknown;

  switch (name) {
    case "search_brand_knowledge":
      result = await searchBrandKnowledge(
        supabase,
        brandId,
        args as { query: string; category?: string; limit?: number }
      );
      break;
    case "get_brand_colors":
      result = await getBrandColors(
        supabase,
        brandId,
        args as { group?: string; include_guidelines?: boolean }
      );
      break;
    case "get_brand_assets":
      result = await getBrandAssets(
        supabase,
        brandId,
        args as { category?: string; variant?: string; limit?: number }
      );
      break;
    case "get_brand_guidelines":
      result = await getBrandGuidelines(
        supabase,
        brandId,
        args as { slug?: string; category?: string }
      );
      break;
    case "search_brand_assets":
      result = await searchBrandAssets(
        supabase,
        brandId,
        args as { query: string; category?: string; limit?: number }
      );
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

// ============================================
// API Key Validation
// ============================================

async function validateApiKey(
  supabase: ReturnType<typeof createClient>,
  apiKey: string
): Promise<{ valid: boolean; brandId?: string; configId?: string }> {
  // Query the mcp_server_config table for the API key
  const { data, error } = await supabase
    .from("mcp_server_config")
    .select("id, brand_id, is_enabled, api_keys")
    .eq("is_enabled", true);

  if (error || !data) {
    return { valid: false };
  }

  // Check each config for matching API key
  for (const config of data) {
    const apiKeys = config.api_keys as Array<{ key: string; name: string; is_active: boolean }> || [];
    const matchingKey = apiKeys.find(
      (k) => k.key === apiKey && k.is_active !== false
    );

    if (matchingKey) {
      // Update last_used timestamp for the key
      const updatedKeys = apiKeys.map((k) =>
        k.key === apiKey ? { ...k, last_used: new Date().toISOString() } : k
      );

      await supabase
        .from("mcp_server_config")
        .update({ api_keys: updatedKeys })
        .eq("id", config.id);

      return {
        valid: true,
        brandId: config.brand_id,
        configId: config.id,
      };
    }
  }

  return { valid: false };
}

// ============================================
// Auth Helper
// ============================================

/**
 * Extract API key from various auth methods:
 * 1. X-API-Key header
 * 2. Bearer token: Authorization: Bearer <api_key>
 * 3. Basic Auth: Authorization: Basic base64(client_id:api_key) - used by Claude Desktop OAuth
 */
function extractApiKey(req: Request): string | null {
  // Method 1: X-API-Key header
  const xApiKey = req.headers.get("X-API-Key");
  if (xApiKey) {
    return xApiKey;
  }

  // Method 2 & 3: Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  // Bearer token
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Basic Auth (used by Claude Desktop for OAuth Client ID/Secret)
  // Format: Basic base64(client_id:client_secret)
  // We use the client_secret (password) as the API key
  if (authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = atob(base64Credentials);
      const [_clientId, clientSecret] = credentials.split(":");
      if (clientSecret) {
        return clientSecret;
      }
    } catch {
      // Invalid base64, ignore
    }
  }

  return null;
}

// ============================================
// OAuth Configuration (Stateless)
// ============================================

// Since Edge Functions are stateless, we use a self-contained code approach
// The authorization code is a base64-encoded JSON with the client_id and expiration
// This is secure enough for API key auth where the client_id IS the API key

function generateCode(clientId: string): string {
  const payload = {
    cid: clientId,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    rnd: Math.random().toString(36).substring(2), // Add randomness
  };
  return btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function parseCode(code: string): { clientId: string; expiresAt: number } | null {
  try {
    // Restore base64 padding and characters
    let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const payload = JSON.parse(atob(base64));
    if (!payload.cid || !payload.exp) {
      return null;
    }
    return { clientId: payload.cid, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // ========================================
  // OAuth Endpoints for Claude Desktop
  // ========================================
  
  // OAuth Metadata Discovery
  // Claude Desktop looks for this at the MCP server URL
  if (req.method === "GET" && (path.endsWith("/.well-known/oauth-authorization-server") || path.includes("/.well-known/oauth-authorization-server"))) {
    // Build the correct base URL for the MCP server
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || `https://${url.host}`;
    const baseUrl = `${supabaseUrl}/functions/v1/bos-mcp-server`;
    return new Response(
      JSON.stringify({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256", "plain"],
        token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // OAuth Authorization Endpoint
  // For API key auth, we skip user consent and immediately redirect with code
  if (req.method === "GET" && (path.endsWith("/authorize") || path.includes("/authorize?"))) {
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    
    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "invalid_request", error_description: "Missing client_id or redirect_uri" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Generate self-contained authorization code (stateless)
    const code = generateCode(clientId);
    
    // Build redirect URL with code
    const redirect = new URL(redirectUri);
    redirect.searchParams.set("code", code);
    if (state) {
      redirect.searchParams.set("state", state);
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirect.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // OAuth Token Endpoint
  if (req.method === "POST" && (path.endsWith("/token") || path.includes("/token"))) {
    let code: string | null = null;
    let clientId: string | null = null;
    let clientSecret: string | null = null;
    
    // Parse request body (form-urlencoded or JSON)
    const contentType = req.headers.get("Content-Type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      code = params.get("code");
      clientId = params.get("client_id");
      clientSecret = params.get("client_secret");
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      code = json.code;
      clientId = json.client_id;
      clientSecret = json.client_secret;
    }
    
    // Also check Basic Auth for client credentials
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Basic ")) {
      try {
        const credentials = atob(authHeader.slice(6));
        const [id, secret] = credentials.split(":");
        clientId = clientId || id;
        clientSecret = clientSecret || secret;
      } catch {
        // Invalid base64
      }
    }
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: "invalid_request", error_description: "Missing authorization code" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse the self-contained code (stateless)
    const codeData = parseCode(code);
    if (!codeData || codeData.expiresAt < Date.now()) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "Invalid or expired authorization code" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // The API key is used as both client_id and access_token
    // This allows simple API key auth through OAuth flow
    const apiKey = clientSecret || codeData.clientId;
    
    return new Response(
      JSON.stringify({
        access_token: apiKey,
        token_type: "Bearer",
        expires_in: 31536000, // 1 year
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // Handle GET requests (health check / capability discovery)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        name: SERVER_INFO.name,
        version: SERVER_INFO.version,
        protocol: "MCP",
        protocolVersion: SERVER_INFO.protocolVersion,
        message: "BOS MCP Server is running. Use POST for JSON-RPC requests.",
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract API key from various auth methods
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32001,
            message: "Authentication required. Provide API key via X-API-Key header, Bearer token, or Basic Auth (OAuth Client Secret).",
          },
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate API key
    const auth = await validateApiKey(supabase, apiKey);

    if (!auth.valid || !auth.brandId) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32001,
            message: "Invalid or expired API key",
          },
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse JSON-RPC request
    const body: JsonRpcRequest = await req.json();

    if (body.jsonrpc !== "2.0" || !body.method) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id || null,
          error: {
            code: -32600,
            message: "Invalid JSON-RPC request",
          },
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    let result: unknown;

    // Route to appropriate handler
    switch (body.method) {
      case "initialize":
        result = await handleInitialize(body.params);
        break;

      case "tools/list":
        result = await handleListTools();
        break;

      case "tools/call":
        if (!body.params || typeof body.params !== "object") {
          throw new Error("Missing tool parameters");
        }
        result = await handleCallTool(
          supabase,
          auth.brandId,
          body.params as { name: string; arguments?: Record<string, unknown> }
        );
        break;

      case "ping":
        result = {};
        break;

      default:
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32601,
              message: `Method not found: ${body.method}`,
            },
          }),
          { status: 400, headers: corsHeaders }
        );
    }

    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: body.id,
      result,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("MCP Server Error:", error);

    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Internal server error",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

