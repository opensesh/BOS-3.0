/**
 * MCP Resources Index
 * 
 * Export all available MCP resources for brand knowledge and design systems.
 * These resources are accessible by consumer LLMs (Claude, ChatGPT, Gemini)
 * through the Model Context Protocol.
 */

// Brand Colors Resource
export {
  brandColorsResourceDefinition,
  fetchBrandColorsResource,
  getBrandColorsSummary,
  exportAsCss,
  exportAsScss,
  exportAsTailwind,
  exportAsTokens,
  type McpBrandColor,
  type McpColorGroup,
  type McpBrandColorsResource,
} from './brand-colors';

// Resource registry for MCP discovery
export const MCP_RESOURCES = {
  'brand-colors': {
    uri: 'bos://brand/{brandSlug}/colors',
    name: 'Brand Color Palette',
    description: 'Access brand color design system with CSS tokens and export formats',
  },
  // Future resources can be added here:
  // 'brand-typography': { ... },
  // 'brand-assets': { ... },
  // 'brand-voice': { ... },
} as const;

export type McpResourceKey = keyof typeof MCP_RESOURCES;

