'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { Search, Upload } from 'lucide-react';
import { 
  getAllLucideIconNames, 
  FA_BRAND_ICONS, 
  POPULAR_ICONS,
  isFontAwesomeIcon 
} from '@/lib/icons';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  onUploadIcon?: (file: File) => void;
}

type TabType = 'popular' | 'brands' | 'all' | 'upload';

export function IconPickerModal({
  isOpen,
  onClose,
  onSelectIcon,
  onUploadIcon,
}: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('popular');

  // Get all Lucide icons once
  const allLucideIcons = useMemo(() => getAllLucideIconNames(), []);

  // Get displayed icons based on tab and search
  const filteredIcons = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (query) {
      // When searching, search both Lucide and FA icons
      const lucideMatches = allLucideIcons.filter(n => 
        n.toLowerCase().includes(query)
      );
      const faMatches = FA_BRAND_ICONS.filter(icon =>
        icon.name.toLowerCase().includes(query) ||
        icon.keywords.some(k => k.includes(query))
      ).map(i => i.name);
      
      // Show FA matches first (they're usually what people want for brands)
      return [...faMatches, ...lucideMatches].slice(0, 60);
    }
    
    switch (selectedTab) {
      case 'popular':
        return [...POPULAR_ICONS.fontAwesome, ...POPULAR_ICONS.lucide];
      case 'brands':
        return FA_BRAND_ICONS.map(i => i.name);
      case 'all':
        return allLucideIcons;
      default:
        return [];
    }
  }, [searchQuery, selectedTab, allLucideIcons]);

  const handleIconClick = (iconName: string) => {
    onSelectIcon(iconName);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadIcon) {
      onUploadIcon(file);
      onClose();
    }
  };

  // Tab button component
  const TabButton = ({ tab, label, count }: { tab: TabType; label: string; count?: number }) => (
    <button
      onClick={() => { setSelectedTab(tab); setSearchQuery(''); }}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        selectedTab === tab && !searchQuery
          ? 'text-[var(--fg-brand-primary)] border-b-2 border-[var(--border-brand-solid)]'
          : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
      }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose an Icon" size="lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-[var(--border-secondary)]">
        <TabButton tab="popular" label="Popular" />
        <TabButton tab="brands" label="Brands" count={FA_BRAND_ICONS.length} />
        <TabButton tab="all" label="All Icons" count={allLucideIcons.length} />
        {onUploadIcon && <TabButton tab="upload" label="Upload" />}
      </div>

      {selectedTab !== 'upload' ? (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" 
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons... (try 'notion', 'slack', 'google')"
              aria-label="Search icons"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-primary-alt border border-[var(--border-primary)] text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-colors"
            />
          </div>

          {/* Icon Grid */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div 
              className="grid grid-cols-6 gap-2"
              role="listbox"
              aria-label="Available icons"
            >
              {filteredIcons.slice(0, 60).map((iconName) => {
                const isFA = isFontAwesomeIcon(iconName);
                const displayName = isFA 
                  ? iconName.replace('fa-', '').replace(/-/g, ' ') 
                  : iconName;
                
                return (
                  <button
                    key={iconName}
                    onClick={() => handleIconClick(iconName)}
                    title={displayName}
                    role="option"
                    aria-label={`Select ${displayName} icon`}
                    className="p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-brand-primary)] hover:border-[var(--border-brand-solid)] border border-transparent transition-all flex items-center justify-center text-[var(--fg-primary)] hover:text-[var(--fg-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1"
                  >
                    <Icon name={iconName} className="w-5 h-5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <p className="text-center text-[var(--fg-tertiary)] py-8">
                No icons found for &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </>
      ) : (
        /* Upload Section */
        <div className="py-8">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border-secondary)] rounded-lg hover:border-[var(--border-brand-solid)] transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-[var(--focus-ring)] focus-within:ring-offset-2">
            <Upload className="w-12 h-12 text-[var(--fg-tertiary)] mb-4" aria-hidden="true" />
            <span className="text-sm font-medium text-[var(--fg-primary)] mb-1">
              Upload Custom Icon
            </span>
            <span className="text-xs text-[var(--fg-tertiary)]">
              PNG, JPG, SVG up to 2MB
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileUpload}
              className="sr-only"
              aria-label="Upload custom icon file"
            />
          </label>
        </div>
      )}
    </Modal>
  );
}
