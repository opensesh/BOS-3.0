'use client';

import { createClient } from './client';
import type {
  DbArtifact,
  ArtifactInsert,
  ArtifactUpdate,
  Artifact,
  ArtifactType,
  ArtifactMetadata,
  dbArtifactToApp,
} from './types';

// Re-export types and converter
export { dbArtifactToApp } from './types';
export type { Artifact, ArtifactType, ArtifactMetadata };

// Track if tables are available
let tablesChecked = false;
let tablesAvailable = true;

/**
 * Check if artifacts table is available
 */
async function checkTablesAvailable(): Promise<boolean> {
  if (tablesChecked) return tablesAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase.from('artifacts').select('id').limit(1);

    tablesChecked = true;

    if (!error) {
      tablesAvailable = true;
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTableMissing =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorCode === '42P01' ||
      errorCode === 'PGRST116';

    tablesAvailable = false;

    if (isTableMissing) {
      console.info('Artifacts: Supabase artifacts table not available. Artifact storage disabled.');
    }

    return false;
  } catch {
    tablesChecked = true;
    tablesAvailable = false;
    return false;
  }
}

/**
 * Convert database artifact to app artifact
 */
function toAppArtifact(db: DbArtifact): Artifact {
  return {
    id: db.id,
    chatId: db.chat_id,
    messageId: db.message_id || undefined,
    type: db.artifact_type,
    title: db.title || undefined,
    content: db.content,
    language: db.language || undefined,
    version: db.version,
    storagePath: db.storage_path || undefined,
    metadata: db.metadata || {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Artifact Service
 * Handles creation, storage, and retrieval of generated artifacts
 */
export const artifactService = {
  /**
   * Create a new artifact
   */
  async createArtifact(artifact: ArtifactInsert): Promise<Artifact | null> {
    if (!(await checkTablesAvailable())) {
      console.warn('Artifact storage not available');
      return null;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('artifacts')
        .insert(artifact)
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating artifact:', error);
        return null;
      }

      return toAppArtifact(data);
    } catch (error) {
      console.error('Error in createArtifact:', error);
      return null;
    }
  },

  /**
   * Get artifact by ID
   */
  async getArtifact(id: string): Promise<Artifact | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching artifact:', error);
        return null;
      }

      return toAppArtifact(data);
    } catch (error) {
      console.error('Error in getArtifact:', error);
      return null;
    }
  },

  /**
   * Get all artifacts for a chat
   */
  async getArtifactsForChat(chatId: string): Promise<Artifact[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Error fetching artifacts for chat:', error);
        return [];
      }

      return data.map(toAppArtifact);
    } catch (error) {
      console.error('Error in getArtifactsForChat:', error);
      return [];
    }
  },

  /**
   * Get artifacts for a message
   */
  async getArtifactsForMessage(messageId: string): Promise<Artifact[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Error fetching artifacts for message:', error);
        return [];
      }

      return data.map(toAppArtifact);
    } catch (error) {
      console.error('Error in getArtifactsForMessage:', error);
      return [];
    }
  },

  /**
   * Update an artifact (creates new version)
   */
  async updateArtifact(id: string, updates: ArtifactUpdate): Promise<Artifact | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      // Get current version
      const { data: current } = await supabase
        .from('artifacts')
        .select('version')
        .eq('id', id)
        .single();

      // Increment version if content changed
      const newVersion = updates.content ? (current?.version || 0) + 1 : undefined;

      const updateData = {
        ...updates,
        ...(newVersion ? { version: newVersion } : {}),
      };

      const { data, error } = await supabase
        .from('artifacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating artifact:', error);
        return null;
      }

      return toAppArtifact(data);
    } catch (error) {
      console.error('Error in updateArtifact:', error);
      return null;
    }
  },

  /**
   * Delete an artifact
   */
  async deleteArtifact(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      // Get artifact to check for storage path
      const { data: artifact } = await supabase
        .from('artifacts')
        .select('storage_path')
        .eq('id', id)
        .single();

      // Delete from storage if exists
      if (artifact?.storage_path) {
        await supabase.storage.from('artifacts').remove([artifact.storage_path]);
      }

      // Delete record
      const { error } = await supabase.from('artifacts').delete().eq('id', id);

      if (error) {
        console.error('Error deleting artifact:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteArtifact:', error);
      return false;
    }
  },

  /**
   * Export artifact to storage bucket
   */
  async exportToStorage(
    id: string,
    options: { format?: string } = {}
  ): Promise<string | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      // Get artifact
      const { data: artifact, error: fetchError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !artifact) {
        console.error('Error fetching artifact:', fetchError);
        return null;
      }

      // Determine file extension
      const extMap: Record<string, string> = {
        code: artifact.language || 'txt',
        diagram: 'mmd',
        document: 'md',
        chart: 'svg',
        html: 'html',
        svg: 'svg',
        markdown: 'md',
        json: 'json',
        csv: 'csv',
      };
      const ext = options.format || extMap[artifact.artifact_type] || 'txt';

      // Build storage path
      const filename = `${artifact.id}.${ext}`;
      const storagePath = `${artifact.chat_id}/${filename}`;

      // Upload to storage
      const blob = new Blob([artifact.content], { type: 'text/plain' });
      const { error: uploadError } = await supabase.storage
        .from('artifacts')
        .upload(storagePath, blob, {
          contentType: 'text/plain',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading artifact:', uploadError);
        return null;
      }

      // Update artifact record
      await supabase.from('artifacts').update({ storage_path: storagePath }).eq('id', id);

      // Get public URL
      const { data: urlData } = supabase.storage.from('artifacts').getPublicUrl(storagePath);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Error in exportToStorage:', error);
      return null;
    }
  },

  /**
   * Parse and create artifacts from Claude's response
   * Detects artifact markers like <artifact> or code blocks
   */
  parseAndCreateArtifacts(
    content: string,
    chatId: string,
    messageId?: string
  ): Array<Omit<ArtifactInsert, 'chat_id' | 'message_id'>> {
    const artifacts: Array<Omit<ArtifactInsert, 'chat_id' | 'message_id'>> = [];

    // Pattern for explicit artifact tags
    const artifactTagPattern =
      /<artifact\s+type="([^"]+)"(?:\s+title="([^"]*)")?(?:\s+language="([^"]*)")?>([\s\S]*?)<\/artifact>/g;

    let match;
    while ((match = artifactTagPattern.exec(content)) !== null) {
      const [, type, title, language, artifactContent] = match;
      artifacts.push({
        artifact_type: type as ArtifactType,
        title: title || undefined,
        content: artifactContent.trim(),
        language: language || undefined,
        metadata: { runnable: type === 'code', editable: true },
      });
    }

    // Pattern for code blocks with language
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;

    while ((match = codeBlockPattern.exec(content)) !== null) {
      const [fullMatch, language, code] = match;

      // Skip if this is inside an artifact tag
      const beforeMatch = content.substring(0, match.index);
      const lastArtifactOpen = beforeMatch.lastIndexOf('<artifact');
      const lastArtifactClose = beforeMatch.lastIndexOf('</artifact>');
      if (lastArtifactOpen > lastArtifactClose) {
        continue;
      }

      // Only create artifact for substantial code blocks
      if (code.trim().length > 100) {
        artifacts.push({
          artifact_type: 'code',
          title: undefined,
          content: code.trim(),
          language: language || 'text',
          metadata: { runnable: ['javascript', 'python', 'typescript'].includes(language || ''), editable: true },
        });
      }
    }

    // Pattern for Mermaid diagrams
    const mermaidPattern = /```mermaid\n([\s\S]*?)```/g;

    while ((match = mermaidPattern.exec(content)) !== null) {
      artifacts.push({
        artifact_type: 'diagram',
        title: 'Diagram',
        content: match[1].trim(),
        language: 'mermaid',
        metadata: { editable: true },
      });
    }

    return artifacts;
  },

  /**
   * Create multiple artifacts from parsed content
   */
  async createArtifactsFromContent(
    content: string,
    chatId: string,
    messageId?: string
  ): Promise<Artifact[]> {
    const parsed = this.parseAndCreateArtifacts(content, chatId, messageId);

    const created: Artifact[] = [];
    for (const artifactData of parsed) {
      const artifact = await this.createArtifact({
        ...artifactData,
        chat_id: chatId,
        message_id: messageId,
      });
      if (artifact) {
        created.push(artifact);
      }
    }

    return created;
  },
};



