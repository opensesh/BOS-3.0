'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { Plus, AlertCircle, Search } from 'lucide-react';
import { 
  getAllLucideIconNames, 
  FA_BRAND_ICONS, 
  POPULAR_ICONS,
  isFontAwesomeIcon 
} from '@/lib/icons';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description?: string, icon?: string) => { slug: string };
}

// Tab types for the icon picker
type IconTab = 'popular' | 'brands' | 'all';

export function CreateSpaceModal({ isOpen, onClose, onCreate }: CreateSpaceModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Rocket');
  const [iconSearch, setIconSearch] = useState('');
  const [iconTab, setIconTab] = useState<IconTab>('popular');
  const [isCreating, setIsCreating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Get all Lucide icons once
  const allLucideIcons = useMemo(() => getAllLucideIconNames(), []);

  // Get displayed icons based on tab and search
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
      
      // Interleave results: show FA matches first
      return [...faMatches, ...lucideMatches].slice(0, 24);
    }
    
    switch (iconTab) {
      case 'popular':
        // Mix of popular Lucide and FA icons
        return [...POPULAR_ICONS.fontAwesome.slice(0, 6), ...POPULAR_ICONS.lucide.slice(0, 12)];
      case 'brands':
        // Font Awesome brand icons only
        return FA_BRAND_ICONS.slice(0, 24).map(i => i.name);
      case 'all':
        // All Lucide icons
        return allLucideIcons.slice(0, 24);
      default:
        return [];
    }
  }, [iconSearch, iconTab, allLucideIcons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setShowValidation(true);
      return;
    }

    setIsCreating(true);
    setShowValidation(false);

    try {
      const newSpace = onCreate(title.trim(), description.trim() || undefined, selectedIcon || undefined);
      
      setTitle('');
      setDescription('');
      setSelectedIcon('Rocket');
      setIconSearch('');
      onClose();
      router.push(`/spaces/${newSpace.slug}`);
    } catch (error) {
      console.error('Error creating space:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTitle('');
      setDescription('');
      setSelectedIcon('Rocket');
      setIconSearch('');
      setShowValidation(false);
      onClose();
    }
  };

  // Clear validation when user starts typing
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (e.target.value.trim()) {
      setShowValidation(false);
    }
  };

  const hasValidationError = showValidation && !title.trim();

  // Tab button styles
  const tabStyles = (isActive: boolean) => `
    px-3 py-1.5 text-xs font-medium rounded-md transition-colors
    ${isActive 
      ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]' 
      : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
    }
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create a Space"
      size="lg"
      showCloseButton={!isCreating}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="space-title"
            className="block text-sm font-medium text-[var(--fg-primary)]"
          >
            Title <span className="text-[var(--fg-brand-primary)]">*</span>
          </label>
          <input
            id="space-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g., Marketing Research, Design System, Q4 Strategy"
            disabled={isCreating}
            className={`
              w-full px-4 py-2.5 rounded-lg
              bg-primary-alt
              border
              text-[var(--fg-primary)] placeholder:text-[var(--fg-placeholder)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-disabled)]
              ${hasValidationError ? 'border-[var(--border-error)]' : 'border-[var(--border-primary)]'}
            `}
            autoFocus
          />
          {hasValidationError && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--fg-error-primary)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Please enter a title for your space</span>
            </div>
          )}
        </div>

        {/* Description Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="space-description"
            className="block text-sm font-medium text-[var(--fg-primary)]"
          >
            Description <span className="text-xs text-[var(--fg-quaternary)]">(Optional)</span>
          </label>
          <textarea
            id="space-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this space for? Add context for AI and collaborators..."
            rows={3}
            disabled={isCreating}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-primary-alt
              border border-[var(--border-primary)]
              text-[var(--fg-primary)] placeholder:text-[var(--fg-placeholder)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent
              transition-all duration-200
              resize-none
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-disabled)]
            "
          />
        </div>

        {/* Icon Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--fg-primary)]">
            Icon <span className="text-xs text-[var(--fg-quaternary)]">(Optional)</span>
          </label>
          
          {/* Tabs */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => { setIconTab('popular'); setIconSearch(''); }}
              className={tabStyles(iconTab === 'popular' && !iconSearch)}
              disabled={isCreating}
            >
              Popular
            </button>
            <button
              type="button"
              onClick={() => { setIconTab('brands'); setIconSearch(''); }}
              className={tabStyles(iconTab === 'brands' && !iconSearch)}
              disabled={isCreating}
            >
              Brands
            </button>
            <button
              type="button"
              onClick={() => { setIconTab('all'); setIconSearch(''); }}
              className={tabStyles(iconTab === 'all' && !iconSearch)}
              disabled={isCreating}
            >
              All Icons
            </button>
          </div>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" aria-hidden="true" />
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Search icons... (try 'notion', 'slack', 'google')"
              aria-label="Search icons"
              disabled={isCreating}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-colors disabled:opacity-50"
            />
          </div>
          
          {/* Icon Grid */}
          <div 
            className="grid grid-cols-8 gap-2" 
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
                  disabled={isCreating}
                  className={`
                    w-full aspect-square rounded-xl
                    flex items-center justify-center
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${selectedIcon === iconName
                      ? 'bg-[var(--bg-brand-primary)] ring-2 ring-[var(--focus-ring)] text-[var(--fg-brand-primary)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg-primary)]'
                    }
                  `}
                  aria-label={`Select ${displayName} icon`}
                >
                  <Icon name={iconName} className="w-5 h-5" aria-hidden="true" />
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
          {selectedIcon && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-tertiary)]">
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
              <button
                type="button"
                onClick={() => setSelectedIcon('')}
                disabled={isCreating}
                className="ml-auto text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
          <Button
            type="button"
            color="secondary"
            size="md"
            onClick={handleClose}
            isDisabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            size="md"
            isLoading={isCreating}
            iconLeading={!isCreating ? Plus : undefined}
          >
            {isCreating ? 'Creating...' : 'Create Space'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
