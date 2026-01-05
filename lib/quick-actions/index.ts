/**
 * Quick Actions Module
 * 
 * Provides structured form-based interactions in the chat interface.
 * Quick actions allow users to fill out forms with specific inputs
 * that are then used to generate targeted content using AI skills.
 */

export * from './types';
export * from './prompt-builder';
// Only export client-safe functions from skill-loader
// Server-only functions should be imported directly from './skill-loader' in API routes
export { loadSkillContentClient, getSkillIdForQuickAction } from './skill-loader';
