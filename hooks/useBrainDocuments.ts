'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandDocument, BrandDocumentCategory, BrandDocumentVersion } from '@/lib/supabase/types';

interface UseBrainDocumentsOptions {
  category?: BrandDocumentCategory;
  autoFetch?: boolean;
}

interface UseBrainDocumentsReturn {
  // Document state
  documents: BrandDocument[];
  isLoading: boolean;
  error: string | null;
  
  // Active document
  activeDocument: BrandDocument | null;
  setActiveDocument: (doc: BrandDocument | null) => void;
  
  // CRUD operations
  fetchDocuments: () => Promise<void>;
  createDocument: (title: string, content: string, icon?: string) => Promise<BrandDocument>;
  updateDocument: (id: string, content: string, changeSummary?: string) => Promise<BrandDocument>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Version operations
  versions: BrandDocumentVersion[];
  isLoadingVersions: boolean;
  fetchVersionHistory: (documentId: string) => Promise<void>;
  restoreVersion: (documentId: string, versionNumber: number) => Promise<void>;
  
  // Utility
  getDocumentBySlug: (slug: string) => BrandDocument | undefined;
  refreshDocument: (id: string) => Promise<void>;
}

export function useBrainDocuments(options: UseBrainDocumentsOptions = {}): UseBrainDocumentsReturn {
  const { category, autoFetch = true } = options;

  // Document state
  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Active document
  const [activeDocument, setActiveDocument] = useState<BrandDocument | null>(null);
  
  // Version state
  const [versions, setVersions] = useState<BrandDocumentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = category 
        ? `/api/brain/documents?category=${category}`
        : '/api/brain/documents';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data);
      
      // Update active document if it exists in the new data
      if (activeDocument) {
        const updated = data.find((d: BrandDocument) => d.id === activeDocument.id);
        if (updated) {
          setActiveDocument(updated);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [category, activeDocument]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
  }, [autoFetch, category]);

  // Create document
  const createDocument = useCallback(async (
    title: string,
    content: string,
    icon?: string
  ): Promise<BrandDocument> => {
    if (!category) {
      throw new Error('Category is required to create a document');
    }

    const response = await fetch('/api/brain/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        title,
        content,
        icon,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create document');
    }

    const newDoc = await response.json();
    setDocuments(prev => [...prev, newDoc]);
    return newDoc;
  }, [category]);

  // Update document
  const updateDocument = useCallback(async (
    id: string,
    content: string,
    changeSummary?: string
  ): Promise<BrandDocument> => {
    const response = await fetch('/api/brain/documents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        content,
        changeSummary,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update document');
    }

    const updatedDoc = await response.json();
    setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
    
    if (activeDocument?.id === id) {
      setActiveDocument(updatedDoc);
    }

    return updatedDoc;
  }, [activeDocument]);

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/brain/documents?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete document');
    }

    setDocuments(prev => prev.filter(d => d.id !== id));
    
    if (activeDocument?.id === id) {
      setActiveDocument(null);
    }
  }, [activeDocument]);

  // Fetch version history
  const fetchVersionHistory = useCallback(async (documentId: string): Promise<void> => {
    setIsLoadingVersions(true);

    try {
      const response = await fetch(`/api/brain/versions?documentId=${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }
      
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
      setVersions([]);
    } finally {
      setIsLoadingVersions(false);
    }
  }, []);

  // Restore to version
  const restoreVersion = useCallback(async (
    documentId: string,
    versionNumber: number
  ): Promise<void> => {
    const response = await fetch('/api/brain/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        versionNumber,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to restore version');
    }

    const { document: updatedDoc } = await response.json();
    setDocuments(prev => prev.map(d => d.id === documentId ? updatedDoc : d));
    
    if (activeDocument?.id === documentId) {
      setActiveDocument(updatedDoc);
    }

    // Refresh version history
    await fetchVersionHistory(documentId);
  }, [activeDocument, fetchVersionHistory]);

  // Get document by slug
  const getDocumentBySlug = useCallback((slug: string): BrandDocument | undefined => {
    return documents.find(d => d.slug === slug);
  }, [documents]);

  // Refresh single document
  const refreshDocument = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/brain/documents?id=${id}`);
    if (!response.ok) {
      return;
    }

    const updatedDoc = await response.json();
    setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
    
    if (activeDocument?.id === id) {
      setActiveDocument(updatedDoc);
    }
  }, [activeDocument]);

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
    
    // Version operations
    versions,
    isLoadingVersions,
    fetchVersionHistory,
    restoreVersion,
    
    // Utility
    getDocumentBySlug,
    refreshDocument,
  };
}

export default useBrainDocuments;

