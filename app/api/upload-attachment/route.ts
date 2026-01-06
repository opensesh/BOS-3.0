import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Lazy-initialize Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

// Bucket name for chat attachments
const BUCKET_NAME = 'chat-attachments';

interface UploadRequest {
  /** Base64 encoded file data (with or without data URL prefix) */
  data: string;
  /** MIME type of the file */
  mimeType: string;
  /** Original filename */
  filename?: string;
  /** Chat ID to associate with */
  chatId?: string;
  /** Message ID to associate with */
  messageId?: string;
  /** User ID */
  userId?: string;
}

interface UploadResponse {
  success: boolean;
  attachment?: {
    id: string;
    storagePath: string;
    publicUrl: string;
    filename: string;
    mimeType: string;
    fileSize: number;
  };
  error?: string;
}

/**
 * Extract base64 data from a data URL or return as-is if already plain base64
 */
function extractBase64Data(data: string): { base64: string; mimeType?: string } {
  const dataUrlMatch = data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      base64: dataUrlMatch[2],
      mimeType: dataUrlMatch[1],
    };
  }
  return { base64: data };
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'application/json': 'json',
  };
  return extensions[mimeType] || 'bin';
}

/**
 * Determine attachment type from MIME type
 */
function getAttachmentType(mimeType: string): 'image' | 'pdf' | 'document' | 'code' | 'text' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'text';
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'code';
  return 'document';
}

/**
 * POST /api/upload-attachment
 * 
 * Uploads a file to Supabase storage and creates a record in the message_attachments table.
 * Used for storing chat images and documents for persistence and RAG.
 */
export async function POST(req: Request): Promise<NextResponse<UploadResponse>> {
  try {
    const body = await req.json() as UploadRequest;
    const { data, mimeType: providedMimeType, filename, chatId, messageId, userId } = body;

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No file data provided' },
        { status: 400 }
      );
    }

    // Extract base64 data and potentially override MIME type from data URL
    const { base64, mimeType: extractedMimeType } = extractBase64Data(data);
    const mimeType = extractedMimeType || providedMimeType || 'application/octet-stream';

    // Validate MIME type for security
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/markdown', 'text/csv', 'text/html',
      'application/json',
    ];

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: `File type ${mimeType} is not allowed` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = getExtension(mimeType);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const storagePath = `${chatId || 'unassigned'}/${timestamp}-${randomId}.${extension}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');
    const fileSize = buffer.length;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Get Supabase client (lazy init)
    const supabaseClient = getSupabase();

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      await supabaseClient.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: maxSize,
        allowedMimeTypes: allowedTypes,
      });
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    // Insert record into message_attachments table
    const attachmentType = getAttachmentType(mimeType);
    
    const { data: attachment, error: dbError } = await supabaseClient
      .from('message_attachments')
      .insert({
        message_id: messageId || null,
        chat_id: chatId || null,
        user_id: userId || null,
        filename: storagePath.split('/').pop() || `file.${extension}`,
        original_filename: filename || `attachment.${extension}`,
        storage_path: storagePath,
        bucket_name: BUCKET_NAME,
        mime_type: mimeType,
        file_size: fileSize,
        attachment_type: attachmentType,
        processing_status: 'completed',
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalDataUrl: data.startsWith('data:') ? data.substring(0, 100) + '...' : undefined,
        },
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // File was uploaded but DB record failed - still return success with storage info
      // The attachment can be linked later
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment?.id || `temp-${timestamp}`,
        storagePath,
        publicUrl: urlData.publicUrl,
        filename: filename || `attachment.${extension}`,
        mimeType,
        fileSize,
      },
    });

  } catch (error) {
    console.error('Upload attachment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload-attachment
 * 
 * Returns information about allowed file types and limits
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/markdown', 'text/csv', 'text/html',
      'application/json',
    ],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    bucket: BUCKET_NAME,
  });
}

