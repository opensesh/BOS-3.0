/**
 * Hook for managing Brain Brand Identity documents
 * 
 * Fetches from the new brain_brand_identity table which supports
 * both Markdown and PDF file types.
 */

import { useState, useEffect, useCallback } from 'react';
import type { BrainBrandIdentity } from '@/lib/supabase/types';

interface UseBrainBrandIdentityOptions {
  /** Brand ID to filter by (uses default if not provided) */
  brandId?: string;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseBrainBrandIdentityReturn {
  /** All brand identity documents */
  documents: BrainBrandIdentity[];
  /** Whether documents are loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Currently selected document */
  activeDocument: BrainBrandIdentity | null;
  /** Set the active document */
  setActiveDocument: (doc: BrainBrandIdentity | null) => void;
  /** Refetch documents from API */
  fetchDocuments: () => Promise<void>;
  /** Create a new document */
  createDocument: (
    title: string,
    content: string,
    fileType?: 'markdown' | 'pdf'
  ) => Promise<BrainBrandIdentity>;
  /** Update a document */
  updateDocument: (
    id: string,
    updates: Partial<BrainBrandIdentity>
  ) => Promise<BrainBrandIdentity>;
  /** Delete a document */
  deleteDocument: (id: string) => Promise<void>;
}

// Default brand ID - in production this would come from auth context
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

export function useBrainBrandIdentity(
  options: UseBrainBrandIdentityOptions = {}
): UseBrainBrandIdentityReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  const [documents, setDocuments] = useState<BrainBrandIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<BrainBrandIdentity | null>(null);

  // Fetch all documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brain/brand-identity?brandId=${brandId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch brand identity documents');
      }

      const data = await response.json();
      setDocuments(data);

      // Update active document if it exists
      if (activeDocument) {
        const updated = data.find((d: BrainBrandIdentity) => d.id === activeDocument.id);
        if (updated) {
          setActiveDocument(updated);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching brand identity documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandId, activeDocument]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
  }, [autoFetch, fetchDocuments]);

  // Create a new document
  const createDocument = useCallback(
    async (
      title: string,
      content: string,
      fileType: 'markdown' | 'pdf' = 'markdown'
    ): Promise<BrainBrandIdentity> => {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const response = await fetch('/api/brain/brand-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          slug,
          title,
          content,
          fileType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const newDoc = await response.json();
      setDocuments((prev) => [...prev, newDoc]);
      return newDoc;
    },
    [brandId]
  );

  // Update a document
  const updateDocument = useCallback(
    async (
      id: string,
      updates: Partial<BrainBrandIdentity>
    ): Promise<BrainBrandIdentity> => {
      const response = await fetch('/api/brain/brand-identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      const updatedDoc = await response.json();
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? updatedDoc : d))
      );

      if (activeDocument?.id === id) {
        setActiveDocument(updatedDoc);
      }

      return updatedDoc;
    },
    [activeDocument]
  );

  // Delete a document
  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/brain/brand-identity?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    setDocuments((prev) => prev.filter((d) => d.id !== id));

    if (activeDocument?.id === id) {
      setActiveDocument(null);
    }
  }, [activeDocument]);

  return {
    documents,
    isLoading,
    error,
    activeDocument,
    setActiveDocument,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}

export default useBrainBrandIdentity;
