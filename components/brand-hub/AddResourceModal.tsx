'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { CategoryInput } from '@/components/ui/CategoryInput';
import { BrandResource } from '@/types';
import { 
  getAllLucideIconNames, 
  FA_BRAND_ICONS, 
  POPULAR_ICONS,
  isFontAwesomeIcon 
} from '@/lib/icons';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddResource: (resource: Omit<BrandResource, 'id' | 'createdAt'>) => void;
  editResource?: BrandResource;
  onUpdateResource?: (id: string, updates: Partial<BrandResource>) => void;
  existingCategories?: string[];
}

export function AddResourceModal({
  isOpen,
  onClose,
  onAddResource,
  editResource,
  onUpdateResource,
  existingCategories = [],
}: AddResourceModalProps) {
  const isEditMode = !!editResource;
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Link');
  const [iconSearch, setIconSearch] = useState('');
  const [error, setError] = useState('');

  // Get all Lucide icons once
  const allLucideIcons = useMemo(() => getAllLucideIconNames(), []);

  useEffect(() => {
    if (editResource && isOpen) {
      setName(editResource.name);
      setUrl(editResource.url);
      setCategory(editResource.category || '');
      setSelectedIcon(editResource.lucideIconName || 'Link');
    } else if (!editResource && isOpen) {
      setName('');
      setUrl('');
      setCategory('');
      setSelectedIcon('Link');
      setIconSearch('');
      setError('');
    }
  }, [editResource, isOpen]);

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    const urlToAdd = url.startsWith('http') ? url : `https://${url}`;

    if (!validateUrl(urlToAdd)) {
      setError('Please enter a valid URL');
      return;
    }

    if (isEditMode && editResource && onUpdateResource) {
      onUpdateResource(editResource.id, {
        name: name.trim(),
        url: urlToAdd,
        category: category.trim() || undefined,
        lucideIconName: selectedIcon,
      });
    } else {
      onAddResource({
        name: name.trim(),
        url: urlToAdd,
        category: category.trim() || undefined,
        icon: 'lucide',
        lucideIconName: selectedIcon,
      });
    }

    setName('');
    setUrl('');
    setCategory('');
    setSelectedIcon('Link');
    setIconSearch('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setCategory('');
    setSelectedIcon('Link');
    setIconSearch('');
    setError('');
    onClose();
  };

  // Get displayed icons based on search
  const displayedIcons = useMemo(() => {
    const query = iconSearch.toLowerCase().trim();

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
      return [...faMatches, ...lucideMatches].slice(0, 12);
    }

    // Default: Link first, then mix of popular FA brands and Lucide icons (2 rows = 12 icons)
    const otherLucide = POPULAR_ICONS.lucide.filter(i => i !== 'Link').slice(0, 5);
    return ['Link', ...POPULAR_ICONS.fontAwesome.slice(0, 6), ...otherLucide];
  }, [iconSearch, allLucideIcons]);

  // Common input styles using UUI theme tokens
  const inputStyles = `
    w-full px-3 py-2.5 rounded-lg
    bg-primary-alt border border-[var(--border-primary)]
    text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)]
    focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent
    transition-colors
  `;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Edit Resource" : "Add Resource"} size="md">
      <div className="space-y-4">
        <div>
          <label htmlFor="resource-name" className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            Name <span className="text-[var(--fg-error-primary)]">*</span>
          </label>
          <input
            id="resource-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g., Brand Assets Drive"
            className={inputStyles}
          />
        </div>

        <div>
          <label htmlFor="resource-url" className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            URL <span className="text-[var(--fg-error-primary)]">*</span>
          </label>
          <input
            id="resource-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://example.com"
            className={inputStyles}
          />
          {error && (
            <p className="mt-1 text-sm text-[var(--fg-error-primary)]" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Category (optional) */}
        <div>
          <label htmlFor="resource-category" className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            Category <span className="text-[var(--fg-tertiary)]">(optional)</span>
          </label>
          <CategoryInput
            id="resource-category"
            value={category}
            onChange={setCategory}
            existingCategories={existingCategories}
            placeholder="e.g., Design Tools"
            className={inputStyles}
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            Icon
          </label>
          
          {/* Search input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" aria-hidden="true" />
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Search icons... (try 'notion', 'slack', 'google')"
              aria-label="Search icons"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-colors"
            />
          </div>
          
          {/* Icon Grid */}
          <div 
            className="grid grid-cols-6 gap-2" 
            role="listbox" 
            aria-label="Available icons"
          >
            {displayedIcons.map((iconName) => {
              const isFA = isFontAwesomeIcon(iconName);
              const displayName = isFA ? iconName.replace('fa-', '').replace(/-/g, ' ') : iconName;
              
              return (
                <button
                  key={iconName}
                  type="button"
                  role="option"
                  aria-selected={selectedIcon === iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  title={displayName}
                  className={`
                    p-2.5 rounded-lg border transition-all flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
                    ${selectedIcon === iconName
                      ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)] text-[var(--fg-brand-primary)]'
                      : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--fg-tertiary)] hover:border-[var(--border-brand-solid)] hover:text-[var(--fg-primary)]'
                    }
                  `}
                >
                  <Icon name={iconName} className="w-4 h-4" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          
          {displayedIcons.length === 0 && iconSearch && (
            <p className="text-center text-sm text-[var(--fg-tertiary)] py-4">
              No icons found for &ldquo;{iconSearch}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-secondary)]">
        <Button
          type="button"
          color="secondary"
          size="md"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          color="primary"
          size="md"
          onClick={handleSubmit}
        >
          {isEditMode ? 'Save Changes' : 'Add Resource'}
        </Button>
      </div>
    </Modal>
  );
}

// Icon preview component for displaying resource icons
export function ResourceIconPreview({
  type,
  lucideIconName,
  customIconUrl,
  size = 'md',
}: {
  type: BrandResource['icon'];
  lucideIconName?: string;
  customIconUrl?: string;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  // Use the Icon component for lucide icons or custom icon names
  if (lucideIconName) {
    return <Icon name={lucideIconName} className={sizeClasses} />;
  }

  if (type === 'custom' && customIconUrl) {
    return (
      <img 
        src={customIconUrl} 
        alt="Custom icon" 
        className={sizeClasses}
      />
    );
  }

  // Legacy icon types with inline SVGs
  switch (type) {
    case 'google-drive':
      return (
        <svg className={sizeClasses} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.71 3L2.16 12.71L4.93 17.71H9.46L15 8H7.71V3Z" fill="#4285F4" />
          <path d="M16.29 3H9L14.55 12.71L12 17.71L19.29 17.71L21.84 12.71L16.29 3Z" fill="#FBBC04" />
          <path d="M2.16 12.71L4.93 17.71H19.29L21.84 12.71H2.16Z" fill="#34A853" />
        </svg>
      );
    case 'figma':
      return (
        <svg className={sizeClasses} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 24C10.208 24 12 22.208 12 20V16H8C5.792 16 4 17.792 4 20C4 22.208 5.792 24 8 24Z" fill="#0ACF83" />
          <path d="M4 12C4 9.792 5.792 8 8 8H12V16H8C5.792 16 4 14.208 4 12Z" fill="#A259FF" />
          <path d="M4 4C4 1.792 5.792 0 8 0H12V8H8C5.792 8 4 6.208 4 4Z" fill="#F24E1E" />
          <path d="M12 0H16C18.208 0 20 1.792 20 4C20 6.208 18.208 8 16 8H12V0Z" fill="#FF7262" />
          <path d="M20 12C20 14.208 18.208 16 16 16C13.792 16 12 14.208 12 12C12 9.792 13.792 8 16 8C18.208 8 20 9.792 20 12Z" fill="#1ABCFE" />
        </svg>
      );
    case 'notion':
      return (
        <svg className={sizeClasses} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.967c-.42-.326-.98-.7-2.055-.606L3.01 2.72c-.467.046-.56.28-.374.466l1.823 1.022zm.793 3.08v13.906c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.382c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.886zm14.337.746c.093.42 0 .84-.42.887l-.7.14v10.265c-.607.327-1.167.514-1.633.514-.747 0-.934-.234-1.494-.934l-4.573-7.187v6.952l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.855L7.379 9.67c-.093-.42.14-1.026.793-1.073l3.454-.233 4.76 7.28V9.202l-1.214-.14c-.093-.514.28-.887.747-.933l3.223-.187zm-16.35-5.16L16.92.813c1.26-.093 1.586-.033 2.38.467l3.267 2.333c.606.42.793.56.793 1.027v15.933c0 1.026-.373 1.633-1.68 1.727l-15.458.933c-.98.047-1.447-.093-1.96-.747l-3.127-4.06c-.56-.747-.793-1.306-.793-1.96V4.154c0-.84.374-1.54 1.54-1.68z" />
        </svg>
      );
    default:
      // Default to Link icon
      return <Icon name="Link" className={sizeClasses} />;
  }
}
