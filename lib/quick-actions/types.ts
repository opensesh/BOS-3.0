/**
 * Quick Action Types
 * 
 * This module defines the types and data models for quick action forms
 * that appear in the chat interface. Quick actions are structured
 * pre-prompts that collect specific inputs before generating content.
 */

// =============================================================================
// Platform Definitions
// =============================================================================

export type SocialPlatform = 
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'x'
  | 'youtube'
  | 'facebook'
  | 'pinterest'
  | 'threads';

export interface PlatformConfig {
  id: SocialPlatform;
  label: string;
  shortLabel: string;
  icon: string;
  contentTypes: ContentType[];
  maxLength?: Record<string, number>;
}

// =============================================================================
// Content Type Definitions (Platform-specific)
// =============================================================================

export type ContentType = 
  // Instagram
  | 'post'
  | 'carousel'
  | 'reel'
  | 'story'
  // LinkedIn
  | 'article'
  | 'poll'
  | 'document'
  // TikTok
  | 'video'
  // X (Twitter)
  | 'tweet'
  | 'thread'
  // YouTube
  | 'video-description'
  | 'community-post'
  | 'short'
  // Facebook
  | 'facebook-post'
  | 'facebook-reel'
  // Pinterest
  | 'pin'
  | 'idea-pin'
  // Threads
  | 'threads-post';

export interface ContentTypeConfig {
  id: ContentType;
  label: string;
  description: string;
  platforms: SocialPlatform[];
  maxLength?: number;
}

// =============================================================================
// Goal Definitions
// =============================================================================

export type PostGoal = 
  | 'awareness'
  | 'engagement'
  | 'conversion'
  | 'education'
  | 'entertainment'
  | 'community';

export interface GoalConfig {
  id: PostGoal;
  label: string;
  description: string;
}

// =============================================================================
// Tone Scale
// =============================================================================

export type TonePreset = 
  | 'casual'
  | 'balanced'
  | 'professional';

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
  channels: SocialPlatform[];
  contentType: ContentType;
  goal: PostGoal;
  keyMessage: string;
  
  // Optional fields
  contentPillar?: string;
  tone?: TonePreset;
  references?: {
    files: ReferenceFile[];
    urls: ReferenceUrl[];
  };
  
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
  formComponent: string;
  skillId?: string; // Maps to brain skill
}

// =============================================================================
// Form Message Type (for chat)
// =============================================================================

export interface QuickActionFormMessage {
  type: 'quick-action-form';
  actionType: QuickActionType;
  formId: string;
  data?: Partial<PostCopyFormData>;
  status: 'pending' | 'submitted' | 'cancelled';
}

// =============================================================================
// Platform Data (Research-based content types per platform)
// =============================================================================

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    shortLabel: 'IG',
    icon: 'instagram',
    contentTypes: ['post', 'carousel', 'reel', 'story'],
    maxLength: {
      post: 2200,
      carousel: 2200,
      reel: 2200,
      story: 250,
    },
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    shortLabel: 'LI',
    icon: 'linkedin',
    contentTypes: ['post', 'article', 'carousel', 'poll', 'document'],
    maxLength: {
      post: 3000,
      article: 125000,
      carousel: 3000,
      poll: 140,
    },
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TT',
    icon: 'tiktok',
    contentTypes: ['video', 'story', 'carousel'],
    maxLength: {
      video: 4000,
      story: 150,
      carousel: 4000,
    },
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    shortLabel: 'X',
    icon: 'twitter',
    contentTypes: ['tweet', 'thread'],
    maxLength: {
      tweet: 280,
      thread: 25000, // ~89 tweets
    },
  },
  {
    id: 'youtube',
    label: 'YouTube',
    shortLabel: 'YT',
    icon: 'youtube',
    contentTypes: ['video-description', 'community-post', 'short'],
    maxLength: {
      'video-description': 5000,
      'community-post': 1000,
      short: 100,
    },
  },
  {
    id: 'facebook',
    label: 'Facebook',
    shortLabel: 'FB',
    icon: 'facebook',
    contentTypes: ['facebook-post', 'facebook-reel', 'story'],
    maxLength: {
      'facebook-post': 63206,
      'facebook-reel': 2200,
      story: 250,
    },
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    shortLabel: 'PIN',
    icon: 'pin',
    contentTypes: ['pin', 'idea-pin'],
    maxLength: {
      pin: 500,
      'idea-pin': 500,
    },
  },
  {
    id: 'threads',
    label: 'Threads',
    shortLabel: 'THR',
    icon: 'threads',
    contentTypes: ['threads-post', 'carousel'],
    maxLength: {
      'threads-post': 500,
      carousel: 500,
    },
  },
];

export const CONTENT_TYPES: ContentTypeConfig[] = [
  // Universal
  { id: 'post', label: 'Post', description: 'Standard feed post', platforms: ['instagram', 'linkedin', 'facebook'] },
  { id: 'carousel', label: 'Carousel', description: 'Multi-image/slide post', platforms: ['instagram', 'linkedin', 'tiktok', 'threads'] },
  { id: 'story', label: 'Story', description: 'Temporary 24-hour content', platforms: ['instagram', 'tiktok', 'facebook'] },
  
  // Video formats
  { id: 'reel', label: 'Reel', description: 'Short-form vertical video', platforms: ['instagram'] },
  { id: 'video', label: 'Video', description: 'Video content', platforms: ['tiktok'] },
  { id: 'short', label: 'Short', description: 'Vertical short-form video', platforms: ['youtube'] },
  { id: 'facebook-reel', label: 'Reel', description: 'Short-form vertical video', platforms: ['facebook'] },
  
  // LinkedIn specific
  { id: 'article', label: 'Article', description: 'Long-form article', platforms: ['linkedin'] },
  { id: 'poll', label: 'Poll', description: 'Interactive poll', platforms: ['linkedin'] },
  { id: 'document', label: 'Document', description: 'PDF carousel/document post', platforms: ['linkedin'] },
  
  // X specific
  { id: 'tweet', label: 'Tweet', description: 'Single tweet (280 chars)', platforms: ['x'] },
  { id: 'thread', label: 'Thread', description: 'Multi-tweet thread', platforms: ['x'] },
  
  // YouTube specific
  { id: 'video-description', label: 'Video Description', description: 'YouTube video description', platforms: ['youtube'] },
  { id: 'community-post', label: 'Community Post', description: 'YouTube Community tab post', platforms: ['youtube'] },
  
  // Pinterest specific
  { id: 'pin', label: 'Pin', description: 'Standard pin', platforms: ['pinterest'] },
  { id: 'idea-pin', label: 'Idea Pin', description: 'Multi-page idea pin', platforms: ['pinterest'] },
  
  // Threads specific
  { id: 'threads-post', label: 'Post', description: 'Threads post', platforms: ['threads'] },
  
  // Facebook specific
  { id: 'facebook-post', label: 'Post', description: 'Facebook post', platforms: ['facebook'] },
];

export const GOALS: GoalConfig[] = [
  { id: 'awareness', label: 'Awareness', description: 'Increase brand visibility and reach' },
  { id: 'engagement', label: 'Engagement', description: 'Drive likes, comments, and shares' },
  { id: 'conversion', label: 'Conversion', description: 'Drive specific actions (clicks, sign-ups, sales)' },
  { id: 'education', label: 'Education', description: 'Teach or inform your audience' },
  { id: 'entertainment', label: 'Entertainment', description: 'Entertain and delight your audience' },
  { id: 'community', label: 'Community', description: 'Build and nurture community' },
];

export const DEFAULT_CONTENT_PILLARS = [
  'Educational',
  'Behind-the-scenes',
  'Product/Service',
  'User-generated',
  'Inspirational',
  'Entertainment',
  'Industry News',
  'Tips & Tricks',
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get content types available for selected platforms
 */
export function getContentTypesForPlatforms(platforms: SocialPlatform[]): ContentTypeConfig[] {
  if (platforms.length === 0) return [];
  
  // Return content types that are available on ALL selected platforms
  return CONTENT_TYPES.filter(ct => 
    platforms.every(platform => ct.platforms.includes(platform))
  );
}

/**
 * Get platform config by ID
 */
export function getPlatformById(id: SocialPlatform): PlatformConfig | undefined {
  return PLATFORMS.find(p => p.id === id);
}

/**
 * Get content type config by ID
 */
export function getContentTypeById(id: ContentType): ContentTypeConfig | undefined {
  return CONTENT_TYPES.find(ct => ct.id === id);
}

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
    channels: [],
    contentType: 'post',
    goal: 'engagement',
    keyMessage: '',
    contentPillar: undefined,
    tone: 'balanced',
    references: {
      files: [],
      urls: [],
    },
    formId: generateFormId(),
    createdAt: new Date().toISOString(),
  };
}

