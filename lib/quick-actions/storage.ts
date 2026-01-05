/**
 * Quick Action Storage
 * 
 * Handles persistence of quick action form configurations,
 * custom options (goals, pillars, channels), and form templates.
 * 
 * Uses localStorage for client-side persistence with future
 * option to sync to Supabase for cross-device access.
 */

import {
  type PostCopyFormData,
  type PostGoal,
  type SocialPlatform,
  DEFAULT_CONTENT_PILLARS,
  GOALS,
  PLATFORMS,
} from './types';

// =============================================================================
// Storage Keys
// =============================================================================

const STORAGE_KEYS = {
  CUSTOM_GOALS: 'bos-quick-actions-custom-goals',
  CUSTOM_PILLARS: 'bos-quick-actions-custom-pillars',
  CUSTOM_CHANNELS: 'bos-quick-actions-custom-channels',
  FORM_TEMPLATES: 'bos-quick-actions-templates',
  RECENT_FORMS: 'bos-quick-actions-recent',
} as const;

// =============================================================================
// Custom Options Types
// =============================================================================

export interface CustomGoal {
  id: string;
  label: string;
  description: string;
  createdAt: string;
}

export interface CustomPillar {
  id: string;
  label: string;
  createdAt: string;
}

export interface CustomChannel {
  id: string;
  label: string;
  shortLabel: string;
  icon?: string;
  contentTypes: string[];
  createdAt: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  data: Partial<PostCopyFormData>;
  createdAt: string;
  updatedAt: string;
}

export interface RecentForm {
  id: string;
  data: PostCopyFormData;
  timestamp: string;
}

// =============================================================================
// Storage Functions
// =============================================================================

/**
 * Get custom goals added by the user
 */
export function getCustomGoals(): CustomGoal[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_GOALS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom goals:', error);
    return [];
  }
}

/**
 * Add a custom goal
 */
export function addCustomGoal(label: string, description: string): CustomGoal {
  const customGoals = getCustomGoals();
  const newGoal: CustomGoal = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    label,
    description,
    createdAt: new Date().toISOString(),
  };
  
  customGoals.push(newGoal);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_GOALS, JSON.stringify(customGoals));
  
  return newGoal;
}

/**
 * Remove a custom goal
 */
export function removeCustomGoal(id: string): void {
  const customGoals = getCustomGoals().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_GOALS, JSON.stringify(customGoals));
}

/**
 * Get all goals (default + custom)
 */
export function getAllGoals(): Array<{ id: string; label: string; description: string; isCustom?: boolean }> {
  const defaultGoals = GOALS.map(g => ({ ...g, isCustom: false }));
  const customGoals = getCustomGoals().map(g => ({ ...g, isCustom: true }));
  return [...defaultGoals, ...customGoals];
}

/**
 * Get custom content pillars
 */
export function getCustomPillars(): CustomPillar[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PILLARS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom pillars:', error);
    return [];
  }
}

/**
 * Add a custom pillar
 */
export function addCustomPillar(label: string): CustomPillar {
  const customPillars = getCustomPillars();
  const newPillar: CustomPillar = {
    id: `pillar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    label,
    createdAt: new Date().toISOString(),
  };
  
  customPillars.push(newPillar);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_PILLARS, JSON.stringify(customPillars));
  
  return newPillar;
}

/**
 * Remove a custom pillar
 */
export function removeCustomPillar(id: string): void {
  const customPillars = getCustomPillars().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_PILLARS, JSON.stringify(customPillars));
}

/**
 * Get all pillars (default + custom)
 */
export function getAllPillars(): Array<{ label: string; isCustom?: boolean }> {
  const defaultPillars = DEFAULT_CONTENT_PILLARS.map(label => ({ label, isCustom: false }));
  const customPillars = getCustomPillars().map(p => ({ label: p.label, isCustom: true }));
  return [...defaultPillars, ...customPillars];
}

/**
 * Save a form template
 */
export function saveFormTemplate(name: string, data: Partial<PostCopyFormData>, description?: string): FormTemplate {
  const templates = getFormTemplates();
  const newTemplate: FormTemplate = {
    id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    description,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(templates));
  
  return newTemplate;
}

/**
 * Get all form templates
 */
export function getFormTemplates(): FormTemplate[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FORM_TEMPLATES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading form templates:', error);
    return [];
  }
}

/**
 * Delete a form template
 */
export function deleteFormTemplate(id: string): void {
  const templates = getFormTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(templates));
}

/**
 * Update a form template
 */
export function updateFormTemplate(id: string, updates: Partial<Omit<FormTemplate, 'id' | 'createdAt'>>): FormTemplate | null {
  const templates = getFormTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(templates));
  return templates[index];
}

/**
 * Save a recent form submission (for quick re-use)
 */
export function saveRecentForm(data: PostCopyFormData): void {
  const recent = getRecentForms();
  
  // Add new form at the start
  recent.unshift({
    id: data.formId,
    data,
    timestamp: new Date().toISOString(),
  });
  
  // Keep only last 10 recent forms
  const trimmed = recent.slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.RECENT_FORMS, JSON.stringify(trimmed));
}

/**
 * Get recent form submissions
 */
export function getRecentForms(): RecentForm[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_FORMS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading recent forms:', error);
    return [];
  }
}

/**
 * Clear all recent forms
 */
export function clearRecentForms(): void {
  localStorage.removeItem(STORAGE_KEYS.RECENT_FORMS);
}

/**
 * Export all quick action data (for backup/sync)
 */
export function exportQuickActionData(): {
  customGoals: CustomGoal[];
  customPillars: CustomPillar[];
  templates: FormTemplate[];
  recentForms: RecentForm[];
} {
  return {
    customGoals: getCustomGoals(),
    customPillars: getCustomPillars(),
    templates: getFormTemplates(),
    recentForms: getRecentForms(),
  };
}

/**
 * Import quick action data (from backup/sync)
 */
export function importQuickActionData(data: ReturnType<typeof exportQuickActionData>): void {
  if (data.customGoals) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_GOALS, JSON.stringify(data.customGoals));
  }
  if (data.customPillars) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PILLARS, JSON.stringify(data.customPillars));
  }
  if (data.templates) {
    localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(data.templates));
  }
  if (data.recentForms) {
    localStorage.setItem(STORAGE_KEYS.RECENT_FORMS, JSON.stringify(data.recentForms));
  }
}

