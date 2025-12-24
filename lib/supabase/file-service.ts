'use client';

import { createClient } from './client';
import type {
  DbFile,
  FileInsert,
  FileUpdate,
  UploadedFile,
  ExtractedText,
  FileProcessingStatus,
  dbFileToApp,
} from './types';

// Re-export the converter
export { dbFileToApp } from './types';

// Track if tables are available
let tablesChecked = false;
let tablesAvailable = true;

/**
 * Check if files table is available
 */
async function checkTablesAvailable(): Promise<boolean> {
  if (tablesChecked) return tablesAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase.from('files').select('id').limit(1);

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
      console.info('Files: Supabase files table not available. File storage disabled.');
    }

    return false;
  } catch {
    tablesChecked = true;
    tablesAvailable = false;
    return false;
  }
}

/**
 * Generate a unique filename for storage
 */
function generateStorageFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalFilename.split('.').pop() || '';
  const baseName = originalFilename.replace(/\.[^.]+$/, '').substring(0, 50);
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${safeName}_${timestamp}_${random}${ext ? '.' + ext : ''}`;
}

/**
 * File Service
 * Handles file uploads, storage, and metadata management
 */
export const fileService = {
  /**
   * Upload a file to Supabase Storage and create metadata record
   */
  async uploadFile(
    file: File,
    options: {
      chatId?: string;
      messageId?: string;
      userId?: string;
      bucket?: string;
    } = {}
  ): Promise<UploadedFile | null> {
    if (!(await checkTablesAvailable())) {
      console.warn('File storage not available');
      return null;
    }

    const supabase = createClient();
    const bucket = options.bucket || 'files';

    // Generate unique filename
    const filename = generateStorageFilename(file.name);

    // Build storage path: {userId or 'anonymous'}/{filename}
    const folder = options.userId || 'anonymous';
    const storagePath = `${folder}/${filename}`;

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

      // Create metadata record
      const fileInsert: FileInsert = {
        user_id: options.userId || null,
        chat_id: options.chatId || null,
        message_id: options.messageId || null,
        filename,
        original_filename: file.name,
        storage_path: storagePath,
        bucket_name: bucket,
        mime_type: file.type,
        file_size: file.size,
        processing_status: 'pending',
        metadata: {},
      };

      const { data: fileRecord, error: insertError } = await supabase
        .from('files')
        .insert(fileInsert)
        .select()
        .single();

      if (insertError || !fileRecord) {
        console.error('Error creating file record:', insertError);
        // Try to clean up uploaded file
        await supabase.storage.from(bucket).remove([storagePath]);
        return null;
      }

      return {
        id: fileRecord.id,
        userId: fileRecord.user_id || undefined,
        chatId: fileRecord.chat_id || undefined,
        messageId: fileRecord.message_id || undefined,
        filename: fileRecord.filename,
        originalFilename: fileRecord.original_filename || undefined,
        storagePath: fileRecord.storage_path,
        bucketName: fileRecord.bucket_name,
        mimeType: fileRecord.mime_type || undefined,
        fileSize: fileRecord.file_size || undefined,
        extractedText: fileRecord.extracted_text || undefined,
        processingStatus: fileRecord.processing_status as FileProcessingStatus,
        metadata: fileRecord.metadata || {},
        createdAt: fileRecord.created_at,
        publicUrl: urlData?.publicUrl,
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  },

  /**
   * Upload a base64 encoded file
   */
  async uploadBase64(
    base64Data: string,
    filename: string,
    mimeType: string,
    options: {
      chatId?: string;
      messageId?: string;
      userId?: string;
      bucket?: string;
    } = {}
  ): Promise<UploadedFile | null> {
    // Convert base64 to Blob
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    return this.uploadFile(file, options);
  },

  /**
   * Get file by ID
   */
  async getFile(id: string): Promise<UploadedFile | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !file) {
        console.error('Error fetching file:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(file.bucket_name)
        .getPublicUrl(file.storage_path);

      return {
        id: file.id,
        userId: file.user_id || undefined,
        chatId: file.chat_id || undefined,
        messageId: file.message_id || undefined,
        filename: file.filename,
        originalFilename: file.original_filename || undefined,
        storagePath: file.storage_path,
        bucketName: file.bucket_name,
        mimeType: file.mime_type || undefined,
        fileSize: file.file_size || undefined,
        extractedText: file.extracted_text || undefined,
        processingStatus: file.processing_status as FileProcessingStatus,
        metadata: file.metadata || {},
        createdAt: file.created_at,
        publicUrl: urlData?.publicUrl,
      };
    } catch (error) {
      console.error('Error in getFile:', error);
      return null;
    }
  },

  /**
   * Get files for a chat
   */
  async getFilesForChat(chatId: string): Promise<UploadedFile[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error || !files) {
        console.error('Error fetching files for chat:', error);
        return [];
      }

      return files.map((file: DbFile) => {
        const { data: urlData } = supabase.storage
          .from(file.bucket_name)
          .getPublicUrl(file.storage_path);

        return {
          id: file.id,
          userId: file.user_id || undefined,
          chatId: file.chat_id || undefined,
          messageId: file.message_id || undefined,
          filename: file.filename,
          originalFilename: file.original_filename || undefined,
          storagePath: file.storage_path,
          bucketName: file.bucket_name,
          mimeType: file.mime_type || undefined,
          fileSize: file.file_size || undefined,
          extractedText: file.extracted_text || undefined,
          processingStatus: file.processing_status as FileProcessingStatus,
          metadata: file.metadata || {},
          createdAt: file.created_at,
          publicUrl: urlData?.publicUrl,
        };
      });
    } catch (error) {
      console.error('Error in getFilesForChat:', error);
      return [];
    }
  },

  /**
   * Get files for a message
   */
  async getFilesForMessage(messageId: string): Promise<UploadedFile[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error || !files) {
        console.error('Error fetching files for message:', error);
        return [];
      }

      return files.map((file: DbFile) => {
        const { data: urlData } = supabase.storage
          .from(file.bucket_name)
          .getPublicUrl(file.storage_path);

        return {
          id: file.id,
          userId: file.user_id || undefined,
          chatId: file.chat_id || undefined,
          messageId: file.message_id || undefined,
          filename: file.filename,
          originalFilename: file.original_filename || undefined,
          storagePath: file.storage_path,
          bucketName: file.bucket_name,
          mimeType: file.mime_type || undefined,
          fileSize: file.file_size || undefined,
          extractedText: file.extracted_text || undefined,
          processingStatus: file.processing_status as FileProcessingStatus,
          metadata: file.metadata || {},
          createdAt: file.created_at,
          publicUrl: urlData?.publicUrl,
        };
      });
    } catch (error) {
      console.error('Error in getFilesForMessage:', error);
      return [];
    }
  },

  /**
   * Update file metadata
   */
  async updateFile(id: string, updates: FileUpdate): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase.from('files').update(updates).eq('id', id);

      if (error) {
        console.error('Error updating file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateFile:', error);
      return false;
    }
  },

  /**
   * Update file with extracted text
   */
  async updateExtractedText(
    id: string,
    extractedText: ExtractedText,
    status: FileProcessingStatus = 'completed'
  ): Promise<boolean> {
    return this.updateFile(id, {
      extracted_text: extractedText,
      processing_status: status,
    });
  },

  /**
   * Delete a file (storage + metadata)
   */
  async deleteFile(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      // Get file info first
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('storage_path, bucket_name')
        .eq('id', id)
        .single();

      if (fetchError || !file) {
        console.error('Error fetching file for deletion:', fetchError);
        return false;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(file.bucket_name)
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue to delete metadata anyway
      }

      // Delete metadata record
      const { error: deleteError } = await supabase.from('files').delete().eq('id', id);

      if (deleteError) {
        console.error('Error deleting file record:', deleteError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      return false;
    }
  },

  /**
   * Get file content as text (for text-based files)
   */
  async getFileContent(id: string): Promise<string | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      // Get file info
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('storage_path, bucket_name, mime_type')
        .eq('id', id)
        .single();

      if (fetchError || !file) {
        console.error('Error fetching file info:', fetchError);
        return null;
      }

      // Download file
      const { data: blob, error: downloadError } = await supabase.storage
        .from(file.bucket_name)
        .download(file.storage_path);

      if (downloadError || !blob) {
        console.error('Error downloading file:', downloadError);
        return null;
      }

      // Convert to text
      return await blob.text();
    } catch (error) {
      console.error('Error in getFileContent:', error);
      return null;
    }
  },

  /**
   * Get file as base64
   */
  async getFileAsBase64(id: string): Promise<string | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      // Get file info
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('storage_path, bucket_name, mime_type')
        .eq('id', id)
        .single();

      if (fetchError || !file) {
        console.error('Error fetching file info:', fetchError);
        return null;
      }

      // Download file
      const { data: blob, error: downloadError } = await supabase.storage
        .from(file.bucket_name)
        .download(file.storage_path);

      if (downloadError || !blob) {
        console.error('Error downloading file:', downloadError);
        return null;
      }

      // Convert to base64
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      return `data:${file.mime_type || 'application/octet-stream'};base64,${base64}`;
    } catch (error) {
      console.error('Error in getFileAsBase64:', error);
      return null;
    }
  },

  /**
   * Associate file with a message
   */
  async associateWithMessage(fileId: string, messageId: string): Promise<boolean> {
    return this.updateFile(fileId, { message_id: messageId });
  },

  /**
   * Associate file with a chat
   */
  async associateWithChat(fileId: string, chatId: string): Promise<boolean> {
    return this.updateFile(fileId, { chat_id: chatId });
  },
};

export type { UploadedFile, ExtractedText, FileProcessingStatus };


