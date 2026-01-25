'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense } from 'react';
import Image from 'next/image';
import JSZip from 'jszip';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { BrandHubLayout } from '@/components/brand-hub/BrandHubLayout';
import { LogoSettingsTableModal } from '@/components/brand-hub/LogoSettingsTableModal';
import { RefreshCw, Download, Palette, ChevronDown, Loader2 } from 'lucide-react';
import { useBrandLogos } from '@/hooks/useBrandLogos';
import type { BrandLogo, BrandLogoMetadata } from '@/lib/supabase/types';

type ColorVariant = 'vanilla' | 'glass' | 'charcoal';
type DownloadFormat = 'svg' | 'png';

interface LogoGroup {
  id: string;
  name: string;
  logos: {
    vanilla?: BrandLogo;
    glass?: BrandLogo;
    charcoal?: BrandLogo;
  };
}

const colorOptions: { value: ColorVariant; label: string }[] = [
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'glass', label: 'Glass' },
  { value: 'charcoal', label: 'Charcoal' },
];

const formatOptions: { value: DownloadFormat; label: string }[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

function Dropdown({ 
  options, 
  value, 
  onChange, 
  icon: Icon,
  hideLabel = false,
}: { 
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  hideLabel?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-primary)]/40 border border-[var(--border-secondary)] hover:bg-[var(--bg-primary)]/80 hover:border-[var(--border-primary)] transition-colors text-[11px]"
        aria-label={hideLabel ? (Icon === Download ? 'Download logo' : 'Select option') : undefined}
      >
        {Icon && <Icon className="w-3 h-3 text-[var(--fg-tertiary)]" />}
        {!hideLabel && selectedOption && (
          <span className="text-[var(--fg-secondary)] font-medium font-display">{selectedOption.label}</span>
        )}
        <ChevronDown className={`w-2.5 h-2.5 text-[var(--fg-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-24 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] shadow-lg z-30 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1.5 text-left text-[11px] transition-colors ${
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

function LogoCard({ 
  logoGroup, 
  colorVariant, 
  onColorChange,
}: { 
  logoGroup: LogoGroup; 
  colorVariant: ColorVariant;
  onColorChange: (color: ColorVariant) => void;
}) {
  // Get the logo for the current color variant, fallback to vanilla if not available
  const logo = logoGroup.logos[colorVariant] || logoGroup.logos.vanilla;
  const imagePath = logo?.publicUrl || '';
  
  // Determine background based on color variant for better contrast
  // Charcoal logos are dark, so they go on light (vanilla) background
  // Vanilla/glass logos are light, so they go on dark (charcoal) background
  const bgClass = colorVariant === 'charcoal' 
    ? 'bg-[var(--color-vanilla)]'  // Charcoal logo on vanilla background
    : 'bg-[var(--color-charcoal)]'; // Vanilla/glass logos on charcoal background
  
  const handleDownload = async (format: DownloadFormat) => {
    if (!imagePath) return;
    
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      
      if (format === 'png') {
        // Convert SVG to PNG using canvas
        const img = new window.Image();
        const svgUrl = URL.createObjectURL(blob);
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 2; // 2x resolution for better quality
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const url = URL.createObjectURL(pngBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${logoGroup.id}-${colorVariant}.png`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }
            }, 'image/png');
          }
          URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
      } else {
        // Download as SVG
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logoGroup.id}-${colorVariant}.svg`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Scale customization based on logo ID
  const isWideOrStacked = ['combo', 'stacked', 'horizontal'].includes(logoGroup.id);
  const imageSizeClass = isWideOrStacked 
    ? "max-w-[85%] max-h-[85%]" // Bigger for combo/stacked/horizontal
    : "max-w-[70%] max-h-[70%]"; // Default for others

  if (!logo) {
    return null;
  }

  return (
    <div 
      className="group relative rounded-xl overflow-hidden border border-[var(--border-secondary)] transition-all duration-300 hover:border-[var(--border-brand)] bg-[var(--bg-secondary)]"
      role="article"
      aria-label={`${logoGroup.name} logo - ${colorVariant} variant`}
    >
      {/* Header Row with Logo Name and Controls */}
      <div className="bg-[var(--bg-tertiary)]/50 px-3 py-2 border-b border-[var(--border-secondary)] flex items-center justify-between">
        {/* Logo Name Label */}
        <span className="text-[11px] font-medium text-[var(--fg-secondary)] font-display">{logoGroup.name}</span>
        
        {/* Controls */}
        <div className="flex gap-1 items-center">
          <Dropdown
            options={colorOptions}
            value={colorVariant}
            onChange={(v) => onColorChange(v as ColorVariant)}
            icon={Palette}
            hideLabel={true}
          />
          <Dropdown
            options={formatOptions}
            value=""
            onChange={(v) => handleDownload(v as DownloadFormat)}
            icon={Download}
            hideLabel={true}
          />
        </div>
      </div>
      
      {/* Logo Preview - Square aspect ratio */}
      <div className={`aspect-square ${bgClass} relative flex items-center justify-center p-3`}>
        <Image
          src={imagePath}
          alt={`${logoGroup.name} logo in ${colorVariant} variant`}
          width={100}
          height={100}
          className={`object-contain ${imageSizeClass}`}
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>
    </div>
  );
}

// Helper function to extract logo type from variant string
function getLogoTypeFromVariant(variant: string | undefined): string {
  if (!variant) return 'other';
  // Handle variants like "brandmark-vanilla", "combo-glass", "core-charcoal"
  const parts = variant.split('-');
  if (parts.length >= 2) {
    // Check if it's a variant ending (vanilla, glass, charcoal)
    const lastPart = parts[parts.length - 1];
    if (['vanilla', 'glass', 'charcoal', 'default'].includes(lastPart)) {
      return parts.slice(0, -1).join('-');
    }
  }
  return variant;
}

// Helper function to extract color variant from variant string
function getColorFromVariant(variant: string | undefined): ColorVariant | null {
  if (!variant) return null;
  if (variant.endsWith('-vanilla') || variant === 'vanilla') return 'vanilla';
  if (variant.endsWith('-glass') || variant === 'glass') return 'glass';
  if (variant.endsWith('-charcoal') || variant === 'charcoal') return 'charcoal';
  // For logos like "core.svg" (no variant suffix), check the filename
  if (variant.endsWith('-default') || !variant.includes('-')) return 'vanilla';
  return null;
}

// Helper to get display name for logo type
function getDisplayName(logoType: string): string {
  const displayNames: Record<string, string> = {
    'brandmark': 'Brandmark',
    'combo': 'Combo',
    'stacked': 'Stacked',
    'horizontal': 'Horizontal',
    'core': 'Core',
    'outline': 'Outline',
    'filled': 'Filled',
    'logo_main_combo': 'Combo',
  };
  return displayNames[logoType] || logoType.charAt(0).toUpperCase() + logoType.slice(1);
}

/**
 * Inner component that handles the logo page logic including auto-download
 */
function LogoPageContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);
  const searchParams = useSearchParams();
  const downloadParam = searchParams.get('download');

  // Fetch logos from Supabase
  const { mainLogos, accessoryLogos, isLoading, error, refresh } = useBrandLogos();
  
  // Get the default color based on the current theme
  const getDefaultColor = (): ColorVariant => {
    return resolvedTheme === 'light' ? 'charcoal' : 'vanilla';
  };

  // Group logos by type for both main and accessory
  const groupedMainLogos = useMemo(() => {
    const groups: Record<string, LogoGroup> = {};
    
    mainLogos.forEach(logo => {
      const metadata = logo.metadata as BrandLogoMetadata;
      const logoType = metadata.logoType || getLogoTypeFromVariant(logo.variant);
      const colorVariant = getColorFromVariant(logo.variant);
      
      if (!groups[logoType]) {
        groups[logoType] = {
          id: logoType,
          name: getDisplayName(logoType),
          logos: {}
        };
      }
      
      if (colorVariant) {
        groups[logoType].logos[colorVariant] = logo;
      }
    });
    
    // Sort by preferred order
    const preferredOrder = ['brandmark', 'combo', 'stacked', 'horizontal'];
    return Object.values(groups).sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.id);
      const bIndex = preferredOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [mainLogos]);

  const groupedAccessoryLogos = useMemo(() => {
    const groups: Record<string, LogoGroup> = {};
    
    accessoryLogos.forEach(logo => {
      const metadata = logo.metadata as BrandLogoMetadata;
      const logoType = metadata.logoType || getLogoTypeFromVariant(logo.variant);
      const colorVariant = getColorFromVariant(logo.variant);
      
      if (!groups[logoType]) {
        groups[logoType] = {
          id: logoType,
          name: getDisplayName(logoType),
          logos: {}
        };
      }
      
      if (colorVariant) {
        groups[logoType].logos[colorVariant] = logo;
      }
    });
    
    // Sort by preferred order
    const preferredOrder = ['core', 'outline', 'filled'];
    return Object.values(groups).sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.id);
      const bIndex = preferredOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [accessoryLogos]);

  const allLogoGroups = useMemo(() => [...groupedMainLogos, ...groupedAccessoryLogos], [groupedMainLogos, groupedAccessoryLogos]);

  // Helper to download a single logo by filename
  const downloadSingleLogo = useCallback(async (logo: BrandLogo) => {
    if (!logo.publicUrl) return;

    try {
      const response = await fetch(logo.publicUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = logo.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download logo:', err);
    }
  }, []);

  // Auto-download handler for MCP-triggered downloads
  const handleAutoDownload = useCallback(async () => {
    if (!downloadParam || isLoading || autoDownloadTriggered) return;

    // Mark as triggered to prevent multiple downloads
    setAutoDownloadTriggered(true);

    // Handle "all" download request
    if (downloadParam === 'all') {
      // This will be handled by handleDownloadAll which is defined later
      return;
    }

    // Find the matching logo by filename across all logos
    const allLogos = [...mainLogos, ...accessoryLogos];
    const targetLogo = allLogos.find((logo) => {
      const filenameMatch = logo.filename === downloadParam;
      const publicUrlMatch = logo.publicUrl?.includes(downloadParam);
      return filenameMatch || publicUrlMatch;
    });

    if (targetLogo) {
      await downloadSingleLogo(targetLogo);
    }
  }, [downloadParam, isLoading, autoDownloadTriggered, mainLogos, accessoryLogos, downloadSingleLogo]);

  // Trigger auto-download when logos are loaded and download param is present
  useEffect(() => {
    if (mounted && !isLoading && downloadParam && mainLogos.length > 0) {
      handleAutoDownload();
    }
  }, [mounted, isLoading, downloadParam, mainLogos.length, handleAutoDownload]);

  const [mainColors, setMainColors] = useState<Record<string, ColorVariant>>({});
  const [accessoryColors, setAccessoryColors] = useState<Record<string, ColorVariant>>({});

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize colors when logos are loaded or theme changes
  useEffect(() => {
    if (mounted && groupedMainLogos.length > 0) {
      const defaultColor = getDefaultColor();
      const mainColorsInit: Record<string, ColorVariant> = {};
      groupedMainLogos.forEach(group => {
        mainColorsInit[group.id] = defaultColor;
      });
      setMainColors(mainColorsInit);
    }
  }, [mounted, groupedMainLogos.length, resolvedTheme]);

  useEffect(() => {
    if (mounted && groupedAccessoryLogos.length > 0) {
      const defaultColor = getDefaultColor();
      const accessoryColorsInit: Record<string, ColorVariant> = {};
      groupedAccessoryLogos.forEach(group => {
        accessoryColorsInit[group.id] = defaultColor;
      });
      setAccessoryColors(accessoryColorsInit);
    }
  }, [mounted, groupedAccessoryLogos.length, resolvedTheme]);

  const resetAllColors = () => {
    const defaultColor = getDefaultColor();
    const mainColorsReset: Record<string, ColorVariant> = {};
    groupedMainLogos.forEach(group => {
      mainColorsReset[group.id] = defaultColor;
    });
    setMainColors(mainColorsReset);
    
    const accessoryColorsReset: Record<string, ColorVariant> = {};
    groupedAccessoryLogos.forEach(group => {
      accessoryColorsReset[group.id] = defaultColor;
    });
    setAccessoryColors(accessoryColorsReset);
  };

  const setMainColor = (id: string, color: ColorVariant) => {
    setMainColors(prev => ({
      ...prev,
      [id]: color,
    }));
  };

  const setAccessoryColor = (id: string, color: ColorVariant) => {
    setAccessoryColors(prev => ({
      ...prev,
      [id]: color,
    }));
  };

  const allColors = { ...mainColors, ...accessoryColors };
  const setColor = (id: string, color: ColorVariant) => {
    if (mainColors[id] !== undefined) {
      setMainColor(id, color);
    } else {
      setAccessoryColor(id, color);
    }
  };

  const handleDownloadAll = useCallback(async () => {
    try {
      const zip = new JSZip();

      // Create an array of promises to fetch all images
      const promises = allLogoGroups.map(async (logoGroup) => {
        const colorVariant = allColors[logoGroup.id] || 'vanilla';
        const logo = logoGroup.logos[colorVariant] || logoGroup.logos.vanilla;

        if (!logo?.publicUrl) return;

        try {
          const response = await fetch(logo.publicUrl);
          const blob = await response.blob();
          zip.file(`${logoGroup.id}-${colorVariant}.svg`, blob);
        } catch (error) {
          console.error(`Failed to download ${logoGroup.name}:`, error);
        }
      });

      // Wait for all fetches to complete
      await Promise.all(promises);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "brand-logos.zip";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to create zip file:', error);
    }
  }, [allLogoGroups, allColors]);

  // Handle auto-download "all" case after handleDownloadAll is defined
  useEffect(() => {
    if (mounted && !isLoading && downloadParam === 'all' && autoDownloadTriggered && allLogoGroups.length > 0) {
      handleDownloadAll();
    }
  }, [mounted, isLoading, downloadParam, autoDownloadTriggered, allLogoGroups.length, handleDownloadAll]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
        <Sidebar />
        <BrandHubLayout
          title="Logo"
          description="Our logo system includes multiple lockups for different contexts."
        >
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" />
            <span className="ml-2 text-[var(--fg-tertiary)]">Loading logos...</span>
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
          title="Logo"
          description="Our logo system includes multiple lockups for different contexts."
        >
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[var(--fg-error-primary)] mb-4">Failed to load logos</p>
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
        title="Logo"
        description="Our logo system includes multiple lockups for different contexts. Click any logo to download."
        onSettingsClick={() => setIsSettingsOpen(true)}
        settingsTooltip="Manage brand logos"
      >
        {/* Header with Reset & Download All */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--fg-tertiary)]">
              {allLogoGroups.length} logo variants
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-xs text-[var(--fg-tertiary)]"
            >
              <Download className="w-3.5 h-3.5" />
              Download All
            </button>
            <button
              onClick={resetAllColors}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors text-xs text-[var(--fg-tertiary)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>

        {/* Main Logos Section */}
        {groupedMainLogos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[var(--fg-primary)] mb-4 font-display">
              Main Logos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupedMainLogos.map((logoGroup) => (
                <LogoCard
                  key={logoGroup.id}
                  logoGroup={logoGroup}
                  colorVariant={mainColors[logoGroup.id] || 'vanilla'}
                  onColorChange={(color) => setMainColor(logoGroup.id, color)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Accessory Logos Section */}
        {groupedAccessoryLogos.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--fg-primary)] mb-4 font-display">
              Accessory Logos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupedAccessoryLogos.map((logoGroup) => (
                <LogoCard
                  key={logoGroup.id}
                  logoGroup={logoGroup}
                  colorVariant={accessoryColors[logoGroup.id] || 'vanilla'}
                  onColorChange={(color) => setAccessoryColor(logoGroup.id, color)}
                />
              ))}
            </div>
          </div>
        )}
      </BrandHubLayout>

      {/* Logo Settings Modal */}
      <LogoSettingsTableModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

/**
 * Logo Page with Suspense boundary for useSearchParams
 */
export default function LogoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
          <Sidebar />
          <BrandHubLayout
            title="Logo"
            description="Our logo system includes multiple lockups for different contexts."
          >
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" />
              <span className="ml-2 text-[var(--fg-tertiary)]">Loading logos...</span>
            </div>
          </BrandHubLayout>
        </div>
      }
    >
      <LogoPageContent />
    </Suspense>
  );
}
