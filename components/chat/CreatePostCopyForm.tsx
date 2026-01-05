'use client';

import React, { useState, useCallback, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Upload,
  Link as LinkIcon,
  ChevronDown,
  ArrowRight,
  Loader2,
  Check,
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  Twitter,
} from 'lucide-react';
import {
  type SocialPlatform,
  type ContentType,
  type PostGoal,
  type TonePreset,
  type PostCopyFormData,
  type ReferenceFile,
  type ReferenceUrl,
  PLATFORMS,
  GOALS,
  DEFAULT_CONTENT_PILLARS,
  getContentTypesForPlatforms,
  generateFormId,
} from '@/lib/quick-actions';

// =============================================================================
// Types
// =============================================================================

interface CreatePostCopyFormProps {
  /** Initial form data (for editing/resuming) */
  initialData?: Partial<PostCopyFormData>;
  /** Called when form is submitted */
  onSubmit: (data: PostCopyFormData) => void;
  /** Called when form is cancelled */
  onCancel: () => void;
  /** Loading state during submission */
  isSubmitting?: boolean;
}

// =============================================================================
// Platform Icons
// =============================================================================

const PlatformIcons: Record<SocialPlatform, React.FC<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  x: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  pinterest: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.92s-.36-.72-.36-1.78c0-1.67.97-2.91 2.17-2.91 1.02 0 1.52.77 1.52 1.69 0 1.03-.65 2.57-.99 3.99-.28 1.19.6 2.16 1.77 2.16 2.13 0 3.76-2.24 3.76-5.48 0-2.87-2.06-4.87-5-4.87-3.4 0-5.4 2.55-5.4 5.2 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.43-2.87-2.43-4.63 0-3.77 2.74-7.24 7.9-7.24 4.15 0 7.38 2.96 7.38 6.92 0 4.12-2.6 7.44-6.21 7.44-1.21 0-2.35-.63-2.74-1.38l-.75 2.84c-.27 1.04-.99 2.34-1.48 3.14A12 12 0 1 0 12 0z" />
    </svg>
  ),
  threads: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.8-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.107-1.168 3.453-1.149 1.027.015 1.942.186 2.744.513.017-.903-.063-1.726-.363-2.387-.313-.689-.826-1.093-1.523-1.199a3.712 3.712 0 0 0-.534-.032c-1.03.014-1.873.374-2.507 1.07l-1.473-1.393c.992-1.09 2.368-1.69 3.87-1.69h.164c1.636.105 2.855.831 3.625 2.162.676 1.168.846 2.63.767 4.376.612.344 1.132.756 1.556 1.233.77.867 1.273 1.933 1.495 3.167.222 1.234.109 2.504-.34 3.775-.898 2.547-2.903 4.282-5.638 4.882a11.936 11.936 0 0 1-2.404.238zm-.09-7.345c-.741-.008-1.379.152-1.843.465-.42.284-.633.644-.617 1.042.017.42.226.77.624 1.042.452.309 1.092.468 1.8.43.963-.052 1.7-.376 2.19-1.02.372-.487.604-1.122.7-1.905a7.14 7.14 0 0 0-2.854-.554z" />
    </svg>
  ),
};

// =============================================================================
// Sub-components
// =============================================================================

interface PlatformChipProps {
  platform: SocialPlatform;
  isSelected: boolean;
  onToggle: () => void;
}

function PlatformChip({ platform, isSelected, onToggle }: PlatformChipProps) {
  const platformData = PLATFORMS.find(p => p.id === platform);
  if (!platformData) return null;
  
  const Icon = PlatformIcons[platform];
  
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`
        inline-flex items-center gap-1.5 px-3 py-2
        border rounded-md transition-colors
        font-mono text-sm
        ${isSelected 
          ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)] text-[var(--fg-brand-primary)]' 
          : 'bg-transparent border-[var(--border-secondary)] text-[var(--fg-secondary)] hover:border-[var(--border-primary)] hover:text-[var(--fg-primary)]'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4" />
      <span>{platformData.shortLabel}</span>
    </motion.button>
  );
}

interface ContentTypeChipProps {
  type: ContentType;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ContentTypeChip({ type, label, isSelected, onSelect }: ContentTypeChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`
        px-4 py-2 border rounded-md transition-colors
        font-mono text-sm
        ${isSelected 
          ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)] text-[var(--fg-brand-primary)]' 
          : 'bg-transparent border-[var(--border-secondary)] text-[var(--fg-secondary)] hover:border-[var(--border-primary)] hover:text-[var(--fg-primary)]'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}

interface GoalRadioProps {
  goal: PostGoal;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function GoalRadio({ goal, label, isSelected, onSelect }: GoalRadioProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        inline-flex items-center gap-2 text-sm font-mono
        ${isSelected ? 'text-[var(--fg-primary)]' : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'}
        transition-colors
      `}
    >
      <span className="text-[var(--fg-quaternary)]">(</span>
      <span className={isSelected ? 'text-[var(--fg-brand-primary)]' : ''}>{isSelected ? '•' : ' '}</span>
      <span className="text-[var(--fg-quaternary)]">)</span>
      <span>{label}</span>
    </button>
  );
}

interface ToneSliderProps {
  value: TonePreset;
  onChange: (value: TonePreset) => void;
}

function ToneSlider({ value, onChange }: ToneSliderProps) {
  const tones: TonePreset[] = ['casual', 'balanced', 'professional'];
  const labels: Record<TonePreset, string> = {
    casual: 'Casual',
    balanced: 'Balanced',
    professional: 'Professional',
  };
  
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-[var(--fg-quaternary)]">[</span>
      <button
        type="button"
        onClick={() => {
          const idx = tones.indexOf(value);
          if (idx > 0) onChange(tones[idx - 1]);
        }}
        className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
        disabled={value === 'casual'}
      >
        ←
      </button>
      <span className="min-w-[100px] text-center text-[var(--fg-primary)]">
        {labels[value]}
      </span>
      <button
        type="button"
        onClick={() => {
          const idx = tones.indexOf(value);
          if (idx < tones.length - 1) onChange(tones[idx + 1]);
        }}
        className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
        disabled={value === 'professional'}
      >
        →
      </button>
      <span className="text-[var(--fg-quaternary)]">]</span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CreatePostCopyForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreatePostCopyFormProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [channels, setChannels] = useState<SocialPlatform[]>(initialData?.channels || []);
  const [contentType, setContentType] = useState<ContentType>(initialData?.contentType || 'post');
  const [goal, setGoal] = useState<PostGoal>(initialData?.goal || 'engagement');
  const [keyMessage, setKeyMessage] = useState(initialData?.keyMessage || '');
  const [contentPillar, setContentPillar] = useState(initialData?.contentPillar || '');
  const [tone, setTone] = useState<TonePreset>(initialData?.tone || 'balanced');
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>(initialData?.references?.files || []);
  const [referenceUrls, setReferenceUrls] = useState<ReferenceUrl[]>(initialData?.references?.urls || []);
  const [urlInput, setUrlInput] = useState('');
  const [isPillarDropdownOpen, setIsPillarDropdownOpen] = useState(false);
  const [customPillars, setCustomPillars] = useState<string[]>([]);
  
  // Get available content types based on selected platforms
  const availableContentTypes = getContentTypesForPlatforms(channels);
  
  // Reset content type if current selection isn't available
  React.useEffect(() => {
    if (channels.length > 0 && !availableContentTypes.some(ct => ct.id === contentType)) {
      if (availableContentTypes.length > 0) {
        setContentType(availableContentTypes[0].id);
      }
    }
  }, [channels, availableContentTypes, contentType]);
  
  // Handlers
  const toggleChannel = useCallback((platform: SocialPlatform) => {
    setChannels(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  }, []);
  
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: ReferenceFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
          preview: file.type.startsWith('image/') ? reader.result as string : undefined,
        };
        setReferenceFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  }, []);
  
  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    
    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      return;
    }
    
    const newUrl: ReferenceUrl = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: urlInput.trim(),
    };
    
    setReferenceUrls(prev => [...prev, newUrl]);
    setUrlInput('');
  }, [urlInput]);
  
  const handleRemoveFile = useCallback((id: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== id));
  }, []);
  
  const handleRemoveUrl = useCallback((id: string) => {
    setReferenceUrls(prev => prev.filter(u => u.id !== id));
  }, []);
  
  const handleSubmit = useCallback(() => {
    if (channels.length === 0 || !keyMessage.trim()) return;
    
    const formData: PostCopyFormData = {
      channels,
      contentType,
      goal,
      keyMessage: keyMessage.trim(),
      contentPillar: contentPillar || undefined,
      tone,
      references: {
        files: referenceFiles,
        urls: referenceUrls,
      },
      formId: generateFormId(),
      createdAt: new Date().toISOString(),
    };
    
    onSubmit(formData);
  }, [channels, contentType, goal, keyMessage, contentPillar, tone, referenceFiles, referenceUrls, onSubmit]);
  
  const isValid = channels.length > 0 && keyMessage.trim().length > 0;
  
  const allPillars = [...DEFAULT_CONTENT_PILLARS, ...customPillars];
  
  return (
    <div className="w-full max-w-2xl font-mono">
      {/* Form Container with ASCII-style border */}
      <div className="border border-[var(--border-secondary)] rounded-lg bg-[var(--bg-secondary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
          <h3 className="text-sm font-medium text-[var(--fg-primary)]">Create Post Copy</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
            aria-label="Close form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Form Content */}
        <div className="p-4 space-y-6">
          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
              Channel
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.slice(0, 4).map(platform => (
                <PlatformChip
                  key={platform.id}
                  platform={platform.id}
                  isSelected={channels.includes(platform.id)}
                  onToggle={() => toggleChannel(platform.id)}
                />
              ))}
              {/* More platforms dropdown */}
              <div className="relative">
                <motion.button
                  type="button"
                  className="px-3 py-2 border border-[var(--border-secondary)] rounded-md text-sm text-[var(--fg-tertiary)] hover:border-[var(--border-primary)] hover:text-[var(--fg-primary)] transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Show all platforms modal/dropdown
                  }}
                >
                  ...
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Content Type Selection */}
          <AnimatePresence>
            {channels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
                  Content Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableContentTypes.map(ct => (
                    <ContentTypeChip
                      key={ct.id}
                      type={ct.id}
                      label={ct.label}
                      isSelected={contentType === ct.id}
                      onSelect={() => setContentType(ct.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Goal Selection */}
          <div className="space-y-2">
            <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
              Goal
            </label>
            <div className="flex flex-wrap gap-4">
              {GOALS.slice(0, 3).map(g => (
                <GoalRadio
                  key={g.id}
                  goal={g.id}
                  label={g.label}
                  isSelected={goal === g.id}
                  onSelect={() => setGoal(g.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Key Message */}
          <div className="space-y-2">
            <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
              Key Message
            </label>
            <textarea
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              placeholder="What's the core message or topic?"
              className="w-full px-3 py-2 bg-transparent border border-[var(--border-secondary)] rounded-md text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] focus:outline-none focus:border-[var(--border-brand-solid)] resize-none min-h-[80px]"
              rows={3}
            />
          </div>
          
          {/* Divider */}
          <div className="border-t border-dashed border-[var(--border-secondary)] pt-4">
            <span className="block text-xs text-[var(--fg-quaternary)] uppercase tracking-wider mb-4">
              Optional
            </span>
            
            {/* Content Pillar & Tone Row */}
            <div className="flex flex-wrap gap-6 mb-4">
              {/* Content Pillar Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
                  Content Pillar
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPillarDropdownOpen(!isPillarDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 border border-[var(--border-secondary)] rounded-md text-sm text-[var(--fg-secondary)] hover:border-[var(--border-primary)] hover:text-[var(--fg-primary)] transition-colors"
                  >
                    <span className="text-[var(--fg-quaternary)]">[</span>
                    <span className="min-w-[120px]">{contentPillar || 'Select...'}</span>
                    <ChevronDown className="w-3 h-3" />
                    <span className="text-[var(--fg-quaternary)]">]</span>
                  </button>
                  
                  <AnimatePresence>
                    {isPillarDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-1 w-48 py-1 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {allPillars.map(pillar => (
                          <button
                            key={pillar}
                            type="button"
                            onClick={() => {
                              setContentPillar(pillar);
                              setIsPillarDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                              contentPillar === pillar
                                ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)]'
                                : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
                            }`}
                          >
                            {pillar}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Tone Slider */}
              <div className="space-y-2">
                <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
                  Tone
                </label>
                <ToneSlider value={tone} onChange={setTone} />
              </div>
            </div>
            
            {/* Reference Section */}
            <div className="space-y-2">
              <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">
                Reference
              </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Drop zone / URL input */}
              <div className="border border-dashed border-[var(--border-secondary)] rounded-md p-4 hover:border-[var(--border-primary)] transition-colors">
                {/* Uploaded files preview */}
                {(referenceFiles.length > 0 || referenceUrls.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {referenceFiles.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--fg-secondary)]"
                      >
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {referenceUrls.map(url => (
                      <div
                        key={url.id}
                        className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--fg-secondary)]"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{new URL(url.url).hostname}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUrl(url.id)}
                          className="text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Actions row */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Drop file or paste URL</span>
                  </button>
                </div>
                
                {/* URL input (shown when + is clicked or always visible) */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    placeholder="https://..."
                    className="flex-1 px-2 py-1 bg-transparent border border-[var(--border-secondary)] rounded text-xs text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] focus:outline-none focus:border-[var(--border-brand-solid)]"
                  />
                  {urlInput && (
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="p-1 text-[var(--fg-brand-primary)] hover:bg-[var(--bg-brand-primary)] rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[var(--border-secondary)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors font-mono disabled:opacity-50"
          >
            [ Cancel ]
          </button>
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono transition-colors
              ${isValid && !isSubmitting
                ? 'bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid)]/90'
                : 'bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] cursor-not-allowed'
              }
            `}
            whileHover={isValid && !isSubmitting ? { scale: 1.02 } : {}}
            whileTap={isValid && !isSubmitting ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>[ Generate</span>
                <ArrowRight className="w-4 h-4" />
                <span>]</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default CreatePostCopyForm;

