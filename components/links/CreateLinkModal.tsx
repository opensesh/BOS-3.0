'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagSelector } from './TagSelector';
import type { ShortLink, ShortLinkTag } from '@/lib/supabase/types';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkFormData) => Promise<void>;
  editingLink?: ShortLink | null;
  availableTags: ShortLinkTag[];
  onCreateTag?: (name: string) => Promise<ShortLinkTag>;
  checkShortCodeAvailable?: (shortCode: string, excludeId?: string) => Promise<boolean>;
}

export interface LinkFormData {
  destinationUrl: string;
  shortCode: string;
  title?: string;
  description?: string;
  tags: string[];
  password?: string;
  expiresAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

/**
 * Modal for creating or editing short links
 */
export function CreateLinkModal({
  isOpen,
  onClose,
  onSubmit,
  editingLink,
  availableTags,
  onCreateTag,
  checkShortCodeAvailable,
}: CreateLinkModalProps) {
  const isEditing = !!editingLink;

  // Form state
  const [destinationUrl, setDestinationUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  // UTM parameters
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // UI state
  const [showUtm, setShowUtm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortCodeAvailable, setShortCodeAvailable] = useState<boolean | null>(null);
  const [shortCodeChecking, setShortCodeChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (editingLink) {
      setDestinationUrl(editingLink.destinationUrl);
      setShortCode(editingLink.shortCode);
      setTitle(editingLink.title || '');
      setDescription(editingLink.description || '');
      setTags(editingLink.tags || []);
      setExpiresAt(editingLink.expiresAt ? editingLink.expiresAt.split('T')[0] : '');
      setUtmSource(editingLink.utmSource || '');
      setUtmMedium(editingLink.utmMedium || '');
      setUtmCampaign(editingLink.utmCampaign || '');
      setUtmTerm(editingLink.utmTerm || '');
      setUtmContent(editingLink.utmContent || '');
      // Show UTM section if any UTM params exist
      if (
        editingLink.utmSource ||
        editingLink.utmMedium ||
        editingLink.utmCampaign ||
        editingLink.utmTerm ||
        editingLink.utmContent
      ) {
        setShowUtm(true);
      }
      // Show advanced if password or expiration exists
      if (editingLink.hasPassword || editingLink.expiresAt) {
        setShowAdvanced(true);
      }
    } else {
      // Reset form
      setDestinationUrl('');
      setShortCode('');
      setTitle('');
      setDescription('');
      setTags([]);
      setPassword('');
      setExpiresAt('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
      setUtmTerm('');
      setUtmContent('');
      setShowUtm(false);
      setShowAdvanced(false);
      setShortCodeAvailable(null);
    }
    setErrors({});
  }, [editingLink, isOpen]);

  // Check short code availability
  useEffect(() => {
    if (!shortCode || !checkShortCodeAvailable) {
      setShortCodeAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setShortCodeChecking(true);
      try {
        const available = await checkShortCodeAvailable(
          shortCode,
          editingLink?.id
        );
        setShortCodeAvailable(available);
      } catch (error) {
        console.error('Error checking short code:', error);
        setShortCodeAvailable(null);
      } finally {
        setShortCodeChecking(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [shortCode, checkShortCodeAvailable, editingLink?.id]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!destinationUrl.trim()) {
      newErrors.destinationUrl = 'Destination URL is required';
    } else {
      try {
        new URL(destinationUrl);
      } catch {
        newErrors.destinationUrl = 'Please enter a valid URL';
      }
    }

    if (shortCode && !/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
      newErrors.shortCode = 'Only letters, numbers, hyphens, and underscores';
    }

    if (shortCodeAvailable === false) {
      newErrors.shortCode = 'This short code is already taken';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        destinationUrl: destinationUrl.trim(),
        shortCode: shortCode.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        tags,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
        utmSource: utmSource.trim() || undefined,
        utmMedium: utmMedium.trim() || undefined,
        utmCampaign: utmCampaign.trim() || undefined,
        utmTerm: utmTerm.trim() || undefined,
        utmContent: utmContent.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error submitting link:', error);
      setErrors({ submit: 'Failed to save link. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[5%] mx-auto max-w-lg max-h-[90vh] overflow-hidden z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)] flex-shrink-0">
                <div>
                  <h2 className="text-lg font-display font-bold text-[var(--fg-primary)]">
                    {isEditing ? 'Edit Link' : 'Create Link'}
                  </h2>
                  <p className="text-sm text-[var(--fg-tertiary)]">
                    {isEditing
                      ? 'Update your short link settings'
                      : 'Create a new short link for sharing'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Destination URL */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg-primary)]">
                    Destination URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://example.com/your-page"
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'bg-[var(--bg-secondary)]/30 border',
                      errors.destinationUrl
                        ? 'border-red-500'
                        : 'border-[var(--border-primary)]/40',
                      'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
                      'focus:outline-none focus:border-[var(--border-primary)]'
                    )}
                  />
                  {errors.destinationUrl && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.destinationUrl}
                    </p>
                  )}
                </div>

                {/* Short Code */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg-primary)]">
                    Short Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 px-3 py-2 text-sm text-[var(--fg-tertiary)] bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-primary)]/40">
                      opensesh.app/l/
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={shortCode}
                        onChange={(e) =>
                          setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                        }
                        placeholder="custom-slug"
                        className={cn(
                          'w-full px-3 py-2 text-sm rounded-lg',
                          'bg-[var(--bg-secondary)]/30 border',
                          errors.shortCode
                            ? 'border-red-500'
                            : 'border-[var(--border-primary)]/40',
                          'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
                          'focus:outline-none focus:border-[var(--border-primary)]'
                        )}
                      />
                      {/* Availability indicator */}
                      {shortCode && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {shortCodeChecking ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--fg-tertiary)]" />
                          ) : shortCodeAvailable === true ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : shortCodeAvailable === false ? (
                            <X className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.shortCode && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.shortCode}
                    </p>
                  )}
                  {!shortCode && !isEditing && (
                    <p className="text-xs text-[var(--fg-tertiary)]">
                      Leave empty to auto-generate
                    </p>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg-primary)]">
                    Title <span className="text-[var(--fg-tertiary)]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My awesome link"
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
                      'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
                      'focus:outline-none focus:border-[var(--border-primary)]'
                    )}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg-primary)]">
                    Tags
                  </label>
                  <TagSelector
                    selectedTags={tags}
                    availableTags={availableTags}
                    onChange={setTags}
                    onCreateTag={onCreateTag}
                    placeholder="Add tags..."
                  />
                </div>

                {/* UTM Parameters - Collapsible */}
                <div className="border border-[var(--border-primary)]/40 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowUtm(!showUtm)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/30 transition-colors"
                  >
                    <span>UTM Parameters</span>
                    {showUtm ? (
                      <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--fg-tertiary)]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showUtm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--border-primary)]/40"
                      >
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Source"
                              value={utmSource}
                              onChange={setUtmSource}
                              placeholder="google"
                            />
                            <InputField
                              label="Medium"
                              value={utmMedium}
                              onChange={setUtmMedium}
                              placeholder="cpc"
                            />
                          </div>
                          <InputField
                            label="Campaign"
                            value={utmCampaign}
                            onChange={setUtmCampaign}
                            placeholder="summer_sale"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Term"
                              value={utmTerm}
                              onChange={setUtmTerm}
                              placeholder="running+shoes"
                            />
                            <InputField
                              label="Content"
                              value={utmContent}
                              onChange={setUtmContent}
                              placeholder="banner_ad"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Advanced Options - Collapsible */}
                <div className="border border-[var(--border-primary)]/40 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/30 transition-colors"
                  >
                    <span>Advanced Options</span>
                    {showAdvanced ? (
                      <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--fg-tertiary)]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--border-primary)]/40"
                      >
                        <div className="p-4 space-y-4">
                          {/* Password Protection */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--fg-primary)] flex items-center gap-2">
                              <Lock className="w-4 h-4 text-[var(--fg-tertiary)]" />
                              Password Protection
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isEditing && editingLink?.hasPassword ? '••••••••' : 'Enter password'}
                                className={cn(
                                  'w-full px-3 py-2 pr-10 text-sm rounded-lg',
                                  'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
                                  'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
                                  'focus:outline-none focus:border-[var(--border-primary)]'
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-[var(--fg-tertiary)]">
                              Visitors will need to enter this password to access the link
                            </p>
                          </div>

                          {/* Expiration Date */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--fg-primary)] flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[var(--fg-tertiary)]" />
                              Expiration Date
                            </label>
                            <input
                              type="date"
                              value={expiresAt}
                              onChange={(e) => setExpiresAt(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className={cn(
                                'w-full px-3 py-2 text-sm rounded-lg',
                                'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
                                'text-[var(--fg-primary)]',
                                'focus:outline-none focus:border-[var(--border-primary)]'
                              )}
                            />
                            <p className="text-xs text-[var(--fg-tertiary)]">
                              Link will stop working after this date
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit error */}
                {errors.submit && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.submit}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border-primary)] flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--fg-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditing ? 'Saving...' : 'Creating...'}
                    </>
                  ) : isEditing ? (
                    'Save Changes'
                  ) : (
                    'Create Link'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: InputFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--fg-tertiary)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full px-2.5 py-1.5 text-sm rounded-md',
          'bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40',
          'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
          'focus:outline-none focus:border-[var(--border-primary)]'
        )}
      />
    </div>
  );
}
