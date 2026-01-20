/**
 * Query Expander
 *
 * Expands user queries with synonyms, related terms, and brand-specific
 * vocabulary to improve search recall.
 *
 * Strategies:
 * 1. Static synonyms for common terms
 * 2. Brand-specific term mappings
 * 3. Query reformulation for semantic coverage
 */

// ===========================================
// Types
// ===========================================

export interface ExpandedQuery {
  original: string;
  expanded: string;
  terms: string[];
  confidence: number;
}

export interface ExpansionOptions {
  includeSynonyms?: boolean;
  includeBrandTerms?: boolean;
  includeReformulations?: boolean;
  maxExpansions?: number;
}

// ===========================================
// Static Synonym Maps
// ===========================================

// Common synonyms and related terms
const SYNONYM_MAP: Record<string, string[]> = {
  // Colors
  'color': ['colour', 'hue', 'shade', 'palette'],
  'colours': ['colors'],
  'red': ['crimson', 'scarlet', 'ruby'],
  'orange': ['aperol', 'tangerine', 'coral'],
  'black': ['dark', 'charcoal', 'ebony'],
  'white': ['light', 'cream', 'vanilla', 'ivory'],

  // Typography
  'font': ['typeface', 'typography', 'type'],
  'typeface': ['font', 'typography'],
  'typography': ['font', 'typeface', 'type', 'lettering'],
  'heading': ['title', 'header', 'headline'],
  'body': ['paragraph', 'text', 'copy'],
  'bold': ['heavy', 'strong', 'thick'],

  // Brand
  'logo': ['logomark', 'brandmark', 'mark', 'symbol'],
  'brand': ['identity', 'branding'],
  'identity': ['brand', 'branding'],
  'guidelines': ['guide', 'rules', 'standards', 'spec'],
  'voice': ['tone', 'personality', 'character'],
  'tone': ['voice', 'mood', 'style'],

  // Design
  'style': ['aesthetic', 'look', 'design'],
  'design': ['style', 'aesthetic', 'visual'],
  'layout': ['composition', 'arrangement', 'structure'],
  'spacing': ['padding', 'margin', 'whitespace', 'gap'],
  'icon': ['symbol', 'glyph', 'pictogram'],

  // Content
  'write': ['compose', 'draft', 'create'],
  'writing': ['copy', 'content', 'text'],
  'message': ['messaging', 'communication', 'content'],
  'social': ['social media', 'instagram', 'twitter', 'linkedin'],

  // Actions
  'use': ['apply', 'utilize', 'employ'],
  'create': ['make', 'build', 'design', 'generate'],
  'find': ['search', 'locate', 'discover'],
  'show': ['display', 'present', 'demonstrate'],
};

// Brand-specific term mappings
const BRAND_TERM_MAP: Record<string, string[]> = {
  // Open Session brand terms
  'aperol': ['orange', 'brand color', 'accent', '#FE5102'],
  'charcoal': ['dark', 'black', '#191919', 'background'],
  'vanilla': ['cream', 'light', 'warm white', '#FFFAEE'],
  'glass': ['transparent', 'overlay', 'frost'],

  // Typography
  'neue haas': ['neue haas grotesk', 'display font', 'heading font'],
  'offbit': ['accent font', 'tech font', 'digital'],

  // Brand concepts
  'steward': ['guide', 'advisor', 'helper', 'guardian'],
  'open session': ['brand', 'company', 'organization'],

  // Asset categories
  'illustration': ['illustrations', 'drawings', 'graphics'],
  'texture': ['textures', 'pattern', 'background'],
  'photo': ['photography', 'image', 'picture'],
};

// ===========================================
// Query Analysis
// ===========================================

/**
 * Tokenize query into terms
 */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 1);
}

/**
 * Detect query intent
 */
function detectIntent(query: string): 'search' | 'question' | 'action' | 'definition' {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.startsWith('what is') || lowerQuery.startsWith('what are') ||
      lowerQuery.startsWith('define') || lowerQuery.includes('meaning of')) {
    return 'definition';
  }

  if (lowerQuery.startsWith('how') || lowerQuery.startsWith('what') ||
      lowerQuery.startsWith('why') || lowerQuery.startsWith('when') ||
      lowerQuery.startsWith('where') || lowerQuery.includes('?')) {
    return 'question';
  }

  if (lowerQuery.startsWith('find') || lowerQuery.startsWith('show') ||
      lowerQuery.startsWith('get') || lowerQuery.startsWith('list') ||
      lowerQuery.startsWith('search')) {
    return 'action';
  }

  return 'search';
}

// ===========================================
// Expansion Functions
// ===========================================

/**
 * Get synonyms for a term
 */
function getSynonyms(term: string): string[] {
  const lower = term.toLowerCase();
  const synonyms: string[] = [];

  // Direct match
  if (SYNONYM_MAP[lower]) {
    synonyms.push(...SYNONYM_MAP[lower]);
  }

  // Check if term is a synonym of another word
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (values.includes(lower) && !synonyms.includes(key)) {
      synonyms.push(key);
    }
  }

  return synonyms;
}

/**
 * Get brand-specific related terms
 */
function getBrandTerms(term: string): string[] {
  const lower = term.toLowerCase();
  const brandTerms: string[] = [];

  // Direct match
  if (BRAND_TERM_MAP[lower]) {
    brandTerms.push(...BRAND_TERM_MAP[lower]);
  }

  // Check if term is a brand term synonym
  for (const [key, values] of Object.entries(BRAND_TERM_MAP)) {
    if (values.some(v => v.toLowerCase().includes(lower)) && !brandTerms.includes(key)) {
      brandTerms.push(key);
    }
  }

  return brandTerms;
}

/**
 * Generate query reformulations
 */
function generateReformulations(query: string): string[] {
  const reformulations: string[] = [];
  const intent = detectIntent(query);
  const lowerQuery = query.toLowerCase();

  // Question reformulations
  if (intent === 'question') {
    // "What are the brand colors?" → "brand colors"
    const strippedQuestion = lowerQuery
      .replace(/^(what|how|where|when|why|which)\s+(is|are|do|does|can|should)\s+/i, '')
      .replace(/\?$/, '')
      .trim();

    if (strippedQuestion !== lowerQuery) {
      reformulations.push(strippedQuestion);
    }
  }

  // Definition queries
  if (intent === 'definition') {
    // "What is aperol?" → "aperol definition" + "aperol"
    const term = lowerQuery
      .replace(/^(what\s+is|what\s+are|define|meaning\s+of)\s+/i, '')
      .replace(/\?$/, '')
      .trim();

    reformulations.push(term);
    reformulations.push(`${term} definition`);
    reformulations.push(`${term} meaning`);
  }

  // Action queries
  if (intent === 'action') {
    // "Find logos" → "logos"
    const target = lowerQuery
      .replace(/^(find|show|get|list|search)\s+(me\s+)?/i, '')
      .trim();

    if (target !== lowerQuery) {
      reformulations.push(target);
    }
  }

  // Phrase variations
  // "brand voice guidelines" → "voice guidelines", "brand voice", "guidelines voice"
  const words = tokenize(query);
  if (words.length >= 3) {
    // Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      reformulations.push(`${words[i]} ${words[i + 1]}`);
    }
  }

  return [...new Set(reformulations)];
}

// ===========================================
// Main Expansion Function
// ===========================================

/**
 * Expand a query with synonyms and related terms
 *
 * @param query - Original user query
 * @param options - Expansion options
 * @returns Expanded query with terms
 */
export function expandQuery(
  query: string,
  options: ExpansionOptions = {}
): ExpandedQuery {
  const {
    includeSynonyms = true,
    includeBrandTerms = true,
    includeReformulations = true,
    maxExpansions = 10,
  } = options;

  const terms = tokenize(query);
  const expansions: Set<string> = new Set();

  // Add original terms
  terms.forEach(t => expansions.add(t));

  // Add synonyms
  if (includeSynonyms) {
    for (const term of terms) {
      const synonyms = getSynonyms(term);
      synonyms.forEach(s => expansions.add(s));
    }
  }

  // Add brand-specific terms
  if (includeBrandTerms) {
    for (const term of terms) {
      const brandTerms = getBrandTerms(term);
      brandTerms.forEach(t => expansions.add(t));
    }

    // Also check multi-word brand terms
    const fullQuery = query.toLowerCase();
    for (const [key, values] of Object.entries(BRAND_TERM_MAP)) {
      if (fullQuery.includes(key)) {
        values.forEach(v => expansions.add(v));
      }
    }
  }

  // Add reformulations
  if (includeReformulations) {
    const reformulations = generateReformulations(query);
    reformulations.forEach(r => expansions.add(r));
  }

  // Convert to array and limit
  const allTerms = Array.from(expansions).slice(0, maxExpansions);

  // Build expanded query string
  // Original query + unique expansion terms
  const uniqueExpansions = allTerms.filter(t => !terms.includes(t));
  const expanded = uniqueExpansions.length > 0
    ? `${query} ${uniqueExpansions.join(' ')}`
    : query;

  // Calculate confidence based on number of expansions
  const confidence = Math.min(1, 0.5 + (uniqueExpansions.length * 0.05));

  return {
    original: query,
    expanded,
    terms: allTerms,
    confidence,
  };
}

/**
 * Expand query for hybrid search (returns both semantic and keyword variants)
 */
export function expandForHybridSearch(query: string): {
  semanticQuery: string;
  keywordQuery: string;
  terms: string[];
} {
  const expansion = expandQuery(query, {
    includeSynonyms: true,
    includeBrandTerms: true,
    includeReformulations: false, // Reformulations can hurt keyword search
    maxExpansions: 8,
  });

  // Semantic query: full expanded form
  const semanticQuery = expansion.expanded;

  // Keyword query: original + key synonyms (no phrases)
  const keywordTerms = expansion.terms
    .filter(t => !t.includes(' ')) // Single words only
    .slice(0, 5);

  const keywordQuery = keywordTerms.join(' ');

  return {
    semanticQuery,
    keywordQuery,
    terms: expansion.terms,
  };
}

/**
 * Check if a query would benefit from expansion
 */
export function shouldExpandQuery(query: string): boolean {
  const terms = tokenize(query);

  // Very short queries benefit from expansion
  if (terms.length <= 2) return true;

  // Queries with brand terms benefit from expansion
  for (const term of terms) {
    if (BRAND_TERM_MAP[term.toLowerCase()]) return true;
  }

  // Questions benefit from reformulation
  if (detectIntent(query) !== 'search') return true;

  return false;
}
