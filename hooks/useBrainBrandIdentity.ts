/**
 * Hook for managing Brain Brand Identity documents
 * 
 * Fetches from the new brain_brand_identity table which supports
 * both Markdown and PDF file types. Automatically seeds data from
 * .claude/ directory if Supabase is empty.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BrainBrandIdentity } from '@/lib/supabase/types';

interface UseBrainBrandIdentityOptions {
  /** Brand ID to filter by (uses default if not provided) */
  brandId?: string;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
  /** Whether to auto-seed if no documents exist */
  autoSeed?: boolean;
}

interface UseBrainBrandIdentityReturn {
  /** All brand identity documents */
  documents: BrainBrandIdentity[];
  /** Whether documents are loading */
  isLoading: boolean;
  /** Whether we're currently seeding data */
  isSeeding: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Currently selected document */
  activeDocument: BrainBrandIdentity | null;
  /** Set the active document */
  setActiveDocument: (doc: BrainBrandIdentity | null) => void;
  /** Refetch documents from API */
  fetchDocuments: () => Promise<void>;
  /** Manually trigger seed operation */
  seedDocuments: () => Promise<boolean>;
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
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true, autoSeed = true } = options;

  const [documents, setDocuments] = useState<BrainBrandIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<BrainBrandIdentity | null>(null);
  
  // Track if we've already attempted to seed to avoid loops
  const hasAttemptedSeed = useRef(false);

  // Seed documents from .claude/ directory
  const seedDocuments = useCallback(async (): Promise<boolean> => {
    setIsSeeding(true);
    setError(null);

    try {
      const response = await fetch(`/api/brain/seed?brandId=${brandId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to seed documents');
      }

      const result = await response.json();
      return result.success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to seed documents';
      console.error('Error seeding documents:', err);
      setError(message);
      return false;
    } finally {
      setIsSeeding(false);
    }
  }, [brandId]);

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
      
      // If no documents and auto-seed is enabled, seed from .claude/
      if (data.length === 0 && autoSeed && !hasAttemptedSeed.current) {
        hasAttemptedSeed.current = true;
        console.log('[useBrainBrandIdentity] No documents found, seeding from .claude/...');
        const seedSuccess = await seedDocuments();
        
        if (seedSuccess) {
          // Refetch after seeding
          const refetchResponse = await fetch(`/api/brain/brand-identity?brandId=${brandId}`);
          if (refetchResponse.ok) {
            const refetchedData = await refetchResponse.json();
            setDocuments(refetchedData);
            
            // Set first document as active
            if (refetchedData.length > 0) {
              setActiveDocument(refetchedData[0]);
            }
            return;
          }
        }
      }
      
      setDocuments(data);

      // Set first document as active if none selected and we have data
      if (data.length > 0) {
        setActiveDocument((prev: BrainBrandIdentity | null) => {
          // If we have a previous selection, try to keep it
          if (prev) {
            const stillExists = data.find((d: BrainBrandIdentity) => d.id === prev.id);
            return stillExists || data[0];
          }
          return data[0];
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching brand identity documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandId, autoSeed, seedDocuments]);

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
    isSeeding,
    error,
    activeDocument,
    setActiveDocument,
    fetchDocuments,
    seedDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}

export default useBrainBrandIdentity;
