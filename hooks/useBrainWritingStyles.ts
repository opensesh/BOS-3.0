/**
 * Hook for managing Brain Writing Styles
 *
 * Fetches from the brain_writing_styles table.
 * Writing styles are flat documents (no nesting).
 *
 * This hook provides the same interface as useBrainDocuments
 * for easy page migration.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrainWritingStyle } from '@/lib/supabase/types';

// Interface that matches useBrainDocuments for easy page migration
interface StyleDocument {
  id: string;
  slug: string;
  title: string;
  content: string;
  filePath?: string;
  fileHash?: string;
}

interface UseBrainWritingStylesOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseBrainWritingStylesReturn {
  // Document state (matches useBrainDocuments interface)
  documents: StyleDocument[];
  isLoading: boolean;
  error: string | null;

  // Active document
  activeDocument: StyleDocument | null;
  setActiveDocument: (doc: StyleDocument | null) => void;

  // CRUD operations
  fetchDocuments: () => Promise<void>;
  createDocument: (title: string, content: string) => Promise<StyleDocument>;
  updateDocument: (id: string, content: string, changeSummary?: string) => Promise<StyleDocument>;
  deleteDocument: (id: string) => Promise<void>;

  // Version operations (stubbed for compatibility)
  versions: never[];
  isLoadingVersions: boolean;
  fetchVersionHistory: (documentId: string) => Promise<void>;
  restoreVersion: (documentId: string, versionNumber: number) => Promise<void>;

  // Utility
  getDocumentBySlug: (slug: string) => StyleDocument | undefined;
  refreshDocument: (id: string) => Promise<void>;
}

// Default brand ID - in production this would come from auth context
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Convert BrainWritingStyle to StyleDocument for UI compatibility
 */
function styleToDocument(style: BrainWritingStyle): StyleDocument {
  return {
    id: style.id,
    slug: style.slug,
    title: style.title,
    content: style.content || '',
    filePath: style.filePath,
    fileHash: style.fileHash,
  };
}

export function useBrainWritingStyles(
  options: UseBrainWritingStylesOptions = {}
): UseBrainWritingStylesReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  // State
  const [documents, setDocuments] = useState<StyleDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<StyleDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all writing styles
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brain/writing-styles?brandId=${brandId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch writing styles');
      }

      const styles: BrainWritingStyle[] = await response.json();
      const docs = styles.map(styleToDocument);
      setDocuments(docs);

      // Update active document if it exists
      if (activeDocument) {
        const updated = docs.find((d) => d.id === activeDocument.id);
        if (updated) {
          setActiveDocument(updated);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching writing styles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandId, activeDocument]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, brandId]);

  // Create a new writing style
  const createDocument = useCallback(
    async (title: string, content: string): Promise<StyleDocument> => {
      const response = await fetch('/api/brain/writing-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          title,
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create writing style');
      }

      const style: BrainWritingStyle = await response.json();
      const newDoc = styleToDocument(style);

      setDocuments((prev) => [...prev, newDoc]);
      return newDoc;
    },
    [brandId]
  );

  // Update a writing style
  const updateDocument = useCallback(
    async (id: string, content: string): Promise<StyleDocument> => {
      const response = await fetch('/api/brain/writing-styles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update writing style');
      }

      const style: BrainWritingStyle = await response.json();
      const updatedDoc = styleToDocument(style);

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

  // Delete a writing style
  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(`/api/brain/writing-styles?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete writing style');
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));

      if (activeDocument?.id === id) {
        setActiveDocument(null);
      }
    },
    [activeDocument]
  );

  // Get document by slug
  const getDocumentBySlug = useCallback(
    (slug: string): StyleDocument | undefined => {
      return documents.find((d) => d.slug === slug);
    },
    [documents]
  );

  // Refresh single document
  const refreshDocument = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(`/api/brain/writing-styles?id=${id}`);
      if (!response.ok) return;

      const style: BrainWritingStyle = await response.json();
      const updatedDoc = styleToDocument(style);

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? updatedDoc : d))
      );

      if (activeDocument?.id === id) {
        setActiveDocument(updatedDoc);
      }
    },
    [activeDocument]
  );

  // Stub version operations for compatibility
  const fetchVersionHistory = useCallback(async (): Promise<void> => {
    // Version history not yet implemented for writing styles
  }, []);

  const restoreVersion = useCallback(async (): Promise<void> => {
    // Version history not yet implemented for writing styles
  }, []);

  return {
    // Document state
    documents,
    isLoading,
    error,

    // Active document
    activeDocument,
    setActiveDocument,

    // CRUD operations
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,

    // Version operations (stubbed)
    versions: [],
    isLoadingVersions: false,
    fetchVersionHistory,
    restoreVersion,

    // Utility
    getDocumentBySlug,
    refreshDocument,
  };
}

export default useBrainWritingStyles;
