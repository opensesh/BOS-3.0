/**
 * Supabase service for brand font/typography management
 * 
 * Handles CRUD operations for brand fonts using the brand_assets table.
 * Fonts are stored with category='fonts' and typography metadata.
 */

import { createClient } from './client';
import type {
  DbBrandAsset,
  BrandAsset,
  BrandAssetInsert,
  BrandAssetUpdate,
  BrandFont,
  BrandFontMetadata,
  FontWeight,
  FontFormat,
} from './types';
import { dbBrandAssetToApp } from './types';

const supabase = createClient();

const BUCKET_NAME = 'brand-assets';
const CATEGORY = 'fonts';

// ============================================
// FONT CRUD OPERATIONS
// ============================================

/**
 * Get all fonts for a brand
 */
export async function getFontsByBrand(brandId: string): Promise<BrandFont[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .order('name');

  if (error) {
    console.error('Error fetching fonts:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandFont;
  });
}

/**
 * Get fonts by family name
 */
export async function getFontsByFamily(
  brandId: string,
  fontFamily: string
): Promise<BrandFont[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .contains('metadata', { fontFamily })
    .order('name');

  if (error) {
    console.error('Error fetching fonts by family:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandFont;
  });
}

/**
 * Get fonts by usage type (display, body, accent)
 */
export async function getFontsByUsage(
  brandId: string,
  usage: string
): Promise<BrandFont[]> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', CATEGORY)
    .contains('metadata', { usage })
    .order('name');

  if (error) {
    console.error('Error fetching fonts by usage:', error);
    throw error;
  }

  return (data as DbBrandAsset[]).map(asset => {
    const publicUrl = getPublicUrl(asset.storage_path);
    return dbBrandAssetToApp(asset, publicUrl) as BrandFont;
  });
}

/**
 * Get a single font by ID
 */
export async function getFontById(id: string): Promise<BrandFont | null> {
  const { data, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('id', id)
    .eq('category', CATEGORY)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching font:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandFont;
}

/**
 * Create a new font
 */
export async function createFont(
  brandId: string,
  name: string,
  filename: string,
  storagePath: string,
  metadata: BrandFontMetadata,
  options?: {
    description?: string;
    mimeType?: string;
    fileSize?: number;
  }
): Promise<BrandFont> {
  const insertData: BrandAssetInsert = {
    brand_id: brandId,
    name,
    filename,
    description: options?.description || `${name} font file`,
    category: CATEGORY,
    variant: metadata.fontWeight || undefined,
    storage_path: storagePath,
    mime_type: options?.mimeType,
    file_size: options?.fileSize,
    metadata: metadata as Record<string, unknown>,
  };

  const { data, error } = await supabase
    .from('brand_assets')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating font:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandFont;
}

/**
 * Update a font
 */
export async function updateFont(
  id: string,
  updates: BrandAssetUpdate & { metadata?: BrandFontMetadata }
): Promise<BrandFont> {
  const { data, error } = await supabase
    .from('brand_assets')
    .update(updates)
    .eq('id', id)
    .eq('category', CATEGORY)
    .select()
    .single();

  if (error) {
    console.error('Error updating font:', error);
    throw error;
  }

  const publicUrl = getPublicUrl(data.storage_path);
  return dbBrandAssetToApp(data as DbBrandAsset, publicUrl) as BrandFont;
}

/**
 * Delete a font
 */
export async function deleteFont(id: string): Promise<void> {
  // First get the font to find storage path
  const font = await getFontById(id);
  if (!font) {
    throw new Error('Font not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([font.storagePath]);

  if (storageError) {
    console.error('Error deleting font from storage:', storageError);
    // Continue to delete metadata even if storage delete fails
  }

  // Delete metadata
  const { error } = await supabase
    .from('brand_assets')
    .delete()
    .eq('id', id)
    .eq('category', CATEGORY);

  if (error) {
    console.error('Error deleting font:', error);
    throw error;
  }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Get public URL for a font
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Upload a font file and create metadata
 */
export async function uploadFont(
  brandId: string,
  brandSlug: string,
  file: File | Blob,
  name: string,
  metadata: BrandFontMetadata
): Promise<BrandFont> {
  const format = metadata.fontFormat || getFormatFromFile(file);
  const weight = metadata.fontWeight || '400';
  const style = metadata.fontStyle || 'normal';
  const filename = `${sanitizeFontFamily(metadata.fontFamily || name)}-${weight}-${style}.${format}`;
  const storagePath = `${brandSlug}/fonts/${filename}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading font file:', uploadError);
    throw uploadError;
  }

  // Create metadata record
  return createFont(brandId, name, filename, storagePath, {
    ...metadata,
    fontFormat: format as FontFormat,
  }, {
    mimeType: file.type || getMimeType(format),
    fileSize: file.size || undefined,
  });
}

/**
 * Get format from file
 */
function getFormatFromFile(file: File | Blob): FontFormat {
  if ('name' in file) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'woff2' || ext === 'woff' || ext === 'ttf' || ext === 'otf' || ext === 'eot') {
      return ext as FontFormat;
    }
  }
  // Default to woff2
  return 'woff2';
}

/**
 * Sanitize font family name for filename
 */
function sanitizeFontFamily(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Get MIME type for font format
 */
function getMimeType(format: FontFormat): string {
  const mimeTypes: Record<FontFormat, string> = {
    woff2: 'font/woff2',
    woff: 'font/woff',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
  };
  return mimeTypes[format];
}

// ============================================
// GROUPED FONT DATA FOR UI
// ============================================

/**
 * Typography section structure for the Fonts page UI
 */
export interface TypographySection {
  id: string;
  label: string;
  fontFamily: string;
  fontClass: string;
  usage: string;
  fonts: BrandFont[];
  styles: TypographyStyle[];
}

export interface TypographyStyle {
  name: string;
  value: string;
  fontSize: string;
  fontWeight: FontWeight;
  fontFamily: string;
  lineHeight: string;
}

/**
 * Get fonts grouped by usage for the Typography page UI
 */
export async function getFontsGroupedByUsage(brandId: string): Promise<{
  display: BrandFont[];
  body: BrandFont[];
  accent: BrandFont[];
}> {
  const fonts = await getFontsByBrand(brandId);

  const display: BrandFont[] = [];
  const body: BrandFont[] = [];
  const accent: BrandFont[] = [];

  fonts.forEach(font => {
    const meta = font.metadata as BrandFontMetadata;
    switch (meta.usage) {
      case 'display':
        display.push(font);
        break;
      case 'body':
        body.push(font);
        break;
      case 'accent':
        accent.push(font);
        break;
      default:
        body.push(font);
    }
  });

  return { display, body, accent };
}

/**
 * Get font families with all their weights
 */
export async function getFontFamilies(brandId: string): Promise<
  Map<string, BrandFont[]>
> {
  const fonts = await getFontsByBrand(brandId);
  const families = new Map<string, BrandFont[]>();

  fonts.forEach(font => {
    const meta = font.metadata as BrandFontMetadata;
    const family = meta.fontFamily || font.name;
    
    if (!families.has(family)) {
      families.set(family, []);
    }
    families.get(family)!.push(font);
  });

  return families;
}

