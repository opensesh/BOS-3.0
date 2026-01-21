# Embedding Dimension Research Audit

**Date:** January 20, 2026
**Auditor:** Claude (AI-assisted analysis)
**Scope:** Evaluating upgrade from 1536 to 3072 embedding dimensions for brand knowledge retrieval
**Current Configuration:** `text-embedding-3-large` @ 1536 dimensions

---

## Executive Summary

### Current State

BOS uses OpenAI's `text-embedding-3-large` model with a **reduced dimension of 1536** to maintain compatibility with the existing pgvector schema. The native output of this model is 3072 dimensions.

| Aspect | Current Value |
|--------|---------------|
| Model | `text-embedding-3-large` |
| Dimensions | 1536 (reduced from native 3072) |
| Vector Tables | 3 (`brand_documents`, `brand_document_chunks`, `brand_assets`) |
| Index Type | IVFFlat (100 lists) |
| Search Functions | 8+ hybrid/semantic functions |
| Evaluation Target | 70% MRR@10 |

### Key Findings

| Factor | Assessment | Impact |
|--------|------------|--------|
| **Retrieval Quality** | Marginal improvement expected | Medium |
| **Storage Cost** | 2x increase | Low-Medium |
| **Query Latency** | 10-30% increase | Low |
| **Migration Complexity** | High (schema + re-embedding) | High |
| **API Cost** | No change | Neutral |

### Recommendation

**Conditional upgrade recommended** — The upgrade to 3072 dimensions is justified only if:
1. Current evaluation shows MRR@10 < 80% with optimization headroom exhausted
2. Brand documentation scales beyond 500+ documents
3. Semantic nuance becomes a documented pain point (e.g., voice tone confusion)

For the current scale and 93.4% MRR@10 (post-context-engineering remediation), the **1536-dimension configuration is optimal**. Alternative improvements (re-ranking, query expansion) offer better ROI.

---

## Technical Background

### OpenAI text-embedding-3-large Specifications

| Specification | Value |
|---------------|-------|
| Native Dimensions | 3072 |
| Supported Dimensions | 256, 512, 1024, 1536, 3072 (via `dimensions` parameter) |
| Max Tokens | 8,191 |
| MTEB Average (3072d) | 64.6% |
| MTEB Average (1536d) | ~64.0% (estimated) |
| MTEB Average (256d) | ~62.0% (still outperforms ada-002) |
| Pricing | $0.00013 / 1K tokens (regardless of dimensions) |

**Reference:** [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

### How Dimension Reduction Works

OpenAI's `text-embedding-3-large` uses **Matryoshka Representation Learning (MRL)**, which structures the embedding so that the first N dimensions contain the most important semantic information. This allows dimension reduction without significant quality loss:

```
3072 dimensions → Full semantic representation
1536 dimensions → ~98% of semantic fidelity retained
1024 dimensions → ~96% of semantic fidelity retained (sweet spot)
256 dimensions  → ~90% of semantic fidelity retained
```

The model is trained so that truncating dimensions preserves maximum information density in the retained dimensions.

### Current BOS Architecture

**Source:** `lib/bos/embedding-service.ts` (lines 13-14)

```typescript
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536; // Using reduced dimensions for compatibility
```

**Vector Tables (Migration 008):**

| Table | Column | Definition | Purpose |
|-------|--------|------------|---------|
| `brand_documents` | `embedding` | `vector(1536)` | Document-level semantic search |
| `brand_document_chunks` | `embedding` | `vector(1536)` | Chunk-level RAG retrieval |
| `brand_assets` | `embedding` | `vector(1536)` | Asset semantic search |

**Search Functions:**

| Function | Source Migration | Parameters |
|----------|------------------|------------|
| `match_document_chunks` | 008 | `vector(1536)` |
| `match_assets` | 008 | `vector(1536)` |
| `match_documents` | 008 | `vector(1536)` |
| `hybrid_search_chunks` | 019 | `vector(1536)` |
| `hybrid_search_assets` | 019 | `vector(1536)` |
| `hybrid_search_documents` | 019 | `vector(1536)` |
| `hybrid_search_chunks_filtered` | 020 | `vector(1536)` |
| `hybrid_search_assets_filtered` | 020 | `vector(1536)` |
| `find_similar_chunks` | 020 | `vector(1536)` |

**Indexes:**

```sql
-- IVFFlat indexes with 100 lists
CREATE INDEX idx_brand_document_chunks_embedding
  ON brand_document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Current Infrastructure Analysis

### Tables with Embeddings

| Table | Primary Use | Estimated Rows | Current Size per Row |
|-------|-------------|----------------|---------------------|
| `brand_documents` | Full document search | ~20-50 | 6 KB (embedding only) |
| `brand_document_chunks` | RAG chunk retrieval | ~200-500 | 6 KB (embedding only) |
| `brand_assets` | Asset semantic search | ~50-100 | 6 KB (embedding only) |

**Calculation:**
- 1536 dimensions × 4 bytes (float32) = 6,144 bytes ≈ 6 KB per embedding
- 3072 dimensions × 4 bytes = 12,288 bytes ≈ 12 KB per embedding

### Current Search Configuration

**Source:** `scripts/evaluate-search.ts` (lines 105-116)

```typescript
const SEARCH_CONFIG = {
  threshold: 0.3,          // Similarity threshold
  topK: 10,                // Results returned
  model: 'text-embedding-3-large',
  searchMode: 'hybrid',    // Semantic + keyword with RRF
  semanticWeight: 0.7,     // 70% semantic, 30% keyword
  rerank: Boolean(process.env.COHERE_API_KEY),
  diversity: true,
  diversityLambda: 0.7,
};
```

### Current Performance Baseline

**Source:** Context Engineering Audit (January 16, 2026)

| Metric | Value | Target |
|--------|-------|--------|
| MRR@10 | 93.4% | 70% |
| Exact Match Rate | 60% → improved | N/A |
| Avg Latency | ~934ms | <1000ms |

**Note:** The MRR@10 of 93.4% significantly exceeds the 70% target, suggesting the current 1536-dimension configuration is already high-performing.

---

## Retrieval Quality Analysis

### Theoretical Improvement

Upgrading from 1536 to 3072 dimensions provides:

1. **Higher Information Density**: 2x the dimensional space captures finer semantic distinctions
2. **Reduced Semantic Collision**: Similar but distinct concepts less likely to overlap
3. **Better Disambiguation**: Improved separation of near-synonyms and contextual meanings

However, the improvement is **non-linear** due to Matryoshka representation:
- 1536 → 3072: ~0.5-1.5% MTEB improvement (estimated)
- Diminishing returns above 1536 dimensions for most retrieval tasks

### Brand-Specific Considerations

| Domain | Current Performance | 3072d Benefit | Assessment |
|--------|---------------------|---------------|------------|
| **Art Direction** | Good | Medium | Visual concepts well-captured at 1536d |
| **Brand Voice** | Excellent | Low | Distillation handles nuance better than dimension increase |
| **Writing Styles** | Good | Medium | Tone variations may benefit marginally |
| **Design System** | Excellent | Low | Technical terms well-indexed via hybrid search |
| **Color Semantics** | Excellent | Low | Keyword search handles hex codes perfectly |

### Where 3072 Dimensions Would Help

1. **Nuanced Voice Distinction**: Differentiating between "confident but not arrogant" and "authoritative but approachable" tones
2. **Visual Concept Similarity**: "Warm photography" vs "cozy aesthetic" vs "inviting imagery"
3. **Cross-Document Relationships**: Finding connections between disparate brand elements
4. **Ambiguous Queries**: Better handling of edge cases in the evaluation dataset

### Where 3072 Dimensions Would NOT Help

1. **Exact Term Matches**: "Aperol", "#FE5102", "Neue Haas Grotesk" — keyword search handles these
2. **Document Titles**: Already indexed via full-text search
3. **Category Filtering**: Metadata queries don't use embeddings
4. **Structured Data**: Product SKUs, dimensions, file paths

### Scaling Considerations

| Brand Corpus Size | 1536d Adequacy | 3072d Recommendation |
|-------------------|----------------|----------------------|
| <100 documents | Fully adequate | Not recommended |
| 100-500 documents | Adequate | Consider if quality issues arise |
| 500-2000 documents | May see degradation | Recommended |
| >2000 documents | Likely inadequate | Strongly recommended |

**Current BOS corpus:** ~50-100 documents → **1536d is fully adequate**

---

## Schema Migration Requirements

### 1. Column Alterations

All three vector tables require column type changes:

```sql
-- Migration: Upgrade embedding dimensions from 1536 to 3072

-- Step 1: Create new columns
ALTER TABLE brand_documents
  ADD COLUMN embedding_3072 extensions.vector(3072);

ALTER TABLE brand_document_chunks
  ADD COLUMN embedding_3072 extensions.vector(3072);

ALTER TABLE brand_assets
  ADD COLUMN embedding_3072 extensions.vector(3072);

-- Step 2: After re-embedding, swap columns
ALTER TABLE brand_documents DROP COLUMN embedding;
ALTER TABLE brand_documents RENAME COLUMN embedding_3072 TO embedding;

-- Repeat for other tables...
```

### 2. Function Signature Updates

All 8+ search functions require parameter type changes:

| Function | Change Required |
|----------|-----------------|
| `match_document_chunks` | `vector(1536)` → `vector(3072)` |
| `match_assets` | `vector(1536)` → `vector(3072)` |
| `match_documents` | `vector(1536)` → `vector(3072)` |
| `hybrid_search_chunks` | `vector(1536)` → `vector(3072)` |
| `hybrid_search_assets` | `vector(1536)` → `vector(3072)` |
| `hybrid_search_documents` | `vector(1536)` → `vector(3072)` |
| `hybrid_search_chunks_filtered` | `vector(1536)` → `vector(3072)` |
| `hybrid_search_assets_filtered` | `vector(1536)` → `vector(3072)` |
| `find_similar_chunks` | `vector(1536)` → `vector(3072)` (local variable) |

### 3. Index Reconstruction

Current IVFFlat indexes must be dropped and recreated:

```sql
-- Drop existing indexes
DROP INDEX IF EXISTS idx_brand_document_chunks_embedding;
DROP INDEX IF EXISTS idx_brand_assets_embedding;
DROP INDEX IF EXISTS idx_brand_documents_embedding;

-- Recreate with new dimensions
CREATE INDEX idx_brand_document_chunks_embedding
  ON brand_document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Alternative: Consider HNSW for 3072d (better for high dimensions)
CREATE INDEX idx_brand_document_chunks_embedding_hnsw
  ON brand_document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 4. Application Code Changes

**File:** `lib/bos/embedding-service.ts`

```typescript
// Change from:
const EMBEDDING_DIMENSIONS = 1536;

// To:
const EMBEDDING_DIMENSIONS = 3072;
```

**Type definitions** may need updates if any interfaces hardcode dimension arrays.

---

## Performance Implications

### Storage Impact

| Component | Current (1536d) | After (3072d) | Increase |
|-----------|-----------------|---------------|----------|
| Per-embedding size | 6 KB | 12 KB | 2x |
| brand_document_chunks (~500 rows) | ~3 MB | ~6 MB | +3 MB |
| brand_documents (~50 rows) | ~300 KB | ~600 KB | +300 KB |
| brand_assets (~100 rows) | ~600 KB | ~1.2 MB | +600 KB |
| **Total embedding storage** | ~4 MB | ~8 MB | +4 MB |
| IVFFlat index overhead | ~2 MB | ~4 MB | +2 MB |
| **Total increase** | — | — | **~6 MB** |

**Assessment:** Storage increase is negligible for current scale. Would become significant at 10,000+ embeddings (~120 MB vs 60 MB).

### Query Latency Impact

| Operation | 1536d | 3072d (estimated) | Change |
|-----------|-------|-------------------|--------|
| Cosine distance computation | 1x | ~1.3-1.5x | +30-50% |
| IVFFlat probe (100 lists) | ~50ms | ~65ms | +30% |
| RRF combination | negligible | negligible | — |
| Total hybrid search | ~934ms | ~1000-1100ms | +7-18% |

**Mitigation strategies:**
1. **HNSW indexes** — Better performance for high-dimensional vectors
2. **Dimension caching** — Cache frequent query embeddings
3. **Reduced probe count** — Lower IVFFlat lists or HNSW ef_search

### Index Build Time

| Index Type | 1536d (500 rows) | 3072d (500 rows) | Notes |
|------------|------------------|------------------|-------|
| IVFFlat | ~2 seconds | ~4 seconds | Acceptable |
| HNSW | ~5 seconds | ~10 seconds | Better query performance |

### Memory Footprint

| Component | 1536d | 3072d |
|-----------|-------|-------|
| Index resident memory | ~8 MB | ~16 MB |
| Query working set | ~1 MB | ~2 MB |

**Assessment:** No concerns for Supabase Pro tier (8GB RAM).

---

## Cost Analysis

### OpenAI API Costs

| Factor | 1536d | 3072d | Difference |
|--------|-------|-------|------------|
| Price per 1K tokens | $0.00013 | $0.00013 | **$0** |
| Tokens per embedding | Same | Same | — |
| Monthly embedding cost | $X | $X | **No change** |

**Key insight:** OpenAI charges by tokens, not dimensions. Dimension selection has zero API cost impact.

### Supabase Storage Costs

| Tier | Included Storage | Current Usage | After Upgrade |
|------|------------------|---------------|---------------|
| Pro | 8 GB | ~100 MB | ~106 MB |
| Team | 16 GB | ~100 MB | ~106 MB |

**Assessment:** 6 MB increase is negligible against included storage.

### Re-embedding One-Time Cost

| Corpus | Chunks | Estimated Tokens | API Cost |
|--------|--------|------------------|----------|
| Current | ~500 | ~250,000 | ~$0.03 |
| 10x scale | ~5,000 | ~2,500,000 | ~$0.33 |

**Assessment:** Re-embedding cost is trivial (<$1 even at 10x scale).

### Total Cost of Ownership

| Category | 1536d/year | 3072d/year | Delta |
|----------|------------|------------|-------|
| API costs | $X | $X | $0 |
| Storage | Included | Included | $0 |
| Re-embedding | — | ~$0.03 | $0.03 |
| Engineering time | — | ~8-16 hours | $800-1600* |

*Assuming $100/hour engineering cost

**Conclusion:** The primary cost is engineering time, not infrastructure.

---

## Risk Assessment

### Migration Failure Scenarios

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Partial re-embedding failure | Medium | High | Batch processing with checkpoints |
| Index corruption | Low | High | Blue-green deployment with rollback |
| Function signature mismatch | Medium | Medium | Staging environment testing |
| Downtime during migration | Medium | Medium | Run parallel columns, swap atomically |

### Quality Regression Possibilities

| Scenario | Likelihood | Detection |
|----------|------------|-----------|
| Lower similarity scores | High (expected) | Adjust thresholds proportionally |
| Different ranking order | Medium | Re-run evaluation suite |
| Edge case regressions | Low | Manual review of worst queries |

**Note:** OpenAI's 3072d model produces different similarity distributions than truncated 1536d. Thresholds may need adjustment.

### Rollback Complexity

| Scenario | Difficulty | Time to Rollback |
|----------|------------|------------------|
| Before index rebuild | Easy | ~5 minutes |
| After index rebuild | Medium | ~30 minutes |
| After column drop | Hard | Requires re-embedding at 1536d |

**Recommendation:** Keep 1536d column for 2 weeks post-migration.

---

## Alternatives Considered

### 1. Stay at 1536 Dimensions (Recommended for Now)

**Pros:**
- Current 93.4% MRR@10 exceeds targets
- No migration effort required
- Zero risk of regression

**Cons:**
- May need upgrade at larger scale
- Slightly less semantic nuance

**Verdict:** ✅ **Best choice for current scale**

### 2. Intermediate Dimensions (2048)

**Pros:**
- Smaller storage increase (33% vs 100%)
- Better performance than 3072d
- More semantic fidelity than 1536d

**Cons:**
- Not a standard dimension (may complicate comparisons)
- Same migration complexity as 3072d
- Marginal benefit over 1536d

**Verdict:** ❌ **Not recommended** — If upgrading, go to 3072d

### 3. Multi-Vector Approaches

**Description:** Store both 1536d (fast retrieval) and 3072d (re-ranking) embeddings.

**Pros:**
- Best of both worlds
- Fast initial retrieval, precise re-ranking
- Gradual migration possible

**Cons:**
- 3x storage increase
- Application complexity
- Synchronization challenges

**Verdict:** ⚠️ **Consider for future** if scale reaches 2000+ documents

### 4. Other RAG Improvements (Higher ROI)

| Improvement | Effort | Impact | Current Status |
|-------------|--------|--------|----------------|
| Query expansion | Low | Medium | Not implemented |
| Better chunking (sliding window) | Medium | Medium | Using header-based |
| Cohere re-ranking | Low | High | Implemented (optional) |
| Cross-encoder fine-tuning | High | High | Not implemented |
| Knowledge graph | High | High | Not implemented |

**Recommendation:** Exhaust these alternatives before dimension upgrade.

---

## Recommendation & Implementation Roadmap

### Decision Framework

```
                    ┌─────────────────────────────────────┐
                    │   Is MRR@10 below 80%?              │
                    └─────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
                   YES                            NO
                     │                             │
        ┌────────────┴────────────┐               │
        │ Have you tried:         │               │
        │ - Query expansion?      │               │
        │ - Re-ranking?           │               │
        │ - Better chunking?      │     ┌─────────┴─────────┐
        └────────────┬────────────┘     │ Stay at 1536d    │
                     │                  │ (Current choice)  │
          ┌──────────┴──────────┐       └───────────────────┘
          ▼                     ▼
         YES                   NO
          │                     │
          │          ┌──────────┴──────────┐
          │          │ Implement those     │
          │          │ improvements first  │
          │          └─────────────────────┘
          │
          ▼
   ┌────────────────────────────────────┐
   │ Is corpus >500 documents AND       │
   │ semantic nuance is documented pain?│
   └────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
         YES                   NO
          │                     │
   ┌──────┴──────┐      ┌──────┴──────┐
   │ Upgrade to  │      │ Stay at     │
   │ 3072d       │      │ 1536d       │
   └─────────────┘      └─────────────┘
```

### Current Recommendation: STAY AT 1536

**Rationale:**
1. MRR@10 of 93.4% significantly exceeds 70% target
2. Corpus size (~50-100 documents) doesn't require higher dimensions
3. Hybrid search (semantic + keyword) compensates for dimensional limitations
4. Re-ranking provides additional quality boost
5. Migration effort not justified by marginal improvement

### If Upgrade Becomes Necessary: Phased Rollout Plan

**Phase 1: Preparation (Week 1)**
- [ ] Create staging environment with production data copy
- [ ] Write migration scripts with rollback procedures
- [ ] Update evaluation harness for 3072d threshold calibration

**Phase 2: Shadow Deployment (Week 2)**
- [ ] Add `embedding_3072` columns alongside existing
- [ ] Run re-embedding for all rows
- [ ] Create parallel search functions with `_3072` suffix
- [ ] Run A/B evaluation: 1536d vs 3072d

**Phase 3: Cutover (Week 3)**
- [ ] If evaluation shows improvement: swap columns
- [ ] Update application code to use 3072d
- [ ] Rebuild indexes
- [ ] Monitor performance metrics

**Phase 4: Cleanup (Week 4)**
- [ ] After 2-week stability period: drop old columns
- [ ] Archive migration scripts
- [ ] Update documentation

### Success Criteria

| Metric | Minimum | Target |
|--------|---------|--------|
| MRR@10 improvement | >1% | >3% |
| P95 latency increase | <50% | <20% |
| Exact match rate | No regression | Improvement |
| Edge case queries | No regression | Improvement |

### Monitoring Plan

Post-migration monitoring for 2 weeks:
1. **Search quality:** Daily MRR@10 sampling
2. **Latency:** P95 latency alerts at >1500ms
3. **Error rate:** Alert on search function errors
4. **User feedback:** Track search-related support tickets

---

## Appendices

### A. Current Schema Reference

**Source:** `supabase/migrations/008_vector_brand_search.sql`

```sql
-- brand_documents (line 97)
ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- brand_document_chunks (lines 120-131)
CREATE TABLE IF NOT EXISTS brand_document_chunks (
  ...
  embedding extensions.vector(1536),
  ...
);

-- brand_assets (lines 179-195)
CREATE TABLE IF NOT EXISTS brand_assets (
  ...
  embedding extensions.vector(1536),
  ...
);
```

### B. OpenAI Benchmark Data

**MTEB Benchmark Scores (text-embedding-3-large):**

| Dimensions | MTEB Average | Relative to 3072d |
|------------|--------------|-------------------|
| 3072 | 64.6% | 100% |
| 1536 | ~64.0% | ~99% |
| 1024 | ~63.5% | ~98% |
| 256 | ~62.0% | ~96% |

**Source:** [OpenAI Embeddings Announcement](https://openai.com/index/new-embedding-models-and-api-updates/), [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

**Key insight from Azure SQL research:** 1024 dimensions provides ~96% of 3072d performance with 33% of the storage.

### C. Migration Script Template

```sql
-- Migration: 021_upgrade_embeddings_3072.sql
-- WARNING: Run in staging first. Requires re-embedding all rows.

BEGIN;

-- 1. Add new columns
ALTER TABLE brand_documents
  ADD COLUMN IF NOT EXISTS embedding_3072 extensions.vector(3072);

ALTER TABLE brand_document_chunks
  ADD COLUMN IF NOT EXISTS embedding_3072 extensions.vector(3072);

ALTER TABLE brand_assets
  ADD COLUMN IF NOT EXISTS embedding_3072 extensions.vector(3072);

-- 2. Update search functions (example for match_document_chunks)
CREATE OR REPLACE FUNCTION match_document_chunks_3072(
  query_embedding extensions.vector(3072),  -- Changed from 1536
  p_brand_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  brand_id UUID,
  heading_hierarchy TEXT[],
  chunk_index INTEGER,
  content TEXT,
  token_count INTEGER,
  similarity FLOAT,
  document_title TEXT,
  document_category TEXT,
  document_slug TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.brand_id,
    c.heading_hierarchy,
    c.chunk_index,
    c.content,
    c.token_count,
    1 - (c.embedding_3072 <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.category AS document_category,
    d.slug AS document_slug
  FROM brand_document_chunks c
  JOIN brand_documents d ON d.id = c.document_id
  WHERE c.brand_id = p_brand_id
    AND c.embedding_3072 IS NOT NULL
    AND 1 - (c.embedding_3072 <=> query_embedding) > match_threshold
  ORDER BY c.embedding_3072 <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. Create new indexes (HNSW recommended for 3072d)
CREATE INDEX IF NOT EXISTS idx_brand_document_chunks_embedding_3072
  ON brand_document_chunks
  USING hnsw (embedding_3072 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;

-- Note: After running re-embedding script, execute column swap migration
```

### D. Re-embedding Script Template

```typescript
// scripts/reembed-3072.ts
import { generateEmbedding } from '../lib/bos/embedding-service';

// Temporarily override dimension
process.env.EMBEDDING_DIMENSIONS = '3072';

async function reembedAll() {
  const supabase = getSupabaseAdmin();

  // Process in batches of 50
  const BATCH_SIZE = 50;
  let offset = 0;

  while (true) {
    const { data: chunks } = await supabase
      .from('brand_document_chunks')
      .select('id, content')
      .is('embedding_3072', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (!chunks?.length) break;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);
      await supabase
        .from('brand_document_chunks')
        .update({ embedding_3072: embedding })
        .eq('id', chunk.id);
    }

    offset += BATCH_SIZE;
    console.log(`Processed ${offset} chunks`);
  }
}
```

### E. Evaluation Test Dataset Reference

**Source:** `tests/evaluation/search-eval-dataset.json`

| Query Type | Count | Purpose |
|------------|-------|---------|
| exact-match | 15 | Test keyword retrieval (brand names, colors, acronyms) |
| semantic | 20 | Test conceptual understanding |
| ambiguous | 10 | Test multi-intent handling |
| edge-cases | 5 | Test single words, abbreviations, typos |
| **Total** | **50** | Comprehensive retrieval evaluation |

---

## Conclusion

The upgrade from 1536 to 3072 embedding dimensions represents a **low-priority optimization** for BOS at its current scale. The existing configuration achieves 93.4% MRR@10, which significantly exceeds the 70% target established in the context engineering remediation.

**Key takeaways:**

1. **Not needed now:** Current quality is excellent; engineering effort better spent elsewhere
2. **Plan for scale:** Revisit when corpus exceeds 500 documents or quality drops below 80% MRR@10
3. **Alternatives first:** Query expansion, better chunking, and fine-tuned re-ranking offer higher ROI
4. **Migration is straightforward:** When needed, the upgrade can be executed in 2-3 weeks with proper staging

This audit should be revisited in 6 months or when the brand documentation corpus doubles in size.

---

*Report generated by Claude on January 20, 2026*
*Based on OpenAI embedding specifications and BOS codebase analysis*

**Sources:**
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [New Embedding Models Announcement](https://openai.com/index/new-embedding-models-and-api-updates/)
- [Azure SQL Embedding Dimensions Analysis](https://devblogs.microsoft.com/azure-sql/embedding-models-and-dimensions-optimizing-the-performance-resource-usage-ratio/)
- [Embedding Models Comparison 2026](https://research.aimultiple.com/embedding-models/)
