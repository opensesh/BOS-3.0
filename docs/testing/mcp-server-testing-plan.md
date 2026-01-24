# MCP Server Testing Plan

> BOS 3.0 — Brand Operating System MCP Server
> Endpoint: `/api/mcp` (Streamable HTTP transport)

---

## Section 1: LLM Agent Tests (Automated via `/test-mcp`)

These tests are executed by the Claude Code slash command and validate the MCP server programmatically using `curl` against the running server.

---

### 1.1 Environment Check

| # | Check | Expected |
|---|-------|----------|
| E1 | `NEXT_PUBLIC_SUPABASE_URL` is set | Non-empty string |
| E2 | `SUPABASE_SERVICE_ROLE_KEY` is set | Non-empty string |
| E3 | `OPENAI_API_KEY` is set | Non-empty string |
| E4 | Base URL resolves (localhost:3000 or `NEXT_PUBLIC_APP_URL`) | HTTP 200 on GET / |

---

### 1.2 Auth Flow Tests

| # | Test | Method | Expected |
|---|------|--------|----------|
| A1 | No token | POST `/api/mcp` with valid JSON-RPC body | 401 Unauthorized |
| A2 | Invalid Bearer token | `Authorization: Bearer fake_token_123` | 401 Unauthorized |
| A3 | Valid Bearer token (header) | `Authorization: Bearer {API_KEY}` | 200 + session init |
| A4 | Valid token via query param | `?token={API_KEY}` | 200 + session init |
| A5 | OAuth metadata endpoint | GET `/.well-known/oauth-authorization-server` | 200 + JSON with `issuer`, `token_endpoint` |
| A6 | Token endpoint (client_credentials) | POST `/api/mcp/token` with `client_secret` | 200 + `access_token` |
| A7 | Client registration | POST `/api/mcp/register` with `client_name` | 200 + `client_id` starting with `bos_client_` |

---

### 1.3 Tool Invocation Tests

Each tool is tested via JSON-RPC `tools/call` method. Every successful response must contain:
- `summary` (string, non-empty)
- `data` (object or array)
- `usage_hint` (string)
- `related_tools` (array of strings)

#### 1. `get_brand_context`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T1.1 | Valid call, no params | `{}` | 200 + response with brand name, tagline, voice traits, core colors |
| T1.2 | Extra unknown params | `{"foo": "bar"}` | 200 (ignores extra params) |

#### 2. `get_brand_colors`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T2.1 | Default (all groups) | `{}` | Colors with hex values, roles, CSS variables |
| T2.2 | Specific group | `{"group": "brand"}` | Only brand colors returned |
| T2.3 | With guidelines | `{"group": "all", "include_guidelines": true}` | Usage guidelines included |
| T2.4 | Without guidelines | `{"include_guidelines": false}` | No usage_guidelines field |
| T2.5 | Invalid group | `{"group": "nonexistent"}` | Graceful fallback or error |

#### 3. `get_brand_assets`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T3.1 | All assets | `{}` | Array of assets with download URLs |
| T3.2 | Logos category | `{"category": "logos"}` | Only logo assets |
| T3.3 | With variant | `{"category": "logos", "variant": "dark"}` | Dark variant logos |
| T3.4 | Limit boundary | `{"limit": 1}` | Exactly 1 result |
| T3.5 | Limit max | `{"limit": 100}` | Up to 100 results |
| T3.6 | Limit zero | `{"limit": 0}` | Error or empty (invalid) |
| T3.7 | Limit exceeds max | `{"limit": 101}` | Capped at 100 or error |

#### 4. `search_brand_knowledge`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T4.1 | Valid query | `{"query": "brand voice"}` | Relevant search results |
| T4.2 | Category filter | `{"query": "colors", "category": "brand-identity"}` | Filtered results |
| T4.3 | Limit | `{"query": "tone", "limit": 3}` | Max 3 results |
| T4.4 | Empty query | `{"query": ""}` | Error response |
| T4.5 | Missing query | `{}` | Error (required param) |

#### 5. `search_brand_assets`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T5.1 | Visual query | `{"query": "logo dark background"}` | Semantically matched assets |
| T5.2 | Category filter | `{"query": "warm tones", "category": "images"}` | Filtered results |
| T5.3 | Limit | `{"query": "icon", "limit": 5}` | Max 5 results |
| T5.4 | Missing query | `{}` | Error (required param) |

#### 6. `get_brand_guidelines`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T6.1 | All guidelines | `{}` | Array of guideline documents |
| T6.2 | Specific slug | `{"slug": "brand-identity"}` | Single guideline document |
| T6.3 | Category filter | `{"category": "visual"}` | Visual guidelines only |
| T6.4 | Invalid slug | `{"slug": "nonexistent"}` | Empty result or error |

#### 7. `get_design_tokens`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T7.1 | JSON format | `{"format": "json"}` | Valid JSON tokens |
| T7.2 | CSS format | `{"format": "css"}` | CSS custom properties |
| T7.3 | SCSS format | `{"format": "scss"}` | SCSS variables |
| T7.4 | Tailwind format | `{"format": "tailwind"}` | Tailwind config object |
| T7.5 | Scoped colors | `{"format": "css", "scope": "colors"}` | Only color tokens |
| T7.6 | Multiple scopes | `{"scope": "colors,typography"}` | Colors + typography |
| T7.7 | Invalid format | `{"format": "yaml"}` | Fallback or error |

#### 8. `get_brand_voice`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T8.1 | General voice | `{}` | Voice traits, anti-traits, posture |
| T8.2 | Platform specific | `{"platform": "linkedin"}` | LinkedIn-specific guidance |
| T8.3 | Content type | `{"content_type": "announcement"}` | Announcement guidance |
| T8.4 | Both params | `{"platform": "twitter", "content_type": "thought_leadership"}` | Combined guidance |
| T8.5 | Invalid platform | `{"platform": "tiktok"}` | Fallback or error |

#### 9. `get_writing_style`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T9.1 | General style | `{}` | Writing style guidance |
| T9.2 | Blog style | `{"style_type": "blog"}` | Blog-specific guidance |
| T9.3 | Social style | `{"style_type": "social"}` | Social media guidance |
| T9.4 | Technical style | `{"style_type": "technical"}` | Technical writing guidance |
| T9.5 | Invalid type | `{"style_type": "poetry"}` | Fallback or error |

#### 10. `get_typography_system`

| # | Test | Params | Expected |
|---|------|--------|----------|
| T10.1 | Without fonts | `{}` | Typography hierarchy, weights, rules |
| T10.2 | With font files | `{"include_font_files": true}` | Includes download URLs |
| T10.3 | Without font files | `{"include_font_files": false}` | No font file URLs |

---

### 1.4 Resource Tests

| # | Test | Method | Expected |
|---|------|--------|----------|
| R1 | List resources | `resources/list` | Contains `bos://brand/{slug}/colors` |
| R2 | Read brand colors | `resources/read` with valid URI | JSON with `meta`, `brand`, `monoScale`, `brandScale`, `cssTokens`, `quickReference` |
| R3 | Invalid brand slug | `resources/read` with `bos://brand/fake-brand/colors` | Error or empty result |
| R4 | Meta fields | Read valid resource | `meta.generatedAt` is ISO timestamp, `meta.brandSlug` matches |

---

### 1.5 Asset Proxy Tests

| # | Test | Request | Expected |
|---|------|---------|----------|
| P1 | Valid SVG download | `GET /api/brand/assets/download/logos/brandmark-vanilla.svg` | 200, `Content-Type: image/svg+xml` |
| P2 | Valid PNG download | `GET /api/brand/assets/download/logos/some-logo.png` | 200, `Content-Type: image/png` |
| P3 | Path traversal (../) | `GET /api/brand/assets/download/../../../etc/passwd` | 400 Bad Request |
| P4 | Path traversal (//) | `GET /api/brand/assets/download/logos//hidden.svg` | 400 Bad Request |
| P5 | Custom bucket | `GET /api/brand/assets/download/doc.pdf?bucket=brand-guidelines` | 200 if file exists |
| P6 | Invalid bucket | `GET /api/brand/assets/download/file.svg?bucket=malicious` | Defaults to `brand-assets` |
| P7 | Non-existent file | `GET /api/brand/assets/download/logos/does-not-exist.svg` | 404 or 500 |
| P8 | Cache headers | Any successful download | `Cache-Control` includes `public, max-age=86400` |
| P9 | Security headers | Any successful download | `X-Content-Type-Options: nosniff` present |

---

### 1.6 Error Sanitization Tests

| # | Test | Method | Expected |
|---|------|--------|----------|
| S1 | Missing brand ID (auth issue) | Call tool with invalid auth context | Error message < 100 chars, no internal details |
| S2 | Invalid tool name | `tools/call` with `name: "nonexistent_tool"` | Clean error, no stack trace |
| S3 | Supabase connection error | Force bad query | "A database error occurred" or similar |
| S4 | Response has no API keys | Any error response | No strings matching `sk-`, `sbp_`, `eyJ` patterns |
| S5 | Response has no URLs | Any error response | No internal Supabase/OpenAI URLs leaked |

---

## Section 2: Human Tests (Manual Verification)

These tests require manual execution by a human tester, typically using Claude Desktop or another MCP-compatible client.

---

### 2.1 Claude Desktop Integration

| # | Test | Steps | Expected |
|---|------|-------|----------|
| H1.1 | Server discovery | Add MCP server config to Claude Desktop `claude_desktop_config.json` | Server appears in MCP panel |
| H1.2 | Tool listing | Open Claude Desktop MCP panel | All 10 tools visible with descriptions |
| H1.3 | Resource listing | Check resources in MCP panel | `bos://brand/{slug}/colors` listed |
| H1.4 | Header auth | Configure with Bearer token in headers | Tools work correctly |
| H1.5 | Query param auth | Configure with `?token=` in URL | Tools work correctly |
| H1.6 | Connection resilience | Stop/restart dev server | Client reconnects gracefully |

**Claude Desktop Config Example:**
```json
{
  "mcpServers": {
    "bos": {
      "transport": "streamable-http",
      "url": "https://bos-3-0.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

---

### 2.2 Response Quality

| # | Test | Prompt | Expected Response Quality |
|---|------|--------|---------------------------|
| H2.1 | Brand colors | "What are our brand colors?" | Complete palette: Charcoal (#191919), Vanilla (#FFFAEE), Aperol (#FE5102) with usage context |
| H2.2 | Voice application | "Write a LinkedIn post about AI" | Uses brand voice: smart not smug, confident but humble, "we/our" language |
| H2.3 | Typography | "What fonts do we use?" | Neue Haas Grotesk (Display + Text Pro), Offbit for accents |
| H2.4 | Asset search | "Find a dark logo" | Returns relevant dark-variant assets with working download URLs |
| H2.5 | CSS tokens | "Give me CSS tokens for colors" | Valid CSS custom properties output |
| H2.6 | Tailwind config | "Give me a Tailwind config for our design system" | Drop-in Tailwind configuration |
| H2.7 | Writing style | "How should I write a blog post?" | Blog-specific guidance with formatting rules |
| H2.8 | Brand context primer | "Give me a brand overview" | Complete primer: name, tagline, mission, voice, colors, rules |

---

### 2.3 Error UX

| # | Test | Scenario | Expected |
|---|------|----------|----------|
| H3.1 | Expired key | Use revoked/expired API key | Clear "authentication failed" message, not cryptic error |
| H3.2 | Non-existent brand | Access with key pointing to deleted brand | "Brand not found" or similar helpful message |
| H3.3 | Network issues | Disconnect network mid-request | Client shows timeout/connection error |
| H3.4 | Rate limiting | Rapid successive requests | Graceful handling (429 or queuing) |
| H3.5 | Large response | Request all assets with limit=100 | Response completes without truncation |

---

### 2.4 Cross-Tool Workflows

| # | Workflow | Steps | Expected |
|---|----------|-------|----------|
| H4.1 | Context → Voice | 1. `get_brand_context` 2. `get_brand_voice` for LinkedIn | Voice guidance aligns with context primer |
| H4.2 | Tokens → Implementation | 1. `get_design_tokens` format=tailwind 2. Use in project | Valid Tailwind config that works in tailwind.config |
| H4.3 | Search → Download | 1. `search_brand_assets` 2. Access download URL | File downloads correctly through proxy |
| H4.4 | Colors → Tokens | 1. `get_brand_colors` 2. `get_design_tokens` scope=colors | Token values match color palette |
| H4.5 | Guidelines → Voice → Writing | 1. `get_brand_guidelines` 2. `get_brand_voice` 3. `get_writing_style` | Consistent guidance across all three |

---

### 2.5 Security Verification

| # | Test | Steps | Expected |
|---|------|-------|----------|
| H5.1 | Token in logs | Check server logs after auth | API keys not logged in plaintext |
| H5.2 | CORS headers | Access from different origin | Proper CORS headers on OAuth endpoints |
| H5.3 | Download URL opacity | Check asset download URLs | No Supabase storage URLs exposed to client |
| H5.4 | Error information | Trigger various errors | No stack traces, internal paths, or service details |

---

## Test Execution Checklist

### Pre-Requisites
- [ ] Dev server running (`bun dev`) or production URL accessible
- [ ] Valid MCP API key generated in BOS settings
- [ ] Environment variables configured (Supabase, OpenAI)
- [ ] At least one brand with colors, assets, and guidelines in database

### Automated Run
```bash
# In Claude Code CLI:
/test-mcp
```

### Manual Run
1. Configure Claude Desktop with MCP server
2. Walk through Section 2 tests sequentially
3. Document any failures with screenshots
4. Report issues in `docs/audits/` directory

---

## Pass/Fail Criteria

### Automated Tests
- **Pass:** All tests return expected status codes and response structures
- **Warn:** Non-critical fields missing but core data present
- **Fail:** Wrong status code, missing required fields, leaked internal details

### Manual Tests
- **Pass:** Responses are accurate, complete, and brand-aligned
- **Warn:** Minor quality issues (formatting, verbosity)
- **Fail:** Incorrect brand data, broken downloads, poor error messages
