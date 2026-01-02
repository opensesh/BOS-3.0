'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button } from '@/components/ui';
import { Plus, AlertCircle } from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description?: string, icon?: string) => { slug: string };
}

// Common emoji icons for spaces
const PRESET_ICONS = [
  '🚀', '💼', '📊', '🎨', '📚', '🔬', '💡', '🎯', 
  '🏆', '🌟', '⚡', '🔥', '🎪', '🌈', '🎭', '🎸'
];

export function CreateSpaceModal({ isOpen, onClose, onCreate }: CreateSpaceModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

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
      setSelectedIcon('');
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
      setSelectedIcon('');
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
          <div className="grid grid-cols-8 gap-2">
            {PRESET_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon === selectedIcon ? '' : icon)}
                disabled={isCreating}
                className={`
                  w-full aspect-square rounded-xl
                  flex items-center justify-center
                  text-2xl
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    selectedIcon === icon
                      ? 'bg-[var(--bg-brand-primary)] ring-2 ring-[var(--focus-ring)]'
                      : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
                aria-label={`Select ${icon} icon`}
              >
                {icon}
              </button>
            ))}
          </div>
          {selectedIcon && (
            <button
              type="button"
              onClick={() => setSelectedIcon('')}
              disabled={isCreating}
              className="text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] transition-colors"
            >
              Clear selection
            </button>
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
