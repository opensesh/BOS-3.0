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
  ContentPillar,
  ContentFormat,
  TonePreset,
} from './types';
import { CONTENT_FORMATS, TONE_PRESETS } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PromptContext {
  channels: Channel[];
  contentSubtypes: ContentSubtype[];
  goals: Goal[];
  pillars: ContentPillar[];
}

export interface BuildPromptOptions {
  formData: PostCopyFormData;
  context: PromptContext;
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

function getContentSubtypeLabel(subtypeId: string | null, subtypes: ContentSubtype[]): string | null {
  if (!subtypeId) return null;
  return subtypes.find(s => s.id === subtypeId)?.label || null;
}

function getGoalLabel(goalId: string, goals: Goal[]): string {
  return goals.find(g => g.id === goalId)?.label || 'engagement';
}

function getPillarLabel(pillarId: string | undefined, pillars: ContentPillar[]): string | null {
  if (!pillarId) return null;
  return pillars.find(p => p.id === pillarId)?.label || null;
}

function getToneLabel(tone: TonePreset): string {
  return TONE_PRESETS.find(t => t.id === tone)?.label || 'Balanced';
}

function formatReferenceUrls(urls: { url: string; title?: string }[]): string {
  if (urls.length === 0) return '';
  return urls.map(u => u.title ? `${u.title}: ${u.url}` : u.url).join('\n  - ');
}

function formatReferenceFiles(files: { name: string }[]): string {
  if (files.length === 0) return '';
  return files.map(f => f.name).join(', ');
}

// =============================================================================
// Main Prompt Builder
// =============================================================================

/**
 * Build a structured prompt for the Create Post Copy skill
 */
export function buildCreatePostCopyPrompt(options: BuildPromptOptions): string {
  const { formData, context } = options;
  const { channels, contentSubtypes, goals, pillars } = context;

  // Get human-readable values
  const channelNames = getChannelNames(formData.channelIds, channels);
  const formatLabel = getContentFormatLabel(formData.contentFormat);
  const subtypeLabel = getContentSubtypeLabel(formData.contentSubtypeId, contentSubtypes);
  const goalLabel = getGoalLabel(formData.goalId, goals);
  const pillarLabel = getPillarLabel(formData.contentPillarId, pillars);
  const toneLabel = getToneLabel(formData.tone);

  // Build the prompt sections
  const sections: string[] = [];

  // Main instruction
  sections.push(`Create social media copy for the following platforms: ${channelNames.join(', ')}.`);

  // Content format and type
  sections.push(`\nContent Format: ${formatLabel}`);
  if (subtypeLabel) {
    sections.push(`Content Type: ${subtypeLabel}`);
  }

  // Goal
  sections.push(`\nGoal: ${goalLabel}`);

  // Key message (the main content to work with)
  sections.push(`\nKey Message:\n${formData.keyMessage}`);

  // Optional: Content pillar
  if (pillarLabel) {
    sections.push(`\nContent Pillar: ${pillarLabel}`);
  }

  // Optional: Product type
  if (formData.productType) {
    const productLabel = formData.productType === 'product' ? 'Product' 
      : formData.productType === 'service' ? 'Service' 
      : 'Other';
    sections.push(`\nFocus: ${productLabel}`);
  }

  // Tone
  sections.push(`\nTone: ${toneLabel}`);

  // Reference materials
  const hasReferences = formData.references && 
    (formData.references.files.length > 0 || formData.references.urls.length > 0);
  
  if (hasReferences) {
    sections.push('\nReference Materials:');
    
    if (formData.references!.files.length > 0) {
      sections.push(`  Files: ${formatReferenceFiles(formData.references!.files)}`);
    }
    
    if (formData.references!.urls.length > 0) {
      sections.push(`  URLs:\n  - ${formatReferenceUrls(formData.references!.urls)}`);
    }
  }

  // Final instructions
  sections.push(`\nPlease generate engaging copy for each selected platform, optimized for the ${formatLabel.toLowerCase()} format. Consider platform-specific best practices, character limits, and engagement strategies for ${goalLabel.toLowerCase()}.`);

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
  context: PromptContext
): { userMessage: string; systemContext: string } {
  const channelNames = getChannelNames(formData.channelIds, context.channels);
  const formatLabel = getContentFormatLabel(formData.contentFormat);
  
  return {
    userMessage: buildCreatePostCopyPrompt({ formData, context }),
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

