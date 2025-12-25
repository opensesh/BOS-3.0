import { NextResponse } from 'next/server';

export const maxDuration = 5; // Fast responses for autocomplete
export const runtime = 'edge'; // Use edge runtime for fastest response

interface SuggestionRequest {
  query?: string;
  mode?: 'search' | 'research';
  limit?: number;
}

/**
 * Fast autocomplete suggestions using DuckDuckGo's autocomplete API
 * Falls back to simple prefix matching if the API fails
 */
export async function POST(req: Request) {
  try {
    const body: SuggestionRequest = await req.json();
    const { query = '', mode = 'search', limit = 6 } = body;

    // If no query or too short, return empty - don't show suggestions
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [], source: 'empty' });
    }

    const trimmedQuery = query.trim();

    // Try to get real search suggestions from DuckDuckGo
    const suggestions = await getDuckDuckGoSuggestions(trimmedQuery, limit);
    
    if (suggestions.length > 0) {
      return NextResponse.json({ suggestions, source: 'duckduckgo' });
    }

    // Fallback: simple query extensions
    const fallbackSuggestions = getSimpleSuggestions(trimmedQuery, mode, limit);
    return NextResponse.json({ suggestions: fallbackSuggestions, source: 'fallback' });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ suggestions: [], source: 'error' });
  }
}

/**
 * Get autocomplete suggestions from DuckDuckGo
 * This is a free, fast API that returns real search suggestions
 */
async function getDuckDuckGoSuggestions(query: string, limit: number): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://duckduckgo.com/ac/?q=${encoded}&type=list`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Short timeout for fast autocomplete
        signal: AbortSignal.timeout(2000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    // DuckDuckGo returns [query, [suggestions]]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].slice(0, limit);
    }

    return [];
  } catch (error) {
    // Silently fail - autocomplete should never block
    console.error('DuckDuckGo autocomplete error:', error);
    return [];
  }
}

/**
 * Simple fallback suggestions when external API fails
 * Generates common query patterns based on the input
 */
function getSimpleSuggestions(query: string, mode: 'search' | 'research', limit: number): string[] {
  const queryLower = query.toLowerCase();
  const suggestions: string[] = [];
  
  // Common question starters
  const questionStarters = ['what is', 'how to', 'why', 'when', 'where', 'who'];
  const isQuestion = questionStarters.some(q => queryLower.startsWith(q));
  
  if (isQuestion) {
    // Extend questions naturally
    suggestions.push(
      `${query} in 2025`,
      `${query} examples`,
      `${query} best practices`,
      `${query} explained`,
    );
  } else {
    // Add common query patterns
    suggestions.push(
      `what is ${query}`,
      `how to ${query}`,
      `${query} tutorial`,
      `${query} examples`,
      `${query} best practices`,
      `${query} guide`,
    );
  }
  
  // For research mode, add more analytical suggestions
  if (mode === 'research') {
    suggestions.push(
      `${query} analysis`,
      `${query} trends`,
      `${query} comparison`,
    );
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
