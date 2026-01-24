/**
 * BOS MCP Server - Main Entry Point
 *
 * This route implements the Model Context Protocol using Vercel's mcp-handler.
 * It provides tools for external AI clients to access brand knowledge,
 * design tokens, voice/tone guidance, and typography systems.
 *
 * Endpoints:
 * - /api/mcp - Streamable HTTP transport (recommended)
 * - /api/sse - SSE transport (requires Redis)
 *
 * Authentication: Bearer token (API key from BOS settings)
 */

import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import {
  searchBrandKnowledge,
  getBrandColors,
  getBrandAssets,
  getBrandGuidelines,
  searchBrandAssets,
  getBrandContext,
  getDesignTokens,
  getBrandVoice,
  getWritingStyle,
  getTypographySystem,
  sanitizeError,
} from '@/lib/mcp/tools';
import { verifyMcpToken, getBrandIdFromAuth } from '@/lib/mcp/auth';
import { fetchBrandColorsResource } from '@/lib/mcp/resources/brand-colors';

// ============================================
// MCP Handler Definition
// ============================================

const handler = createMcpHandler(
  (server) => {
    // ========================================
    // Resource: Brand Colors
    // ========================================
    server.resource(
      'brand-colors',
      'bos://brand/{brandSlug}/colors',
      {
        description: 'Access the complete brand color design system including brand colors, mono scale, brand scale, and CSS tokens',
        mimeType: 'application/json',
      },
      async (uri) => {
        // Extract brandSlug from URI: bos://brand/{brandSlug}/colors
        const match = uri.href.match(/bos:\/\/brand\/([^/]+)\/colors/);
        const brandSlug = match?.[1] || 'open-session';

        try {
          const resource = await fetchBrandColorsResource(brandSlug);
          return {
            contents: [{
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(resource, null, 2),
            }],
          };
        } catch {
          return {
            contents: [{
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'Brand colors not available' }),
            }],
          };
        }
      }
    );

    // ========================================
    // Tool: search_brand_knowledge
    // ========================================
    server.tool(
      'search_brand_knowledge',
      'Search brand documentation for voice, messaging, philosophy, and guidelines. USE THIS when helping with: writing content, understanding brand approach, answering "how do we..." questions, or finding brand philosophy on any topic. Returns relevant excerpts with source context and usage hints.',
      {
        query: z.string().describe('Natural language question or topic - e.g., "voice and tone for social media" or "how we talk about AI"'),
        category: z.enum(['brand-identity', 'writing-styles', 'skills', 'all']).optional()
          .describe('Focus area: brand-identity (visual/colors), writing-styles (content/copy), skills (capabilities), or all'),
        limit: z.number().int().min(1).max(20).optional()
          .describe('Number of results (default: 5). Use lower for quick context, higher for comprehensive research'),
      },
      async ({ query, category, limit }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await searchBrandKnowledge(brandId, { query, category, limit });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_brand_colors
    // ========================================
    server.tool(
      'get_brand_colors',
      'Get the exact color palette with hex/RGB values. USE THIS when: designing anything visual, suggesting colors, creating mockups, or answering "what color should I use for...". Returns colors with roles (primary, accent, etc.) and usage context.',
      {
        group: z.enum(['brand', 'mono-scale', 'brand-scale', 'custom', 'all']).optional()
          .describe('brand=core colors (Vanilla/Charcoal/Aperol), mono-scale=grayscale, brand-scale=tints/shades, all=everything'),
        include_guidelines: z.boolean().optional()
          .describe('Include when/how to use each color (default: true). Set false for just hex values'),
      },
      async ({ group, include_guidelines }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandColors(brandId, { group, include_guidelines });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_brand_assets
    // ========================================
    server.tool(
      'get_brand_assets',
      'List downloadable brand assets by category. USE THIS when user needs: logos for a project, font files, imagery for content, or asking "where are our...". Returns branded download URLs and metadata.',
      {
        category: z.enum(['logos', 'fonts', 'illustrations', 'images', 'textures', 'icons', 'all']).optional()
          .describe('logos=brand marks, fonts=typography files, images=photos, illustrations=graphics, textures=overlays'),
        variant: z.string().optional()
          .describe('Style variant: light (for dark backgrounds), dark (for light backgrounds), mono, glass'),
        limit: z.number().int().min(1).max(100).optional()
          .describe('Number of assets (default: 20). Use lower limit for quick retrieval'),
      },
      async ({ category, variant, limit }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandAssets(brandId, { category, variant, limit });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_brand_guidelines
    // ========================================
    server.tool(
      'get_brand_guidelines',
      'Fetch comprehensive guideline documents (PDFs, detailed specs). USE THIS for: deep dives into specific topics, sharing official documentation, or when user needs the "full guide" on something. More detailed than search_brand_knowledge.',
      {
        slug: z.string().optional()
          .describe('Specific guide: brand-identity, brand-messaging, art-direction, writing-styles'),
        category: z.string().optional()
          .describe('Category filter: visual, voice, content, creative'),
      },
      async ({ slug, category }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandGuidelines(brandId, { slug, category });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: search_brand_assets
    // ========================================
    server.tool(
      'search_brand_assets',
      'Find assets by description using AI search. USE THIS when: user describes what they need visually ("energetic photo", "minimal logo", "warm texture"), or when get_brand_assets category filter isn\'t specific enough. Returns relevance-ranked results.',
      {
        query: z.string().describe('Describe the visual: "automotive photo with motion blur", "horizontal logo on dark", "abstract warm texture"'),
        category: z.enum(['logos', 'fonts', 'illustrations', 'images', 'textures', 'icons']).optional()
          .describe('Narrow to category if known, or omit for cross-category search'),
        limit: z.number().int().min(1).max(50).optional()
          .describe('Number of results (default: 10). Higher for more options'),
      },
      async ({ query, category, limit }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await searchBrandAssets(brandId, { query, category, limit });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_brand_context
    // ========================================
    server.tool(
      'get_brand_context',
      'Get a complete brand primer in a single call. USE THIS FIRST when starting any brand-related work. Returns: brand name/mission, voice traits, core colors, key rules, and typography. This is your "brand personality card" for warm-starting any conversation.',
      {},
      async (_params, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandContext(brandId);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_design_tokens
    // ========================================
    server.tool(
      'get_design_tokens',
      'Export the complete design system as CSS, SCSS, Tailwind config, or raw JSON. USE THIS when: building components, styling interfaces, creating design specs, or answering "how do I implement this in code?". Supports scoped exports (colors only, typography only, etc.).',
      {
        format: z.enum(['json', 'css', 'scss', 'tailwind']).optional()
          .describe('Output format: json (raw tokens), css (custom properties), scss (variables), tailwind (config extension)'),
        scope: z.string().optional()
          .describe('Comma-separated scopes: colors, typography, spacing, shadows, animations, borderRadius, breakpoints, accessibility. Default: all'),
      },
      async ({ format, scope }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getDesignTokens(brandId, { format, scope });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_brand_voice
    // ========================================
    server.tool(
      'get_brand_voice',
      'Get structured voice and tone guidance for content creation. USE THIS when: writing copy, drafting social posts, creating emails, or any content that needs to sound "on brand". Optionally scoped to a specific platform or content type.',
      {
        platform: z.string().optional()
          .describe('Target platform: linkedin, twitter, instagram, email, blog, website'),
        content_type: z.string().optional()
          .describe('Content type: announcement, tutorial, thought_leadership, product, internal, creative'),
      },
      async ({ platform, content_type }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandVoice(brandId, { platform, content_type });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_writing_style
    // ========================================
    server.tool(
      'get_writing_style',
      'Get detailed writing style guidance for specific content formats. USE THIS when: drafting blog posts, social content, strategic documents, or creative copy. Returns excerpts from brand writing guides with formatting rules.',
      {
        style_type: z.string().optional()
          .describe('Writing style: general, blog, social, creative, strategic, technical'),
      },
      async ({ style_type }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getWritingStyle(brandId, { style_type });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );

    // ========================================
    // Tool: get_typography_system
    // ========================================
    server.tool(
      'get_typography_system',
      'Get the complete typography system: font families, weights, size hierarchy, and usage rules. USE THIS when: building UI components, choosing fonts, or implementing text styles. Includes font download URLs when requested.',
      {
        include_font_files: z.boolean().optional()
          .describe('Include download URLs for font files (woff2). Default: false'),
      },
      async ({ include_font_files }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text' as const, text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getTypographySystem(brandId, { include_font_files });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${sanitizeError(error)}` }],
            isError: true,
          };
        }
      }
    );
  },
  {
    // Server options
    name: 'BOS MCP Server',
    version: '3.0.0',
  },
  {
    // Handler options
    basePath: '/api',
    verboseLogs: process.env.NODE_ENV === 'development',
  }
);

// ============================================
// Wrap with authentication
// ============================================

const authHandler = withMcpAuth(handler, verifyMcpToken, {
  required: true,
  requiredScopes: ['read:brand'],
});

// ============================================
// Export route handlers
// ============================================

// CORS preflight handler
async function optionsHandler() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
    },
  });
}

export { authHandler as GET, authHandler as POST, authHandler as DELETE, optionsHandler as OPTIONS };
