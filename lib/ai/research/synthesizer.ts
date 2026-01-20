/**
 * Deep Research Module - Answer Synthesizer
 *
 * Combines research notes into coherent answers and identifies
 * knowledge gaps that may need additional research.
 */

import type {
  ResearchNote,
  Citation,
  ResearchGap,
  SynthesisInput,
  SynthesisOutput,
} from './types';
import {
  SYNTHESIS_SYSTEM_PROMPT,
  MAX_GAPS_TO_ADDRESS,
  MIN_CONFIDENCE_TO_COMPLETE,
  GAP_PRIORITY_WEIGHTS,
} from './config';
import { getAnthropicClient, getAnthropicModelId } from '../providers';

// ============================================
// TYPES
// ============================================

interface SynthesisLLMOutput {
  gaps: Array<{
    description: string;
    suggestedQuery: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  confidence: number;
}

export interface SynthesisProgressCallback {
  onProgress: (progress: number, partialAnswer?: string) => void;
}

// ============================================
// PROMPTS
// ============================================

const buildSynthesisPrompt = (input: SynthesisInput): string => {
  const { query, notes, previousAnswer, gaps } = input;

  // Build notes section
  const notesSection = notes
    .map(
      (note, idx) =>
        `## Research Note ${idx + 1}
Question: ${note.subQuestionId}
Content:
${note.content}
Sources: ${note.citations.map((c, i) => `[${i + 1}] ${c.url}`).join(', ')}
Confidence: ${Math.round(note.confidence * 100)}%`
    )
    .join('\n\n');

  // Build gap context if round 2
  const gapContext =
    gaps && gaps.length > 0
      ? `\n\n## Gaps to Address
${gaps.map((g) => `- ${g.description}`).join('\n')}`
      : '';

  // Build previous answer context if round 2
  const previousContext = previousAnswer
    ? `\n\n## Previous Answer (Round 1)
${previousAnswer}

Please improve upon this answer by addressing the gaps and incorporating new research.`
    : '';

  return `# Research Query
${query}

# Research Notes
${notesSection}
${gapContext}
${previousContext}

Please synthesize these research notes into a comprehensive answer. Use inline citations [1], [2], etc. to reference sources.`;
};

// ============================================
// MAIN SYNTHESIS FUNCTION
// ============================================

/**
 * Synthesize research notes into a coherent answer
 */
export async function synthesizeAnswer(
  input: SynthesisInput,
  sessionId: string,
  round: number,
  callbacks?: SynthesisProgressCallback
): Promise<SynthesisOutput> {
  const startTime = Date.now();

  try {
    const client = await getAnthropicClient();
    const modelId = getAnthropicModelId('claude-sonnet');

    // Build the synthesis prompt
    const userPrompt = buildSynthesisPrompt(input);

    // Collect all citations from notes for reference
    const allCitations = collectCitations(input.notes);

    // Stream the response for progress updates
    const stream = await client.messages.stream({
      model: modelId,
      max_tokens: 4000,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    let fullContent = '';
    let lastProgressUpdate = 0;

    // Process stream
    stream.on('text', (text: string) => {
      fullContent += text;

      // Update progress periodically
      const now = Date.now();
      if (now - lastProgressUpdate > 500) {
        // Estimate progress based on content length (rough estimate)
        const estimatedProgress = Math.min(90, (fullContent.length / 3000) * 100);
        callbacks?.onProgress(estimatedProgress, fullContent);
        lastProgressUpdate = now;
      }
    });

    // Wait for completion
    await stream.finalMessage();

    callbacks?.onProgress(100, fullContent);

    // Parse the response to extract answer and gap analysis
    const { answer, gapAnalysis } = parseResponse(fullContent);

    // Transform gaps
    const gaps = transformGaps(gapAnalysis, sessionId, round);

    // Map citations from the answer
    const usedCitations = extractUsedCitations(answer, allCitations);

    console.log(
      `[Synthesizer] Generated answer (${answer.length} chars) with ` +
        `${usedCitations.length} citations and ${gaps.length} gaps in ${Date.now() - startTime}ms`
    );

    return {
      answer,
      citations: usedCitations,
      gaps,
      confidence: gapAnalysis?.confidence ?? calculateConfidence(answer, usedCitations, gaps),
    };
  } catch (error) {
    console.error('[Synthesizer] Synthesis failed:', error);
    throw error;
  }
}

// ============================================
// RESPONSE PARSING
// ============================================

/**
 * Parse the LLM response to separate answer from gap analysis
 */
function parseResponse(content: string): {
  answer: string;
  gapAnalysis: SynthesisLLMOutput | null;
} {
  // Look for JSON block at the end
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```|\{[\s\S]*"gaps"[\s\S]*"confidence"[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const gapAnalysis = JSON.parse(jsonStr) as SynthesisLLMOutput;

      // Remove the JSON block from the answer
      const answer = content.replace(jsonMatch[0], '').trim();

      return { answer, gapAnalysis };
    } catch {
      // JSON parsing failed, return full content as answer
    }
  }

  return { answer: content.trim(), gapAnalysis: null };
}

/**
 * Transform gap analysis into ResearchGap objects
 */
function transformGaps(
  gapAnalysis: SynthesisLLMOutput | null,
  sessionId: string,
  round: number
): ResearchGap[] {
  if (!gapAnalysis || !gapAnalysis.gaps) {
    return [];
  }

  return gapAnalysis.gaps
    .slice(0, MAX_GAPS_TO_ADDRESS)
    .map((gap, index) => ({
      id: `gap-${sessionId}-r${round}-${index}`,
      sessionId,
      round,
      description: gap.description,
      suggestedQuery: gap.suggestedQuery,
      priority: gap.priority || 'medium',
      resolved: false,
    }));
}

// ============================================
// CITATION HANDLING
// ============================================

/**
 * Collect all citations from research notes, deduplicating by URL
 */
function collectCitations(notes: ResearchNote[]): Citation[] {
  const citationMap = new Map<string, Citation>();

  for (const note of notes) {
    for (const citation of note.citations) {
      if (!citationMap.has(citation.url)) {
        citationMap.set(citation.url, {
          ...citation,
          id: `citation-${citationMap.size + 1}`,
        });
      }
    }
  }

  return Array.from(citationMap.values());
}

/**
 * Extract citations actually used in the answer (referenced by [n])
 */
function extractUsedCitations(answer: string, allCitations: Citation[]): Citation[] {
  const usedIndices = new Set<number>();

  // Find all citation references like [1], [2], etc.
  const matches = answer.matchAll(/\[(\d+)\]/g);
  for (const match of matches) {
    usedIndices.add(parseInt(match[1], 10) - 1); // Convert to 0-based index
  }

  // Return citations in order of first use
  return Array.from(usedIndices)
    .filter((idx) => idx >= 0 && idx < allCitations.length)
    .map((idx) => allCitations[idx]);
}

/**
 * Renumber citations in the answer to be sequential
 * (handles cases where not all original citations are used)
 */
export function renumberCitations(
  answer: string,
  citations: Citation[]
): { answer: string; citations: Citation[] } {
  // Build a mapping from old indices to new indices
  const oldToNew = new Map<number, number>();

  // Find all used citation numbers in order of first appearance
  const usedNumbers: number[] = [];
  const matches = answer.matchAll(/\[(\d+)\]/g);

  for (const match of matches) {
    const num = parseInt(match[1], 10);
    if (!oldToNew.has(num)) {
      oldToNew.set(num, usedNumbers.length + 1);
      usedNumbers.push(num);
    }
  }

  // Replace citation numbers
  let renumberedAnswer = answer.replace(/\[(\d+)\]/g, (match, num) => {
    const newNum = oldToNew.get(parseInt(num, 10));
    return newNum ? `[${newNum}]` : match;
  });

  // Reorder citations
  const renumberedCitations = usedNumbers
    .map((oldNum) => citations[oldNum - 1])
    .filter(Boolean)
    .map((c, idx) => ({ ...c, id: `citation-${idx + 1}` }));

  return { answer: renumberedAnswer, citations: renumberedCitations };
}

// ============================================
// GAP ANALYSIS
// ============================================

/**
 * Calculate overall confidence when no gap analysis is provided
 */
function calculateConfidence(
  answer: string,
  citations: Citation[],
  gaps: ResearchGap[]
): number {
  let score = 0.6; // Base score

  // Answer completeness
  if (answer.length > 1000) score += 0.1;
  if (answer.length > 2000) score += 0.05;

  // Citation coverage
  if (citations.length >= 3) score += 0.1;
  if (citations.length >= 5) score += 0.05;

  // Penalize for gaps
  const gapPenalty = gaps.reduce(
    (penalty, gap) => penalty + GAP_PRIORITY_WEIGHTS[gap.priority] * 0.05,
    0
  );
  score -= gapPenalty;

  return Math.max(0.3, Math.min(0.95, score));
}

/**
 * Determine if we should proceed to round 2 based on gaps and confidence
 */
export function shouldProceedToRound2(output: SynthesisOutput): boolean {
  // If confidence is high enough, no need for round 2
  if (output.confidence >= MIN_CONFIDENCE_TO_COMPLETE) {
    return false;
  }

  // If there are significant gaps, proceed to round 2
  const significantGaps = output.gaps.filter(
    (g) => g.priority === 'high' || g.priority === 'medium'
  );

  return significantGaps.length > 0;
}

/**
 * Get queries for round 2 based on gaps
 */
export function getRound2Queries(gaps: ResearchGap[]): string[] {
  // Sort gaps by priority
  const sortedGaps = [...gaps].sort(
    (a, b) => GAP_PRIORITY_WEIGHTS[b.priority] - GAP_PRIORITY_WEIGHTS[a.priority]
  );

  // Return suggested queries for top gaps
  return sortedGaps.slice(0, MAX_GAPS_TO_ADDRESS).map((g) => g.suggestedQuery);
}

/**
 * Merge round 1 and round 2 citations, deduplicating by URL
 */
export function mergeCitations(
  round1Citations: Citation[],
  round2Citations: Citation[]
): Citation[] {
  const urlSet = new Set(round1Citations.map((c) => c.url));
  const merged = [...round1Citations];

  for (const citation of round2Citations) {
    if (!urlSet.has(citation.url)) {
      urlSet.add(citation.url);
      merged.push({
        ...citation,
        id: `citation-${merged.length + 1}`,
      });
    }
  }

  return merged;
}
