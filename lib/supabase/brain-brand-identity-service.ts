/**
 * Supabase service for Brain Brand Identity documents
 * 
 * Handles CRUD operations for brand identity documents (MD + PDF)
 * with support for Supabase Storage for PDF files.
 */

import { createClient } from './client';
import type {
  DbBrainBrandIdentity,
  BrainBrandIdentity,
  BrainBrandIdentityInsert,
  BrainBrandIdentityUpdate,
  SyncStatus,
  SyncDirection,
  SyncTrigger,
} from './types';
import { dbBrainBrandIdentityToApp } from './types';

const supabase = createClient();

const STORAGE_BUCKET = 'brain-files';

// ============================================
// DOCUMENT CRUD OPERATIONS
// ============================================

/**
 * Get all brand identity documents for a brand
 */
export async function getBrandIdentityDocs(
  brandId: string,
  includeInactive = false
): Promise<BrainBrandIdentity[]> {
  let query = supabase
    .from('brain_brand_identity')
    .select('*')
    .eq('brand_id', brandId)
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching brand identity docs:', error);
    throw error;
  }

  // Get public URLs for PDFs
  return await Promise.all(
    (data as DbBrainBrandIdentity[]).map(async (doc) => {
      let publicUrl: string | undefined;
      if (doc.file_type === 'pdf' && doc.storage_path) {
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(doc.storage_path);
        publicUrl = urlData.publicUrl;
      }
      return dbBrainBrandIdentityToApp(doc, publicUrl);
    })
  );
}

/**
 * Get a single brand identity document by ID
 */
export async function getBrandIdentityDocById(
  id: string
): Promise<BrainBrandIdentity | null> {
  const { data, error } = await supabase
    .from('brain_brand_identity')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching brand identity doc:', error);
    throw error;
  }

  const doc = data as DbBrainBrandIdentity;
  let publicUrl: string | undefined;
  if (doc.file_type === 'pdf' && doc.storage_path) {
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(doc.storage_path);
    publicUrl = urlData.publicUrl;
  }

  return dbBrainBrandIdentityToApp(doc, publicUrl);
}

/**
 * Get a brand identity document by slug
 */
export async function getBrandIdentityDocBySlug(
  brandId: string,
  slug: string
): Promise<BrainBrandIdentity | null> {
  const { data, error } = await supabase
    .from('brain_brand_identity')
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching brand identity doc by slug:', error);
    throw error;
  }

  const doc = data as DbBrainBrandIdentity;
  let publicUrl: string | undefined;
  if (doc.file_type === 'pdf' && doc.storage_path) {
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(doc.storage_path);
    publicUrl = urlData.publicUrl;
  }

  return dbBrainBrandIdentityToApp(doc, publicUrl);
}

/**
 * Create a new brand identity document
 */
export async function createBrandIdentityDoc(
  doc: BrainBrandIdentityInsert
): Promise<BrainBrandIdentity> {
  const { data, error } = await supabase
    .from('brain_brand_identity')
    .insert(doc)
    .select()
    .single();

  if (error) {
    console.error('Error creating brand identity doc:', error);
    throw error;
  }

  return dbBrainBrandIdentityToApp(data as DbBrainBrandIdentity);
}

/**
 * Update a brand identity document
 */
export async function updateBrandIdentityDoc(
  id: string,
  updates: BrainBrandIdentityUpdate
): Promise<BrainBrandIdentity> {
  const { data, error } = await supabase
    .from('brain_brand_identity')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating brand identity doc:', error);
    throw error;
  }

  const doc = data as DbBrainBrandIdentity;
  let publicUrl: string | undefined;
  if (doc.file_type === 'pdf' && doc.storage_path) {
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(doc.storage_path);
    publicUrl = urlData.publicUrl;
  }

  return dbBrainBrandIdentityToApp(doc, publicUrl);
}

/**
 * Delete a brand identity document (soft delete by setting is_active = false)
 */
export async function deleteBrandIdentityDoc(id: string): Promise<void> {
  const { error } = await supabase
    .from('brain_brand_identity')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting brand identity doc:', error);
    throw error;
  }
}

/**
 * Hard delete a brand identity document and its storage file
 */
export async function hardDeleteBrandIdentityDoc(id: string): Promise<void> {
  // Get the document first to check for storage path
  const doc = await getBrandIdentityDocById(id);
  if (!doc) return;

  // Delete from storage if it's a PDF
  if (doc.fileType === 'pdf' && doc.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([doc.storagePath]);

    if (storageError) {
      console.error('Error deleting storage file:', storageError);
    }
  }

  // Delete the database record
  const { error } = await supabase
    .from('brain_brand_identity')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting brand identity doc:', error);
    throw error;
  }
}

// ============================================
// PDF UPLOAD OPERATIONS
// ============================================

/**
 * Upload a PDF file for a brand identity document
 */
export async function uploadBrandIdentityPdf(
  brandId: string,
  file: File,
  slug: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const fileExt = file.name.split('.').pop();
  const storagePath = `${brandId}/brand-identity/${slug}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading PDF:', uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Create a brand identity PDF document with file upload
 */
export async function createBrandIdentityPdfDoc(
  brandId: string,
  file: File,
  title: string,
  slug: string
): Promise<BrainBrandIdentity> {
  // Upload the file first
  const { storagePath, publicUrl } = await uploadBrandIdentityPdf(
    brandId,
    file,
    slug
  );

  // Create the database record
  const doc = await createBrandIdentityDoc({
    brand_id: brandId,
    slug,
    title,
    file_type: 'pdf',
    storage_path: storagePath,
    file_size: file.size,
    mime_type: file.type,
  });

  return { ...doc, publicUrl };
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Update sync metadata for a brand identity document
 */
export async function updateBrandIdentityDocSync(
  id: string,
  updates: {
    file_hash?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_direction?: SyncDirection;
  }
): Promise<BrainBrandIdentity | null> {
  const { data, error } = await supabase
    .from('brain_brand_identity')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating brand identity sync:', error);
    throw error;
  }

  return data ? dbBrainBrandIdentityToApp(data as DbBrainBrandIdentity) : null;
}

/**
 * Get all syncable brand identity documents
 */
export async function getSyncableBrandIdentityDocs(
  brandId: string
): Promise<BrainBrandIdentity[]> {
  const { data, error } = await supabase
    .from('brain_brand_identity')
    .select('*')
    .eq('brand_id', brandId)
    .not('file_path', 'is', null)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching syncable brand identity docs:', error);
    throw error;
  }

  return (data as DbBrainBrandIdentity[]).map((doc) =>
    dbBrainBrandIdentityToApp(doc)
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a slug from a title
 */
export function generateBrandIdentitySlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if a slug is available
 */
export async function isBrandIdentitySlugAvailable(
  brandId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('brain_brand_identity')
    .select('id')
    .eq('brand_id', brandId)
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking slug availability:', error);
    throw error;
  }

  return data === null;
}
