/**
 * BOS (Brand Operating System) - Embedding Pipeline
 * 
 * Utilities for ingesting brand documents and assets into Supabase
 * with embeddings for semantic search.
 */

// Markdown chunking utilities
export {
  chunkMarkdown,
  type MarkdownChunk,
  type ChunkOptions,
} from './markdown-chunker';

// Embedding service (OpenAI)
export {
  generateEmbedding,
  generateEmbeddings,
  generateSummary,
  enrichAssetDescription,
} from './embedding-service';

// Document ingestion
export {
  ingestDocument,
  ingestAllDocuments,
  type IngestOptions,
  type IngestResult,
} from './document-ingestion';

// Asset ingestion
export {
  enrichAndEmbedAsset,
  ingestAllAssets,
  type AssetIngestResult,
} from './asset-ingestion';

