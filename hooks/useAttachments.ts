'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export type AttachmentType = 'image' | 'pdf' | 'document' | 'code' | 'text';

export interface Attachment {
  id: string;
  file: File;
  preview: string; // Base64 data URL for preview or thumbnail
  type: AttachmentType;
  extractedText?: string; // For PDFs and documents
  isProcessing?: boolean;
}

interface UseAttachmentsOptions {
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  enableTextExtraction?: boolean;
}

interface UseAttachmentsReturn {
  attachments: Attachment[];
  isDragging: boolean;
  error: string | null;
  isProcessing: boolean;
  addFiles: (files: FileList | File[]) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  clearError: () => void;
  handlePaste: (e: React.ClipboardEvent | ClipboardEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openFilePicker: () => void;
  getAcceptString: () => string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// Supported file types organized by category
const FILE_TYPE_CONFIG = {
  // Images
  'image/jpeg': { type: 'image' as AttachmentType, ext: 'jpg' },
  'image/png': { type: 'image' as AttachmentType, ext: 'png' },
  'image/gif': { type: 'image' as AttachmentType, ext: 'gif' },
  'image/webp': { type: 'image' as AttachmentType, ext: 'webp' },
  'image/svg+xml': { type: 'image' as AttachmentType, ext: 'svg' },
  
  // PDF
  'application/pdf': { type: 'pdf' as AttachmentType, ext: 'pdf' },
  
  // Documents
  'text/plain': { type: 'text' as AttachmentType, ext: 'txt' },
  'text/markdown': { type: 'document' as AttachmentType, ext: 'md' },
  'text/csv': { type: 'document' as AttachmentType, ext: 'csv' },
  'text/html': { type: 'document' as AttachmentType, ext: 'html' },
  'application/json': { type: 'code' as AttachmentType, ext: 'json' },
  
  // Code files
  'text/javascript': { type: 'code' as AttachmentType, ext: 'js' },
  'application/javascript': { type: 'code' as AttachmentType, ext: 'js' },
  'text/typescript': { type: 'code' as AttachmentType, ext: 'ts' },
  'application/typescript': { type: 'code' as AttachmentType, ext: 'ts' },
  'text/css': { type: 'code' as AttachmentType, ext: 'css' },
  'text/x-python': { type: 'code' as AttachmentType, ext: 'py' },
  'application/x-python': { type: 'code' as AttachmentType, ext: 'py' },
};

const DEFAULT_ACCEPTED_TYPES = Object.keys(FILE_TYPE_CONFIG);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine attachment type from MIME type or file extension
 */
function getAttachmentType(file: File): AttachmentType {
  // Check MIME type first
  const config = FILE_TYPE_CONFIG[file.type as keyof typeof FILE_TYPE_CONFIG];
  if (config) return config.type;
  
  // Fall back to extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const extMap: Record<string, AttachmentType> = {
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
    // PDF
    pdf: 'pdf',
    // Documents
    txt: 'text', md: 'document', csv: 'document', html: 'document',
    // Code
    js: 'code', ts: 'code', jsx: 'code', tsx: 'code', 
    py: 'code', css: 'code', json: 'code',
    java: 'code', c: 'code', cpp: 'code', h: 'code',
    rb: 'code', go: 'code', rs: 'code', swift: 'code',
  };
  
  return extMap[ext || ''] || 'document';
}

/**
 * Generate a placeholder preview for non-image files
 */
function getPlaceholderPreview(type: AttachmentType, filename: string): string {
  // Return a data URL with a colored placeholder
  const colors: Record<AttachmentType, string> = {
    image: '#10b981', // Green
    pdf: '#ef4444',   // Red
    document: '#3b82f6', // Blue
    code: '#8b5cf6',  // Purple
    text: '#6b7280',  // Gray
  };
  
  const color = colors[type] || '#6b7280';
  const label = type.toUpperCase();
  
  // Create a simple SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" rx="8"/>
      <text x="50" y="45" text-anchor="middle" fill="white" font-family="system-ui" font-size="12" font-weight="600">${label}</text>
      <text x="50" y="65" text-anchor="middle" fill="white" font-family="system-ui" font-size="8" opacity="0.8">${filename.slice(0, 12)}${filename.length > 12 ? '...' : ''}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Extract text from a text-based file
 */
async function extractTextContent(file: File): Promise<string | undefined> {
  const type = getAttachmentType(file);
  
  // Only extract from text-based files
  if (type === 'text' || type === 'code' || type === 'document') {
    try {
      return await file.text();
    } catch {
      console.warn('Failed to extract text from file:', file.name);
    }
  }
  
  return undefined;
}

// ============================================
// HOOK
// ============================================

export function useAttachments(options: UseAttachmentsOptions = {}): UseAttachmentsReturn {
  const {
    maxFiles = DEFAULT_MAX_FILES,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    enableTextExtraction = true,
  } = options;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const type = getAttachmentType(file);
    const isAccepted = acceptedTypes.includes(file.type) || 
      acceptedTypes.some(t => t.includes('*') && file.type.startsWith(t.split('*')[0]));
    
    // Allow by extension if MIME type check fails
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 
                         'txt', 'md', 'csv', 'html', 'json', 
                         'js', 'ts', 'jsx', 'tsx', 'py', 'css'];
    
    if (!isAccepted && ext && !allowedExts.includes(ext)) {
      return `File type "${file.type || ext}" is not supported.`;
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      const maxMB = Math.round(maxSizeBytes / 1024 / 1024);
      return `File "${file.name}" is too large. Maximum size is ${maxMB}MB.`;
    }
    
    return null;
  }, [acceptedTypes, maxSizeBytes]);

  // Convert file to base64 data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Add files
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = attachments.length;
    const availableSlots = maxFiles - currentCount;

    if (availableSlots <= 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const filesToAdd = fileArray.slice(0, availableSlots);
    setIsProcessing(true);
    const newAttachments: Attachment[] = [];

    for (const file of filesToAdd) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      try {
        const attachmentType = getAttachmentType(file);
        let preview: string;
        
        // For images, create actual preview
        if (attachmentType === 'image') {
          preview = await fileToDataUrl(file);
        } else {
          // For other files, use placeholder
          preview = getPlaceholderPreview(attachmentType, file.name);
        }
        
        // Extract text content if enabled
        let extractedText: string | undefined;
        if (enableTextExtraction) {
          extractedText = await extractTextContent(file);
        }
        
        newAttachments.push({
          id: generateId(),
          file,
          preview,
          type: attachmentType,
          extractedText,
        });
      } catch (err) {
        setError(`Failed to process file "${file.name}"`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      setError(null);
    }
    
    setIsProcessing(false);
  }, [attachments.length, maxFiles, validateFile, enableTextExtraction]);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Clear all attachments
  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle paste event
  const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Accept images and files
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }, [addFiles]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Get accept string for file input
  const getAcceptString = useCallback(() => {
    // Include both MIME types and extensions
    const mimeTypes = acceptedTypes.join(',');
    const extensions = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md,.csv,.html,.json,.js,.ts,.jsx,.tsx,.py,.css';
    return `${mimeTypes},${extensions}`;
  }, [acceptedTypes]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle drag enter on window level to show drop zone
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  return {
    attachments,
    isDragging,
    error,
    isProcessing,
    addFiles,
    removeAttachment,
    clearAttachments,
    clearError,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    fileInputRef,
    openFilePicker,
    getAcceptString,
  };
}
