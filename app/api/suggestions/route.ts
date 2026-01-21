import { NextResponse } from 'next/server';

export const maxDuration = 10;

interface SuggestionRequest {
  query?: string;
  mode?: 'search' | 'research';
  limit?: number;
}

/**
 * Smart autocomplete suggestions using Claude Sonnet
 * Fast, contextual, and intelligent - not generic internet searches
 */
export async function POST(req: Request) {
  try {
    const body: SuggestionRequest = await req.json();
    const { query = '', mode = 'search', limit = 6 } = body;

    // If no query or too short, return empty
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [], source: 'empty' });
    }

    const trimmedQuery = query.trim();

    // Use Claude Sonnet for intelligent suggestions
    const suggestions = await getSmartSuggestions(trimmedQuery, mode, limit);
    
    return NextResponse.json({ suggestions, source: 'ai' });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ suggestions: [], source: 'error' });
  }
}

/**
 * Generate intelligent autocomplete suggestions using Claude Sonnet
 * Fast and contextually aware
 */
async function getSmartSuggestions(
  query: string,
  mode: 'search' | 'research',
  limit: number
): Promise<string[]> {
  const isResearch = mode === 'research';
  
  const prompt = `You are an intelligent autocomplete engine. The user is typing a query and you need to suggest helpful completions.

User's partial query: "${query}"
Mode: ${isResearch ? 'Deep research' : 'Quick search'}

Generate ${limit} smart autocomplete suggestions that:
1. Naturally complete or extend their query
2. Are contextually relevant to what they seem to be asking about
3. Are practical and useful - things someone would actually want to know
4. Cover different angles or aspects of the topic

${isResearch 
  ? 'For research mode: Suggest comprehensive, analytical queries that invite deeper exploration.'
  : 'For search mode: Suggest direct, specific questions that can be answered concisely.'}

Rules:
- Each suggestion should feel like a natural completion of "${query}"
- Be intelligent about context - if they're asking about "branding", suggest branding-related completions, not unrelated topics
- Vary the suggestions - don't just add different endings to the same base
- Keep suggestions 5-15 words
- Return ONLY the suggestions, one per line, no numbering, no bullets, no quotes
- Do NOT suggest anything unrelated to their apparent topic`;

  try {
    // Dynamic import to avoid issues
    const { getAnthropicClient, getAnthropicModelId } = await import('@/lib/ai/providers');
    
    const client = await getAnthropicClient();
    const modelId = getAnthropicModelId('claude-sonnet'); // Fast model for autocomplete
    
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 250,
      messages: [{ role: 'user', content: prompt }],
    });
    
    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');
    
    // Parse suggestions from response
    const suggestions = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 150)
      .filter(s => !s.match(/^[\d\-\*\•\"\']/)) // Remove numbered/bulleted/quoted items
      .filter(s => !s.startsWith('-'))
      .slice(0, limit);
    
    return suggestions;
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    // Return simple contextual fallbacks
    return getContextualFallbacks(query, mode, limit);
  }
}

/**
 * Simple contextual fallbacks when AI fails
 * These are generic but at least contextually relevant
 */
function getContextualFallbacks(
  query: string,
  mode: 'search' | 'research',
  limit: number
): string[] {
  const queryLower = query.toLowerCase();
  const suggestions: string[] = [];
  
  // Detect if it's a question
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'should', 'is', 'are', 'do', 'does'];
  const startsWithQuestion = questionWords.some(q => queryLower.startsWith(q));
  
  if (startsWithQuestion) {
    // Extend questions naturally
    if (mode === 'research') {
      suggestions.push(
        `${query} and its implications`,
        `${query} - a comprehensive analysis`,
        `${query} compared to alternatives`,
        `${query} - trends and future outlook`,
      );
    } else {
      suggestions.push(
        `${query} in 2025`,
        `${query} - best practices`,
        `${query} examples`,
        `${query} explained simply`,
      );
    }
  } else {
    // Add common patterns for non-questions
    if (mode === 'research') {
      suggestions.push(
        `${query} comprehensive guide`,
        `${query} industry analysis`,
        `${query} best practices and strategies`,
        `${query} case studies`,
      );
    } else {
      suggestions.push(
        `what is ${query}`,
        `${query} best practices`,
        `${query} examples`,
        `how to use ${query}`,
      );
    }
  }
  
  return suggestions.slice(0, limit);
}

// Also support GET for simple queries
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const mode = (searchParams.get('mode') as 'search' | 'research') || 'search';
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  
  return POST(new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode, limit }),
  }));
}
