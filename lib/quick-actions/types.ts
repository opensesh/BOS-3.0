/**
 * Quick Action Types
 * 
 * This module defines the types and data models for quick action forms
 * that appear in the chat interface. Quick actions are structured
 * pre-prompts that collect specific inputs before generating content.
 */

// =============================================================================
// Content Format (Tier 1)
// =============================================================================

export type ContentFormat = 'short_form' | 'long_form' | 'written';

export interface ContentFormatConfig {
  id: ContentFormat;
  label: string;
  description: string;
}

export const CONTENT_FORMATS: ContentFormatConfig[] = [
  {
    id: 'short_form',
    label: 'Short-form',
    description: 'Quick, digestible content (< 60 seconds or single image)',
  },
  {
    id: 'long_form',
    label: 'Long-form',
    description: 'Extended content (videos, articles, carousels)',
  },
  {
    id: 'written',
    label: 'Written',
    description: 'Text-focused content (posts, captions, threads)',
  },
];

// =============================================================================
// Channel (Social Media Platform)
// =============================================================================

export interface Channel {
  id: string;
  label: string;
  shortLabel: string;
  icon: string | null;
  supportedFormats: ContentFormat[];
  isDefault: boolean;
  displayOrder: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Database row format (snake_case)
export interface ChannelRow {
  id: string;
  label: string;
  short_label: string;
  icon: string | null;
  supported_formats: ContentFormat[];
  is_default: boolean;
  display_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app model
export function channelFromRow(row: ChannelRow): Channel {
  return {
    id: row.id,
    label: row.label,
    shortLabel: row.short_label,
    icon: row.icon,
    supportedFormats: row.supported_formats,
    isDefault: row.is_default,
    displayOrder: row.display_order,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Content Sub-type (Tier 2 - Dynamic based on channels + format)
// =============================================================================

export interface ContentSubtype {
  id: string;
  label: string;
  format: ContentFormat;
  channelIds: string[];
  isDefault: boolean;
  displayOrder: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Database row format
export interface ContentSubtypeRow {
  id: string;
  label: string;
  format: ContentFormat;
  channel_ids: string[];
  is_default: boolean;
  display_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function contentSubtypeFromRow(row: ContentSubtypeRow): ContentSubtype {
  return {
    id: row.id,
    label: row.label,
    format: row.format,
    channelIds: row.channel_ids,
    isDefault: row.is_default,
    displayOrder: row.display_order,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Goal
// =============================================================================

export interface Goal {
  id: string;
  label: string;
  description: string | null;
  isDefault: boolean;
  displayOrder: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalRow {
  id: string;
  label: string;
  description: string | null;
  is_default: boolean;
  display_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function goalFromRow(row: GoalRow): Goal {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    isDefault: row.is_default,
    displayOrder: row.display_order,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Content Pillar
// =============================================================================

export interface ContentPillar {
  id: string;
  label: string;
  isDefault: boolean;
  displayOrder: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPillarRow {
  id: string;
  label: string;
  is_default: boolean;
  display_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function contentPillarFromRow(row: ContentPillarRow): ContentPillar {
  return {
    id: row.id,
    label: row.label,
    isDefault: row.is_default,
    displayOrder: row.display_order,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Tone
// =============================================================================

export type TonePreset = 'casual' | 'balanced' | 'professional';

export const TONE_PRESETS: { id: TonePreset; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'professional', label: 'Professional' },
];

// =============================================================================
// Output Preferences
// =============================================================================

export type VariationCount = 1 | 3;

export const VARIATION_OPTIONS: { id: VariationCount; label: string }[] = [
  { id: 1, label: '1' },
  { id: 3, label: '2-3' },
];

export type HashtagPreference = 'yes' | 'no' | 'suggest';

export const HASHTAG_OPTIONS: { id: HashtagPreference; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'suggest', label: 'Suggest' },
];

export type CaptionLength = 'concise' | 'standard' | 'extended';

export const CAPTION_LENGTH_OPTIONS: { id: CaptionLength; label: string }[] = [
  { id: 'concise', label: 'Concise' },
  { id: 'standard', label: 'Standard' },
  { id: 'extended', label: 'Extended' },
];

export type CtaPreference = 'yes' | 'no';

export const CTA_OPTIONS: { id: CtaPreference; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];

export interface OutputPreferences {
  variations: VariationCount;
  hashtags: HashtagPreference;
  captionLength: CaptionLength;
  includeCta: CtaPreference;
}

// =============================================================================
// Product (Placeholder for now)
// =============================================================================

export type ProductType = 'product' | 'service' | 'other';

export const PRODUCT_TYPES: { id: ProductType; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'service', label: 'Service' },
  { id: 'other', label: 'Other' },
];

// =============================================================================
// Reference Types
// =============================================================================

export interface ReferenceFile {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string; // Base64 preview for images
  data?: string; // Full base64 data
}

export interface ReferenceUrl {
  id: string;
  url: string;
  title?: string;
  favicon?: string;
}

// =============================================================================
// Form Data
// =============================================================================

export interface PostCopyFormData {
  // Required fields
  channelIds: string[];
  contentFormat: ContentFormat;
  contentSubtypeId: string | null;
  goalId: string;
  keyMessage: string;
  
  // Optional fields
  productType?: ProductType;
  contentPillarId?: string;
  tone: TonePreset;
  customVoiceNotes?: string;
  references?: {
    files: ReferenceFile[];
    urls: ReferenceUrl[];
  };
  
  // Output preferences
  outputPreferences: OutputPreferences;
  
  // Metadata
  formId: string;
  createdAt: string;
}

// =============================================================================
// Quick Action Definition
// =============================================================================

export type QuickActionType = 
  | 'create-post-copy'
  | 'plan-campaign'
  | 'brainstorm-ideas'
  | 'get-feedback';

export interface QuickActionConfig {
  id: QuickActionType;
  title: string;
  description: string;
  prePrompt: string;
  skillId?: string; // Maps to brain skill
}

export const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    id: 'create-post-copy',
    title: 'Create Post Copy',
    description: 'Generate engaging social media copy for your posts',
    prePrompt: 'Create a post',
    skillId: 'create-post-copy',
  },
  {
    id: 'plan-campaign',
    title: 'Plan Campaign',
    description: 'Plan a comprehensive marketing campaign',
    prePrompt: 'Help me plan a campaign',
  },
  {
    id: 'brainstorm-ideas',
    title: 'Brainstorm Ideas',
    description: 'Generate creative content ideas',
    prePrompt: 'Brainstorm content ideas',
  },
  {
    id: 'get-feedback',
    title: 'Get Feedback',
    description: 'Get feedback on your content',
    prePrompt: 'Give me feedback on this',
  },
];

// =============================================================================
// Form State (for chat context)
// =============================================================================

export interface QuickActionFormState {
  type: QuickActionType;
  formId: string;
  data?: Partial<PostCopyFormData>;
  status: 'active' | 'submitting' | 'submitted' | 'cancelled';
  isExpanded: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique form ID
 */
export function generateFormId(): string {
  return `form-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create initial form data
 */
export function createInitialFormData(): PostCopyFormData {
  return {
    channelIds: [],
    contentFormat: 'written',
    contentSubtypeId: null,
    goalId: '',
    keyMessage: '',
    productType: undefined,
    contentPillarId: undefined,
    tone: 'balanced',
    customVoiceNotes: undefined,
    references: {
      files: [],
      urls: [],
    },
    outputPreferences: {
      variations: 1,
      hashtags: 'suggest',
      captionLength: 'standard',
      includeCta: 'yes',
    },
    formId: generateFormId(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get available content formats for selected channels
 */
export function getAvailableFormatsForChannels(
  channels: Channel[],
  selectedChannelIds: string[]
): ContentFormat[] {
  if (selectedChannelIds.length === 0) return ['short_form', 'long_form', 'written'];
  
  const selectedChannels = channels.filter(c => selectedChannelIds.includes(c.id));
  if (selectedChannels.length === 0) return ['short_form', 'long_form', 'written'];
  
  // Find formats available in ALL selected channels
  const formatSets = selectedChannels.map(c => new Set(c.supportedFormats));
  const intersection = formatSets.reduce((acc, set) => {
    return new Set([...acc].filter(format => set.has(format)));
  });
  
  return Array.from(intersection) as ContentFormat[];
}

/**
 * Filter content subtypes by selected channels and format
 */
export function filterSubtypesByChannelsAndFormat(
  subtypes: ContentSubtype[],
  selectedChannelIds: string[],
  format: ContentFormat
): ContentSubtype[] {
  if (selectedChannelIds.length === 0) return [];
  
  return subtypes.filter(subtype => {
    // Must match the format
    if (subtype.format !== format) return false;
    
    // Must be available for at least one selected channel
    return selectedChannelIds.some(channelId => 
      subtype.channelIds.includes(channelId)
    );
  });
}

/**
 * Get quick action config by type
 */
export function getQuickActionConfig(type: QuickActionType): QuickActionConfig | undefined {
  return QUICK_ACTIONS.find(action => action.id === type);
}
