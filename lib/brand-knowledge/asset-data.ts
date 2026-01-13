/**
 * Asset Data for Chat Carousels
 *
 * Centralized metadata for logos, fonts, art direction, textures, and illustrations.
 * Used by the AssetCarousel component to render downloadable assets in chat.
 */

// ===========================================
// Supabase Storage URL Helpers
// ===========================================

function getStorageUrl(category: string, filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/brand-assets/open-session/${category}/${filename}`;
}

const logo = (filename: string) => getStorageUrl('logos', filename);
const image = (filename: string) => getStorageUrl('images', filename);
const texture = (filename: string) => getStorageUrl('textures', filename);
const font = (filename: string) => getStorageUrl('fonts', filename);
const illustration = (filename: string) => getStorageUrl('illustrations', filename);

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
    vanillaPath: logo('brandmark-vanilla.svg'),
    glassPath: logo('brandmark-glass.svg'),
    charcoalPath: logo('brandmark-charcoal.svg'),
    category: 'primary',
  },
  {
    id: 'combo',
    name: 'Combo',
    description: 'Brandmark + wordmark together',
    vanillaPath: logo('logo_main_combo_vanilla.svg'),
    glassPath: logo('logo_main_combo_glass.svg'),
    charcoalPath: logo('logo_main_combo_charcoal.svg'),
    category: 'primary',
  },
  {
    id: 'stacked',
    name: 'Stacked',
    description: 'Wordmark stacked vertically',
    vanillaPath: logo('stacked-vanilla.svg'),
    glassPath: logo('stacked-glass.svg'),
    charcoalPath: logo('stacked-charcoal.svg'),
    category: 'primary',
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Wordmark in horizontal layout',
    vanillaPath: logo('horizontal-vanilla.svg'),
    glassPath: logo('horizontal-glass.svg'),
    charcoalPath: logo('horizontal-charcoal.svg'),
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
    desktopPath: font('NeueHaasGroteskDisplay-Pro.zip'),
    webPath: font('NeueHaasDisplay.woff2'),
  },
  {
    id: 'neue-haas-text',
    name: 'Neue Haas Text',
    description: 'Body copy and UI text',
    family: 'Neue Haas Grotesk Text Pro',
    weights: ['Roman', 'Medium'],
    specimen: 'The quick brown fox jumps over the lazy dog.',
    desktopPath: font('NeueHaasGroteskText-Pro.zip'),
    webPath: font('NeueHaasText.woff2'),
  },
  {
    id: 'offbit',
    name: 'OffBit',
    description: 'Accent font for digital displays',
    family: 'OffBit',
    weights: ['Regular', 'Bold'],
    specimen: 'Born to Create, Made to Make',
    desktopPath: font('OffBit.zip'),
    webPath: font('OffBit-Regular.woff2'),
  },
];

// ===========================================
// Art Direction Assets (subset for carousel)
// ===========================================

export const ART_DIRECTION_ASSETS: ArtDirectionAsset[] = [
  // Auto - 2 representative images
  { id: 'auto-1', name: 'Audi Quattro Urban', category: 'auto', src: image('auto-audi-quattro-urban-portrait.png') },
  { id: 'auto-2', name: 'Desert Porsche Sunset', category: 'auto', src: image('auto-desert-porsche-sunset-drift.png') },
  // Lifestyle - 2 representative images
  { id: 'lifestyle-1', name: 'Confident Street Style', category: 'lifestyle', src: image('lifestyle-confident-street-style.png') },
  { id: 'lifestyle-2', name: 'Editorial Look Urban', category: 'lifestyle', src: image('lifestyle-editorial-look-urban.png') },
  // Move - 2 representative images
  { id: 'move-1', name: 'Athletic Motion Energy', category: 'move', src: image('move-athletic-motion-energy.png') },
  { id: 'move-2', name: 'Abstract Dance Flow', category: 'move', src: image('move-abstract-dance-flow.png') },
  // Escape - 2 representative images
  { id: 'escape-1', name: 'Cliffside Workspace', category: 'escape', src: image('escape-cliffside-workspace-ocean-view.png') },
  { id: 'escape-2', name: 'Desert Wanderer', category: 'escape', src: image('escape-desert-silhouette-wanderer.png') },
  // Work - 2 representative images
  { id: 'work-1', name: 'Professional Collaboration', category: 'work', src: image('work-professional-collaboration.png') },
  { id: 'work-2', name: 'Modern Workspace', category: 'work', src: image('work-office-workspace-modern.png') },
  // Feel - 2 representative images
  { id: 'feel-1', name: 'Ethereal Portrait', category: 'feel', src: image('feel-ethereal-portrait-softness.png') },
  { id: 'feel-2', name: 'Flowing Fabric Grace', category: 'feel', src: image('feel-flowing-fabric-grace.png') },
];

// ===========================================
// Texture Assets
// ===========================================

export const TEXTURE_ASSETS: TextureAsset[] = [
  {
    id: 'ascii',
    name: 'ASCII',
    description: 'Digital text pattern overlay',
    lightPath: texture('texture_ascii_01_white_compressed.jpg'),
    darkPath: texture('texture_ascii_01_black_compressed.jpg'),
    previewPath: texture('texture_ascii_01_white_compressed.jpg'),
  },
  {
    id: 'halftone',
    name: 'Halftone',
    description: 'Print-inspired dot pattern',
    lightPath: texture('texture_halftone_01_compressed.jpg'),
    previewPath: texture('texture_halftone_01_compressed.jpg'),
  },
  {
    id: 'recycled-card',
    name: 'Recycled Card',
    description: 'Paper texture overlay',
    lightPath: texture('texture_recycled-card_01_compressed.jpg'),
    previewPath: texture('texture_recycled-card_01_compressed.jpg'),
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
    path: illustration('shape-01.svg'),
    category: 'geometric',
  },
  {
    id: 'shape-2',
    name: 'Abstract Shape 2',
    description: 'Organic form',
    path: illustration('shape-02.svg'),
    category: 'organic',
  },
  {
    id: 'shape-3',
    name: 'Abstract Shape 3',
    description: 'Linear pattern',
    path: illustration('shape-03.svg'),
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

