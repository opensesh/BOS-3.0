'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, X, ZoomIn } from 'lucide-react';
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
 * UserMessageBubble Component
 * 
 * Displays user messages with:
 * - Right alignment
 * - Fill background
 * - 80% max width
 * - "Show more" functionality for long messages with gradient fade
 * - Attached image previews
 */
export function UserMessageBubble({ query, maxHeight = 120, attachments }: UserMessageBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Check if content overflows the max height
  useEffect(() => {
    if (contentRef.current) {
      const hasContentOverflow = contentRef.current.scrollHeight > maxHeight;
      setHasOverflow(hasContentOverflow);
    }
  }, [query, maxHeight]);

  const hasAttachments = attachments && attachments.length > 0;

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
                  <button
                    key={attachment.id}
                    onClick={() => setLightboxImage(attachment.data)}
                    className="relative group aspect-video rounded-lg overflow-hidden bg-[var(--bg-primary)] hover:ring-2 hover:ring-[var(--border-brand-solid)] transition-all"
                  >
                    <Image
                      src={attachment.data}
                      alt={attachment.name || 'Attached image'}
                      fill
                      className="object-cover"
                      unoptimized // Base64 images don't need optimization
                    />
                    {/* Hover overlay with zoom icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
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
      {lightboxImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={lightboxImage}
              alt="Full size image"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh] w-auto"
              unoptimized
            />
          </div>
        </motion.div>
      )}
    </>
  );
}

export default UserMessageBubble;

