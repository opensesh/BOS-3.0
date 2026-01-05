/**
 * Prompt Builder for Quick Actions
 * 
 * Converts form data into structured prompts for AI processing.
 * The prompts are designed to work with the "Create Post Copy" skill.
 */

import type {
  PostCopyFormData,
  Channel,
  ContentSubtype,
  Goal,
  ContentFormat,
  OutputPreferences,
} from './types';
import { 
  CONTENT_FORMATS, 
  VARIATION_OPTIONS,
  HASHTAG_OPTIONS,
  CAPTION_LENGTH_OPTIONS,
  CTA_OPTIONS,
} from './types';

// =============================================================================
// Types
// =============================================================================

export interface PromptContext {
  channels: Channel[];
  contentSubtypes: ContentSubtype[];
  goals: Goal[];
}

export interface BrandContext {
  voiceGuidelines?: string;
  messagingPillars?: string;
  contentPillars?: string;
}

export interface BuildPromptOptions {
  formData: PostCopyFormData;
  context: PromptContext;
  brandContext?: BrandContext;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getChannelNames(channelIds: string[], channels: Channel[]): string[] {
  return channelIds
    .map(id => channels.find(c => c.id === id)?.label)
    .filter((label): label is string => !!label);
}

function getContentFormatLabel(format: ContentFormat): string {
  return CONTENT_FORMATS.find(f => f.id === format)?.label || format;
}

function getContentSubtypeLabels(subtypeIds: string[], subtypes: ContentSubtype[]): string[] {
  return subtypeIds
    .map(id => subtypes.find(s => s.id === id)?.label)
    .filter((label): label is string => !!label);
}

function getGoalLabel(goalId: string, goals: Goal[]): string {
  return goals.find(g => g.id === goalId)?.label || 'engagement';
}

function formatReferenceUrls(urls: { url: string; title?: string }[]): string {
  if (urls.length === 0) return '';
  return urls.map(u => u.title ? `${u.title}: ${u.url}` : u.url).join('\n  - ');
}

function formatReferenceFiles(files: { name: string }[]): string {
  if (files.length === 0) return '';
  return files.map(f => f.name).join(', ');
}

function formatOutputPreferences(prefs: OutputPreferences): string {
  const parts: string[] = [];
  
  // Variations
  const variationLabel = VARIATION_OPTIONS.find(v => v.id === prefs.variations)?.label || '1';
  parts.push(`- Variations: ${variationLabel}`);
  
  // Hashtags
  const hashtagLabel = HASHTAG_OPTIONS.find(h => h.id === prefs.hashtags)?.label || 'Suggest';
  parts.push(`- Hashtags: ${hashtagLabel}`);
  
  // Caption length
  const lengthLabel = CAPTION_LENGTH_OPTIONS.find(l => l.id === prefs.captionLength)?.label || 'Standard';
  parts.push(`- Length: ${lengthLabel}`);
  
  // CTA
  const ctaLabel = CTA_OPTIONS.find(c => c.id === prefs.includeCta)?.label || 'Yes';
  parts.push(`- Include CTA: ${ctaLabel}`);
  
  return parts.join('\n');
}

// =============================================================================
// Main Prompt Builder
// =============================================================================

/**
 * Build a structured prompt for the Create Post Copy skill
 */
export function buildCreatePostCopyPrompt(options: BuildPromptOptions): string {
  const { formData, context, brandContext } = options;
  const { channels, contentSubtypes, goals } = context;

  // Get human-readable values
  const channelNames = getChannelNames(formData.channelIds, channels);
  const formatLabel = getContentFormatLabel(formData.contentFormat);
  const subtypeLabels = getContentSubtypeLabels(formData.contentSubtypeIds, contentSubtypes);
  const goalLabel = getGoalLabel(formData.goalId, goals);

  // Build the prompt sections
  const sections: string[] = [];

  // Brand context (if available)
  if (brandContext) {
    sections.push('## Brand Context');
    if (brandContext.voiceGuidelines) {
      sections.push(`**Voice Guidelines:**\n${brandContext.voiceGuidelines}`);
    }
    if (brandContext.messagingPillars) {
      sections.push(`\n**Messaging Pillars:**\n${brandContext.messagingPillars}`);
    }
    if (brandContext.contentPillars) {
      sections.push(`\n**Content Pillars:**\n${brandContext.contentPillars}`);
    }
    sections.push('');
  }

  // Main request section
  sections.push('## Request');
  if (subtypeLabels.length > 0) {
    sections.push(`Create ${subtypeLabels.join(', ')} content for ${channelNames.join(', ')}.`);
  } else {
    sections.push(`Create ${formatLabel.toLowerCase()} content for ${channelNames.join(', ')}.`);
  }

  // Parameters
  sections.push('\n**Parameters:**');
  sections.push(`- Platforms: ${channelNames.join(', ')}`);
  sections.push(`- Format: ${formatLabel}`);
  if (subtypeLabels.length > 0) {
    sections.push(`- Content Types: ${subtypeLabels.join(', ')}`);
  }
  sections.push(`- Goal: ${goalLabel}`);
  
  // Writing style note (the actual style content is injected via chat API system prompt)
  if (formData.writingStyleId) {
    sections.push(`- Writing Style: Using "${formData.writingStyleId}" style guide`);
  }

  // Key message (the main content to work with)
  sections.push(`\n**Brief:**\n${formData.keyMessage}`);

  // Output preferences
  if (formData.outputPreferences) {
    sections.push('\n## Preferences');
    sections.push(formatOutputPreferences(formData.outputPreferences));
  }

  // Reference materials
  const hasReferences = formData.references && 
    (formData.references.files.length > 0 || formData.references.urls.length > 0);
  
  if (hasReferences) {
    sections.push('\n## Additional Context');
    sections.push('Reference Materials:');
    
    if (formData.references!.files.length > 0) {
      sections.push(`- Files: ${formatReferenceFiles(formData.references!.files)}`);
    }
    
    if (formData.references!.urls.length > 0) {
      sections.push(`- URLs:\n  - ${formatReferenceUrls(formData.references!.urls)}`);
    }
  }

  // Final instruction - specific for multiple content types
  if (subtypeLabels.length > 1) {
    sections.push(`\nGenerate separate, optimized copy for EACH content type: ${subtypeLabels.join(', ')}. Clearly label each section.`);
  } else {
    sections.push('\nGenerate on-brand copy following the skill guidelines for this channel and content type.');
  }

  return sections.join('\n');
}

/**
 * Build a system prompt context for the AI
 */
export function buildSystemContext(channelNames: string[], format: string): string {
  return `You are a social media copywriting expert. You're helping create ${format.toLowerCase()} content for ${channelNames.join(', ')}. 

Key considerations:
- Optimize for each platform's unique audience and best practices
- Consider character limits and formatting constraints
- Focus on driving the specified goal
- Match the requested tone while maintaining authenticity
- Include relevant hashtags where appropriate
- Create engaging hooks and calls-to-action

Provide separate copy for each platform, clearly labeled.`;
}

/**
 * Format the final prompt for the chat
 */
export function formatPromptForChat(
  formData: PostCopyFormData,
  context: PromptContext,
  brandContext?: BrandContext
): { userMessage: string; systemContext: string } {
  const channelNames = getChannelNames(formData.channelIds, context.channels);
  const formatLabel = getContentFormatLabel(formData.contentFormat);
  
  return {
    userMessage: buildCreatePostCopyPrompt({ formData, context, brandContext }),
    systemContext: buildSystemContext(channelNames, formatLabel),
  };
}

/**
 * Generate a summary of the form data for display
 */
export function generateFormSummary(
  formData: PostCopyFormData,
  context: PromptContext
): string {
  const channelNames = getChannelNames(formData.channelIds, context.channels);
  const formatLabel = getContentFormatLabel(formData.contentFormat);
  const goalLabel = getGoalLabel(formData.goalId, context.goals);
  
  const parts = [
    `Channels: ${channelNames.join(', ')}`,
    `Format: ${formatLabel}`,
    `Goal: ${goalLabel}`,
  ];

  if (formData.keyMessage) {
    const truncatedMessage = formData.keyMessage.length > 50 
      ? formData.keyMessage.substring(0, 50) + '...'
      : formData.keyMessage;
    parts.push(`Message: "${truncatedMessage}"`);
  }

  return parts.join(' | ');
}

