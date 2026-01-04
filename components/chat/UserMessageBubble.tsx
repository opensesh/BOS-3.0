'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, ZoomIn, Download, Copy, Check } from 'lucide-react';
import Image from 'next/image';

// Image attachment type
interface MessageAttachment {
  id: string;
  type: 'image';
  data: string; // Base64 data URL
  mimeType: string;
  name?: string;
}

interface UserMessageBubbleProps {
  /** The user's message content */
  query: string;
  /** Maximum height before truncation (default: 120px) */
  maxHeight?: number;
  /** Attached images */
  attachments?: MessageAttachment[];
}

/**
 * Download an image from a data URL
 */
function downloadImage(dataUrl: string, filename: string = 'image') {
  const link = document.createElement('a');
  link.href = dataUrl;
  // Extract extension from data URL or default to png
  const mimeMatch = dataUrl.match(/data:image\/([^;]+)/);
  const ext = mimeMatch ? mimeMatch[1] : 'png';
  link.download = `${filename}.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy image to clipboard from data URL
 */
async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Try to copy as image
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch {
    // Fallback: copy the URL itself
    try {
      await navigator.clipboard.writeText(dataUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * UserMessageBubble Component
 * 
 * Displays user messages with:
 * - Right alignment
 * - Fill background
 * - 80% max width
 * - "Show more" functionality for long messages with gradient fade
 * - Attached image previews with hover actions (zoom, copy, download)
 */
export function UserMessageBubble({ query, maxHeight = 120, attachments }: UserMessageBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<MessageAttachment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxCopied, setLightboxCopied] = useState(false);

  // Check if content overflows the max height
  useEffect(() => {
    if (contentRef.current) {
      const hasContentOverflow = contentRef.current.scrollHeight > maxHeight;
      setHasOverflow(hasContentOverflow);
    }
  }, [query, maxHeight]);

  const hasAttachments = attachments && attachments.length > 0;

  // Handle copy with feedback
  const handleCopy = useCallback(async (attachment: MessageAttachment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await copyImageToClipboard(attachment.data);
    if (success) {
      setCopiedId(attachment.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  // Handle download
  const handleDownload = useCallback((attachment: MessageAttachment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    downloadImage(attachment.data, attachment.name || 'image');
  }, []);

  // Handle lightbox copy
  const handleLightboxCopy = useCallback(async () => {
    if (!lightboxImage) return;
    const success = await copyImageToClipboard(lightboxImage.data);
    if (success) {
      setLightboxCopied(true);
      setTimeout(() => setLightboxCopied(false), 2000);
    }
  }, [lightboxImage]);

  // Handle lightbox download
  const handleLightboxDownload = useCallback(() => {
    if (!lightboxImage) return;
    downloadImage(lightboxImage.data, lightboxImage.name || 'image');
  }, [lightboxImage]);

  // Close lightbox on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  return (
    <>
      <div className="flex justify-end mb-6">
        <div className="bg-[var(--bg-secondary)] rounded-2xl max-w-[80%] relative overflow-hidden">
          {/* Attached images preview */}
          {hasAttachments && (
            <div className="p-2 pb-0">
              <div className={`grid gap-2 ${
                attachments.length === 1 
                  ? 'grid-cols-1' 
                  : attachments.length === 2 
                    ? 'grid-cols-2' 
                    : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative group aspect-video rounded-lg overflow-hidden bg-[var(--bg-primary)]"
                  >
                    <Image
                      src={attachment.data}
                      alt={attachment.name || 'Attached image'}
                      fill
                      className="object-cover"
                      unoptimized // Base64 images don't need optimization
                    />
                    {/* Hover overlay with action buttons */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                      {/* Action buttons - top right */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleCopy(attachment, e)}
                          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
                          title="Copy image"
                        >
                          {copiedId === attachment.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDownload(attachment, e)}
                          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
                          title="Download image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Zoom button - center */}
                      <button
                        onClick={() => setLightboxImage(attachment)}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="p-3 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content wrapper with conditional max-height */}
          {query && (
            <div
              ref={contentRef}
              className={`px-4 py-2.5 ${!isExpanded && hasOverflow ? '' : ''}`}
              style={{
                maxHeight: !isExpanded && hasOverflow ? `${maxHeight}px` : 'none',
                overflow: 'hidden',
              }}
            >
              <p className="text-[15px] text-[var(--fg-primary)] whitespace-pre-wrap">
                {query}
              </p>
            </div>
          )}

          {/* Gradient overlay + Show more button */}
          {hasOverflow && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0">
              {/* Gradient fade */}
              <div className="h-12 bg-gradient-to-t from-[var(--bg-secondary)] via-[var(--bg-secondary)]/80 to-transparent" />
              
              {/* Show more button */}
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full flex items-center justify-center gap-1 py-2 bg-[var(--bg-secondary)] text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
              >
                <span>Show more</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Show less button when expanded */}
          {hasOverflow && isExpanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsExpanded(false)}
              className="w-full flex items-center justify-center gap-1 py-2 border-t border-[var(--border-secondary)] text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
            >
              <span>Show less</span>
              <motion.div animate={{ rotate: 180 }}>
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Lightbox for full-size image viewing */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => setLightboxImage(null)}
          >
            {/* Top toolbar */}
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image name */}
              <div className="text-white/80 text-sm truncate max-w-[60%]">
                {lightboxImage.name || 'Image'}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLightboxCopy}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  title="Copy image"
                >
                  {lightboxCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleLightboxDownload}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Image container - takes up remaining space */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {/* Using img tag for better sizing behavior with unknown dimensions */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.data}
                alt={lightboxImage.name || 'Full size image'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Hint text at bottom */}
            <div className="text-center py-3 text-white/40 text-xs">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">Esc</kbd> or click outside to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default UserMessageBubble;

