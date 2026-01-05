/**
 * Quick Action Service
 * 
 * Provides CRUD operations for quick action configuration:
 * - Channels (social media platforms)
 * - Content sub-types
 * - Goals
 * - Content pillars
 */

import { createClient } from './client';

// =============================================================================
// Types
// =============================================================================

export type ContentFormat = 'short_form' | 'long_form' | 'written';

export interface Channel {
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

export interface ContentSubtype {
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

export interface Goal {
  id: string;
  label: string;
  description: string | null;
  is_default: boolean;
  display_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPillar {
  id: string;
  label: string;
  is_default: boolean;
  display_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Input Types (for create/update)
// =============================================================================

export interface CreateChannelInput {
  label: string;
  short_label: string;
  icon?: string;
  supported_formats: ContentFormat[];
}

export interface UpdateChannelInput {
  label?: string;
  short_label?: string;
  icon?: string;
  supported_formats?: ContentFormat[];
  display_order?: number;
}

export interface CreateContentSubtypeInput {
  label: string;
  format: ContentFormat;
  channel_ids: string[];
}

export interface UpdateContentSubtypeInput {
  label?: string;
  format?: ContentFormat;
  channel_ids?: string[];
  display_order?: number;
}

export interface CreateGoalInput {
  label: string;
  description?: string;
}

export interface UpdateGoalInput {
  label?: string;
  description?: string;
  display_order?: number;
}

export interface CreatePillarInput {
  label: string;
}

export interface UpdatePillarInput {
  label?: string;
  display_order?: number;
}

// =============================================================================
// Channel Operations
// =============================================================================

/**
 * Get all channels (default + user's custom)
 */
export async function getChannels(): Promise<Channel[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_channels')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single channel by ID
 */
export async function getChannelById(id: string): Promise<Channel | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_channels')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching channel:', error);
    return null;
  }

  return data;
}

/**
 * Add a custom channel
 */
export async function addChannel(input: CreateChannelInput): Promise<Channel | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Get max display order
  const { data: maxOrder } = await supabase
    .from('quick_action_channels')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('quick_action_channels')
    .insert({
      ...input,
      is_default: false,
      user_id: user.id,
      display_order: (maxOrder?.display_order || 0) + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding channel:', error);
    return null;
  }

  return data;
}

/**
 * Update a channel (only custom channels can be updated)
 */
export async function updateChannel(id: string, input: UpdateChannelInput): Promise<Channel | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_channels')
    .update(input)
    .eq('id', id)
    .eq('is_default', false) // Prevent updating default channels
    .select()
    .single();

  if (error) {
    console.error('Error updating channel:', error);
    return null;
  }

  return data;
}

/**
 * Delete a custom channel
 */
export async function deleteChannel(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('quick_action_channels')
    .delete()
    .eq('id', id)
    .eq('is_default', false); // Prevent deleting default channels

  if (error) {
    console.error('Error deleting channel:', error);
    return false;
  }

  return true;
}

// =============================================================================
// Content Sub-type Operations
// =============================================================================

/**
 * Get all content sub-types
 */
export async function getContentSubtypes(): Promise<ContentSubtype[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_content_subtypes')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching content subtypes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get content sub-types filtered by channel IDs and format
 * Returns sub-types that are available for ALL selected channels
 */
export async function getContentSubtypesForChannels(
  channelIds: string[],
  format: ContentFormat
): Promise<ContentSubtype[]> {
  if (channelIds.length === 0) return [];
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_content_subtypes')
    .select('*')
    .eq('format', format)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching content subtypes:', error);
    return [];
  }

  // Filter to only include sub-types available for ALL selected channels
  // A sub-type is available if its channel_ids array contains at least one of the selected channels
  const filtered = (data || []).filter(subtype => {
    // Check if this subtype is available for at least one selected channel
    return channelIds.some(channelId => subtype.channel_ids.includes(channelId));
  });

  return filtered;
}

/**
 * Add a custom content sub-type
 */
export async function addContentSubtype(input: CreateContentSubtypeInput): Promise<ContentSubtype | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data: maxOrder } = await supabase
    .from('quick_action_content_subtypes')
    .select('display_order')
    .eq('format', input.format)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('quick_action_content_subtypes')
    .insert({
      ...input,
      is_default: false,
      user_id: user.id,
      display_order: (maxOrder?.display_order || 0) + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding content subtype:', error);
    return null;
  }

  return data;
}

/**
 * Update a content sub-type
 */
export async function updateContentSubtype(
  id: string,
  input: UpdateContentSubtypeInput
): Promise<ContentSubtype | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_content_subtypes')
    .update(input)
    .eq('id', id)
    .eq('is_default', false)
    .select()
    .single();

  if (error) {
    console.error('Error updating content subtype:', error);
    return null;
  }

  return data;
}

/**
 * Delete a content sub-type
 */
export async function deleteContentSubtype(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('quick_action_content_subtypes')
    .delete()
    .eq('id', id)
    .eq('is_default', false);

  if (error) {
    console.error('Error deleting content subtype:', error);
    return false;
  }

  return true;
}

// =============================================================================
// Goal Operations
// =============================================================================

/**
 * Get all goals
 */
export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_goals')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a custom goal
 */
export async function addGoal(input: CreateGoalInput): Promise<Goal | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data: maxOrder } = await supabase
    .from('quick_action_goals')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('quick_action_goals')
    .insert({
      ...input,
      is_default: false,
      user_id: user.id,
      display_order: (maxOrder?.display_order || 0) + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding goal:', error);
    return null;
  }

  return data;
}

/**
 * Update a goal
 */
export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_goals')
    .update(input)
    .eq('id', id)
    .eq('is_default', false)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal:', error);
    return null;
  }

  return data;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('quick_action_goals')
    .delete()
    .eq('id', id)
    .eq('is_default', false);

  if (error) {
    console.error('Error deleting goal:', error);
    return false;
  }

  return true;
}

// =============================================================================
// Content Pillar Operations
// =============================================================================

/**
 * Get all content pillars
 */
export async function getPillars(): Promise<ContentPillar[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_pillars')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching pillars:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a custom content pillar
 */
export async function addPillar(input: CreatePillarInput): Promise<ContentPillar | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data: maxOrder } = await supabase
    .from('quick_action_pillars')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('quick_action_pillars')
    .insert({
      ...input,
      is_default: false,
      user_id: user.id,
      display_order: (maxOrder?.display_order || 0) + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding pillar:', error);
    return null;
  }

  return data;
}

/**
 * Update a content pillar
 */
export async function updatePillar(id: string, input: UpdatePillarInput): Promise<ContentPillar | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quick_action_pillars')
    .update(input)
    .eq('id', id)
    .eq('is_default', false)
    .select()
    .single();

  if (error) {
    console.error('Error updating pillar:', error);
    return null;
  }

  return data;
}

/**
 * Delete a content pillar
 */
export async function deletePillar(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('quick_action_pillars')
    .delete()
    .eq('id', id)
    .eq('is_default', false);

  if (error) {
    console.error('Error deleting pillar:', error);
    return false;
  }

  return true;
}

// =============================================================================
// Bulk Operations (for initial load)
// =============================================================================

export interface QuickActionConfig {
  channels: Channel[];
  contentSubtypes: ContentSubtype[];
  goals: Goal[];
  pillars: ContentPillar[];
}

/**
 * Load all quick action configuration data at once
 */
export async function loadQuickActionConfig(): Promise<QuickActionConfig> {
  const [channels, contentSubtypes, goals, pillars] = await Promise.all([
    getChannels(),
    getContentSubtypes(),
    getGoals(),
    getPillars(),
  ]);

  return {
    channels,
    contentSubtypes,
    goals,
    pillars,
  };
}

