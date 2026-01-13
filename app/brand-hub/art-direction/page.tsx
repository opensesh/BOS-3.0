'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { BrandHubLayout } from '@/components/brand-hub/BrandHubLayout';
import { ArtDirectionSettingsModal } from '@/components/brand-hub/ArtDirectionSettingsModal';
import { TabSelector } from '@/components/brain/TabSelector';
import { Download, X, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { useBrandArtDirection } from '@/hooks/useBrandArtDirection';
import type { BrandArtImage, BrandArtImageMetadata, ArtDirectionCategory } from '@/lib/supabase/types';

type Category = 'All' | ArtDirectionCategory;

interface CategoryContent {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}

// Content for each category
const categoryContent: Record<Category, CategoryContent> = {
  All: {
    title: 'Visual Identity System',
    subtitle: 'THE COMPLETE PICTURE',
    description: 'Our art direction encompasses six distinct visual territories, each contributing to a cohesive brand narrative. From the precision of automotive photography to the intimacy of emotional portraiture, every image is crafted to evoke aspiration while maintaining authenticity. This visual system allows our brand to speak with range and depth across all touchpoints.',
    tags: ['Cinematic', 'Aspirational', 'Authentic', 'Dynamic', 'Emotive', 'Premium'],
  },
  Auto: {
    title: 'Automotive Excellence',
    subtitle: 'PRECISION IN MOTION',
    description: 'Our automotive imagery celebrates the marriage of engineering and artistry. We capture vehicles not merely as machines, but as objects of desire—emphasizing form, light, and the promise of the open road. Each shot honors heritage while pushing toward the future, finding beauty in both vintage classics and modern masterpieces.',
    tags: ['Speed', 'Heritage', 'Precision', 'Power', 'Elegance', 'Night'],
  },
  Lifestyle: {
    title: 'Contemporary Living',
    subtitle: 'STYLE AS EXPRESSION',
    description: 'Lifestyle photography captures the confident, creative spirit of modern living. We focus on authentic moments of self-expression—street style that commands attention, editorial looks that tell stories, and candid captures that feel both aspirational and attainable. Fashion becomes a vehicle for identity.',
    tags: ['Editorial', 'Fashion', 'Urban', 'Confidence', 'Expression', 'Bold'],
  },
  Move: {
    title: 'Dynamic Energy',
    subtitle: 'BODIES IN FLOW',
    description: 'Movement imagery explores the poetry of the human form in motion. Through dance, athletics, and gesture, we capture energy that transcends the static frame. Motion blur becomes intentional, form becomes fluid, and every image pulses with kinetic vitality that invites the viewer to feel the rhythm.',
    tags: ['Energy', 'Flow', 'Athletic', 'Grace', 'Momentum', 'Rhythm'],
  },
  Escape: {
    title: 'Boundless Horizons',
    subtitle: 'BEYOND THE EVERYDAY',
    description: 'Escapist imagery transports viewers to liminal spaces where work meets wonder and routine dissolves into possibility. Remote workspaces overlooking oceans, deserts that stretch into infinity, and surreal compositions that challenge perspective—these images remind us that freedom is a state of mind.',
    tags: ['Freedom', 'Wonder', 'Adventure', 'Dreams', 'Remote', 'Surreal'],
  },
  Work: {
    title: 'Professional Vision',
    subtitle: 'PURPOSE MEETS CRAFT',
    description: 'Our work imagery reframes professional environments as spaces of creative potential and meaningful collaboration. We move beyond sterile corporate photography to capture genuine connection, focused intention, and the satisfaction of craft. Business becomes a platform for building something that matters.',
    tags: ['Collaboration', 'Innovation', 'Leadership', 'Focus', 'Growth', 'Purpose'],
  },
  Feel: {
    title: 'Emotional Resonance',
    subtitle: 'TEXTURE OF SENSATION',
    description: 'The most intimate territory in our visual language, Feel imagery prioritizes atmosphere over subject. Soft focus, warm tones, and abstract compositions create emotional impressions rather than literal narratives. Light becomes tactile, fabric becomes landscape, and every image invites contemplation.',
    tags: ['Intimacy', 'Texture', 'Warmth', 'Softness', 'Abstract', 'Poetic'],
  },
};

const categories: Category[] = ['All', 'Auto', 'Lifestyle', 'Move', 'Escape', 'Work', 'Feel'];

// Helper to get category from variant field
function getCategoryFromImage(image: BrandArtImage): ArtDirectionCategory | null {
  // First check metadata for artCategory
  const meta = image.metadata as BrandArtImageMetadata;
  if (meta.artCategory) {
    return meta.artCategory;
  }
  
  // Fall back to variant field (lowercase)
  if (image.variant) {
    const variantLower = image.variant.toLowerCase();
    const categoryMap: Record<string, ArtDirectionCategory> = {
      'auto': 'Auto',
      'lifestyle': 'Lifestyle',
      'move': 'Move',
      'escape': 'Escape',
      'work': 'Work',
      'feel': 'Feel',
    };
    return categoryMap[variantLower] || null;
  }
  
  return null;
}

// Helper to get display title from image
function getImageTitle(image: BrandArtImage): string {
  // Capitalize each word in the name
  return image.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ImageModal({ 
  image, 
  images,
  currentIndex,
  onClose,
  onNavigate 
}: { 
  image: BrandArtImage; 
  images: BrandArtImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const handleDownload = async () => {
    if (!image.publicUrl) return;
    
    try {
      const response = await fetch(image.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.filename || `${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
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
  }, [currentIndex, images.length]);

  const category = getCategoryFromImage(image);

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
        aria-label="Previous image"
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
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 text-white/70 text-sm font-accent tracking-wider z-30">
        {currentIndex + 1} / {images.length}
      </div>
      
      <motion.div 
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        key={image.id}
      >
        <Image
          src={image.publicUrl || ''}
          alt={getImageTitle(image)}
          width={1200}
          height={800}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          quality={95}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">{getImageTitle(image)}</h3>
              <span className="text-sm text-white/70">{category || 'Image'}</span>
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
      className="mt-12 pt-10 border-t border-[var(--fg-primary)]/10"
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
        className="font-display text-3xl md:text-4xl font-bold text-[var(--fg-primary)] mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {content.title}
      </motion.h3>
      
      {/* Description */}
      <motion.p 
        className="text-[var(--fg-primary)]/70 text-base md:text-lg leading-relaxed max-w-3xl mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {content.description}
      </motion.p>
      
      {/* Tags - Simple text with dot separators */}
      <motion.div 
        className="flex flex-wrap items-center gap-x-1 gap-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {content.tags.map((tag, index) => (
          <React.Fragment key={tag}>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="font-accent text-xs tracking-[0.15em] uppercase text-[var(--fg-primary)]/60"
            >
              {tag}
            </motion.span>
            {index < content.tags.length - 1 && (
              <span className="text-[var(--fg-primary)]/30 mx-2">•</span>
            )}
          </React.Fragment>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function ArtDirectionPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch images from Supabase
  const { images, isLoading, error, refresh } = useBrandArtDirection();

  // Filter images based on selected category
  const filteredImages = useMemo(() => {
    if (selectedCategory === 'All') {
      return images;
    }
    return images.filter(img => {
      const category = getCategoryFromImage(img);
      return category === selectedCategory;
    });
  }, [images, selectedCategory]);

  // Get the currently selected image
  const selectedImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null;

  // Reset active image when category changes
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setActiveImage(0);
  };

  // Download function - creates a ZIP file with all images in current category
  const handleDownloadAll = async () => {
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const categoryName = selectedCategory === 'All' ? 'all-art-direction' : selectedCategory.toLowerCase();
      const folder = zip.folder(categoryName);
      
      if (!folder) {
        throw new Error('Failed to create zip folder');
      }

      // Fetch all images and add to zip
      await Promise.all(
        filteredImages.map(async (image) => {
          if (!image.publicUrl) return;
          
          try {
            const response = await fetch(image.publicUrl);
            const blob = await response.blob();
            const filename = image.filename || `${image.id}.png`;
            folder.file(filename, blob);
          } catch (error) {
            console.error(`Failed to fetch ${image.name}:`, error);
          }
        })
      );

      // Generate and download zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `art-direction-${categoryName}.zip`;
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
          title="Art Direction"
          description="Our visual language spans automotive excellence, lifestyle moments, dynamic movement, escapist dreams, professional environments, and emotional resonance."
        >
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" />
            <span className="ml-2 text-[var(--fg-tertiary)]">Loading images...</span>
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
          title="Art Direction"
          description="Our visual language spans automotive excellence, lifestyle moments, dynamic movement, escapist dreams, professional environments, and emotional resonance."
        >
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[var(--fg-error-primary)] mb-4">Failed to load images</p>
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
        title="Art Direction"
        description="Our visual language spans automotive excellence, lifestyle moments, dynamic movement, escapist dreams, professional environments, and emotional resonance."
        onSettingsClick={() => setIsSettingsOpen(true)}
        settingsTooltip="Manage art direction images"
      >
        {/* Category Tabs + Download Button */}
        <div className="flex flex-wrap gap-3 items-center mb-8">
          <TabSelector
            tabs={categories.map(category => ({ id: category, label: category }))}
            activeTab={selectedCategory}
            onChange={(tabId) => handleCategoryChange(tabId as Category)}
          />

          {/* Download Button - Icon Only, pushed to right */}
          <motion.button
            onClick={handleDownloadAll}
            disabled={isDownloading || filteredImages.length === 0}
            className={`
              w-9 h-9 rounded-lg transition-all duration-200 flex items-center justify-center ml-auto
              ${isDownloading || filteredImages.length === 0
                ? 'bg-[var(--fg-primary)]/5 text-[var(--fg-primary)]/40 cursor-not-allowed'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
              }
            `}
            whileHover={!isDownloading && filteredImages.length > 0 ? { scale: 1.05 } : {}}
            whileTap={!isDownloading && filteredImages.length > 0 ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            title={`Download ${selectedCategory === 'All' ? 'all images' : selectedCategory + ' images'} as ZIP`}
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

        {/* Gallery - Horizontal Accordion Style (matching original exactly) */}
        <motion.div
          id="art-direction"
          initial={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative w-full"
        >
          {/* Desktop: Horizontal Gallery */}
          <div className="hidden md:flex w-full items-center justify-center gap-1">
            {filteredImages.map((image, index) => (
              <motion.div
                key={`${selectedCategory}-${index}-${image.id}`}
                className="relative cursor-pointer overflow-hidden rounded-3xl"
                initial={false}
                animate={{
                  width: activeImage === index ? '28rem' : '5rem',
                  height: '24rem',
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={() => setSelectedImageIndex(index)}
                onMouseEnter={() => setActiveImage(index)}
              >
                {/* Gradient Overlay on Active */}
                <AnimatePresence>
                  {activeImage === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 h-full w-full bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10"
                    />
                  )}
                </AnimatePresence>
                
                {/* Category Label on Active (only when <= 8 images) */}
                <AnimatePresence>
                  {activeImage === index && filteredImages.length <= 8 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute flex h-full w-full flex-col items-end justify-end p-4 z-20"
                    >
                      <p className="text-left text-xs text-white/70 font-accent tracking-wider uppercase">
                        {getCategoryFromImage(image) || 'Image'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Image */}
                <Image
                  src={image.publicUrl || ''}
                  alt={getImageTitle(image)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 28rem"
                  quality={90}
                  priority={index < 3}
                />
              </motion.div>
            ))}
          </div>

          {/* Mobile: Vertical Accordion Gallery */}
          <div className="flex md:hidden w-full flex-col items-center justify-center gap-1">
            {filteredImages.slice(0, 10).map((image, index) => (
              <motion.div
                key={`${selectedCategory}-mobile-${index}-${image.id}`}
                className="relative cursor-pointer overflow-hidden rounded-3xl w-full"
                initial={false}
                animate={{ 
                  height: activeImage === index ? '20rem' : '2.75rem' 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={() => setActiveImage(activeImage === index ? -1 : index)}
              >
                {/* Gradient Overlay on Active */}
                <AnimatePresence>
                  {activeImage === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10"
                    />
                  )}
                </AnimatePresence>

                {/* Category Label on Active */}
                <AnimatePresence>
                  {activeImage === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      className="absolute inset-0 flex items-end justify-end px-4 pb-4 z-20"
                    >
                      <p className="text-xs text-white/70 font-accent tracking-wider uppercase">
                        {getCategoryFromImage(image) || 'Image'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Image */}
                <Image
                  src={image.publicUrl || ''}
                  alt={getImageTitle(image)}
                  fill
                  className="object-cover select-none"
                  sizes="100vw"
                  quality={85}
                />
              </motion.div>
            ))}

            {/* Truncation indicator for mobile */}
            {filteredImages.length > 10 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full py-4 text-center"
              >
                <p className="text-sm text-[var(--fg-primary)]/50 font-accent tracking-wider">
                  +{filteredImages.length - 10} more {filteredImages.length - 10 === 1 ? 'image' : 'images'}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Category Description Section */}
        <AnimatePresence mode="wait">
          <CategoryDescription key={selectedCategory} category={selectedCategory} />
        </AnimatePresence>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-20 text-[var(--fg-tertiary)]">
            No images found for {selectedCategory}.
          </div>
        )}

        {/* Image Modal */}
        <AnimatePresence>
          {selectedImage && selectedImageIndex !== null && (
            <ImageModal 
              image={selectedImage}
              images={filteredImages}
              currentIndex={selectedImageIndex}
              onClose={() => setSelectedImageIndex(null)}
              onNavigate={(index) => setSelectedImageIndex(index)}
            />
          )}
        </AnimatePresence>
      </BrandHubLayout>

      {/* Art Direction Settings Modal */}
      <ArtDirectionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
