/**
 * Supabase service for brand document management with version control
 * 
 * Handles CRUD operations for brand documents (brand-identity, writing-styles, skills)
 * with full version history tracking.
 */

import { createClient } from './client';
import { triggerEmbeddingProcessor } from './embedding-trigger';
import type {
  DbBrandDocument,
  DbBrandDocumentVersion,
  BrandDocument,
  BrandDocumentVersion,
  BrandDocumentInsert,
  BrandDocumentUpdate,
  BrandDocumentVersionInsert,
  BrandDocumentCategory,
} from './types';
import { dbBrandDocumentToApp, dbBrandDocumentVersionToApp } from './types';

const supabase = createClient();

// ============================================
// DOCUMENT CRUD OPERATIONS
// ============================================

/**
 * Get all documents for a category
 */
export async function getDocumentsByCategory(
  category: BrandDocumentCategory,
  includeDeleted = false
): Promise<BrandDocument[]> {
  let query = supabase
    .from('brand_documents')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return (data as DbBrandDocument[]).map(dbBrandDocumentToApp);
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(id: string): Promise<BrandDocument | null> {
  const { data, error } = await supabase
    .from('brand_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching document:', error);
    throw error;
  }

  return dbBrandDocumentToApp(data as DbBrandDocument);
}

/**
 * Get a document by category and slug
 */
export async function getDocumentBySlug(
  category: BrandDocumentCategory,
  slug: string
): Promise<BrandDocument | null> {
  const { data, error } = await supabase
    .from('brand_documents')
    .select('*')
    .eq('category', category)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching document by slug:', error);
    throw error;
  }

  return dbBrandDocumentToApp(data as DbBrandDocument);
}

/**
 * Create a new document
 */
export async function createDocument(
  document: BrandDocumentInsert,
  createInitialVersion = true
): Promise<BrandDocument> {
  const { data, error } = await supabase
    .from('brand_documents')
    .insert(document)
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }

  const newDoc = dbBrandDocumentToApp(data as DbBrandDocument);

  // Create initial version if content is provided
  if (createInitialVersion && document.content) {
    await createVersion({
      document_id: newDoc.id,
      version_number: 1,
      content: document.content,
      change_summary: 'Initial version',
    });
  }

  // Trigger embedding processor (fire and forget)
  triggerEmbeddingProcessor();

  return newDoc;
}

/**
 * Update a document (creates a new version)
 */
export async function updateDocument(
  id: string,
  updates: BrandDocumentUpdate,
  changeSummary?: string,
  createdBy?: string
): Promise<BrandDocument> {
  // Get current document to check content change
  const currentDoc = await getDocumentById(id);
  if (!currentDoc) {
    throw new Error('Document not found');
  }

  // Update the document
  const { data, error } = await supabase
    .from('brand_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating document:', error);
    throw error;
  }

  const updatedDoc = dbBrandDocumentToApp(data as DbBrandDocument);

  // Create new version if content changed
  if (updates.content && updates.content !== currentDoc.content) {
    const nextVersion = await getNextVersionNumber(id);
    await createVersion({
      document_id: id,
      version_number: nextVersion,
      content: updates.content,
      change_summary: changeSummary,
      created_by: createdBy,
    });
    
    // Trigger embedding processor (fire and forget)
    triggerEmbeddingProcessor();
  }

  return updatedDoc;
}

/**
 * Soft delete a document
 */
export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('brand_documents')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted document
 */
export async function restoreDocument(id: string): Promise<BrandDocument> {
  const { data, error } = await supabase
    .from('brand_documents')
    .update({ is_deleted: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error restoring document:', error);
    throw error;
  }

  return dbBrandDocumentToApp(data as DbBrandDocument);
}

/**
 * Permanently delete a document and all its versions
 */
export async function hardDeleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('brand_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting document:', error);
    throw error;
  }
}

// ============================================
// VERSION OPERATIONS
// ============================================

/**
 * Get the next version number for a document
 */
async function getNextVersionNumber(documentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('brand_document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return 1; // No versions yet
    }
    console.error('Error getting next version number:', error);
    throw error;
  }

  return (data?.version_number || 0) + 1;
}

/**
 * Create a new version
 */
export async function createVersion(
  version: BrandDocumentVersionInsert
): Promise<BrandDocumentVersion> {
  const { data, error } = await supabase
    .from('brand_document_versions')
    .insert(version)
    .select()
    .single();

  if (error) {
    console.error('Error creating version:', error);
    throw error;
  }

  return dbBrandDocumentVersionToApp(data as DbBrandDocumentVersion);
}

/**
 * Get all versions for a document
 */
export async function getVersionHistory(
  documentId: string
): Promise<BrandDocumentVersion[]> {
  const { data, error } = await supabase
    .from('brand_document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching version history:', error);
    throw error;
  }

  return (data as DbBrandDocumentVersion[]).map(dbBrandDocumentVersionToApp);
}

/**
 * Get a specific version
 */
export async function getVersion(
  documentId: string,
  versionNumber: number
): Promise<BrandDocumentVersion | null> {
  const { data, error } = await supabase
    .from('brand_document_versions')
    .select('*')
    .eq('document_id', documentId)
    .eq('version_number', versionNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching version:', error);
    throw error;
  }

  return dbBrandDocumentVersionToApp(data as DbBrandDocumentVersion);
}

/**
 * Restore a document to a specific version
 */
export async function restoreToVersion(
  documentId: string,
  versionNumber: number,
  createdBy?: string
): Promise<BrandDocument> {
  // Get the version to restore
  const version = await getVersion(documentId, versionNumber);
  if (!version) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  // Update document with version content (this will create a new version)
  return updateDocument(
    documentId,
    { content: version.content },
    `Restored to version ${versionNumber}`,
    createdBy
  );
}

/**
 * Get the latest version for a document
 */
export async function getLatestVersion(
  documentId: string
): Promise<BrandDocumentVersion | null> {
  const { data, error } = await supabase
    .from('brand_document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching latest version:', error);
    throw error;
  }

  return dbBrandDocumentVersionToApp(data as DbBrandDocumentVersion);
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Get all documents across all categories
 */
export async function getAllDocuments(
  includeDeleted = false
): Promise<BrandDocument[]> {
  let query = supabase
    .from('brand_documents')
    .select('*')
    .order('category')
    .order('sort_order', { ascending: true });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all documents:', error);
    throw error;
  }

  return (data as DbBrandDocument[]).map(dbBrandDocumentToApp);
}

/**
 * Seed a document with content (for initial data migration)
 * Only updates if content is currently empty
 */
export async function seedDocumentContent(
  category: BrandDocumentCategory,
  slug: string,
  content: string
): Promise<BrandDocument | null> {
  // Get existing document
  const doc = await getDocumentBySlug(category, slug);
  if (!doc) {
    console.warn(`Document not found for seeding: ${category}/${slug}`);
    return null;
  }

  // Only seed if content is empty
  if (doc.content && doc.content.trim() !== '') {
    return doc;
  }

  // Update with seeded content
  return updateDocument(
    doc.id,
    { content },
    'Seeded from markdown file',
    'system'
  );
}

/**
 * Check if documents need to be seeded
 */
export async function needsSeeding(): Promise<boolean> {
  const docs = await getAllDocuments();
  return docs.some(doc => !doc.content || doc.content.trim() === '');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if a slug is available within a category
 */
export async function isSlugAvailable(
  category: BrandDocumentCategory,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('brand_documents')
    .select('id')
    .eq('category', category)
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

