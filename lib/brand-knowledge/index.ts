/**
 * Brand Knowledge Module
 *
 * Central exports for brand documentation and asset indexing.
 */

// Types
export type {
  BrandDocument,
  AssetEntry,
  LogoAsset,
  FontAsset,
  ImageAsset,
  TextureAsset,
  AssetManifest,
  BrandSource,
  BrandPageRoute,
  SystemPromptOptions,
  ResourceCardData,
  PageContext,
  ArticleContext,
  IdeaContext,
  SpaceContext,
  SkillContext,
} from './types';

// Page routes and utilities
export {
  BRAND_PAGE_ROUTES,
  BRAND_SOURCES,
  getPageRoute,
  getBrandSource,
  parseResourceMarkers,
  parseSourceMarkers,
  cleanMarkers,
} from './page-routes';

// System prompt builder
export {
  buildBrandSystemPrompt,
  shouldIncludeFullDocs,
  detectFocusAreas,
} from './system-prompt';

// Re-export generated modules (these are created by generate.ts)
// Note: Run `npm run generate:brand-index` before building
export * from './brand-docs';
export * from './asset-manifest';

// Asset data for chat carousels
export type { AssetType, ColorVariant } from './asset-data';
export {
  LOGO_ASSETS,
  FONT_ASSETS,
  ART_DIRECTION_ASSETS,
  TEXTURE_ASSETS,
  ILLUSTRATION_ASSETS,
  getAssetsByType,
  getAssetTypeLabel,
  getAssetPagePath,
  COLOR_OPTIONS,
  FORMAT_OPTIONS,
} from './asset-data';
// Note: LogoAsset, FontAsset types are also in types.ts but asset-data.ts has different structure for carousel
