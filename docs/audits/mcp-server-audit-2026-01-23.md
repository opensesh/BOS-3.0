# BOS MCP Server Audit

**Date:** 2026-01-23
**Scope:** MCP server usability for external LLMs, technical issues, and feature gaps
**Server Version:** 2.0.0
**Endpoint:** `https://bos-3-0.vercel.app/api/mcp`

---

## Executive Summary

The BOS MCP server provides 5 tools and 1 resource (unregistered) for external AI clients. While the foundation is solid (authentication, multi-tenant isolation, semantic search), the server has **critical technical issues** preventing basic functionality and **significant gaps** in the three core use cases: brand asset access, intelligent copy creation, and on-brand code generation.

| Area | Status | Impact |
|------|--------|--------|
| Tool discovery (tools/list) | Broken | External clients can't find tools |
| Asset URL privacy | Leaking Supabase URLs | Exposes infrastructure to consumers |
| Brand asset downloads | Partially working | URLs work but naming is unclear |
| Copy/writing assistance | Missing entirely | No tools for drafting on-brand content |
| Code generation (CSS/Tailwind) | Dead code | Export functions exist but aren't exposed |
| Resource registration | Not implemented | Brand colors resource unreachable |
| Embedding model mismatch | Silent bug | May affect search quality |

---

## Part 1: Technical Issues

### 1.1 "Tools Not Found" Error

**Symptom:** When connecting BOS MCP to Claude Desktop or other clients, `tools/list` returns empty or errors.

**Root Cause Analysis:**

The MCP handler uses `mcp-handler` library with `withMcpAuth` wrapping. The authentication flow has a fragile chain:

1. `verifyMcpToken()` in `lib/mcp/auth.ts:107` accepts Bearer tokens and `?token=` query params
2. If auth fails, it returns `undefined` (not an error), which causes `withMcpAuth` to reject the request silently
3. The handler at `app/api/[transport]/route.ts` uses dynamic routing (`[transport]`) - this means the actual path is `/api/mcp` but the `basePath` is set to `/api`

**Potential issues:**
- The `[transport]` dynamic segment may not correctly resolve for all MCP client implementations
- OAuth metadata at `app/api/mcp/oauth-metadata/route.ts` hardcodes `https://bos-3-0.vercel.app` which breaks in preview deployments (intentional, but may confuse auth flows)
- The `client_credentials` grant in `token/route.ts` uses `client_secret` as the API key directly, which some clients may not expect
- If the `mcp_server_config` table has no enabled configs or the API key array is empty/malformed, all auth silently fails with no diagnostic output

**Files involved:**
- `app/api/[transport]/route.ts` (handler)
- `lib/mcp/auth.ts` (auth verification)
- `app/api/mcp/token/route.ts` (token exchange)
- `app/api/mcp/oauth-metadata/route.ts` (discovery)

---

### 1.2 Supabase URL Leakage in Asset Responses

**Symptom:** When assets are returned, URLs expose the Supabase project URL: `https://{project-id}.supabase.co/storage/v1/object/public/brand-assets/...`

**Location:** `lib/mcp/tools.ts` - lines 251, 281, 342, 378, 403

```typescript
// Current (exposes infrastructure)
url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.storage_path}`,

// Also in guidelines:
url: `${supabaseUrl}/storage/v1/object/public/brand-guidelines/${guide.storage_path}`,
```

**Impact:**
- Reveals database provider to external consumers
- Exposes project ID structure
- Not brand-aligned (should say "from your Brand Operating System")
- If Supabase URL changes, all cached/referenced URLs break

**Recommendation:** Proxy asset downloads through a BOS-branded endpoint like `/api/brand/assets/{assetId}/download` that redirects or streams the file. Response metadata should reference "Brand Operating System" not "Supabase".

---

### 1.3 Embedding Model Mismatch

**Location:** `lib/mcp/tools.ts:99` vs `lib/bos/document-ingestion.ts`

| Context | Model | Dimensions |
|---------|-------|-----------|
| MCP query embedding | `text-embedding-ada-002` | 1536 |
| Document ingestion | `text-embedding-3-large` | 1536 |

These are **different models** producing embeddings in the same vector space. While both produce 1536-dim vectors, their semantic spaces are not identical. This means:
- Cosine similarity comparisons may be degraded
- Search quality may be unpredictably poor for certain queries
- The threshold of `0.5` may be too aggressive or too lenient depending on the model pairing

**Recommendation:** Use the same model (`text-embedding-3-large`) for query embeddings in MCP tools.

---

### 1.4 Resource Not Registered

**Location:** `lib/mcp/resources/brand-colors.ts` and `lib/mcp/resources/index.ts`

The brand colors MCP resource is fully implemented with:
- Resource definition (`brandColorsResourceDefinition`)
- Fetcher (`fetchBrandColorsResource`)
- Export helpers (CSS, SCSS, Tailwind, Style Dictionary)
- Type definitions

**However**, the resource is **never registered** with the MCP server. The handler in `route.ts` only calls `server.tool()` — it never calls `server.resource()`. This means:
- `resources/list` returns empty
- No client can discover or read the brand colors resource
- All the export format code is dead code from an MCP perspective

---

### 1.5 Error Messages Expose Internals

Tool error responses can leak internal details:

```typescript
// Current error format
text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
```

Supabase errors, OpenAI errors, and internal exceptions may contain project IDs, table names, or API details that shouldn't be exposed to external consumers.

---

## Part 2: Current Tool Assessment

### 2.1 Tool Inventory

| Tool | Purpose | LLM Usefulness | Issues |
|------|---------|----------------|--------|
| `search_brand_knowledge` | Semantic search on brand docs | Medium | Embedding mismatch, no writing context |
| `get_brand_colors` | Color palette retrieval | High | Works well, but no export formats |
| `get_brand_assets` | List assets by category | Medium | Supabase URL leak, no download abstraction |
| `get_brand_guidelines` | Fetch guideline PDFs | Low | Returns URLs only, not content |
| `search_brand_assets` | AI-powered asset search | Medium | Supabase URL leak, embedding mismatch |

### 2.2 Tool Description Quality

The tool descriptions are well-written with "USE THIS when..." guidance, which helps LLMs select the right tool. This is a strength. However, the descriptions could better indicate what format responses come in and what the LLM should do with the results.

---

## Part 3: Gap Analysis by Use Case

### 3.1 Use Case: Quick Brand Asset Access & Downloads

**What works:**
- `get_brand_assets` lists assets with category filtering
- `search_brand_assets` finds assets by visual description
- Asset metadata (name, description, category, variant) is good

**What's missing:**

| Gap | Impact | Priority |
|-----|--------|----------|
| No branded download URLs | Users see raw Supabase URLs | High |
| No asset preview/thumbnail tool | LLMs can't show previews in chat | Medium |
| No "get logo" shortcut | Common request requires knowing category/variant system | High |
| No asset format conversion | Can't request SVG vs PNG vs different sizes | Low |
| No usage context with assets | "When to use this logo" isn't attached | Medium |

**Ideal flow for "Give me our logo":**
1. LLM calls a simple tool (e.g., `get_logo` with variant param)
2. Gets back a branded download URL + usage context
3. Presents it cleanly: "Here's your charcoal logo — [Download from BOS](https://bos.app/assets/...)"

---

### 3.2 Use Case: Intelligent Copy Creation

**What works:**
- `search_brand_knowledge` can retrieve writing style docs
- Brand voice/tone documentation exists in the knowledge base
- Category filtering (`writing-styles`) narrows to relevant content

**What's missing:**

| Gap | Impact | Priority |
|-----|--------|----------|
| No "get writing context" tool | LLMs must search, then interpret results | High |
| No platform-specific guidance tool | "Write for Instagram" requires multiple searches | High |
| No voice/tone system prompt | LLMs get raw chunks, not usable system context | Critical |
| No content templates | No post structures, caption formulas, or frameworks | Medium |
| No brand vocabulary/terminology tool | No quick access to preferred terms, banned words | Medium |
| No content examples tool | Can't retrieve exemplar posts for tone matching | Low |

**Ideal flow for "Write me a LinkedIn post about our new feature":**
1. LLM calls `get_brand_voice_context` with platform="linkedin"
2. Gets structured response: voice traits, do/don't, example structures, word preferences
3. Writes content using that context natively (no second search needed)

**Proposed new tools:**
- `get_brand_voice` — Returns structured voice/tone guidance, optionally scoped to a platform or content type
- `get_writing_style` — Returns the full writing style doc for a specific format (blog, social, creative, strategic)
- `get_brand_vocabulary` — Preferred terms, banned words, style rules (Oxford comma, capitalization, etc.)

---

### 3.3 Use Case: On-Brand Code Generation

**What works:**
- Color data is retrievable via `get_brand_colors`
- `tokens.json` has comprehensive design system data
- Brand colors resource has CSS/SCSS/Tailwind export helpers (unused)

**What's missing:**

| Gap | Impact | Priority |
|-----|--------|----------|
| No CSS/Tailwind export tool | Export functions exist but aren't exposed | Critical |
| No typography tokens tool | Font families, weights, sizes not accessible | High |
| No spacing/layout tokens tool | 24-point spacing scale inaccessible | Medium |
| No component pattern tool | Card, button, input patterns not available | High |
| No motion/animation tokens tool | Animation specs inaccessible | Medium |
| No design system summary tool | No single "give me everything for coding" tool | High |
| No framework-specific output | Can't request "give me this in Tailwind v4" vs "CSS vars" | Medium |

**Ideal flow for "Style this component to match our brand":**
1. LLM calls `get_design_tokens` with format="tailwind" and scope="colors,typography,spacing"
2. Gets back a ready-to-use Tailwind config snippet
3. Applies it directly to the component code

**Proposed new tools:**
- `get_design_tokens` — Returns tokens in specified format (CSS, SCSS, Tailwind, JSON) with optional scope filtering (colors, typography, spacing, shadows, animations)
- `get_component_patterns` — Returns recommended patterns for common UI components (cards, buttons, inputs, modals) with the brand's specific token usage
- `get_typography_system` — Font families, weights, scale, and usage rules
- `get_motion_design` — Animation tokens, timing functions, and transition patterns

---

## Part 4: LLM Interpretation Quality

### 4.1 Response Format Issues

**Current:** All tools return `JSON.stringify(result, null, 2)` as plain text.

**Problems for LLMs:**
- Large JSON blobs are token-expensive
- LLMs must parse nested structures to extract useful info
- No natural language summary accompanies the data
- No "here's what to do with this" guidance in responses

**Recommendation:** Include both structured data AND a brief natural language summary:
```json
{
  "summary": "3 brand colors found: Charcoal (#191919) for dark backgrounds, Vanilla (#FFFAEE) for light, Aperol (#FE5102) as accent (max 10% of composition)",
  "data": { ... structured data ... },
  "usage_hint": "Use Charcoal as your primary dark. Aperol ONLY for CTAs and badges."
}
```

### 4.2 Missing System-Level Context

When an LLM connects via MCP, it has no automatic context about the brand. It must call tools to learn anything. This means:
- First interaction always requires multiple tool calls
- No "warm start" with brand basics
- LLMs in Claude/ChatGPT/Gemini don't know the brand personality without explicit queries

**Recommendation:** Add a `get_brand_context` tool that returns a condensed brand primer:
- Brand name, tagline, mission (2-3 sentences)
- Voice traits (5-7 adjectives with anti-traits)
- Core colors (3 hex values with roles)
- Key rules (what to never do)
- This becomes the LLM's "brand personality card"

### 4.3 Cross-Platform Compatibility

| Platform | MCP Support | Auth Method | Status |
|----------|------------|-------------|--------|
| Claude Desktop | Native MCP | Bearer token / OAuth | Should work (auth issues) |
| Claude.ai | Via MCP server config | Bearer token | Should work |
| ChatGPT | Via actions/plugins | OAuth or API key | Requires OpenAPI spec |
| Gemini | Via extensions | OAuth | Requires adapter |
| Cursor/Windsurf | Native MCP | Bearer token | Should work |

**Missing:** No OpenAPI/Swagger spec for non-MCP clients (ChatGPT, Gemini). These platforms can't consume MCP directly and need REST API documentation.

---

## Part 5: Recommended New Tool Architecture

### 5.1 Proposed Tool Set (Reorganized)

#### Tier 1: Essential (Fix Now)
| Tool | Purpose |
|------|---------|
| `get_brand_context` | Brand primer for LLM context (name, voice, colors, rules) |
| `get_design_tokens` | Export design system in CSS/SCSS/Tailwind/JSON |
| `get_brand_voice` | Structured voice/tone for content creation |
| `download_asset` | Branded URL proxy (hides Supabase) |

#### Tier 2: High Value (Next Sprint)
| Tool | Purpose |
|------|---------|
| `get_writing_style` | Full writing guide for specific content types |
| `get_component_patterns` | UI component recipes with brand tokens |
| `get_typography_system` | Font stack, scale, weights, usage rules |
| `get_logo` | Simplified logo retrieval with variant selection |

#### Tier 3: Enhancement (Future)
| Tool | Purpose |
|------|---------|
| `get_brand_vocabulary` | Preferred terms, banned words, style rules |
| `get_motion_design` | Animations, transitions, timing |
| `get_content_examples` | Exemplar content for tone matching |
| `validate_content` | Check if draft content matches brand voice |

### 5.2 Response Format Standard

All tools should follow this pattern:
```typescript
{
  // Human-readable summary for LLM context
  summary: string;

  // Structured data
  data: T;

  // What to do with this information
  usage_hint?: string;

  // Related tools the LLM might want next
  related_tools?: string[];
}
```

---

## Part 6: Specific Fixes Required

### 6.1 Critical (Blocking)

1. **Fix tool discovery**: Ensure `tools/list` returns all 5 tools after authentication. Debug the auth flow end-to-end with Claude Desktop.

2. **Fix Supabase URL leakage**: Replace raw Supabase storage URLs with branded proxy URLs. Example:
   - Current: `https://xyz.supabase.co/storage/v1/object/public/brand-assets/logos/brandmark-vanilla.svg`
   - Target: `https://bos-3-0.vercel.app/api/brand/assets/download/brandmark-vanilla.svg`

3. **Fix embedding model mismatch**: Change `text-embedding-ada-002` to `text-embedding-3-large` in `lib/mcp/tools.ts:99`.

4. **Register the colors resource**: Add `server.resource()` call in the handler to expose the brand colors resource.

### 6.2 High Priority

5. **Add `get_brand_context` tool**: Single-call brand primer for LLM warm-start.

6. **Expose design token exports as a tool**: Wire up the existing `exportAsCss`, `exportAsTailwind`, etc. functions.

7. **Add response summaries**: Augment JSON responses with natural language summaries.

8. **Sanitize error messages**: Strip internal details (table names, Supabase errors) from consumer-facing errors.

### 6.3 Medium Priority

9. **Add `get_brand_voice` tool**: Structured voice/tone output for content creation.

10. **Add `get_writing_style` tool**: Platform-specific writing guidance.

11. **Add `get_typography_system` tool**: Font families, weights, and usage from `tokens.json`.

12. **Create OpenAPI spec**: For ChatGPT/Gemini compatibility.

---

## Part 7: Data Availability Check

What's already in the database vs what needs to be created:

| Data | Storage Location | Accessible via MCP? | Notes |
|------|-----------------|---------------------|-------|
| Brand colors | `brand_colors` table | Yes (tool) | Working |
| Logo files | `brand-assets` storage bucket | Yes (URL leak) | Needs proxy |
| Font files | `brand-assets` storage bucket | Yes (URL leak) | Needs proxy |
| Brand identity doc | `brand_document_chunks` | Yes (search) | Not structured |
| Writing styles (5) | `brand_document_chunks` | Yes (search) | Not structured |
| Art direction | `brand_document_chunks` | Yes (search) | Not structured |
| Design tokens | `lib/brand-styles/tokens.json` | No | File only, not in DB |
| Typography specs | `tokens.json` | No | Not exposed |
| Spacing scale | `tokens.json` | No | Not exposed |
| Animation specs | `tokens.json` | No | Not exposed |
| Component patterns | CLAUDE.md / design-system.md | No | Docs only |
| Brand vocabulary | Brand messaging doc | Indirect (search) | Not structured |

---

## Part 8: Security & Privacy Considerations

| Concern | Current State | Recommendation |
|---------|--------------|----------------|
| API key in URL params | Supported (`?token=`) | Document security implications |
| Rate limiting | Configured but not enforced in handler | Implement middleware check |
| Error message leakage | Exposes internals | Sanitize all error responses |
| Storage URL exposure | Full Supabase URL visible | Proxy through branded endpoint |
| Scope enforcement | Only `read:brand` checked | Add granular tool-level scopes |
| Audit logging | `last_used` updated on key | Add per-tool usage tracking |

---

## Conclusion

The BOS MCP server has a solid architectural foundation — multi-tenant auth, semantic search, and clean tool definitions. However, it's currently **underserving all three core use cases**:

1. **Asset access** is hampered by infrastructure URL leakage and no download abstraction
2. **Copy creation** has zero dedicated tooling — LLMs must cobble together context from raw search results
3. **Code generation** has the building blocks (export functions, tokens) but none are exposed to consumers

The most impactful immediate work is:
- Fix the auth/discovery flow so tools are actually reachable
- Add URL proxying to hide Supabase
- Add `get_brand_context` for LLM warm-start
- Expose the design token export functions as a proper tool

These four changes would transform the MCP server from "broken reference implementation" to "genuinely useful brand API for AI clients".
