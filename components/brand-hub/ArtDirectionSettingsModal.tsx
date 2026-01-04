'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Check, 
  ChevronDown, 
  Loader2,
  Download,
  Image as ImageIcon,
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useBrandArtDirection } from '@/hooks/useBrandArtDirection';
import type { BrandArtImage, BrandArtImageMetadata, ArtDirectionCategory } from '@/lib/supabase/types';
import { ART_DIRECTION_CATEGORIES } from '@/lib/supabase/brand-art-service';
import { ConfirmDialog } from './BrandHubSettingsModal';

// ============================================
// STATIC ART DIRECTION IMAGES (Pre-populated from brand assets)
// ============================================

interface StaticArtImage {
  id: string;
  name: string;
  category: ArtDirectionCategory;
  photographer?: string;
  tags: string[];
  path: string;
  format: 'png' | 'jpg' | 'webp';
}

const STATIC_ART_IMAGES: StaticArtImage[] = [
  // Auto category
  {
    id: 'auto-audi-quattro',
    name: 'Audi Quattro Urban Portrait',
    category: 'Auto',
    tags: ['urban', 'night', 'precision'],
    path: '/assets/images/auto-audi-quattro-urban-portrait.png',
    format: 'png',
  },
  {
    id: 'auto-bmw-garage',
    name: 'BMW Convertible Garage Night',
    category: 'Auto',
    tags: ['garage', 'night', 'elegance'],
    path: '/assets/images/auto-bmw-convertible-garage-night.png',
    format: 'png',
  },
  {
    id: 'auto-porsche-desert',
    name: 'Desert Porsche Sunset Drift',
    category: 'Auto',
    tags: ['desert', 'sunset', 'speed'],
    path: '/assets/images/auto-desert-porsche-sunset-drift.png',
    format: 'png',
  },
  {
    id: 'auto-night-drive',
    name: 'Night Drive Motion Blur',
    category: 'Auto',
    tags: ['night', 'motion', 'speed'],
    path: '/assets/images/auto-night-drive-motion-blur.png',
    format: 'png',
  },
  // Lifestyle category
  {
    id: 'lifestyle-street-style',
    name: 'Confident Street Style',
    category: 'Lifestyle',
    tags: ['urban', 'fashion', 'confidence'],
    path: '/assets/images/lifestyle-confident-street-style.png',
    format: 'png',
  },
  {
    id: 'lifestyle-editorial',
    name: 'Editorial Look Urban',
    category: 'Lifestyle',
    tags: ['editorial', 'fashion', 'urban'],
    path: '/assets/images/lifestyle-editorial-look-urban.png',
    format: 'png',
  },
  {
    id: 'lifestyle-modern',
    name: 'Modern Aesthetic Pose',
    category: 'Lifestyle',
    tags: ['modern', 'aesthetic', 'bold'],
    path: '/assets/images/lifestyle-modern-aesthetic-pose.png',
    format: 'png',
  },
  // Move category
  {
    id: 'move-dance-flow',
    name: 'Abstract Dance Flow',
    category: 'Move',
    tags: ['dance', 'flow', 'energy'],
    path: '/assets/images/move-abstract-dance-flow.png',
    format: 'png',
  },
  {
    id: 'move-athletic',
    name: 'Athletic Motion Energy',
    category: 'Move',
    tags: ['athletic', 'motion', 'energy'],
    path: '/assets/images/move-athletic-motion-energy.png',
    format: 'png',
  },
  {
    id: 'move-kinetic',
    name: 'Kinetic Energy Motion',
    category: 'Move',
    tags: ['kinetic', 'energy', 'momentum'],
    path: '/assets/images/move-kinetic-energy-motion.png',
    format: 'png',
  },
  // Escape category
  {
    id: 'escape-astronaut',
    name: 'Astronaut Sparkle Floating',
    category: 'Escape',
    tags: ['surreal', 'dreams', 'wonder'],
    path: '/assets/images/escape-astronaut-sparkle-floating.png',
    format: 'png',
  },
  {
    id: 'escape-cliffside',
    name: 'Cliffside Workspace Ocean View',
    category: 'Escape',
    tags: ['remote', 'freedom', 'adventure'],
    path: '/assets/images/escape-cliffside-workspace-ocean-view.png',
    format: 'png',
  },
  {
    id: 'escape-desert',
    name: 'Desert Silhouette Wanderer',
    category: 'Escape',
    tags: ['desert', 'freedom', 'remote'],
    path: '/assets/images/escape-desert-silhouette-wanderer.png',
    format: 'png',
  },
  // Work category
  {
    id: 'work-presentation',
    name: 'Business Presentation',
    category: 'Work',
    tags: ['leadership', 'collaboration', 'purpose'],
    path: '/assets/images/work-business-presentation.png',
    format: 'png',
  },
  {
    id: 'work-collaboration',
    name: 'Professional Collaboration',
    category: 'Work',
    tags: ['collaboration', 'innovation', 'growth'],
    path: '/assets/images/work-professional-collaboration.png',
    format: 'png',
  },
  {
    id: 'work-meeting',
    name: 'Team Meeting Discussion',
    category: 'Work',
    tags: ['collaboration', 'focus', 'purpose'],
    path: '/assets/images/work-team-meeting-discussion.png',
    format: 'png',
  },
  // Feel category
  {
    id: 'feel-abstract',
    name: 'Abstract Figure Warm Tones',
    category: 'Feel',
    tags: ['abstract', 'warmth', 'intimacy'],
    path: '/assets/images/feel-abstract-figure-warm-tones.png',
    format: 'png',
  },
  {
    id: 'feel-ethereal',
    name: 'Ethereal Portrait Softness',
    category: 'Feel',
    tags: ['softness', 'poetic', 'intimacy'],
    path: '/assets/images/feel-ethereal-portrait-softness.png',
    format: 'png',
  },
  {
    id: 'feel-flowing',
    name: 'Flowing Fabric Grace',
    category: 'Feel',
    tags: ['texture', 'grace', 'poetic'],
    path: '/assets/images/feel-flowing-fabric-grace.png',
    format: 'png',
  },
];

interface ArtDirectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// CATEGORY SELECT DROPDOWN (with Add New option)
// ============================================

// Default categories + any custom ones the user adds
const DEFAULT_CATEGORIES: string[] = ['Auto', 'Lifestyle', 'Move', 'Escape', 'Work', 'Feel'];

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  customCategories?: string[];
  onAddCategory?: (category: string) => void;
}

function CategorySelect({ value, onChange, disabled, customCategories = [], onAddCategory }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine default and custom categories
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories.filter(c => !DEFAULT_CATEGORIES.includes(c))];

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const dropdownHeight = 280;
      
      if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  const handleAddNew = () => {
    if (newValue.trim()) {
      const formattedValue = newValue.trim();
      onChange(formattedValue);
      onAddCategory?.(formattedValue);
      setNewValue('');
      setIsAddingNew(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-colors min-w-[80px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <span className="text-[var(--fg-primary)] truncate">{value}</span>
        <ChevronDown className={`w-3 h-3 text-[var(--fg-tertiary)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -4 : 4 }}
            className={`absolute left-0 z-[100] py-1 min-w-[160px] max-h-[260px] overflow-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl ${
              dropdownPosition === 'bottom' 
                ? 'top-full mt-1' 
                : 'bottom-full mb-1'
            }`}
          >
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onChange(category);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  value === category ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-primary)]'
                }`}
              >
                <span>{category}</span>
                {value === category && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
            
            {/* Add new category option */}
            <div className="border-t border-[var(--border-secondary)] my-1" />
            {isAddingNew ? (
              <div className="px-2 py-1.5 flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNew();
                    if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewValue('');
                    }
                  }}
                  placeholder="Category name..."
                  className="flex-1 px-2 py-1 text-xs rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--fg-primary)] focus:outline-none focus:border-[var(--border-brand)]"
                />
                <button
                  onClick={handleAddNew}
                  disabled={!newValue.trim()}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-brand-primary)] disabled:opacity-50"
                  title="Save"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewValue('');
                  }}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-brand-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add new</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// STATIC ART IMAGE ROW (Pre-populated images)
// ============================================

interface StaticArtImageRowProps {
  image: StaticArtImage;
  onDownload: (path: string, name: string) => void;
}

function StaticArtImageRow({ image, onDownload }: StaticArtImageRowProps) {
  const getCategoryColor = (category: ArtDirectionCategory) => {
    switch (category) {
      case 'Auto':
        return 'bg-blue-500/10 text-blue-500';
      case 'Lifestyle':
        return 'bg-pink-500/10 text-pink-500';
      case 'Move':
        return 'bg-orange-500/10 text-orange-500';
      case 'Escape':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'Work':
        return 'bg-purple-500/10 text-purple-500';
      case 'Feel':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]';
    }
  };

  return (
    <tr className="group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors">
      {/* Preview */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
          <img 
            src={image.path} 
            alt={image.name} 
            className="w-full h-full object-cover"
          />
        </div>
      </td>

      {/* Name */}
      <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
        <span className="text-xs sm:text-sm font-medium text-[var(--fg-primary)] truncate block">
          {image.name}
        </span>
      </td>

      {/* Category */}
      <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px]">
        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded ${getCategoryColor(image.category)}`}>
          {image.category}
        </span>
      </td>

      {/* Photographer - hidden on mobile */}
      <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px] hidden sm:table-cell">
        <span className="text-[10px] sm:text-xs text-[var(--fg-tertiary)]">
          {image.photographer || '—'}
        </span>
      </td>

      {/* Tags - hidden on mobile and tablet */}
      <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] hidden md:table-cell">
        <span className="text-[10px] text-[var(--fg-muted)] truncate block" title={image.tags.join(', ')}>
          {image.tags.slice(0, 3).join(', ')}
        </span>
      </td>

      {/* Format - hidden on mobile and tablet */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          {image.format}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="flex items-center justify-end">
          <button
            onClick={() => onDownload(image.path, `${image.id}.${image.format}`)}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            title="Download"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// DYNAMIC ART IMAGE ROW (User-added images)
// ============================================

interface EditingArtImage {
  name: string;
  category: ArtDirectionCategory;
  photographer: string;
  tags: string;
  altText: string;
}

interface ArtImageRowProps {
  image: BrandArtImage;
  isEditing: boolean;
  editValues: EditingArtImage | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateField: <K extends keyof EditingArtImage>(field: K, value: EditingArtImage[K]) => void;
  onSave: () => void;
  onDelete: () => void;
  onDownload: (image: BrandArtImage) => void;
  isSaving: boolean;
}

function ArtImageRow({
  image,
  isEditing,
  editValues,
  onStartEdit,
  onCancelEdit,
  onUpdateField,
  onSave,
  onDelete,
  onDownload,
  isSaving,
}: ArtImageRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHoveringConfirm, setIsHoveringConfirm] = useState(false);

  // Editing is disabled until authentication is set up
  const EDITING_DISABLED = true;

  const meta = image.metadata as BrandArtImageMetadata;
  const category = meta.artCategory || 'Auto';
  const photographer = meta.photographer || '';
  const tags = meta.tags || [];
  const format = image.mimeType?.split('/')[1] || 'png';

  const getCategoryColor = (cat: ArtDirectionCategory) => {
    switch (cat) {
      case 'Auto':
        return 'bg-blue-500/10 text-blue-500';
      case 'Lifestyle':
        return 'bg-pink-500/10 text-pink-500';
      case 'Move':
        return 'bg-orange-500/10 text-orange-500';
      case 'Escape':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'Work':
        return 'bg-purple-500/10 text-purple-500';
      case 'Feel':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]';
    }
  };

  return (
    <>
      <tr className={`group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-colors ${
        isEditing ? 'bg-[var(--bg-secondary)]/40' : ''
      }`}>
        {/* Preview */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
            {image.publicUrl ? (
              <img 
                src={image.publicUrl} 
                alt={image.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fg-muted)]" />
            )}
          </div>
        </td>

        {/* Name */}
        <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              disabled={EDITING_DISABLED}
              className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-xs sm:text-sm font-medium text-[var(--fg-primary)] truncate block">
              {image.name}
            </span>
          )}
        </td>

        {/* Category */}
        <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px]">
          {isEditing && editValues ? (
            <CategorySelect
              value={editValues.category}
              onChange={(value) => onUpdateField('category', value)}
              disabled={EDITING_DISABLED}
            />
          ) : (
            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded ${getCategoryColor(category)}`}>
              {category}
            </span>
          )}
        </td>

        {/* Photographer - hidden on mobile */}
        <td className="py-2 px-2 sm:px-3 w-[80px] sm:w-[100px] hidden sm:table-cell">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.photographer}
              onChange={(e) => onUpdateField('photographer', e.target.value)}
              disabled={EDITING_DISABLED}
              placeholder="Photographer"
              className="w-full px-2 py-1 text-xs rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-[10px] sm:text-xs text-[var(--fg-tertiary)]">
              {photographer || '—'}
            </span>
          )}
        </td>

        {/* Tags - hidden on mobile and tablet */}
        <td className="py-2 px-2 sm:px-3 w-[100px] sm:w-[140px] hidden md:table-cell">
          {isEditing && editValues ? (
            <input
              type="text"
              value={editValues.tags}
              onChange={(e) => onUpdateField('tags', e.target.value)}
              disabled={EDITING_DISABLED}
              placeholder="tag1, tag2, tag3"
              className="w-full px-2 py-1 text-xs rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-muted)] focus:border-[var(--border-brand)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <span className="text-[10px] text-[var(--fg-muted)] truncate block" title={tags.join(', ')}>
              {tags.length > 0 ? tags.slice(0, 3).join(', ') : '—'}
            </span>
          )}
        </td>

        {/* Format - hidden on mobile and tablet */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
          <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
            {format}
          </span>
        </td>

        {/* Actions */}
        <td className="py-2 px-2 sm:px-3 w-[50px] sm:w-[60px]">
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={onSave}
                  disabled={isSaving || EDITING_DISABLED}
                  onMouseEnter={() => setIsHoveringConfirm(true)}
                  onMouseLeave={() => setIsHoveringConfirm(false)}
                  className={`p-1 sm:p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isHoveringConfirm 
                      ? 'bg-[var(--bg-brand-solid)] border-[var(--bg-brand-solid)] text-white' 
                      : 'border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] bg-transparent'
                  }`}
                  title="Save"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                </button>
                <button
                  onClick={onCancelEdit}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                  title="Cancel"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onDownload(image)}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  title="Download"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={onStartEdit}
                  disabled={EDITING_DISABLED}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed sm:group-hover:disabled:opacity-30"
                  title={EDITING_DISABLED ? "Editing disabled" : "Edit"}
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={EDITING_DISABLED}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--fg-tertiary)] hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed sm:group-hover:disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--fg-tertiary)]"
                  title={EDITING_DISABLED ? "Deleting disabled" : "Delete"}
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Delete Image"
        message={`Are you sure you want to delete "${image.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

// ============================================
// ADD ART IMAGE ROW
// ============================================

interface AddArtImageRowProps {
  onAdd: (data: {
    file: File;
    name: string;
    category: ArtDirectionCategory;
    photographer: string;
    tags: string;
    altText: string;
  }) => void;
  onCancel: () => void;
  isAdding: boolean;
}

function AddArtImageRow({ onAdd, onCancel, isAdding }: AddArtImageRowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ArtDirectionCategory>('Auto');
  const [photographer, setPhotographer] = useState('');
  const [tags, setTags] = useState('');
  const [altText, setAltText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringConfirm, setIsHoveringConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Auto-populate name from filename
    if (!name) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameWithoutExt.replace(/[-_]/g, ' ');
      setName(cleanName);
      
      // Try to detect category from filename
      const lowerName = nameWithoutExt.toLowerCase();
      if (lowerName.includes('auto') || lowerName.includes('car') || lowerName.includes('porsche') || lowerName.includes('bmw') || lowerName.includes('audi')) {
        setCategory('Auto');
      } else if (lowerName.includes('lifestyle') || lowerName.includes('fashion') || lowerName.includes('street')) {
        setCategory('Lifestyle');
      } else if (lowerName.includes('move') || lowerName.includes('dance') || lowerName.includes('athletic') || lowerName.includes('motion')) {
        setCategory('Move');
      } else if (lowerName.includes('escape') || lowerName.includes('travel') || lowerName.includes('adventure')) {
        setCategory('Escape');
      } else if (lowerName.includes('work') || lowerName.includes('office') || lowerName.includes('business')) {
        setCategory('Work');
      } else if (lowerName.includes('feel') || lowerName.includes('abstract') || lowerName.includes('texture')) {
        setCategory('Feel');
      }
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = () => {
    if (!file || !name.trim()) return;
    onAdd({
      file,
      name: name.trim(),
      category,
      photographer: photographer.trim(),
      tags: tags.trim(),
      altText: altText.trim(),
    });
  };

  const isValid = file && name.trim();

  const getCategoryColor = (cat: ArtDirectionCategory) => {
    switch (cat) {
      case 'Auto':
        return 'bg-blue-500/10 text-blue-500';
      case 'Lifestyle':
        return 'bg-pink-500/10 text-pink-500';
      case 'Move':
        return 'bg-orange-500/10 text-orange-500';
      case 'Escape':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'Work':
        return 'bg-purple-500/10 text-purple-500';
      case 'Feel':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]';
    }
  };

  return (
    <tr className="border-b border-[var(--border-brand)] bg-[var(--bg-brand-primary)]/5">
      {/* File Upload */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <label
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed transition-colors overflow-hidden ${
            isDragging
              ? 'border-[var(--border-brand)] bg-[var(--bg-brand-primary)]'
              : file
                ? 'border-[var(--border-brand)] bg-[var(--bg-secondary)]'
                : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-brand)]'
          }`}
        >
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fg-tertiary)]" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </td>

      {/* Name */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[100px] sm:w-[140px] md:w-[180px]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Image name"
          autoFocus
          className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Category */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[80px] sm:w-[100px]">
        <CategorySelect
          value={category}
          onChange={setCategory}
        />
      </td>

      {/* Photographer - hidden on mobile */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[80px] sm:w-[100px] hidden sm:table-cell">
        <input
          type="text"
          value={photographer}
          onChange={(e) => setPhotographer(e.target.value)}
          placeholder="Photographer"
          className="w-full px-2 py-1 text-xs rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-primary)] focus:outline-none"
        />
      </td>

      {/* Tags - hidden on mobile and tablet */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[100px] sm:w-[140px] hidden md:table-cell">
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tag1, tag2, tag3"
          className="w-full px-2 py-1 text-xs rounded border border-[var(--border-brand)] bg-[var(--bg-primary)] text-[var(--fg-muted)] focus:outline-none"
        />
      </td>

      {/* Format - hidden on mobile and tablet */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px] hidden md:table-cell">
        <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">
          {file ? file.type.split('/')[1] : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 sm:py-3 px-2 sm:px-3 w-[50px] sm:w-[60px]">
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <button
            onClick={handleSubmit}
            disabled={isAdding || !isValid}
            onMouseEnter={() => setIsHoveringConfirm(true)}
            onMouseLeave={() => setIsHoveringConfirm(false)}
            className={`p-1 sm:p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isHoveringConfirm && isValid
                ? 'bg-[var(--bg-brand-solid)] border-[var(--bg-brand-solid)] text-white' 
                : 'border-[var(--fg-brand-primary)] text-[var(--fg-brand-primary)] bg-transparent'
            }`}
            title="Add image"
          >
            {isAdding ? (
              <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            ) : (
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </button>
          <button
            onClick={onCancel}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            title="Cancel"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================

export function ArtDirectionSettingsModal({ isOpen, onClose }: ArtDirectionSettingsModalProps) {
  const {
    images,
    isLoading,
    uploadImageFile,
    editImage,
    removeImage,
  } = useBrandArtDirection();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditingArtImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = useCallback((image: BrandArtImage) => {
    const meta = image.metadata as BrandArtImageMetadata;
    setEditingId(image.id);
    setEditValues({
      name: image.name,
      category: meta.artCategory || 'Auto',
      photographer: meta.photographer || '',
      tags: meta.tags?.join(', ') || '',
      altText: meta.altText || '',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues(null);
  }, []);

  const handleUpdateField = useCallback(<K extends keyof EditingArtImage>(
    field: K,
    value: EditingArtImage[K]
  ) => {
    setEditValues(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editValues) return;

    setIsSaving(true);
    setError(null);
    try {
      await editImage(editingId, {
        name: editValues.name,
        metadata: {
          artCategory: editValues.category,
          photographer: editValues.photographer || undefined,
          tags: editValues.tags ? editValues.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          altText: editValues.altText || undefined,
        },
      });
      setEditingId(null);
      setEditValues(null);
    } catch (err) {
      console.error('Error saving image:', err);
      setError(err instanceof Error ? err.message : 'Failed to save image');
    } finally {
      setIsSaving(false);
    }
  }, [editingId, editValues, editImage]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await removeImage(id);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsSaving(false);
    }
  }, [removeImage]);

  const handleAddImage = useCallback(async (data: {
    file: File;
    name: string;
    category: ArtDirectionCategory;
    photographer: string;
    tags: string;
    altText: string;
  }) => {
    setIsSaving(true);
    setError(null);
    try {
      const metadata: BrandArtImageMetadata = {
        artCategory: data.category,
        photographer: data.photographer || undefined,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        altText: data.altText || undefined,
      };

      await uploadImageFile(data.file, data.name, metadata);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding image:', err);
      setError(err instanceof Error ? err.message : 'Failed to add image');
    } finally {
      setIsSaving(false);
    }
  }, [uploadImageFile]);

  const handleDownloadImage = useCallback((image: BrandArtImage) => {
    if (image.publicUrl) {
      const link = document.createElement('a');
      link.href = image.publicUrl;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const handleDownloadStaticImage = useCallback((path: string, filename: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Sort images by category, then by name
  const sortedImages = [...images].sort((a, b) => {
    const metaA = a.metadata as BrandArtImageMetadata;
    const metaB = b.metadata as BrandArtImageMetadata;
    const categoryOrder = ['Auto', 'Lifestyle', 'Move', 'Escape', 'Work', 'Feel'];
    const catA = categoryOrder.indexOf(metaA.artCategory || 'Auto');
    const catB = categoryOrder.indexOf(metaB.artCategory || 'Auto');
    
    if (catA !== catB) {
      return catA - catB;
    }
    return a.name.localeCompare(b.name);
  });

  // Total count includes both static and dynamic images
  const totalImageCount = STATIC_ART_IMAGES.length + images.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal container - Full screen flex for centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[65vh] overflow-hidden rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-primary)] shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-display font-bold text-[var(--fg-primary)]">
                    Manage Art Direction
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--fg-tertiary)]">
                    {totalImageCount} image{totalImageCount !== 1 ? 's' : ''} in your art direction library
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Add Image Button */}
                  <motion.button
                    onClick={() => setIsAddingNew(true)}
                    disabled={isAddingNew}
                    className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-brand-primary)] border border-[var(--border-primary)] hover:border-[var(--border-brand)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add new image"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] transition-colors" />
                  </motion.button>
                  
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mx-4 sm:mx-5 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Table Content - Scrollable area */}
              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-brand-primary)]" />
                    <span className="text-[var(--fg-tertiary)]">Loading images...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)] z-10">
                        <tr>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px]">
                            
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px] sm:w-[140px] md:w-[180px]">
                            Name
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px] sm:w-[100px]">
                            Category
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[80px] sm:w-[100px] hidden sm:table-cell">
                            Photographer
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[100px] sm:w-[140px] hidden md:table-cell">
                            Tags
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-left text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px] hidden md:table-cell">
                            Format
                          </th>
                          <th className="py-2.5 px-2 sm:px-3 text-right text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider w-[50px] sm:w-[60px]">
                            
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Add new image row (when active) */}
                        {isAddingNew && (
                          <AddArtImageRow
                            onAdd={handleAddImage}
                            onCancel={() => setIsAddingNew(false)}
                            isAdding={isSaving}
                          />
                        )}
                        
                        {/* Static pre-populated images */}
                        {STATIC_ART_IMAGES.map((image) => (
                          <StaticArtImageRow
                            key={`static-${image.id}`}
                            image={image}
                            onDownload={handleDownloadStaticImage}
                          />
                        ))}
                        
                        {/* Dynamic user-added images from Supabase */}
                        {sortedImages.map((image) => (
                          <ArtImageRow
                            key={image.id}
                            image={image}
                            isEditing={editingId === image.id}
                            editValues={editingId === image.id ? editValues : null}
                            onStartEdit={() => handleStartEdit(image)}
                            onCancelEdit={handleCancelEdit}
                            onUpdateField={handleUpdateField}
                            onSave={handleSaveEdit}
                            onDelete={() => handleDelete(image.id)}
                            onDownload={handleDownloadImage}
                            isSaving={isSaving}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="p-3 sm:p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 shrink-0">
                <p className="text-[10px] sm:text-xs text-[var(--fg-muted)]">
                  <span className="hidden sm:inline">Upload art direction images using the + button. Supported formats: JPEG, PNG, WebP.</span>
                  <span className="sm:hidden">Use + to add new images.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
