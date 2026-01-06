/**
 * BOS MCP Server - Main Entry Point
 * 
 * This route implements the Model Context Protocol using Vercel's mcp-handler.
 * It provides tools for external AI clients to access brand knowledge.
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
} from '@/lib/mcp/tools';
import { verifyMcpToken, getBrandIdFromAuth } from '@/lib/mcp/auth';

// ============================================
// MCP Handler Definition
// ============================================

const handler = createMcpHandler(
  (server) => {
    // ========================================
    // Tool: search_brand_knowledge
    // ========================================
    server.tool(
      'search_brand_knowledge',
      'Search the brand knowledge base using semantic similarity. Returns relevant brand documentation, guidelines, and context based on your query.',
      {
        query: z.string().describe('The search query - describe what brand information you\'re looking for'),
        category: z.enum(['brand-identity', 'writing-styles', 'skills', 'all']).optional()
          .describe('Category to search within (default: all)'),
        limit: z.number().int().min(1).max(20).optional()
          .describe('Maximum number of results to return (default: 5, max: 20)'),
      },
      async ({ query, category, limit }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text', text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await searchBrandKnowledge(brandId, { query, category, limit });
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
      'Retrieve the brand color palette including primary, secondary, and accent colors with hex values and usage guidelines.',
      {
        group: z.enum(['brand', 'mono-scale', 'brand-scale', 'custom', 'all']).optional()
          .describe('Filter by color group (default: all)'),
        include_guidelines: z.boolean().optional()
          .describe('Include usage guidelines for each color (default: true)'),
      },
      async ({ group, include_guidelines }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text', text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandColors(brandId, { group, include_guidelines });
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
      'List brand assets such as logos, fonts, illustrations, and images. Can filter by category.',
      {
        category: z.enum(['logos', 'fonts', 'illustrations', 'images', 'textures', 'icons', 'all']).optional()
          .describe('Asset category to retrieve (default: all)'),
        variant: z.string().optional()
          .describe('Filter by variant (e.g., \'light\', \'dark\', \'mono\')'),
        limit: z.number().int().min(1).max(100).optional()
          .describe('Maximum number of assets to return (default: 20, max: 100)'),
      },
      async ({ category, variant, limit }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text', text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandAssets(brandId, { category, variant, limit });
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
      'Fetch specific brand guideline documents including visual direction, usage rules, and brand standards.',
      {
        slug: z.string().optional()
          .describe('Specific guideline document slug to retrieve'),
        category: z.string().optional()
          .describe('Filter guidelines by category'),
      },
      async ({ slug, category }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text', text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await getBrandGuidelines(brandId, { slug, category });
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
      'Semantic search for brand assets by description. Use natural language to find logos, images, or other visual assets.',
      {
        query: z.string().describe('Natural language description of the asset you\'re looking for'),
        category: z.enum(['logos', 'fonts', 'illustrations', 'images', 'textures', 'icons']).optional()
          .describe('Limit search to specific category'),
        limit: z.number().int().min(1).max(50).optional()
          .describe('Maximum number of results (default: 10, max: 50)'),
      },
      async ({ query, category, limit }, { authInfo }) => {
        const brandId = getBrandIdFromAuth(authInfo);
        if (!brandId) {
          return {
            content: [{ type: 'text', text: 'Error: Authentication required' }],
            isError: true,
          };
        }

        try {
          const result = await searchBrandAssets(brandId, { query, category, limit });
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true,
          };
        }
      }
    );
  },
  {
    // Server options
    name: 'BOS MCP Server',
    version: '2.0.0',
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

export { authHandler as GET, authHandler as POST, authHandler as DELETE };

