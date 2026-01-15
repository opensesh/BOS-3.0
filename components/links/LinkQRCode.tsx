'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShortLink } from '@/lib/supabase/types';

interface LinkQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ShortLink | null;
}

/**
 * Modal for displaying and downloading QR codes for short links
 */
export function LinkQRCodeModal({
  isOpen,
  onClose,
  link,
}: LinkQRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shortUrl = link ? `https://${link.domain}/l/${link.shortCode}` : '';

  // Generate QR code when link changes
  useEffect(() => {
    if (!link || !isOpen) return;

    setIsLoading(true);

    // Dynamically import qrcode library
    import('qrcode')
      .then((QRCode) => {
        if (canvasRef.current) {
          QRCode.toCanvas(
            canvasRef.current,
            shortUrl,
            {
              width: 256,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            },
            (error) => {
              if (error) {
                console.error('QR Code generation error:', error);
              }
              setIsLoading(false);
            }
          );
        }
      })
      .catch((error) => {
        console.error('Failed to load QR code library:', error);
        setIsLoading(false);
      });
  }, [link, isOpen, shortUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current || !link) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `qr-${link.shortCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <AnimatePresence>
      {isOpen && link && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[15%] mx-auto max-w-sm z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
              <div>
                <h2 className="text-lg font-display font-bold text-[var(--fg-primary)]">
                  QR Code
                </h2>
                <p className="text-sm text-[var(--fg-tertiary)]">
                  Scan to visit the link
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code */}
            <div className="p-6 flex flex-col items-center">
              <div className="relative bg-white p-4 rounded-xl shadow-sm">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={cn(
                    'w-64 h-64',
                    isLoading && 'opacity-0'
                  )}
                />
              </div>

              {/* Short URL */}
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]/40">
                <span className="text-sm font-medium text-[var(--fg-primary)]">
                  {shortUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border-primary)]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--fg-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
