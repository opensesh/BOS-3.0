'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ExternalLink,
  Image as ImageIcon,
  FileType,
  Palette,
  Shapes,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandAsset {
  path: string;
  filename: string;
  variant: string | null;
  description: string;
  downloadUrl: string;
  previewable: boolean;
}

interface AssetCarouselProps {
  category: string;
  variant?: string | null;
  assets: BrandAsset[];
  totalAvailable?: number;
}

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; hubPath: string }> = {
  logos: { icon: Shapes, color: 'text-[var(--fg-brand-primary)]', hubPath: '/brand-hub/logo' },
  images: { icon: ImageIcon, color: 'text-emerald-400', hubPath: '/brand-hub/art-direction' },
  textures: { icon: Palette, color: 'text-purple-400', hubPath: '/brand-hub/art-direction' },
  illustrations: { icon: Shapes, color: 'text-cyan-400', hubPath: '/brand-hub/art-direction' },
  icons: { icon: Shapes, color: 'text-amber-400', hubPath: '/brand-hub/logo' },
  fonts: { icon: FileType, color: 'text-pink-400', hubPath: '/brand-hub/fonts' },
};

export function AssetCarousel({ category, variant, assets, totalAvailable }: AssetCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.images;
  const CategoryIcon = categoryConfig.icon;

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 280; // Card width + gap
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const handleImageLoad = (path: string) => {
    setLoadedImages(prev => new Set(prev).add(path));
  };

  const handleImageError = (path: string) => {
    setFailedImages(prev => new Set(prev).add(path));
  };

  const handleDownload = async (asset: BrandAsset, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(asset.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(asset.downloadUrl, '_blank');
    }
  };

  if (assets.length === 0) {
    return (
      <div className="my-4 p-4 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border-secondary)]">
        <p className="text-sm text-[var(--fg-tertiary)]">No assets found for this request.</p>
      </div>
    );
  }

  return (
    <div className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-[var(--bg-secondary)] ${categoryConfig.color}`}>
            <CategoryIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[var(--fg-primary)] capitalize">
              {category}
              {variant && <span className="text-[var(--fg-tertiary)] font-normal"> · {variant}</span>}
            </h4>
            <p className="text-xs text-[var(--fg-tertiary)]">
              {assets.length} asset{assets.length !== 1 ? 's' : ''}
              {totalAvailable && totalAvailable > assets.length && (
                <span> of {totalAvailable} total</span>
              )}
            </p>
          </div>
        </div>
        
        {/* View all link */}
        <Link 
          href={categoryConfig.hubPath}
          className="text-xs text-[var(--fg-brand-primary)] hover:underline flex items-center gap-1"
        >
          View all in Brand Hub
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Left scroll button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] shadow-lg flex items-center justify-center text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors -translate-x-1/2"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right scroll button */}
        <AnimatePresence>
          {canScrollRight && assets.length > 3 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] shadow-lg flex items-center justify-center text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors translate-x-1/2"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {assets.map((asset, idx) => (
            <AssetCard
              key={asset.path}
              asset={asset}
              index={idx}
              isLoaded={loadedImages.has(asset.path)}
              hasFailed={failedImages.has(asset.path)}
              onLoad={() => handleImageLoad(asset.path)}
              onError={() => handleImageError(asset.path)}
              onDownload={(e) => handleDownload(asset, e)}
              categoryColor={categoryConfig.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AssetCardProps {
  asset: BrandAsset;
  index: number;
  isLoaded: boolean;
  hasFailed: boolean;
  onLoad: () => void;
  onError: () => void;
  onDownload: (e: React.MouseEvent) => void;
  categoryColor: string;
}

function AssetCard({ asset, index, isLoaded, hasFailed, onLoad, onError, onDownload, categoryColor }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine background based on variant for better preview
  const getPreviewBackground = () => {
    const filename = asset.filename.toLowerCase();
    if (filename.includes('vanilla') || filename.includes('white')) {
      return 'bg-[#191919]'; // Dark background for light assets
    }
    if (filename.includes('charcoal') || filename.includes('black') || filename.includes('dark')) {
      return 'bg-[#FFFAEE]'; // Light background for dark assets
    }
    return 'bg-[var(--bg-secondary)]'; // Default
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex-shrink-0 w-[200px] rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 overflow-hidden group hover:border-[var(--border-brand-solid)] transition-colors"
    >
      {/* Preview area */}
      <div className={`relative aspect-square ${getPreviewBackground()} flex items-center justify-center overflow-hidden`}>
        {asset.previewable && !hasFailed ? (
          <>
            {/* Loading skeleton */}
            {!isLoaded && (
              <div className="absolute inset-0 animate-pulse bg-[var(--bg-tertiary)]" />
            )}
            {/* Actual image */}
            <img
              src={asset.path}
              alt={asset.description}
              onLoad={onLoad}
              onError={onError}
              className={`
                max-w-[80%] max-h-[80%] object-contain transition-all duration-300
                ${isLoaded ? 'opacity-100' : 'opacity-0'}
                ${isHovered ? 'scale-105' : 'scale-100'}
              `}
            />
          </>
        ) : (
          // Fallback for non-previewable assets
          <div className={`w-12 h-12 rounded-xl bg-[var(--bg-primary)]/50 flex items-center justify-center ${categoryColor}`}>
            <FileType className="w-6 h-6" />
          </div>
        )}

        {/* Download overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <button
                onClick={onDownload}
                className="p-3 rounded-full bg-white/90 hover:bg-white text-[#191919] transition-colors shadow-lg"
                aria-label="Download asset"
              >
                <Download className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="text-xs font-medium text-[var(--fg-primary)] truncate" title={asset.filename}>
          {asset.filename}
        </p>
        {asset.variant && (
          <p className="text-[10px] text-[var(--fg-tertiary)] truncate mt-0.5 capitalize">
            {asset.variant.replace(/-/g, ' ')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Export type for use in other components
export type { BrandAsset, AssetCarouselProps };

