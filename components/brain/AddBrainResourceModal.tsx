'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Zap, FolderOpen, FileCode, Terminal, PenTool, Link, Search } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { BrainResource } from '@/hooks/useBrainResources';

// Popular icons for quick selection
const POPULAR_ICONS = [
  'Globe', 'Link', 'FileText', 'Folder', 'Cloud', 'Database',
  'Code', 'Terminal', 'Figma', 'Github', 'Slack', 'Chrome',
  'BookOpen', 'Lightbulb', 'Zap', 'Settings', 'Star', 'Heart',
];

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

  // Get all Lucide icon names (filter out Icon suffix duplicates and non-components)
  const allIconNames = Object.keys(LucideIcons).filter(
    (key) => 
      !key.endsWith('Icon') && 
      key !== 'createLucideIcon' && 
      key !== 'default' &&
      key !== 'icons' &&
      /^[A-Z]/.test(key) // Only PascalCase component names
  ).sort();
  
  // When searching, filter all icons; otherwise show popular icons
  // Always limit to 18 icons (3 rows of 6)
  const displayedIcons = iconSearch.trim()
    ? allIconNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 18)
    : POPULAR_ICONS.slice(0, 18);

  const renderIcon = (iconName: string, size: string = 'w-5 h-5') => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className={size} /> : <Link className={size} />;
  };

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
          <label className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            Name <span className="text-[var(--fg-error-primary)]">*</span>
          </label>
          <input
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
          <label className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            URL <span className="text-[var(--fg-error-primary)]">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://docs.anthropic.com/..."
            className={inputStyles}
          />
          {error && <p className="mt-1 text-sm text-[var(--fg-error-primary)]">{error}</p>}
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5">
            Icon
          </label>
          
          {/* Search input - always visible */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" />
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--fg-primary)] placeholder-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-colors"
            />
          </div>
          
          {/* Icon Grid - fixed 3 rows, no scroll */}
          <div className="grid grid-cols-6 gap-2">
            {displayedIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                title={iconName}
                className={`
                  p-2.5 rounded-lg border transition-all flex items-center justify-center
                  ${selectedIcon === iconName
                    ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)] text-[var(--fg-brand-primary)]'
                    : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--fg-tertiary)] hover:bg-[var(--bg-quaternary)] hover:text-[var(--fg-primary)]'
                  }
                `}
              >
                {renderIcon(iconName, 'w-4 h-4')}
              </button>
            ))}
          </div>
          
          {/* Selected icon preview */}
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              {renderIcon(selectedIcon)}
            </div>
            <span className="text-sm text-[var(--fg-secondary)]">
              Selected: <span className="font-medium text-[var(--fg-primary)]">{selectedIcon}</span>
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

// Icon preview component
export function BrainResourceIcon({
  type,
  size = 'md',
}: {
  type: BrainResource['icon'];
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  switch (type) {
    case 'skills':
      return <Zap className={sizeClasses} />;
    case 'projects':
      return <FolderOpen className={sizeClasses} />;
    case 'claude-md':
      return <FileCode className={sizeClasses} />;
    case 'commands':
      return <Terminal className={sizeClasses} />;
    case 'writing-styles':
      return <PenTool className={sizeClasses} />;
    default:
      return <Link className={sizeClasses} />;
  }
}
