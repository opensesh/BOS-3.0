/**
 * Hook for managing Brain Skills
 *
 * Fetches from the brain_skills table which supports
 * nested skill structures (folders with SKILL.md files).
 *
 * This hook provides a simplified interface that matches
 * what the skills page expects:
 * - documents: flat list of skill files for tab selection
 * - activeDocument: the currently selected skill file
 * - CRUD operations that work on skill files
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrainSkill } from '@/lib/supabase/types';

// Interface that matches useBrainDocuments for easy page migration
interface SkillDocument {
  id: string;
  slug: string;
  title: string;
  content: string;
  skillSlug: string;
  filePath?: string;
  fileHash?: string;
}

interface UseBrainSkillsOptions {
  brandId?: string;
  autoFetch?: boolean;
}

interface UseBrainSkillsReturn {
  // Document state (matches useBrainDocuments interface)
  documents: SkillDocument[];
  isLoading: boolean;
  error: string | null;

  // Active document
  activeDocument: SkillDocument | null;
  setActiveDocument: (doc: SkillDocument | null) => void;

  // CRUD operations
  fetchDocuments: () => Promise<void>;
  createDocument: (title: string, content: string) => Promise<SkillDocument>;
  updateDocument: (id: string, content: string, changeSummary?: string) => Promise<SkillDocument>;
  deleteDocument: (id: string) => Promise<void>;

  // Version operations (stubbed for compatibility)
  versions: never[];
  isLoadingVersions: boolean;
  fetchVersionHistory: (documentId: string) => Promise<void>;
  restoreVersion: (documentId: string, versionNumber: number) => Promise<void>;

  // Utility
  getDocumentBySlug: (slug: string) => SkillDocument | undefined;
  refreshDocument: (id: string) => Promise<void>;
}

// Default brand ID - in production this would come from auth context
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Convert BrainSkill to SkillDocument for UI compatibility
 */
function skillToDocument(skill: BrainSkill): SkillDocument {
  return {
    id: skill.id,
    slug: skill.skillSlug || skill.slug,
    title: skill.title,
    content: skill.content || '',
    skillSlug: skill.skillSlug || '',
    filePath: skill.filePath,
    fileHash: skill.fileHash,
  };
}

export function useBrainSkills(
  options: UseBrainSkillsOptions = {}
): UseBrainSkillsReturn {
  const { brandId = DEFAULT_BRAND_ID, autoFetch = true } = options;

  // State
  const [skills, setSkills] = useState<BrainSkill[]>([]);
  const [documents, setDocuments] = useState<SkillDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<SkillDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all skills and their main files
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all root-level skills
      const response = await fetch(`/api/brain/skills?brandId=${brandId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }

      const rootSkills: BrainSkill[] = await response.json();
      setSkills(rootSkills);

      // For each root skill, fetch its files and get the main one (usually SKILL.md)
      const skillDocs: SkillDocument[] = [];

      for (const skill of rootSkills) {
        // Fetch skill items (files inside this skill folder)
        const itemsResponse = await fetch(
          `/api/brain/skills?brandId=${brandId}&skillSlug=${skill.slug}`
        );

        if (itemsResponse.ok) {
          const items: BrainSkill[] = await itemsResponse.json();
          // Find the main file (SKILL.md or first file)
          const mainFile = items.find(
            (item) => item.itemType === 'file' && item.slug.toLowerCase().includes('skill')
          ) || items.find((item) => item.itemType === 'file');

          if (mainFile) {
            skillDocs.push({
              id: mainFile.id,
              slug: skill.slug, // Use parent skill slug for tabs
              title: skill.title,
              content: mainFile.content || '',
              skillSlug: skill.slug,
              filePath: mainFile.filePath,
              fileHash: mainFile.fileHash,
            });
          } else {
            // If no file exists, still show the skill folder
            skillDocs.push({
              id: skill.id,
              slug: skill.slug,
              title: skill.title,
              content: '',
              skillSlug: skill.slug,
            });
          }
        }
      }

      setDocuments(skillDocs);

      // Update active document if it exists
      if (activeDocument) {
        const updated = skillDocs.find((d) => d.slug === activeDocument.slug);
        if (updated) {
          setActiveDocument(updated);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching skills:', err);
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

  // Create a new skill
  const createDocument = useCallback(
    async (title: string, content: string): Promise<SkillDocument> => {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create root skill folder
      const folderResponse = await fetch('/api/brain/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          slug,
          title,
          isRootSkill: true,
        }),
      });

      if (!folderResponse.ok) {
        throw new Error('Failed to create skill folder');
      }

      const folder: BrainSkill = await folderResponse.json();

      // Create SKILL.md file inside
      const fileResponse = await fetch('/api/brain/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          parentId: folder.id,
          slug: 'SKILL.md',
          title: 'SKILL.md',
          itemType: 'file',
          content,
          skillSlug: slug,
          pathSegments: ['SKILL.md'],
        }),
      });

      if (!fileResponse.ok) {
        throw new Error('Failed to create skill file');
      }

      const file: BrainSkill = await fileResponse.json();

      const newDoc: SkillDocument = {
        id: file.id,
        slug,
        title,
        content,
        skillSlug: slug,
      };

      setDocuments((prev) => [...prev, newDoc]);
      return newDoc;
    },
    [brandId]
  );

  // Update a skill's content
  const updateDocument = useCallback(
    async (id: string, content: string): Promise<SkillDocument> => {
      const response = await fetch('/api/brain/skills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update skill');
      }

      const updated: BrainSkill = await response.json();
      const doc = skillToDocument(updated);

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, content } : d))
      );

      if (activeDocument?.id === id) {
        setActiveDocument({ ...activeDocument, content });
      }

      return doc;
    },
    [activeDocument]
  );

  // Delete a skill
  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(`/api/brain/skills?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
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
    (slug: string): SkillDocument | undefined => {
      return documents.find((d) => d.slug === slug);
    },
    [documents]
  );

  // Refresh single document
  const refreshDocument = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(`/api/brain/skills?id=${id}`);
      if (!response.ok) return;

      const updated: BrainSkill = await response.json();
      const doc = skillToDocument(updated);

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? doc : d))
      );

      if (activeDocument?.id === id) {
        setActiveDocument(doc);
      }
    },
    [activeDocument]
  );

  // Stub version operations for compatibility
  const fetchVersionHistory = useCallback(async (): Promise<void> => {
    // Version history not yet implemented for skills
  }, []);

  const restoreVersion = useCallback(async (): Promise<void> => {
    // Version history not yet implemented for skills
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

export default useBrainSkills;
