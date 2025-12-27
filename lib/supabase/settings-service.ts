/**
 * Supabase service for user profile and settings management
 */

import { createClient } from './client';
import type {
  DbUserProfile,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
} from './types';
import { dbUserProfileToApp } from './types';

const supabase = createClient();

/**
 * Get the current user's profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found, return null
      return null;
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return dbUserProfileToApp(data as DbUserProfile);
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profile: UserProfileInsert): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return dbUserProfileToApp(data as DbUserProfile);
}

/**
 * Update an existing user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdate
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return dbUserProfileToApp(data as DbUserProfile);
}

/**
 * Get or create a user profile (upsert behavior)
 */
export async function getOrCreateUserProfile(
  userId: string,
  defaults?: Partial<UserProfileInsert>
): Promise<UserProfile> {
  // Try to get existing profile
  const existing = await getUserProfile(userId);
  if (existing) {
    return existing;
  }

  // Create new profile with defaults
  return createUserProfile({
    user_id: userId,
    ...defaults,
  });
}

/**
 * Upload a user avatar image
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrl = urlData.publicUrl;

  // Update profile with new avatar URL
  await updateUserProfile(userId, { avatar_url: avatarUrl });

  return avatarUrl;
}

/**
 * Delete the user's avatar
 */
export async function deleteAvatar(userId: string): Promise<void> {
  // List files in user's avatar folder
  const { data: files, error: listError } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (listError) {
    console.error('Error listing avatar files:', listError);
    throw listError;
  }

  // Delete all avatar files for this user
  if (files && files.length > 0) {
    const filePaths = files.map(f => `${userId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting avatar:', deleteError);
      throw deleteError;
    }
  }

  // Clear avatar URL from profile
  await updateUserProfile(userId, { avatar_url: null });
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  let query = supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username);

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }

  return data === null;
}

