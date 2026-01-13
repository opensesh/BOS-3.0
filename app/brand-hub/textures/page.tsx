'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { BrandHubLayout } from '@/components/brand-hub/BrandHubLayout';
import { TabSelector } from '@/components/brain/TabSelector';
import { Download, X, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { useBrandTextures } from '@/hooks/useBrandTextures';
import type { BrandTexture, TextureVariant } from '@/lib/supabase/brand-textures-service';

type Category = 'all' | TextureVariant;

interface CategoryContent {
  title: string;
  subtitle: string;
  description: string;
}

// Content for each category
const categoryContent: Record<Category, CategoryContent> = {
  all: {
    title: 'Texture Library',
    subtitle: 'SURFACE & DEPTH',
    description: 'Our texture library provides visual depth and tactile quality to digital experiences. Each texture family serves a specific purpose—from dynamic movement to organic authenticity—creating layered compositions that elevate our brand presence.',
  },
  'sonic-line': {
    title: 'Sonic Line',
    subtitle: 'DYNAMIC ENERGY',
    description: 'Bold, sweeping lines that capture motion and energy. These textures add dynamism and forward momentum to compositions, perfect for conveying speed, innovation, and technological advancement.',
  },
  ascii: {
    title: 'ASCII',
    subtitle: 'DIGITAL HERITAGE',
    description: 'Text-based patterns that celebrate our digital roots. ASCII textures bridge the gap between human creativity and machine precision, adding a layer of technical authenticity to our visual language.',
  },
  halftone: {
    title: 'Halftone',
    subtitle: 'PRINT LEGACY',
    description: 'Classic dot patterns that reference print heritage while feeling contemporary. Halftone textures add depth and visual interest, creating a sense of craftsmanship and editorial sophistication.',
  },
  'recycled-card': {
    title: 'Recycled Card',
    subtitle: 'ORGANIC AUTHENTICITY',
    description: 'Subtle paper textures that ground digital experiences with tactile warmth. These textures communicate sustainability, craftsmanship, and an appreciation for natural materials.',
  },
  unknown: {
    title: 'Other',
    subtitle: 'MISCELLANEOUS',
    description: 'Additional textures that complement our visual system.',
  },
};

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sonic-line', label: 'Sonic Line' },
  { id: 'ascii', label: 'ASCII' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'recycled-card', label: 'Recycled Card' },
];

// Helper to get display title from texture
function getTextureTitle(texture: BrandTexture): string {
  return texture.name
    .replace(/GFX DATABASE /i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/ compressed$/i, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper to get variant from texture
function getTextureVariant(texture: BrandTexture): TextureVariant {
  let variant = texture.variant as TextureVariant || 'unknown';
  // Normalize Sonic Line textures
  if (variant === 'unknown' && texture.name.toLowerCase().includes('sonic line')) {
    variant = 'sonic-line';
  }
  return variant;
}

function ImageModal({ 
  texture, 
  textures,
  currentIndex,
  onClose,
  onNavigate 
}: { 
  texture: BrandTexture; 
  textures: BrandTexture[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const handleDownload = async () => {
    if (!texture.publicUrl) return;
    
    try {
      const response = await fetch(texture.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = texture.filename || `${texture.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : textures.length - 1;
    onNavigate(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex < textures.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, textures.length]);

  const variant = getTextureVariant(texture);
  const variantLabel = categories.find(c => c.id === variant)?.label || 'Texture';

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-30"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Left Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToPrevious();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-30 group"
        aria-label="Previous texture"
      >
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-30 group"
        aria-label="Next texture"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 text-white/70 text-sm font-accent tracking-wider z-30">
        {currentIndex + 1} / {textures.length}
      </div>
      
      <motion.div 
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        key={texture.id}
      >
        <Image
          src={texture.publicUrl || ''}
          alt={getTextureTitle(texture)}
          width={1200}
          height={800}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          quality={95}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">{getTextureTitle(texture)}</h3>
              <span className="text-sm text-white/70">{variantLabel}</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-vanilla)] text-[var(--color-charcoal)] font-medium text-sm hover:bg-[var(--color-vanilla)]/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </motion.div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/40 text-xs font-accent tracking-wider z-30">
        <span>← → Navigate</span>
        <span>•</span>
        <span>ESC Close</span>
      </div>
    </motion.div>
  );
}

// Category Description Section Component
function CategoryDescription({ category }: { category: Category }) {
  const content = categoryContent[category];
  
  return (
    <motion.div 
      key={category}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-8 pt-8 border-t border-[var(--fg-primary)]/10"
    >
      {/* Subtitle - OffBit Font */}
      <motion.p 
        className="font-accent text-xs tracking-[0.3em] text-[var(--fg-brand-primary)] mb-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {content.subtitle}
      </motion.p>
      
      {/* Title */}
      <motion.h3 
        className="font-display text-2xl md:text-3xl font-bold text-[var(--fg-primary)] mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {content.title}
      </motion.h3>
      
      {/* Description */}
      <motion.p 
        className="text-[var(--fg-primary)]/70 text-base leading-relaxed max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {content.description}
      </motion.p>
    </motion.div>
  );
}

export default function TexturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedTextureIndex, setSelectedTextureIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch textures from Supabase
  const { filteredTextures, textures, isLoading, error, refresh, setSelectedVariant } = useBrandTextures();

  // Sync category with hook
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedVariant(category);
  };

  // Filter textures for display
  const displayTextures = selectedCategory === 'all' 
    ? textures 
    : textures.filter(t => getTextureVariant(t) === selectedCategory);

  // Get the currently selected texture
  const selectedTexture = selectedTextureIndex !== null ? displayTextures[selectedTextureIndex] : null;

  // Download function - creates a ZIP file with all textures in current category
  const handleDownloadAll = async () => {
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const categoryName = selectedCategory === 'all' ? 'all-textures' : selectedCategory;
      const folder = zip.folder(categoryName);
      
      if (!folder) {
        throw new Error('Failed to create zip folder');
      }

      // Fetch all textures and add to zip
      await Promise.all(
        displayTextures.map(async (texture) => {
          if (!texture.publicUrl) return;
          
          try {
            const response = await fetch(texture.publicUrl);
            const blob = await response.blob();
            const filename = texture.filename || `${texture.id}.jpg`;
            folder.file(filename, blob);
          } catch (error) {
            console.error(`Failed to fetch ${texture.name}:`, error);
          }
        })
      );

      // Generate and download zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `textures-${categoryName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
        <Sidebar />
        <BrandHubLayout
          title="Textures"
          description="Surface patterns and overlays that add depth and tactile quality to our visual system."
        >
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" />
            <span className="ml-2 text-[var(--fg-tertiary)]">Loading textures...</span>
          </div>
        </BrandHubLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
        <Sidebar />
        <BrandHubLayout
          title="Textures"
          description="Surface patterns and overlays that add depth and tactile quality to our visual system."
        >
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[var(--fg-error-primary)] mb-4">Failed to load textures</p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </BrandHubLayout>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      <BrandHubLayout
        title="Textures"
        description="Surface patterns and overlays that add depth and tactile quality to our visual system."
      >
        {/* Category Tabs + Download Button */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <TabSelector
            tabs={categories}
            activeTab={selectedCategory}
            onChange={(tabId) => handleCategoryChange(tabId as Category)}
          />

          {/* Download Button */}
          <motion.button
            onClick={handleDownloadAll}
            disabled={isDownloading || displayTextures.length === 0}
            className={`
              w-9 h-9 rounded-lg transition-all duration-200 flex items-center justify-center ml-auto
              ${isDownloading || displayTextures.length === 0
                ? 'bg-[var(--fg-primary)]/5 text-[var(--fg-primary)]/40 cursor-not-allowed'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
              }
            `}
            whileHover={!isDownloading && displayTextures.length > 0 ? { scale: 1.05 } : {}}
            whileTap={!isDownloading && displayTextures.length > 0 ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            title={`Download ${selectedCategory === 'all' ? 'all textures' : selectedCategory + ' textures'} as ZIP`}
          >
            {isDownloading ? (
              <motion.div 
                className="w-4 h-4 border-2 border-[var(--fg-primary)]/40 border-t-[var(--fg-primary)] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Texture Grid Gallery */}
        <motion.div
          initial={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          {displayTextures.map((texture, index) => (
            <motion.div
              key={texture.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              onClick={() => setSelectedTextureIndex(index)}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-[var(--border-secondary)] hover:border-[var(--border-brand)] transition-all duration-300"
            >
              {/* Texture Image */}
              <Image
                src={texture.publicUrl || ''}
                alt={getTextureTitle(texture)}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                quality={85}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end justify-center p-3 opacity-0 group-hover:opacity-100">
                <span className="text-white text-xs font-medium text-center line-clamp-2">
                  {getTextureTitle(texture)}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {displayTextures.length === 0 && (
          <div className="text-center py-20 text-[var(--fg-tertiary)]">
            No textures found{selectedCategory !== 'all' ? ` for ${categories.find(c => c.id === selectedCategory)?.label}` : ''}.
          </div>
        )}

        {/* Category Description Section */}
        <AnimatePresence mode="wait">
          <CategoryDescription key={selectedCategory} category={selectedCategory} />
        </AnimatePresence>

        {/* Image Modal */}
        <AnimatePresence>
          {selectedTexture && selectedTextureIndex !== null && (
            <ImageModal 
              texture={selectedTexture}
              textures={displayTextures}
              currentIndex={selectedTextureIndex}
              onClose={() => setSelectedTextureIndex(null)}
              onNavigate={(index) => setSelectedTextureIndex(index)}
            />
          )}
        </AnimatePresence>
      </BrandHubLayout>
    </div>
  );
}
