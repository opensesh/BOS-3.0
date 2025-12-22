'use client';

import { useState, useEffect } from 'react';
import { Zap, FolderOpen, FileCode, Terminal, PenTool, Link } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { BrainResource } from '@/hooks/useBrainResources';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (editResource) {
      setName(editResource.name);
      setUrl(editResource.url);
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
      });
    } else {
      onAddResource({
        name: name.trim(),
        url: urlToAdd,
        icon: 'custom',
      });
    }

    setName('');
    setUrl('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setError('');
    onClose();
  };

  // Common input styles using UUI theme tokens
  const inputStyles = `
    w-full px-3 py-2.5 rounded-lg
    bg-[var(--bg-primary_alt)] border border-[var(--border-primary)]
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
