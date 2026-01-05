'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  X,
  Upload,
  Link as LinkIcon,
  Check,
  Loader2,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/base/buttons/button';
import type {
  PostCopyFormData,
  Channel,
  ContentSubtype,
  Goal,
  ContentPillar,
  ContentFormat,
  TonePreset,
  ProductType,
  ReferenceFile,
  ReferenceUrl,
  VariationCount,
  HashtagPreference,
  CaptionLength,
  CtaPreference,
  OutputPreferences,
} from '@/lib/quick-actions';
import {
  CONTENT_FORMATS,
  TONE_PRESETS,
  PRODUCT_TYPES,
  VARIATION_OPTIONS,
  HASHTAG_OPTIONS,
  CAPTION_LENGTH_OPTIONS,
  CTA_OPTIONS,
  createInitialFormData,
  getAvailableFormatsForChannels,
  filterSubtypesByChannelsAndFormat,
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
  /** Whether the form is expanded by default */
  defaultExpanded?: boolean;
  /** Configuration data from Supabase */
  channels: Channel[];
  contentSubtypes: ContentSubtype[];
  goals: Goal[];
  pillars: ContentPillar[];
  /** Called when user wants to add/edit a field */
  onEditField?: (fieldType: 'channel' | 'goal' | 'pillar', mode: 'add' | 'edit', item?: unknown) => void;
}

// =============================================================================
// Channel Icons (inline SVG for custom platforms)
// =============================================================================

const ChannelIcon: React.FC<{ icon: string | null; className?: string }> = ({ icon, className }) => {
  // Map icon names to simple representations
  const iconMap: Record<string, React.ReactNode> = {
    instagram: <span className={className}>IG</span>,
    linkedin: <span className={className}>LI</span>,
    tiktok: <span className={className}>TT</span>,
    youtube: <span className={className}>YT</span>,
    twitter: <span className={className}>X</span>,
    facebook: <span className={className}>FB</span>,
    pinterest: <span className={className}>PIN</span>,
    threads: <span className={className}>THR</span>,
    snapchat: <span className={className}>SNAP</span>,
    reddit: <span className={className}>RED</span>,
    discord: <span className={className}>DISC</span>,
    tumblr: <span className={className}>TUMB</span>,
    medium: <span className={className}>MED</span>,
    substack: <span className={className}>SUB</span>,
    spotify: <span className={className}>SPOT</span>,
    'apple-podcasts': <span className={className}>APOD</span>,
    twitch: <span className={className}>TWCH</span>,
    bereal: <span className={className}>BREAL</span>,
    mastodon: <span className={className}>MAST</span>,
    bluesky: <span className={className}>BSKY</span>,
  };

  return <>{iconMap[icon || ''] || <span className={className}>•</span>}</>;
};

// =============================================================================
// Sub-components
// =============================================================================

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function Chip({ selected, onClick, children, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        rounded-lg text-sm font-medium transition-all duration-150
        ${selected
          ? 'bg-[var(--bg-brand-primary)] text-[var(--fg-brand-primary)] ring-1 ring-[var(--border-brand-solid)]'
          : 'bg-[var(--bg-primary)] text-[var(--fg-secondary)] ring-1 ring-[var(--border-primary)] hover:ring-[var(--border-brand-solid)] hover:text-[var(--fg-primary)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {selected && <Check className="w-3 h-3" />}
      {children}
    </button>
  );
}

interface SegmentedControlProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function SegmentedControl<T extends string>({ options, value, onChange, disabled }: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--bg-tertiary)] p-0.5 ring-1 ring-[var(--border-secondary)]">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150
            ${value === option.id
              ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
              : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SectionHeaderProps {
  label: string;
  onAdd?: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
}

function SectionHeader({ label, onAdd, onEdit, showEdit }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {showEdit && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-[var(--fg-quaternary)] hover:text-[var(--fg-secondary)] transition-colors"
            title="Edit options"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="p-1 text-[var(--fg-quaternary)] hover:text-[var(--fg-brand-primary)] transition-colors"
            title="Add new"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
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
  defaultExpanded = true,
  channels,
  contentSubtypes,
  goals,
  pillars,
  onEditField,
}: CreatePostCopyFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(initialData?.channelIds || []);
  const [contentFormat, setContentFormat] = useState<ContentFormat>(initialData?.contentFormat || 'written');
  const [contentSubtypeId, setContentSubtypeId] = useState<string | null>(initialData?.contentSubtypeId || null);
  const [goalId, setGoalId] = useState<string>(initialData?.goalId || '');
  const [keyMessage, setKeyMessage] = useState(initialData?.keyMessage || '');
  const [productType, setProductType] = useState<ProductType | undefined>(initialData?.productType);
  const [contentPillarId, setContentPillarId] = useState<string | undefined>(initialData?.contentPillarId);
  const [tone, setTone] = useState<TonePreset>(initialData?.tone || 'balanced');
  const [customVoiceNotes, setCustomVoiceNotes] = useState<string>(initialData?.customVoiceNotes || '');
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>(initialData?.references?.files || []);
  const [referenceUrls, setReferenceUrls] = useState<ReferenceUrl[]>(initialData?.references?.urls || []);
  const [urlInput, setUrlInput] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [showOutputPrefs, setShowOutputPrefs] = useState(false);
  
  // Output preferences state
  const [variations, setVariations] = useState<VariationCount>(initialData?.outputPreferences?.variations || 1);
  const [hashtags, setHashtags] = useState<HashtagPreference>(initialData?.outputPreferences?.hashtags || 'suggest');
  const [captionLength, setCaptionLength] = useState<CaptionLength>(initialData?.outputPreferences?.captionLength || 'standard');
  const [includeCta, setIncludeCta] = useState<CtaPreference>(initialData?.outputPreferences?.includeCta || 'yes');

  // Convert channels array to Channel type for helper functions
  const channelObjects = useMemo(() => {
    return channels.map(c => ({
      ...c,
      shortLabel: c.shortLabel,
      supportedFormats: c.supportedFormats,
      isDefault: c.isDefault,
      displayOrder: c.displayOrder,
      userId: c.userId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }, [channels]);

  // Available formats based on selected channels
  const availableFormats = useMemo(() => {
    return getAvailableFormatsForChannels(channelObjects, selectedChannelIds);
  }, [channelObjects, selectedChannelIds]);

  // Convert contentSubtypes to ContentSubtype type for helper functions
  const subtypeObjects = useMemo(() => {
    return contentSubtypes.map(s => ({
      ...s,
      channelIds: s.channelIds,
      isDefault: s.isDefault,
      displayOrder: s.displayOrder,
      userId: s.userId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }, [contentSubtypes]);

  // Available subtypes based on selected channels and format
  const availableSubtypes = useMemo(() => {
    return filterSubtypesByChannelsAndFormat(subtypeObjects, selectedChannelIds, contentFormat);
  }, [subtypeObjects, selectedChannelIds, contentFormat]);

  // Reset content format if not available for selected channels
  useEffect(() => {
    if (selectedChannelIds.length > 0 && !availableFormats.includes(contentFormat)) {
      setContentFormat(availableFormats[0] || 'written');
    }
  }, [selectedChannelIds, availableFormats, contentFormat]);

  // Reset content subtype if not available
  useEffect(() => {
    if (contentSubtypeId && !availableSubtypes.find(s => s.id === contentSubtypeId)) {
      setContentSubtypeId(availableSubtypes[0]?.id || null);
    }
  }, [availableSubtypes, contentSubtypeId]);

  // Set default goal if none selected
  useEffect(() => {
    if (!goalId && goals.length > 0) {
      setGoalId(goals[0].id);
    }
  }, [goalId, goals]);

  // Handlers
  const toggleChannel = useCallback((channelId: string) => {
    setSelectedChannelIds(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
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

    e.target.value = '';
  }, []);

  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;

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

  const handleSubmit = useCallback(() => {
    if (selectedChannelIds.length === 0 || !keyMessage.trim() || !goalId) return;

    const formData: PostCopyFormData = {
      channelIds: selectedChannelIds,
      contentFormat,
      contentSubtypeId,
      goalId,
      keyMessage: keyMessage.trim(),
      productType,
      contentPillarId,
      tone,
      customVoiceNotes: customVoiceNotes.trim() || undefined,
      references: {
        files: referenceFiles,
        urls: referenceUrls,
      },
      outputPreferences: {
        variations,
        hashtags,
        captionLength,
        includeCta,
      },
      formId: initialData?.formId || createInitialFormData().formId,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSubmit(formData);
  }, [
    selectedChannelIds,
    contentFormat,
    contentSubtypeId,
    goalId,
    keyMessage,
    productType,
    contentPillarId,
    tone,
    customVoiceNotes,
    referenceFiles,
    referenceUrls,
    variations,
    hashtags,
    captionLength,
    includeCta,
    initialData,
    onSubmit,
  ]);

  const isValid = selectedChannelIds.length > 0 && keyMessage.trim().length > 0 && goalId;

  return (
    <div className="w-full">
      {/* Collapsible Container */}
      <div className="rounded-xl bg-[var(--bg-secondary)] ring-1 ring-[var(--border-secondary)] shadow-sm overflow-hidden">
        {/* Header - Always visible */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--fg-primary)]">Create Post Copy</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
          </motion.div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-5 border-t border-[var(--border-secondary)]">
                {/* Channels Section */}
                <div className="pt-4">
                  <SectionHeader
                    label="Channels"
                    onAdd={() => onEditField?.('channel', 'add')}
                    onEdit={() => onEditField?.('channel', 'edit')}
                    showEdit={channels.some(c => !c.isDefault)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {channels.map((channel) => (
                      <Chip
                        key={channel.id}
                        selected={selectedChannelIds.includes(channel.id)}
                        onClick={() => toggleChannel(channel.id)}
                      >
                        {channel.shortLabel}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Content Format Section */}
                {selectedChannelIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SectionHeader label="Content Format" />
                    <SegmentedControl
                      options={CONTENT_FORMATS.filter(f => availableFormats.includes(f.id)).map(f => ({
                        id: f.id,
                        label: f.label,
                      }))}
                      value={contentFormat}
                      onChange={setContentFormat}
                    />
                  </motion.div>
                )}

                {/* Content Sub-type Section */}
                {selectedChannelIds.length > 0 && availableSubtypes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SectionHeader label="Content Type" />
                    <div className="flex flex-wrap gap-2">
                      {availableSubtypes.map((subtype) => (
                        <Chip
                          key={subtype.id}
                          selected={contentSubtypeId === subtype.id}
                          onClick={() => setContentSubtypeId(subtype.id)}
                        >
                          {subtype.label}
                        </Chip>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Goal Section */}
                <div>
                  <SectionHeader
                    label="Goal"
                    onAdd={() => onEditField?.('goal', 'add')}
                    onEdit={() => onEditField?.('goal', 'edit')}
                    showEdit={goals.some(g => !g.isDefault)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {goals.map((goal) => (
                      <Chip
                        key={goal.id}
                        selected={goalId === goal.id}
                        onClick={() => setGoalId(goal.id)}
                      >
                        {goal.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Key Message */}
                <div>
                  <SectionHeader label="Key Message" />
                  <textarea
                    value={keyMessage}
                    onChange={(e) => setKeyMessage(e.target.value)}
                    placeholder="What's the core message or topic for this post?"
                    className="w-full px-3 py-2.5 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)] resize-none transition-shadow"
                    rows={3}
                  />
                </div>

                {/* Optional Section Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
                >
                  {showOptional ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>Optional settings</span>
                </button>

                {/* Optional Section */}
                <AnimatePresence>
                  {showOptional && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Products (Placeholder) */}
                      <div>
                        <SectionHeader label="Product" />
                        <div className="flex flex-wrap gap-2">
                          {PRODUCT_TYPES.map((product) => (
                            <Chip
                              key={product.id}
                              selected={productType === product.id}
                              onClick={() => setProductType(productType === product.id ? undefined : product.id)}
                            >
                              {product.label}
                            </Chip>
                          ))}
                        </div>
                      </div>

                      {/* Content Pillar */}
                      <div>
                        <SectionHeader
                          label="Content Pillar"
                          onAdd={() => onEditField?.('pillar', 'add')}
                          onEdit={() => onEditField?.('pillar', 'edit')}
                          showEdit={pillars.some(p => !p.isDefault)}
                        />
                        <div className="flex flex-wrap gap-2">
                          {pillars.map((pillar) => (
                            <Chip
                              key={pillar.id}
                              selected={contentPillarId === pillar.id}
                              onClick={() => setContentPillarId(contentPillarId === pillar.id ? undefined : pillar.id)}
                            >
                              {pillar.label}
                            </Chip>
                          ))}
                        </div>
                      </div>

                      {/* Tone */}
                      <div>
                        <SectionHeader label="Tone" />
                        <SegmentedControl
                          options={TONE_PRESETS}
                          value={tone}
                          onChange={setTone}
                        />
                      </div>

                      {/* Custom Voice Notes */}
                      <div>
                        <SectionHeader label="Custom Voice Notes" />
                        <textarea
                          value={customVoiceNotes}
                          onChange={(e) => setCustomVoiceNotes(e.target.value)}
                          placeholder="Any specific voice or style notes? (e.g., 'Use more humor', 'Reference our recent launch')"
                          className="w-full px-3 py-2 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)] resize-none transition-shadow"
                          rows={2}
                        />
                      </div>

                      {/* References */}
                      <div>
                        <SectionHeader label="Reference Materials" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {/* Uploaded items preview */}
                        {(referenceFiles.length > 0 || referenceUrls.length > 0) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {referenceFiles.map(file => (
                              <div
                                key={file.id}
                                className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] rounded-md text-xs text-[var(--fg-secondary)]"
                              >
                                <span className="truncate max-w-[100px]">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setReferenceFiles(prev => prev.filter(f => f.id !== file.id))}
                                  className="text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {referenceUrls.map(url => (
                              <div
                                key={url.id}
                                className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] rounded-md text-xs text-[var(--fg-secondary)]"
                              >
                                <LinkIcon className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{new URL(url.url).hostname}</span>
                                <button
                                  type="button"
                                  onClick={() => setReferenceUrls(prev => prev.filter(u => u.id !== url.id))}
                                  className="text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload/URL input row */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] bg-[var(--bg-tertiary)] rounded-md ring-1 ring-[var(--border-secondary)] transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>
                          <div className="flex-1 flex items-center gap-2">
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
                              placeholder="Paste URL..."
                              className="flex-1 px-3 py-1.5 bg-[var(--bg-primary)] rounded-md text-xs text-[var(--fg-primary)] placeholder:text-[var(--fg-quaternary)] ring-1 ring-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-brand-solid)]"
                            />
                            {urlInput && (
                              <button
                                type="button"
                                onClick={handleAddUrl}
                                className="p-1.5 text-[var(--fg-brand-primary)] hover:bg-[var(--bg-brand-primary)] rounded-md transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Output Preferences Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOutputPrefs(!showOutputPrefs)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
                >
                  {showOutputPrefs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>Output preferences</span>
                </button>

                {/* Output Preferences Section */}
                <AnimatePresence>
                  {showOutputPrefs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Variations */}
                      <div>
                        <SectionHeader label="Variations" />
                        <SegmentedControl
                          options={VARIATION_OPTIONS.map(v => ({ id: v.id.toString() as `${typeof v.id}`, label: v.label }))}
                          value={variations.toString() as `${VariationCount}`}
                          onChange={(v) => setVariations(Number(v) as VariationCount)}
                        />
                        <p className="mt-1.5 text-xs text-[var(--fg-quaternary)]">
                          Generate one polished option or 2-3 variations to choose from
                        </p>
                      </div>

                      {/* Hashtags */}
                      <div>
                        <SectionHeader label="Include Hashtags" />
                        <SegmentedControl
                          options={HASHTAG_OPTIONS}
                          value={hashtags}
                          onChange={setHashtags}
                        />
                      </div>

                      {/* Caption Length */}
                      <div>
                        <SectionHeader label="Caption Length" />
                        <SegmentedControl
                          options={CAPTION_LENGTH_OPTIONS}
                          value={captionLength}
                          onChange={setCaptionLength}
                        />
                      </div>

                      {/* Include CTA */}
                      <div>
                        <SectionHeader label="Include Call-to-Action" />
                        <SegmentedControl
                          options={CTA_OPTIONS}
                          value={includeCta}
                          onChange={setIncludeCta}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    color="tertiary"
                    size="sm"
                    onClick={onCancel}
                    isDisabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={handleSubmit}
                    isDisabled={!isValid || isSubmitting}
                    isLoading={isSubmitting}
                    iconTrailing={isSubmitting ? undefined : PenLine}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CreatePostCopyForm;
