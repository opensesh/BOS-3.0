'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { BrainResource } from '@/hooks/useBrainResources';
import { 
  getAllLucideIconNames, 
  FA_BRAND_ICONS, 
  POPULAR_ICONS,
  isFontAwesomeIcon 
} from '@/lib/icons';

interface AddBrainResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddResource: (resource: Omit<BrainResource, 'id' | 'createdAt'>) => void;
  editResource?: BrainResource;
  onUpdateResource?: (id: string, updates: Partial<BrainResource>) => void;
}

export function AddBrainResourceModal({
  isOpen,
  onClose,
  onAddResource,
  editResource,
  onUpdateResource,
}: AddBrainResourceModalProps) {
  const isEditMode = !!editResource;
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Link');
  const [iconSearch, setIconSearch] = useState('');
  const [error, setError] = useState('');

  // Get all Lucide icons once
  const allLucideIcons = useMemo(() => getAllLucideIconNames(), []);

  useEffect(() => {
    if (editResource) {
      setName(editResource.name);
      setUrl(editResource.url);
      setSelectedIcon(editResource.iconName || 'Link');
    } else {
      setSelectedIcon('Link');
    }
  }, [editResource]);

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
        iconName: selectedIcon,
      });
    } else {
      onAddResource({
        name: name.trim(),
        url: urlToAdd,
        icon: 'custom',
        iconName: selectedIcon,
      });
    }

    setName('');
    setUrl('');
    setSelectedIcon('Link');
    setIconSearch('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setUrl('');
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
      return [...faMatches, ...lucideMatches].slice(0, 18);
    }
    
    // Default: show mix of popular FA brands and Lucide icons
    return [...POPULAR_ICONS.fontAwesome.slice(0, 6), ...POPULAR_ICONS.lucide.slice(0, 12)];
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
            placeholder="e.g., Custom Skills"
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
            placeholder="https://docs.anthropic.com/..."
            className={inputStyles}
          />
          {error && (
            <p className="mt-1 text-sm text-[var(--fg-error-primary)]" role="alert">
              {error}
            </p>
          )}
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
                    focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1
                    ${selectedIcon === iconName
                      ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)] text-[var(--fg-brand-primary)]'
                      : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--fg-tertiary)] hover:bg-[var(--bg-quaternary)] hover:text-[var(--fg-primary)]'
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
          
          {/* Selected icon preview */}
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <Icon name={selectedIcon} className="w-5 h-5" />
            </div>
            <span className="text-sm text-[var(--fg-secondary)]">
              Selected: <span className="font-medium text-[var(--fg-primary)]">
                {isFontAwesomeIcon(selectedIcon) 
                  ? selectedIcon.replace('fa-', '').replace(/-/g, ' ')
                  : selectedIcon
                }
              </span>
            </span>
          </div>
        </div>
      </div>

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

// Icon preview component for external use
export function BrainResourceIcon({
  iconName,
  size = 'md',
}: {
  iconName?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return <Icon name={iconName || 'Link'} className={sizeClasses[size]} />;
}
