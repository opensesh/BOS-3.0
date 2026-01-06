'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, Palette, ChevronDown, ExternalLink } from 'lucide-react';
import {
  AssetType,
  ColorVariant,
  LogoAsset,
  FontAsset,
  ArtDirectionAsset,
  TextureAsset,
  LOGO_ASSETS,
  FONT_ASSETS,
  ART_DIRECTION_ASSETS,
  TEXTURE_ASSETS,
  COLOR_OPTIONS,
  getAssetTypeLabel,
  getAssetPagePath,
} from '@/lib/brand-knowledge/asset-data';

// ===========================================
// Types
// ===========================================

interface AssetCarouselProps {
  type: AssetType;
  className?: string;
}

// ===========================================
// Dropdown Component
// ===========================================

function Dropdown({ 
  options, 
  value, 
  onChange, 
  icon: Icon,
}: { 
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-[var(--bg-primary)]/40 border border-[var(--border-secondary)] hover:bg-[var(--bg-primary)]/80 hover:border-[var(--border-primary)] transition-colors text-[10px]"
        aria-label="Select option"
      >
        {Icon && <Icon className="w-3 h-3 text-[var(--fg-tertiary)]" />}
        <ChevronDown className={`w-2 h-2 text-[var(--fg-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-20 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] shadow-lg z-30 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1.5 text-left text-[10px] transition-colors ${
                option.value === value
                  ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] font-medium'
                  : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Logo Card Component
// ===========================================

function LogoCard({ logo }: { logo: LogoAsset }) {
  const [colorVariant, setColorVariant] = useState<ColorVariant>('vanilla');

  const imagePath = colorVariant === 'charcoal' && logo.charcoalPath
    ? logo.charcoalPath
    : colorVariant === 'glass'
    ? logo.glassPath
    : logo.vanillaPath;

  // Background based on color variant
  const bgClass = colorVariant === 'vanilla' 
    ? 'bg-[#191919]' 
    : colorVariant === 'charcoal'
    ? 'bg-[#FFFAEE]'
    : 'bg-gradient-to-br from-[#191919] via-[#2a2a2a] to-[#191919]';

  const handleDownload = async (format: 'svg' | 'png') => {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      
      if (format === 'svg') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logo.id}-${colorVariant}.svg`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Convert to PNG
        const img = new window.Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 512, 512);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const url = URL.createObjectURL(pngBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${logo.id}-${colorVariant}.png`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }
            }, 'image/png');
          }
        };
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="group flex-shrink-0 w-[140px] sm:w-[160px] rounded-lg overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-secondary)] transition-all duration-200 hover:border-[var(--border-brand)]">
      {/* Header */}
      <div className="bg-[var(--bg-tertiary)]/50 px-2 py-1.5 border-b border-[var(--border-secondary)] flex items-center justify-between">
        <span className="text-[10px] font-medium text-[var(--fg-secondary)] truncate">{logo.name}</span>
        <div className="flex gap-0.5 items-center">
          <Dropdown
            options={COLOR_OPTIONS}
            value={colorVariant}
            onChange={(v) => setColorVariant(v as ColorVariant)}
            icon={Palette}
          />
          <Dropdown
            options={[{ value: 'svg', label: 'SVG' }, { value: 'png', label: 'PNG' }]}
            value=""
            onChange={(v) => handleDownload(v as 'svg' | 'png')}
            icon={Download}
          />
        </div>
      </div>
      
      {/* Preview */}
      <div className={`aspect-square ${bgClass} relative flex items-center justify-center p-4`}>
        <Image
          src={imagePath}
          alt={`${logo.name} logo`}
          width={80}
          height={80}
          className="object-contain max-w-[70%] max-h-[70%]"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>
    </div>
  );
}

// ===========================================
// Font Card Component
// ===========================================

function FontCard({ font }: { font: FontAsset }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = font.desktopPath;
    a.download = `${font.id}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fontClass = font.id === 'offbit' ? 'font-mono' : 'font-display';

  return (
    <div className="group flex-shrink-0 w-[180px] sm:w-[200px] rounded-lg overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-secondary)] transition-all duration-200 hover:border-[var(--border-brand)]">
      {/* Header */}
      <div className="bg-[var(--bg-tertiary)]/50 px-2 py-1.5 border-b border-[var(--border-secondary)] flex items-center justify-between">
        <span className="text-[10px] font-medium text-[var(--fg-secondary)] truncate">{font.name}</span>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-[var(--bg-primary)]/40 border border-[var(--border-secondary)] hover:bg-[var(--bg-primary)]/80 hover:border-[var(--border-primary)] transition-colors text-[10px]"
          aria-label="Download font"
        >
          <Download className="w-3 h-3 text-[var(--fg-tertiary)]" />
        </button>
      </div>
      
      {/* Specimen */}
      <div className="bg-[var(--bg-primary)] p-4 min-h-[100px] flex items-center justify-center">
        <p className={`${fontClass} text-[18px] sm:text-[20px] text-[var(--fg-primary)] text-center leading-tight`}>
          {font.specimen}
        </p>
      </div>
      
      {/* Weights */}
      <div className="px-2 py-1.5 border-t border-[var(--border-secondary)]">
        <p className="text-[9px] text-[var(--fg-tertiary)]">
          {font.weights.join(' • ')}
        </p>
      </div>
    </div>
  );
}

// ===========================================
// Art Direction Card Component
// ===========================================

function ArtDirectionCard({ image }: { image: ArtDirectionAsset }) {
  const handleDownload = async () => {
    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="group flex-shrink-0 w-[140px] sm:w-[160px] rounded-lg overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-secondary)] transition-all duration-200 hover:border-[var(--border-brand)]">
      {/* Header */}
      <div className="bg-[var(--bg-tertiary)]/50 px-2 py-1.5 border-b border-[var(--border-secondary)] flex items-center justify-between">
        <span className="text-[10px] font-medium text-[var(--fg-secondary)] capitalize truncate">{image.category}</span>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-[var(--bg-primary)]/40 border border-[var(--border-secondary)] hover:bg-[var(--bg-primary)]/80 hover:border-[var(--border-primary)] transition-colors text-[10px]"
          aria-label="Download image"
        >
          <Download className="w-3 h-3 text-[var(--fg-tertiary)]" />
        </button>
      </div>
      
      {/* Image */}
      <div className="aspect-square relative">
        <Image
          src={image.src}
          alt={image.name}
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}

// ===========================================
// Texture Card Component
// ===========================================

function TextureCard({ texture }: { texture: TextureAsset }) {
  const handleDownload = async () => {
    try {
      const response = await fetch(texture.lightPath);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${texture.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="group flex-shrink-0 w-[140px] sm:w-[160px] rounded-lg overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-secondary)] transition-all duration-200 hover:border-[var(--border-brand)]">
      {/* Header */}
      <div className="bg-[var(--bg-tertiary)]/50 px-2 py-1.5 border-b border-[var(--border-secondary)] flex items-center justify-between">
        <span className="text-[10px] font-medium text-[var(--fg-secondary)] truncate">{texture.name}</span>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-[var(--bg-primary)]/40 border border-[var(--border-secondary)] hover:bg-[var(--bg-primary)]/80 hover:border-[var(--border-primary)] transition-colors text-[10px]"
          aria-label="Download texture"
        >
          <Download className="w-3 h-3 text-[var(--fg-tertiary)]" />
        </button>
      </div>
      
      {/* Preview */}
      <div className="aspect-square relative">
        <Image
          src={texture.previewPath}
          alt={texture.name}
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}

// ===========================================
// Main AssetCarousel Component
// ===========================================

export function AssetCarousel({ type, className = '' }: AssetCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const label = getAssetTypeLabel(type);
  const pagePath = getAssetPagePath(type);

  // Render appropriate cards based on type
  const renderCards = () => {
    switch (type) {
      case 'logos':
        return LOGO_ASSETS.map((logo) => (
          <LogoCard key={logo.id} logo={logo} />
        ));
      case 'fonts':
        return FONT_ASSETS.map((font) => (
          <FontCard key={font.id} font={font} />
        ));
      case 'art-direction':
        return ART_DIRECTION_ASSETS.map((image) => (
          <ArtDirectionCard key={image.id} image={image} />
        ));
      case 'textures':
        return TEXTURE_ASSETS.map((texture) => (
          <TextureCard key={texture.id} texture={texture} />
        ));
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header with type label and link to full page */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
          {label}
        </span>
        <Link
          href={pagePath}
          className="flex items-center gap-1 text-[11px] text-[var(--fg-brand-primary)] hover:text-[var(--fg-brand-primary-hover)] transition-colors"
        >
          <span>View all</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Left arrow - hidden on mobile */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-[var(--bg-secondary)]/90 border border-[var(--border-secondary)] shadow-lg hover:bg-[var(--bg-tertiary)] transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--fg-secondary)]" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {renderCards()}
        </div>

        {/* Right arrow - hidden on mobile */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-[var(--bg-secondary)]/90 border border-[var(--border-secondary)] shadow-lg hover:bg-[var(--bg-tertiary)] transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-[var(--fg-secondary)]" />
          </button>
        )}
      </div>
    </div>
  );
}

// Export for use in LinksView
export type { AssetCarouselProps };
