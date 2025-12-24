'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui';
import * as LucideIcons from 'lucide-react';
import { Search, Upload } from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  onUploadIcon?: (file: File) => void;
}

// Popular Lucide icons for quick access
const POPULAR_ICONS = [
  'Globe', 'Mail', 'MessageSquare', 'Phone', 'MapPin', 'Calendar',
  'Clock', 'Heart', 'Star', 'Bookmark', 'Tag', 'Share2',
  'Link', 'Download', 'Upload', 'File', 'Folder', 'Image',
  'Video', 'Music', 'Mic', 'Camera', 'Tool', 'Settings',
  'User', 'Users', 'Building', 'Home', 'Store', 'Package',
  'ShoppingCart', 'CreditCard', 'DollarSign', 'TrendingUp', 'BarChart', 'PieChart',
];

export function IconPickerModal({
  isOpen,
  onClose,
  onSelectIcon,
  onUploadIcon,
}: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'popular' | 'all' | 'upload'>('popular');

  const allIconNames = Object.keys(LucideIcons).filter(
    (key) => key !== 'createLucideIcon' && key !== 'default'
  );

  const filteredIcons = selectedTab === 'popular' 
    ? POPULAR_ICONS.filter(name => 
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allIconNames.filter(name => 
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );

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

  const renderIcon = (iconName: string) => {
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as any;
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose an Icon" size="lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-[var(--border-secondary)]">
        <button
          onClick={() => setSelectedTab('popular')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'popular'
              ? 'text-[var(--fg-brand-primary)] border-b-2 border-[var(--border-brand-solid)]'
              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
          }`}
        >
          Popular
        </button>
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'all'
              ? 'text-[var(--fg-brand-primary)] border-b-2 border-[var(--border-brand-solid)]'
              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
          }`}
        >
          All Icons ({allIconNames.length})
        </button>
        <button
          onClick={() => setSelectedTab('upload')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'upload'
              ? 'text-[var(--fg-brand-primary)] border-b-2 border-[var(--border-brand-solid)]'
              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]'
          }`}
        >
          Upload
        </button>
      </div>

      {selectedTab !== 'upload' ? (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-primary-alt border border-[var(--border-primary)] text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-colors"
            />
          </div>

          {/* Icon Grid */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.slice(0, 60).map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => handleIconClick(iconName)}
                  title={iconName}
                  className="p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-brand-primary)] hover:border-[var(--border-brand-solid)] border border-transparent transition-all flex items-center justify-center text-[var(--fg-primary)] hover:text-[var(--fg-brand-primary)]"
                >
                  {renderIcon(iconName)}
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <p className="text-center text-[var(--fg-tertiary)] py-8">
                No icons found
              </p>
            )}
          </div>
        </>
      ) : (
        /* Upload Section */
        <div className="py-8">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border-secondary)] rounded-lg hover:border-[var(--border-brand-solid)] transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-[var(--fg-tertiary)] mb-4" />
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
              className="hidden"
            />
          </label>
        </div>
      )}
    </Modal>
  );
}
