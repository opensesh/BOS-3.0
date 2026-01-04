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

export function IconPickerModal({
  isOpen,
  onClose,
  onSelectIcon,
  onUploadIcon,
}: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all Lucide icons once
  const allLucideIcons = useMemo(() => getAllLucideIconNames(), []);

  // Get displayed icons based on search - always show popular icons or search results
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
    
    // Default: show popular icons (FA brands + common Lucide icons)
    return [...POPULAR_ICONS.fontAwesome, ...POPULAR_ICONS.lucide];
  }, [searchQuery, allLucideIcons]);

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

  // Limit to 3 rows based on responsive grid
  const maxIcons = 18; // 6 cols on desktop, 4 on tablet, 3-4 on mobile = 3 rows

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose an Icon" size="md">
      {/* Search */}
      <div className="relative mb-3">
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
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-colors"
        />
      </div>

      {/* Icon Grid - Fixed to 3 rows, responsive columns */}
      <div className="overflow-y-auto custom-scrollbar">
        <div 
          className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2"
          role="listbox"
          aria-label="Available icons"
        >
          {filteredIcons.slice(0, maxIcons).map((iconName) => {
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
                className="aspect-square p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-brand-primary)] hover:border-[var(--border-brand-solid)] border border-transparent transition-all flex items-center justify-center text-[var(--fg-primary)] hover:text-[var(--fg-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1"
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
    </Modal>
  );
}
