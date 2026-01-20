-- Migration: Enhanced Metadata Filtering
-- Adds advanced filtering capabilities to search functions:
-- - Multi-category filtering (AND/OR)
-- - Date range filtering
-- - Exclusion lists
-- - Faceted search support

-- =============================================
-- Enhanced Hybrid Search for Document Chunks
-- =============================================

CREATE OR REPLACE FUNCTION hybrid_search_chunks_filtered(
  p_query TEXT,
  query_embedding extensions.vector(1536),
  p_brand_id UUID,
  p_categories TEXT[] DEFAULT NULL,        -- Filter by categories (OR logic)
  p_date_from TIMESTAMPTZ DEFAULT NULL,    -- Filter by date range start
  p_date_to TIMESTAMPTZ DEFAULT NULL,      -- Filter by date range end
  p_exclude_ids UUID[] DEFAULT NULL,       -- Exclude specific chunk IDs
  p_document_ids UUID[] DEFAULT NULL,      -- Filter to specific documents
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  semantic_weight FLOAT DEFAULT 0.7,
  rrf_k INT DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  heading_hierarchy TEXT[],
  content TEXT,
  token_count INT,
  semantic_similarity FLOAT,
  keyword_rank INT,
  rrf_score FLOAT,
  document_title TEXT,
  document_category TEXT,
  document_slug TEXT,
  match_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  keyword_weight FLOAT := 1.0 - semantic_weight;
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      c.id,
      c.document_id,
      c.heading_hierarchy,
      c.content,
      c.token_count,
      1 - (c.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS rank,
      d.title AS doc_title,
      d.category AS doc_category,
      d.slug AS doc_slug,
      c.created_at AS chunk_created_at,
      c.updated_at AS chunk_updated_at
    FROM brand_document_chunks c
    JOIN brand_documents d ON c.document_id = d.id
    WHERE d.brand_id = p_brand_id
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) >= match_threshold
      -- Category filter (OR logic - match any category)
      AND (p_categories IS NULL OR d.category = ANY(p_categories))
      -- Date range filter
      AND (p_date_from IS NULL OR c.updated_at >= p_date_from)
      AND (p_date_to IS NULL OR c.updated_at <= p_date_to)
      -- Exclusion filter
      AND (p_exclude_ids IS NULL OR c.id != ALL(p_exclude_ids))
      -- Document filter
      AND (p_document_ids IS NULL OR c.document_id = ANY(p_document_ids))
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_results AS (
    SELECT
      c.id,
      c.document_id,
      c.heading_hierarchy,
      c.content,
      c.token_count,
      ts_rank_cd(c.content_tsv, plainto_tsquery('english', p_query)) AS rank_score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.content_tsv, plainto_tsquery('english', p_query)) DESC) AS rank,
      d.title AS doc_title,
      d.category AS doc_category,
      d.slug AS doc_slug,
      c.created_at AS chunk_created_at,
      c.updated_at AS chunk_updated_at
    FROM brand_document_chunks c
    JOIN brand_documents d ON c.document_id = d.id
    WHERE d.brand_id = p_brand_id
      AND c.content_tsv @@ plainto_tsquery('english', p_query)
      -- Apply same filters
      AND (p_categories IS NULL OR d.category = ANY(p_categories))
      AND (p_date_from IS NULL OR c.updated_at >= p_date_from)
      AND (p_date_to IS NULL OR c.updated_at <= p_date_to)
      AND (p_exclude_ids IS NULL OR c.id != ALL(p_exclude_ids))
      AND (p_document_ids IS NULL OR c.document_id = ANY(p_document_ids))
    ORDER BY rank_score DESC
    LIMIT match_count * 2
  ),
  combined AS (
    SELECT
      COALESCE(s.id, k.id) AS id,
      COALESCE(s.document_id, k.document_id) AS document_id,
      COALESCE(s.heading_hierarchy, k.heading_hierarchy) AS heading_hierarchy,
      COALESCE(s.content, k.content) AS content,
      COALESCE(s.token_count, k.token_count) AS token_count,
      s.similarity AS semantic_sim,
      k.rank AS kw_rank,
      s.doc_title AS document_title,
      s.doc_category AS document_category,
      s.doc_slug AS document_slug,
      COALESCE(s.chunk_created_at, k.chunk_created_at) AS created_at,
      COALESCE(s.chunk_updated_at, k.chunk_updated_at) AS updated_at,
      -- RRF Score calculation
      COALESCE(semantic_weight / (rrf_k + s.rank), 0) +
      COALESCE(keyword_weight / (rrf_k + k.rank), 0) AS rrf,
      CASE
        WHEN s.id IS NOT NULL AND k.id IS NOT NULL THEN 'both'
        WHEN s.id IS NOT NULL THEN 'semantic'
        ELSE 'keyword'
      END AS match_source
    FROM semantic_results s
    FULL OUTER JOIN keyword_results k ON s.id = k.id
  )
  SELECT
    c.id,
    c.document_id,
    c.heading_hierarchy,
    c.content,
    c.token_count,
    c.semantic_sim::FLOAT AS semantic_similarity,
    c.kw_rank::INT AS keyword_rank,
    c.rrf::FLOAT AS rrf_score,
    c.document_title,
    c.document_category,
    c.document_slug,
    c.match_source AS match_type,
    c.created_at,
    c.updated_at
  FROM combined c
  ORDER BY c.rrf DESC
  LIMIT match_count;
END;
$$;

-- =============================================
-- Enhanced Hybrid Search for Assets
-- =============================================

CREATE OR REPLACE FUNCTION hybrid_search_assets_filtered(
  p_query TEXT,
  query_embedding extensions.vector(1536),
  p_brand_id UUID,
  p_categories TEXT[] DEFAULT NULL,        -- Filter by asset categories
  p_variants TEXT[] DEFAULT NULL,          -- Filter by variants
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_exclude_ids UUID[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  semantic_weight FLOAT DEFAULT 0.7,
  rrf_k INT DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  filename TEXT,
  description TEXT,
  category TEXT,
  variant TEXT,
  storage_path TEXT,
  semantic_similarity FLOAT,
  keyword_rank INT,
  rrf_score FLOAT,
  match_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  keyword_weight FLOAT := 1.0 - semantic_weight;
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      a.id,
      a.name,
      a.filename,
      a.description,
      a.category,
      a.variant,
      a.storage_path,
      1 - (a.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (ORDER BY a.embedding <=> query_embedding) AS rank,
      a.created_at AS asset_created_at,
      a.updated_at AS asset_updated_at
    FROM brand_assets a
    WHERE a.brand_id = p_brand_id
      AND a.embedding IS NOT NULL
      AND 1 - (a.embedding <=> query_embedding) >= match_threshold
      AND (p_categories IS NULL OR a.category = ANY(p_categories))
      AND (p_variants IS NULL OR a.variant = ANY(p_variants))
      AND (p_date_from IS NULL OR a.updated_at >= p_date_from)
      AND (p_date_to IS NULL OR a.updated_at <= p_date_to)
      AND (p_exclude_ids IS NULL OR a.id != ALL(p_exclude_ids))
    ORDER BY a.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_results AS (
    SELECT
      a.id,
      a.name,
      a.filename,
      a.description,
      a.category,
      a.variant,
      a.storage_path,
      ts_rank_cd(a.content_tsv, plainto_tsquery('english', p_query)) AS rank_score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(a.content_tsv, plainto_tsquery('english', p_query)) DESC) AS rank,
      a.created_at AS asset_created_at,
      a.updated_at AS asset_updated_at
    FROM brand_assets a
    WHERE a.brand_id = p_brand_id
      AND a.content_tsv @@ plainto_tsquery('english', p_query)
      AND (p_categories IS NULL OR a.category = ANY(p_categories))
      AND (p_variants IS NULL OR a.variant = ANY(p_variants))
      AND (p_date_from IS NULL OR a.updated_at >= p_date_from)
      AND (p_date_to IS NULL OR a.updated_at <= p_date_to)
      AND (p_exclude_ids IS NULL OR a.id != ALL(p_exclude_ids))
    ORDER BY rank_score DESC
    LIMIT match_count * 2
  ),
  combined AS (
    SELECT
      COALESCE(s.id, k.id) AS id,
      COALESCE(s.name, k.name) AS name,
      COALESCE(s.filename, k.filename) AS filename,
      COALESCE(s.description, k.description) AS description,
      COALESCE(s.category, k.category) AS category,
      COALESCE(s.variant, k.variant) AS variant,
      COALESCE(s.storage_path, k.storage_path) AS storage_path,
      s.similarity AS semantic_sim,
      k.rank AS kw_rank,
      COALESCE(s.asset_created_at, k.asset_created_at) AS created_at,
      COALESCE(s.asset_updated_at, k.asset_updated_at) AS updated_at,
      COALESCE(semantic_weight / (rrf_k + s.rank), 0) +
      COALESCE(keyword_weight / (rrf_k + k.rank), 0) AS rrf,
      CASE
        WHEN s.id IS NOT NULL AND k.id IS NOT NULL THEN 'both'
        WHEN s.id IS NOT NULL THEN 'semantic'
        ELSE 'keyword'
      END AS match_source
    FROM semantic_results s
    FULL OUTER JOIN keyword_results k ON s.id = k.id
  )
  SELECT
    c.id,
    c.name,
    c.filename,
    c.description,
    c.category,
    c.variant,
    c.storage_path,
    c.semantic_sim::FLOAT AS semantic_similarity,
    c.kw_rank::INT AS keyword_rank,
    c.rrf::FLOAT AS rrf_score,
    c.match_source AS match_type,
    c.created_at,
    c.updated_at
  FROM combined c
  ORDER BY c.rrf DESC
  LIMIT match_count;
END;
$$;

-- =============================================
-- Faceted Search Support
-- =============================================

-- Get available facets for document search
CREATE OR REPLACE FUNCTION get_document_search_facets(
  p_brand_id UUID
)
RETURNS TABLE (
  facet_type TEXT,
  facet_value TEXT,
  count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return category facets
  RETURN QUERY
  SELECT
    'category'::TEXT AS facet_type,
    d.category AS facet_value,
    COUNT(DISTINCT c.id) AS count
  FROM brand_documents d
  JOIN brand_document_chunks c ON c.document_id = d.id
  WHERE d.brand_id = p_brand_id
  GROUP BY d.category
  ORDER BY count DESC;
END;
$$;

-- Get available facets for asset search
CREATE OR REPLACE FUNCTION get_asset_search_facets(
  p_brand_id UUID
)
RETURNS TABLE (
  facet_type TEXT,
  facet_value TEXT,
  count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return category facets
  RETURN QUERY
  SELECT
    'category'::TEXT AS facet_type,
    a.category AS facet_value,
    COUNT(*) AS count
  FROM brand_assets a
  WHERE a.brand_id = p_brand_id
  GROUP BY a.category

  UNION ALL

  -- Return variant facets
  SELECT
    'variant'::TEXT AS facet_type,
    a.variant AS facet_value,
    COUNT(*) AS count
  FROM brand_assets a
  WHERE a.brand_id = p_brand_id
    AND a.variant IS NOT NULL
  GROUP BY a.variant

  ORDER BY facet_type, count DESC;
END;
$$;

-- =============================================
-- Search with "More Like This" Support
-- =============================================

-- Find similar chunks to a given chunk (for "more like this" feature)
CREATE OR REPLACE FUNCTION find_similar_chunks(
  p_chunk_id UUID,
  p_brand_id UUID,
  match_count INT DEFAULT 5,
  p_exclude_same_document BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  document_title TEXT,
  document_category TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding extensions.vector(1536);
  source_document_id UUID;
BEGIN
  -- Get the source chunk's embedding and document
  SELECT c.embedding, c.document_id
  INTO source_embedding, source_document_id
  FROM brand_document_chunks c
  JOIN brand_documents d ON c.document_id = d.id
  WHERE c.id = p_chunk_id
    AND d.brand_id = p_brand_id;

  IF source_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    (1 - (c.embedding <=> source_embedding))::FLOAT AS similarity,
    d.title AS document_title,
    d.category AS document_category
  FROM brand_document_chunks c
  JOIN brand_documents d ON c.document_id = d.id
  WHERE d.brand_id = p_brand_id
    AND c.id != p_chunk_id
    AND c.embedding IS NOT NULL
    AND (NOT p_exclude_same_document OR c.document_id != source_document_id)
  ORDER BY c.embedding <=> source_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- Indexes for Filtered Queries
-- =============================================

-- Composite index for category + date filtering on chunks
CREATE INDEX IF NOT EXISTS idx_brand_document_chunks_category_date
ON brand_document_chunks (document_id, updated_at DESC);

-- Composite index for category + date filtering on assets
CREATE INDEX IF NOT EXISTS idx_brand_assets_category_date
ON brand_assets (brand_id, category, updated_at DESC);

-- Index for variant filtering
CREATE INDEX IF NOT EXISTS idx_brand_assets_variant
ON brand_assets (brand_id, variant) WHERE variant IS NOT NULL;
