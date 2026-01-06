/**
 * Asset Data for Chat Carousels
 *
 * Centralized metadata for logos, fonts, art direction, textures, and illustrations.
 * Used by the AssetCarousel component to render downloadable assets in chat.
 */

// ===========================================
// Types
// ===========================================

export type AssetType = 'logos' | 'fonts' | 'art-direction' | 'textures' | 'illustrations';

export type ColorVariant = 'vanilla' | 'glass' | 'charcoal';

export interface LogoAsset {
  id: string;
  name: string;
  description: string;
  vanillaPath: string;
  glassPath: string;
  charcoalPath?: string;
  category: 'primary' | 'accessory';
}

export interface FontAsset {
  id: string;
  name: string;
  description: string;
  family: string;
  weights: string[];
  specimen: string;
  desktopPath: string;
  webPath: string;
}

export interface ArtDirectionAsset {
  id: string;
  name: string;
  category: 'auto' | 'lifestyle' | 'move' | 'escape' | 'work' | 'feel';
  src: string;
  thumbnailSrc?: string;
}

export interface TextureAsset {
  id: string;
  name: string;
  description: string;
  lightPath: string;
  darkPath?: string;
  previewPath: string;
}

export interface IllustrationAsset {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
}

// ===========================================
// Logo Assets
// ===========================================

export const LOGO_ASSETS: LogoAsset[] = [
  {
    id: 'brandmark',
    name: 'Brandmark',
    description: 'Standalone icon, minimum 50px',
    vanillaPath: '/assets/logos/brandmark-vanilla.svg',
    glassPath: '/assets/logos/brandmark-glass.svg',
    charcoalPath: '/assets/logos/brandmark-charcoal.svg',
    category: 'primary',
  },
  {
    id: 'combo',
    name: 'Combo',
    description: 'Brandmark + wordmark together',
    vanillaPath: '/assets/logos/logo_main_combo_vanilla.svg',
    glassPath: '/assets/logos/logo_main_combo_glass.svg',
    charcoalPath: '/assets/logos/logo_main_combo_charcoal.svg',
    category: 'primary',
  },
  {
    id: 'stacked',
    name: 'Stacked',
    description: 'Wordmark stacked vertically',
    vanillaPath: '/assets/logos/stacked-vanilla.svg',
    glassPath: '/assets/logos/stacked-glass.svg',
    charcoalPath: '/assets/logos/stacked-charcoal.svg',
    category: 'primary',
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Wordmark in horizontal layout',
    vanillaPath: '/assets/logos/horizontal-vanilla.svg',
    glassPath: '/assets/logos/horizontal-glass.svg',
    charcoalPath: '/assets/logos/horizontal-charcoal.svg',
    category: 'primary',
  },
];

// ===========================================
// Font Assets
// ===========================================

export const FONT_ASSETS: FontAsset[] = [
  {
    id: 'neue-haas-display',
    name: 'Neue Haas Display',
    description: 'Headlines and display text',
    family: 'Neue Haas Grotesk Display Pro',
    weights: ['Bold', 'Medium'],
    specimen: 'Brand OS™',
    desktopPath: '/assets/fonts/NeueHaasGroteskDisplay-Pro.zip',
    webPath: '/assets/fonts/NeueHaasDisplay.woff2',
  },
  {
    id: 'neue-haas-text',
    name: 'Neue Haas Text',
    description: 'Body copy and UI text',
    family: 'Neue Haas Grotesk Text Pro',
    weights: ['Roman', 'Medium'],
    specimen: 'The quick brown fox jumps over the lazy dog.',
    desktopPath: '/assets/fonts/NeueHaasGroteskText-Pro.zip',
    webPath: '/assets/fonts/NeueHaasText.woff2',
  },
  {
    id: 'offbit',
    name: 'OffBit',
    description: 'Accent font for digital displays',
    family: 'OffBit',
    weights: ['Regular', 'Bold'],
    specimen: 'Born to Create, Made to Make',
    desktopPath: '/assets/fonts/OffBit.zip',
    webPath: '/assets/fonts/OffBit-Regular.woff2',
  },
];

// ===========================================
// Art Direction Assets (subset for carousel)
// ===========================================

export const ART_DIRECTION_ASSETS: ArtDirectionAsset[] = [
  // Auto - 2 representative images
  { id: 'auto-1', name: 'Audi Quattro Urban', category: 'auto', src: '/assets/images/auto-audi-quattro-urban-portrait.png' },
  { id: 'auto-2', name: 'Desert Porsche Sunset', category: 'auto', src: '/assets/images/auto-desert-porsche-sunset-drift.png' },
  // Lifestyle - 2 representative images
  { id: 'lifestyle-1', name: 'Confident Street Style', category: 'lifestyle', src: '/assets/images/lifestyle-confident-street-style.png' },
  { id: 'lifestyle-2', name: 'Editorial Look Urban', category: 'lifestyle', src: '/assets/images/lifestyle-editorial-look-urban.png' },
  // Move - 2 representative images
  { id: 'move-1', name: 'Athletic Motion Energy', category: 'move', src: '/assets/images/move-athletic-motion-energy.png' },
  { id: 'move-2', name: 'Abstract Dance Flow', category: 'move', src: '/assets/images/move-abstract-dance-flow.png' },
  // Escape - 2 representative images
  { id: 'escape-1', name: 'Cliffside Workspace', category: 'escape', src: '/assets/images/escape-cliffside-workspace-ocean-view.png' },
  { id: 'escape-2', name: 'Desert Wanderer', category: 'escape', src: '/assets/images/escape-desert-silhouette-wanderer.png' },
  // Work - 2 representative images
  { id: 'work-1', name: 'Professional Collaboration', category: 'work', src: '/assets/images/work-professional-collaboration.png' },
  { id: 'work-2', name: 'Modern Workspace', category: 'work', src: '/assets/images/work-office-workspace-modern.png' },
  // Feel - 2 representative images
  { id: 'feel-1', name: 'Ethereal Portrait', category: 'feel', src: '/assets/images/feel-ethereal-portrait-softness.png' },
  { id: 'feel-2', name: 'Flowing Fabric Grace', category: 'feel', src: '/assets/images/feel-flowing-fabric-grace.png' },
];

// ===========================================
// Texture Assets
// ===========================================

export const TEXTURE_ASSETS: TextureAsset[] = [
  {
    id: 'ascii',
    name: 'ASCII',
    description: 'Digital text pattern overlay',
    lightPath: '/assets/textures/texture_ascii_01_white_compressed.jpg',
    darkPath: '/assets/textures/texture_ascii_01_black_compressed.jpg',
    previewPath: '/assets/textures/texture_ascii_01_white_compressed.jpg',
  },
  {
    id: 'halftone',
    name: 'Halftone',
    description: 'Print-inspired dot pattern',
    lightPath: '/assets/textures/texture_halftone_01_compressed.jpg',
    previewPath: '/assets/textures/texture_halftone_01_compressed.jpg',
  },
  {
    id: 'recycled-card',
    name: 'Recycled Card',
    description: 'Paper texture overlay',
    lightPath: '/assets/textures/texture_recycled-card_01_compressed.jpg',
    previewPath: '/assets/textures/texture_recycled-card_01_compressed.jpg',
  },
];

// ===========================================
// Illustration Assets
// ===========================================

export const ILLUSTRATION_ASSETS: IllustrationAsset[] = [
  {
    id: 'shape-1',
    name: 'Abstract Shape 1',
    description: 'Geometric form',
    path: '/assets/illustrations/shape-01.svg',
    category: 'geometric',
  },
  {
    id: 'shape-2',
    name: 'Abstract Shape 2',
    description: 'Organic form',
    path: '/assets/illustrations/shape-02.svg',
    category: 'organic',
  },
  {
    id: 'shape-3',
    name: 'Abstract Shape 3',
    description: 'Linear pattern',
    path: '/assets/illustrations/shape-03.svg',
    category: 'linear',
  },
];

// ===========================================
// Helper Functions
// ===========================================

/**
 * Get assets by type
 */
export function getAssetsByType(type: AssetType) {
  switch (type) {
    case 'logos':
      return { type: 'logos' as const, assets: LOGO_ASSETS };
    case 'fonts':
      return { type: 'fonts' as const, assets: FONT_ASSETS };
    case 'art-direction':
      return { type: 'art-direction' as const, assets: ART_DIRECTION_ASSETS };
    case 'textures':
      return { type: 'textures' as const, assets: TEXTURE_ASSETS };
    case 'illustrations':
      return { type: 'illustrations' as const, assets: ILLUSTRATION_ASSETS };
    default:
      return null;
  }
}

/**
 * Get asset type label for display
 */
export function getAssetTypeLabel(type: AssetType): string {
  switch (type) {
    case 'logos':
      return 'Logos';
    case 'fonts':
      return 'Typography';
    case 'art-direction':
      return 'Art Direction';
    case 'textures':
      return 'Textures';
    case 'illustrations':
      return 'Illustrations';
    default:
      return type;
  }
}

/**
 * Get the BrandHub page path for an asset type
 */
export function getAssetPagePath(type: AssetType): string {
  switch (type) {
    case 'logos':
      return '/brand-hub/logo';
    case 'fonts':
      return '/brand-hub/fonts';
    case 'art-direction':
    case 'textures':
    case 'illustrations':
      return '/brand-hub/art-direction';
    default:
      return '/brand-hub';
  }
}

/**
 * Color variant options for dropdowns
 */
export const COLOR_OPTIONS: { value: ColorVariant; label: string }[] = [
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'glass', label: 'Glass' },
  { value: 'charcoal', label: 'Charcoal' },
];

/**
 * Download format options
 */
export const FORMAT_OPTIONS: { value: 'svg' | 'png'; label: string }[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

