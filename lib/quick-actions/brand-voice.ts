/**
 * Brand Voice Retrieval Service
 * 
 * Retrieves and distills brand voice context for quick actions.
 * The key philosophy: EMBODIMENT, NOT REFERENCE.
 * 
 * The AI should write AS the brand, not ABOUT the brand.
 * Retrieved context is framed as identity, not instructions.
 */

import { generateEmbedding } from '@/lib/bos/embedding-service';
import { createClient } from '@supabase/supabase-js';
import type { PostCopyFormData, Goal, Channel } from './types';

// =============================================================================
// Types
// =============================================================================

export interface BrandVoiceContext {
  /** Distilled voice characteristics as identity framing */
  voiceIdentity: string;
  /** Raw chunks used (for debugging, not shown to AI) */
  sourceChunks?: string[];
  /** Whether voice context was successfully retrieved */
  hasVoiceContext: boolean;
}

export interface VoiceRetrievalOptions {
  /** The quick action form data */
  formData: PostCopyFormData;
  /** Channel configuration */
  channel: Channel;
  /** Goal configuration */
  goal: Goal;
  /** Brand ID (defaults to open-session) */
  brandId?: string;
  /** Similarity threshold for semantic search */
  threshold?: number;
  /** Maximum chunks to retrieve */
  maxChunks?: number;
}

interface DocumentChunk {
  id: string;
  document_id: string;
  document_title: string;
  document_category: string;
  document_slug: string;
  content: string;
  heading_hierarchy: string[];
  similarity: number;
}

// =============================================================================
// Supabase Client
// =============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function getDefaultBrandId(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', 'open-session')
    .single();

  if (error || !data) {
    throw new Error('Default brand not found');
  }

  return data.id;
}

// =============================================================================
// Semantic Query Builder
// =============================================================================

/**
 * Build a semantic query that captures the essence of what voice context we need.
 * This is NOT the user's request - it's a query to find relevant brand voice.
 */
function buildVoiceQuery(options: VoiceRetrievalOptions): string {
  const { formData, channel, goal } = options;
  
  // Extract key themes from the brief to find relevant voice context
  const briefThemes = formData.keyMessage
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 10)
    .join(' ');

  // Build a query that will find relevant voice/tone guidance
  const queryParts = [
    `brand voice tone writing style`,
    `${channel.label.toLowerCase()} social media content`,
    `${goal.label.toLowerCase()} content goals`,
    briefThemes,
  ];

  return queryParts.join(' ');
}

// =============================================================================
// Voice Distillation
// =============================================================================

/**
 * Distill raw document chunks into internalized voice identity.
 * 
 * CRITICAL: This transforms guidelines into identity.
 * - NOT: "The brand guidelines say to be friendly"
 * - YES: "You speak with warmth and clarity"
 */
function distillVoiceIdentity(
  chunks: DocumentChunk[],
  channel: Channel,
  goal: Goal
): string {
  if (chunks.length === 0) {
    return '';
  }

  // Extract voice-relevant content from chunks
  const voiceContent = chunks
    .map(chunk => chunk.content)
    .join('\n\n');

  // Build identity framing - this is WHO the AI is, not rules to follow
  const identityParts: string[] = [];

  // Add channel-specific voice framing
  identityParts.push(
    `When creating ${channel.label} content, you naturally adapt your voice for the platform's culture and audience expectations.`
  );

  // Add goal-specific energy
  const goalEnergy = getGoalEnergy(goal.label);
  if (goalEnergy) {
    identityParts.push(goalEnergy);
  }

  // Extract personality traits from the content
  const traits = extractVoiceTraits(voiceContent);
  if (traits.length > 0) {
    identityParts.push(
      `Your natural voice is ${traits.join(', ')}.`
    );
  }

  // Extract any specific writing patterns
  const patterns = extractWritingPatterns(voiceContent);
  if (patterns) {
    identityParts.push(patterns);
  }

  // Add the distilled context (trimmed to avoid overwhelming)
  const trimmedContext = voiceContent.slice(0, 1500);
  if (trimmedContext) {
    identityParts.push(
      `\nYour approach to content comes from this perspective:\n${trimmedContext}`
    );
  }

  return identityParts.join(' ');
}

/**
 * Get energy framing based on goal
 */
function getGoalEnergy(goalLabel: string): string {
  const goal = goalLabel.toLowerCase();
  
  if (goal.includes('engagement') || goal.includes('community')) {
    return 'Your energy is conversational and inviting - you write like someone starting a good conversation, not delivering a speech.';
  }
  if (goal.includes('awareness') || goal.includes('reach')) {
    return 'Your energy is bold and attention-grabbing - you lead with hooks that make people stop scrolling.';
  }
  if (goal.includes('conversion') || goal.includes('sales')) {
    return 'Your energy is confident and clear - you know the value you offer and communicate it without being pushy.';
  }
  if (goal.includes('education') || goal.includes('inform')) {
    return 'Your energy is helpful and knowledgeable - you make complex things feel accessible without dumbing them down.';
  }
  if (goal.includes('entertainment')) {
    return 'Your energy is playful and creative - you\'re not afraid to take creative risks that delight your audience.';
  }
  
  return '';
}

/**
 * Extract voice traits from content
 */
function extractVoiceTraits(content: string): string[] {
  const traits: string[] = [];
  const contentLower = content.toLowerCase();

  // Look for trait indicators in the content
  const traitPatterns = [
    { pattern: /friendly|approachable|warm/i, trait: 'warm and approachable' },
    { pattern: /professional|credible|authoritative/i, trait: 'professionally credible' },
    { pattern: /creative|innovative|visionary/i, trait: 'creatively forward-thinking' },
    { pattern: /playful|fun|witty/i, trait: 'playfully engaging' },
    { pattern: /clear|concise|direct/i, trait: 'clear and direct' },
    { pattern: /authentic|genuine|honest/i, trait: 'authentically genuine' },
    { pattern: /inspiring|motivating|uplifting/i, trait: 'quietly inspiring' },
    { pattern: /human|personal|relatable/i, trait: 'humanly relatable' },
  ];

  for (const { pattern, trait } of traitPatterns) {
    if (pattern.test(contentLower) && traits.length < 3) {
      traits.push(trait);
    }
  }

  return traits;
}

/**
 * Extract writing patterns from content
 */
function extractWritingPatterns(content: string): string {
  const patterns: string[] = [];
  const contentLower = content.toLowerCase();

  // Check for specific writing guidance
  if (contentLower.includes('first person') || contentLower.includes('we, us, our')) {
    patterns.push('You use first person plural (we, us, our) when speaking as the brand');
  }
  if (contentLower.includes('headline') || contentLower.includes('hook')) {
    patterns.push('You lead with hooks that capture attention');
  }
  if (contentLower.includes('storytelling') || contentLower.includes('narrative')) {
    patterns.push('You weave narrative elements into your content');
  }
  if (contentLower.includes('accessibility') || contentLower.includes('inclusive')) {
    patterns.push('You write with accessibility and inclusion in mind');
  }

  if (patterns.length === 0) {
    return '';
  }

  return patterns.slice(0, 2).join('. ') + '.';
}

// =============================================================================
// Main API
// =============================================================================

/**
 * Retrieve and distill brand voice context for a quick action.
 * 
 * This is the main entry point. It:
 * 1. Builds a semantic query from the form inputs
 * 2. Searches brand documents for relevant voice context
 * 3. Distills results into identity framing (not instructions)
 * 
 * @returns BrandVoiceContext with internalized voice identity
 */
export async function retrieveBrandVoice(
  options: VoiceRetrievalOptions
): Promise<BrandVoiceContext> {
  const {
    threshold = 0.5,
    maxChunks = 5,
  } = options;

  try {
    // Build semantic query
    const query = buildVoiceQuery(options);
    
    // Generate embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Get Supabase client and brand ID
    const supabase = getSupabaseAdmin();
    const brandId = options.brandId || await getDefaultBrandId(supabase);

    // Search for relevant document chunks
    const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      p_brand_id: brandId,
      match_threshold: threshold,
      match_count: maxChunks,
    });

    if (error) {
      console.error('[BrandVoice] Search error:', error);
      return {
        voiceIdentity: '',
        hasVoiceContext: false,
      };
    }

    const documentChunks = (chunks || []) as DocumentChunk[];

    if (documentChunks.length === 0) {
      console.log('[BrandVoice] No relevant chunks found');
      return {
        voiceIdentity: '',
        hasVoiceContext: false,
      };
    }

    // Distill chunks into voice identity
    const voiceIdentity = distillVoiceIdentity(
      documentChunks,
      options.channel,
      options.goal
    );

    console.log(`[BrandVoice] Distilled ${documentChunks.length} chunks into voice identity`);

    return {
      voiceIdentity,
      sourceChunks: documentChunks.map(c => c.content.slice(0, 200)),
      hasVoiceContext: true,
    };

  } catch (error) {
    console.error('[BrandVoice] Retrieval failed:', error);
    return {
      voiceIdentity: '',
      hasVoiceContext: false,
    };
  }
}

/**
 * Format voice identity for injection into system prompt.
 * 
 * This wraps the voice identity in framing that makes it feel
 * like identity, not instructions.
 */
export function formatVoiceForSystemPrompt(voiceContext: BrandVoiceContext): string {
  if (!voiceContext.hasVoiceContext || !voiceContext.voiceIdentity) {
    return '';
  }

  return `
## Your Voice

${voiceContext.voiceIdentity}

Remember: You don't reference guidelines - you embody them. Write naturally as yourself.
`.trim();
}

