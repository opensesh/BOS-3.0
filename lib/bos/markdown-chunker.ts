/**
 * Markdown Chunker
 * 
 * Splits markdown content by headers while preserving hierarchy.
 * Creates chunks suitable for embedding and RAG retrieval.
 */

export interface MarkdownChunk {
  /** The heading text for this chunk (empty for content before first heading) */
  heading: string;
  /** Breadcrumb path: ["Brand Core", "Mission Statement"] */
  headingHierarchy: string[];
  /** The content under this heading */
  content: string;
  /** Approximate token count (chars / 4) */
  tokenCount: number;
  /** Heading level (1-6, or 0 for intro content) */
  headingLevel: number;
}

export interface ChunkOptions {
  /** Maximum tokens per chunk (default: 500) */
  maxTokens?: number;
  /** Minimum tokens for a chunk to be included (default: 20) */
  minTokens?: number;
  /** Include the heading text in the content (default: true) */
  includeHeadingInContent?: boolean;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxTokens: 500,
  minTokens: 20,
  includeHeadingInContent: true,
};

/**
 * Estimate token count from text (rough approximation: 1 token ≈ 4 chars)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Parse heading level from markdown heading line
 * Returns 0 if not a heading
 */
function getHeadingLevel(line: string): number {
  const match = line.match(/^(#{1,6})\s+/);
  return match ? match[1].length : 0;
}

/**
 * Extract heading text from markdown heading line
 */
function extractHeadingText(line: string): string {
  return line.replace(/^#{1,6}\s+/, '').trim();
}

/**
 * Split text into smaller chunks by paragraphs/sentences if it exceeds maxTokens
 */
function splitLargeContent(content: string, maxTokens: number): string[] {
  const tokens = estimateTokens(content);
  
  if (tokens <= maxTokens) {
    return [content];
  }
  
  const chunks: string[] = [];
  
  // First, try splitting by double newlines (paragraphs)
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';
  
  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);
    const currentTokens = estimateTokens(currentChunk);
    
    if (currentTokens + paraTokens <= maxTokens) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      
      // If single paragraph is too large, split by sentences
      if (paraTokens > maxTokens) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        currentChunk = '';
        
        for (const sentence of sentences) {
          const sentenceTokens = estimateTokens(sentence);
          const chunkTokens = estimateTokens(currentChunk);
          
          if (chunkTokens + sentenceTokens <= maxTokens) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            // If single sentence is still too large, just include it as-is
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = para;
      }
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Chunk markdown content by headers while preserving hierarchy
 * 
 * @param content - Raw markdown content
 * @param options - Chunking options
 * @returns Array of chunks with heading hierarchy preserved
 * 
 * @example
 * ```ts
 * const chunks = chunkMarkdown(`
 * # Brand Core
 * Introduction text...
 * 
 * ## Mission Statement
 * Our mission is...
 * 
 * ## Values
 * ### Curiosity
 * We value curiosity...
 * `);
 * 
 * // Returns chunks with hierarchies like:
 * // ["Brand Core"]
 * // ["Brand Core", "Mission Statement"]
 * // ["Brand Core", "Values", "Curiosity"]
 * ```
 */
export function chunkMarkdown(
  content: string,
  options: ChunkOptions = {}
): MarkdownChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines = content.split('\n');
  const chunks: MarkdownChunk[] = [];
  
  // Track heading hierarchy stack: [h1, h2, h3, h4, h5, h6]
  const headingStack: (string | null)[] = [null, null, null, null, null, null];
  
  let currentHeading = '';
  let currentLevel = 0;
  let currentContent: string[] = [];
  
  function flushCurrentChunk() {
    const rawContent = currentContent.join('\n').trim();
    if (!rawContent) return;
    
    // Build hierarchy from stack up to current level
    const hierarchy: string[] = [];
    for (let i = 0; i < 6; i++) {
      if (headingStack[i]) {
        hierarchy.push(headingStack[i]!);
      }
      if (i + 1 === currentLevel) break;
    }
    
    // Prepend heading to content if option is enabled
    let fullContent = rawContent;
    if (opts.includeHeadingInContent && currentHeading) {
      const headingPrefix = '#'.repeat(currentLevel) + ' ' + currentHeading + '\n\n';
      fullContent = headingPrefix + rawContent;
    }
    
    // Split if content is too large
    const contentChunks = splitLargeContent(fullContent, opts.maxTokens);
    
    for (let i = 0; i < contentChunks.length; i++) {
      const chunkContent = contentChunks[i];
      const tokenCount = estimateTokens(chunkContent);
      
      // Skip chunks that are too small (unless it's the only chunk)
      if (tokenCount < opts.minTokens && contentChunks.length > 1) {
        continue;
      }
      
      chunks.push({
        heading: currentHeading + (contentChunks.length > 1 ? ` (part ${i + 1})` : ''),
        headingHierarchy: [...hierarchy],
        content: chunkContent,
        tokenCount,
        headingLevel: currentLevel,
      });
    }
  }
  
  for (const line of lines) {
    const level = getHeadingLevel(line);
    
    if (level > 0) {
      // Flush previous chunk
      flushCurrentChunk();
      
      // Update heading stack
      const headingText = extractHeadingText(line);
      headingStack[level - 1] = headingText;
      
      // Clear lower levels
      for (let i = level; i < 6; i++) {
        headingStack[i] = null;
      }
      
      currentHeading = headingText;
      currentLevel = level;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  
  // Flush final chunk
  flushCurrentChunk();
  
  return chunks;
}

/**
 * Get a summary of chunks for logging/debugging
 */
export function summarizeChunks(chunks: MarkdownChunk[]): string {
  const lines = chunks.map((chunk, i) => {
    const hierarchy = chunk.headingHierarchy.join(' > ') || '(intro)';
    return `${i + 1}. [${chunk.tokenCount} tokens] ${hierarchy}`;
  });
  
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
  
  return [
    `Total chunks: ${chunks.length}`,
    `Total tokens: ${totalTokens}`,
    '',
    ...lines,
  ].join('\n');
}

