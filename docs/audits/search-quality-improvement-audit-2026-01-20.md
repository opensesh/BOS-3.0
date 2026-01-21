# Search Quality Improvement Audit

**Date:** January 20, 2026
**Auditor:** Claude (AI-assisted analysis)
**Scope:** Comprehensive search quality assessment beyond embedding dimensions
**Supersedes:** `embedding-dimensions-audit-2026-01-20.md`

---

## Executive Summary

### The Core Insight

BOS achieves **93.4% MRR@10**—a strong statistical measure of retrieval quality. However, MRR (Mean Reciprocal Rank) measures whether "correct" documents appear in results, not whether users find those results useful. This audit expands beyond embedding dimensions to address **user satisfaction holistically**.

### What MRR@10 Measures vs What It Misses

| Measured by MRR@10 | Not Measured |
|--------------------|--------------|
| ✓ Correct documents in top 10 | ✗ User engagement with results |
| ✓ Ranking position of expected docs | ✗ Whether users found answers helpful |
| ✓ Statistical relevance | ✗ Intent matching |
| ✓ Evaluation dataset performance | ✗ Real-world satisfaction |

**The gap:** A user can be shown "correct" content that doesn't match their actual intent, context, or current task.

### Three Dimensions of Quality Improvement

Beyond embedding dimensions, search quality improves through:

| Dimension | Current State | Opportunity |
|-----------|---------------|-------------|
| **Implicit Data** | Basic page views only | Engagement tracking, abandonment signals |
| **Explicit Feedback** | Like/dislike implemented | Detailed feedback, categories, comments |
| **Memory** | No personalization | Learned preferences, topic affinity |

### Recommendation

1. **Embedding Dimensions:** Stay at 1536 (93.4% MRR@10 exceeds targets; upgrade ROI is low)
2. **Immediate Priority:** Implement enhanced feedback mechanisms to close the satisfaction gap
3. **Medium-term:** Add behavioral analytics and personalization foundation

---

## Embedding Dimensions Analysis (Condensed)

*Full analysis available in the superseded document.*

### Current Configuration

| Aspect | Value |
|--------|-------|
| Model | `text-embedding-3-large` |
| Dimensions | 1536 (reduced from native 3072) |
| MRR@10 | 93.4% |
| Target | 70% |

### Why 1536 Dimensions is Optimal

**OpenAI's Matryoshka Representation Learning (MRL)** ensures the first N dimensions contain the most important semantic information:

```
3072 dimensions → Full semantic representation
1536 dimensions → ~98% semantic fidelity retained
1024 dimensions → ~96% semantic fidelity retained
```

### Upgrade Decision Framework

| Condition | Recommendation |
|-----------|----------------|
| MRR@10 > 80% AND corpus < 500 docs | Stay at 1536 |
| MRR@10 < 80% AND alternatives exhausted | Consider 3072 |
| Corpus > 500 docs AND semantic nuance documented | Upgrade to 3072 |

**Current state:** MRR@10 is 93.4%, corpus is ~50-100 docs → **Stay at 1536**

### If Upgrade Becomes Necessary

Migration would require:
- Column alterations (3 tables)
- Function signature updates (8+ functions)
- Index reconstruction
- Re-embedding all content

**Estimated effort:** 2-3 weeks
**Storage increase:** ~6 MB (negligible)
**API cost change:** $0 (pricing is per token, not per dimension)

### Key Takeaway

Embedding dimensions address **semantic precision**, not **user satisfaction**. With 93.4% MRR@10, dimensional improvements offer diminishing returns. The greater opportunity lies in understanding whether users actually find results helpful.

---

## The MRR Limitation

### What MRR@10 Actually Measures

MRR (Mean Reciprocal Rank) at cutoff 10 calculates the average of `1/rank` where `rank` is the position of the first relevant document. A 93.4% MRR@10 means the expected document typically appears in position 1 or 2.

### The Satisfaction Gap

```
Statistical Relevance ≠ User Satisfaction

User query: "How should I write headlines for social media?"

MRR perspective:
✓ Document about headline best practices ranked #1
✓ Score: 1.0 (perfect)

User perspective:
✗ User wanted brand-specific tone guidance
✗ Document was generic copywriting advice
✗ User reformulated query 3 times
✗ Actual satisfaction: Poor
```

### Signals We're Missing

| Signal Type | What It Tells Us | Current Collection |
|-------------|------------------|-------------------|
| **Time on response** | Did user read the full response? | ❌ Not tracked |
| **Scroll depth** | How much content was consumed? | ❌ Not tracked |
| **Query reformulation** | Did initial results fail? | ❌ Not tracked |
| **Copy/share actions** | Was content valuable enough to save? | ❌ Not tracked |
| **Follow-up questions** | Was answer incomplete? | ⚠️ Stored but not analyzed |
| **Explicit feedback** | Did user rate positively? | ✅ Like/dislike exists |
| **Feedback comments** | Why was it good/bad? | ❌ Not collected |

### The Need for Multi-Signal Quality Assessment

True search quality requires triangulating:

1. **Statistical metrics** (MRR, Precision, Recall) — We have this
2. **Behavioral signals** (engagement, abandonment) — We need this
3. **Explicit feedback** (ratings, comments) — Partially implemented
4. **Longitudinal learning** (personalization) — Not implemented

---

## Dimension 1: Implicit Data (Behavioral Analytics)

### Current State

**Vercel Analytics** provides:
- Page views
- Unique visitors
- Referrer data
- Geographic distribution

**What's missing:**
- Search-specific engagement metrics
- Result interaction tracking
- Session-level quality signals
- Abandonment detection

### Opportunity Areas

#### 1.1 Engagement Metrics

| Metric | Implementation | Purpose |
|--------|----------------|---------|
| **Time on response** | Start timer on response render, end on next action | Gauge whether user read the response |
| **Scroll depth** | Intersection observer on response blocks | Did user consume full content? |
| **Response expansion** | Track "show more" clicks | Content length appropriateness |
| **Source clicks** | Track citation link clicks | Which sources users find credible |

**Implementation approach:**

```typescript
// hooks/useResponseEngagement.ts
interface EngagementEvent {
  messageId: string;
  conversationId: string;
  type: 'view_start' | 'view_end' | 'scroll_depth' | 'source_click' | 'copy' | 'share';
  data: {
    durationMs?: number;
    scrollPercentage?: number;
    sourceUrl?: string;
  };
  timestamp: Date;
}
```

#### 1.2 Abandonment Signals

| Signal | Indicates | Detection |
|--------|-----------|-----------|
| **Session end after search** | Poor result satisfaction | No further actions within 30s |
| **Rapid query reformulation** | Initial results failed | New query within 10s |
| **Same-intent retry** | Frustration with results | Similar query in same session |
| **Tab close after results** | Complete abandonment | Page unload within 5s of results |

#### 1.3 Query Reformulation Analysis

Currently, chat history is stored but not analyzed for patterns. Query reformulations indicate:

- Original query didn't match intent
- Results were too broad/narrow
- Missing context needed

**Proposed schema:**

```sql
CREATE TABLE search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES profiles(id),
  brand_id UUID REFERENCES brands(id),

  -- Query sequence analysis
  queries JSONB[], -- Array of {query, timestamp, results_count}
  reformulation_count INTEGER DEFAULT 0,

  -- Session outcome
  outcome TEXT CHECK (outcome IN ('success', 'abandoned', 'reformulated', 'unknown')),
  final_query TEXT,

  -- Engagement metrics
  total_duration_ms INTEGER,
  sources_clicked INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.4 Analytics Dashboard Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Search Success Rate** | (Sessions ending in engagement) / (Total sessions) | >70% |
| **Avg Reformulations** | Total reformulations / Total sessions | <1.5 |
| **Mean Time to Success** | Avg time from first query to engagement | <30s |
| **Abandonment Rate** | Sessions with no engagement / Total sessions | <20% |

---

## Dimension 2: Explicit Feedback (Enhanced User Input)

### Current State

**Fully implemented:**
- `message_feedback` table with `rating` (boolean: like/dislike)
- `ResponseActions.tsx` component with thumbs up/down buttons
- `feedback-service.ts` with `submitFeedback()` and `getFeedback()` methods

**Current schema:**

```sql
CREATE TABLE message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating BOOLEAN NOT NULL, -- true = positive, false = negative
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Opportunity: Enhanced Feedback Collection

#### 2.1 Add Comment Field

Allow users to explain their rating:

```sql
ALTER TABLE message_feedback
  ADD COLUMN comment TEXT,
  ADD COLUMN comment_at TIMESTAMPTZ;
```

**UI enhancement:**
- Optional text field appears after rating
- Auto-dismiss after 5 seconds if no input
- Placeholder: "What made this response helpful/unhelpful? (optional)"

#### 2.2 Feedback Categories

Structured signals for analysis:

```sql
ALTER TABLE message_feedback
  ADD COLUMN categories TEXT[] DEFAULT '{}';
```

**Negative categories:**
- `outdated` — Information was stale
- `incorrect` — Factually wrong
- `off_topic` — Didn't answer the question
- `too_brief` — Needed more detail
- `too_verbose` — Too much irrelevant content
- `poor_sources` — Citations weren't helpful

**Positive categories:**
- `accurate` — Information was correct
- `comprehensive` — Answered thoroughly
- `well_sourced` — Good citations
- `clear` — Easy to understand
- `actionable` — Could immediately use the advice

#### 2.3 Report Mechanism

For problematic responses:

```sql
ALTER TABLE message_feedback
  ADD COLUMN reported BOOLEAN DEFAULT false,
  ADD COLUMN report_reason TEXT CHECK (
    report_reason IN ('harmful', 'off_brand', 'confidential', 'other')
  ),
  ADD COLUMN report_details TEXT;
```

#### 2.4 Source-Level Feedback

Track which retrieved sources users find helpful:

```sql
CREATE TABLE source_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Source identification
  source_type TEXT NOT NULL CHECK (source_type IN ('document', 'chunk', 'asset')),
  source_id UUID NOT NULL,

  -- Feedback
  helpful BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Enhanced Feedback UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Was this response helpful?                              │
│                                                         │
│   [👍 Yes]  [👎 No]                                     │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ What made it helpful? (select all that apply)           │
│                                                         │
│   [Accurate] [Comprehensive] [Clear] [Well-sourced]     │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ Any additional feedback? (optional)                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                              [Submit]  [Skip]           │
└─────────────────────────────────────────────────────────┘
```

### Feedback Analytics

| Metric | Formula | Target |
|--------|---------|--------|
| **Feedback Rate** | (Responses with feedback) / (Total responses) | >15% |
| **Positive Rate** | (Positive ratings) / (Total ratings) | >80% |
| **Category Distribution** | Count per category | Balanced |
| **Report Rate** | (Reported responses) / (Total responses) | <1% |

---

## Dimension 3: Memory (Personalization)

### Current State

**Chat history is stored but not analyzed:**
- `conversations` table with messages
- `messages` table with role, content, metadata
- No topic extraction
- No preference learning
- No personalized re-ranking

**Query expansion is static:**
- `lib/bos/query-expander.ts` uses hardcoded synonyms
- No user-specific expansions
- No learned terminology preferences

**Search query logging is stubbed:**
- `lib/supabase/chat-service.ts` has commented-out `logSearchQuery()` calls
- Infrastructure exists but is disabled

### Opportunity: Personalization Foundation

#### 3.1 User Preferences Schema

```sql
CREATE TABLE user_search_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  brand_id UUID NOT NULL REFERENCES brands(id),

  -- Topic affinity (learned from conversations)
  topic_weights JSONB DEFAULT '{}', -- {"voice": 0.8, "design": 0.3, "messaging": 0.6}

  -- Source preferences (learned from feedback)
  preferred_sources UUID[] DEFAULT '{}',
  avoided_sources UUID[] DEFAULT '{}',

  -- Query patterns
  common_terms TEXT[] DEFAULT '{}',
  terminology_preferences JSONB DEFAULT '{}', -- {"tone" -> "voice", "colors" -> "palette"}

  -- Context
  active_project_id UUID REFERENCES projects(id),
  recent_topics TEXT[] DEFAULT '{}',

  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, brand_id)
);
```

#### 3.2 Topic Extraction

Extract topics from conversations to learn user interests:

```typescript
// lib/ai/topic-extractor.ts
interface TopicExtraction {
  topics: Array<{
    name: string;
    confidence: number;
    category: 'voice' | 'design' | 'messaging' | 'strategy' | 'assets';
  }>;
}

async function extractTopics(messages: Message[]): Promise<TopicExtraction> {
  // Use small model to classify conversation topics
  // Update user_search_preferences.topic_weights
}
```

#### 3.3 Feedback-Aware Re-Ranking

Integrate positive/negative feedback into re-ranking weights:

```typescript
// lib/bos/reranker.ts - Enhancement
interface PersonalizedRerankerOptions extends RerankerOptions {
  userPreferences?: {
    preferredSources: string[];
    avoidedSources: string[];
    topicWeights: Record<string, number>;
  };
}

function applyPersonalization(
  results: SearchResult[],
  preferences: UserSearchPreferences
): SearchResult[] {
  return results.map(result => {
    let boost = 0;

    // Boost preferred sources
    if (preferences.preferred_sources.includes(result.sourceId)) {
      boost += 0.1;
    }

    // Penalize avoided sources
    if (preferences.avoided_sources.includes(result.sourceId)) {
      boost -= 0.2;
    }

    // Apply topic affinity
    const topicMatch = calculateTopicOverlap(result.topics, preferences.topic_weights);
    boost += topicMatch * 0.15;

    return { ...result, score: result.score + boost };
  });
}
```

#### 3.4 Dynamic Query Expansion

Replace static synonyms with learned user terminology:

```typescript
// lib/bos/query-expander.ts - Enhancement
async function expandQuery(
  query: string,
  userId: string,
  brandId: string
): Promise<string[]> {
  const preferences = await getUserPreferences(userId, brandId);

  // Apply user-specific terminology preferences
  let expanded = query;
  for (const [userTerm, brandTerm] of Object.entries(preferences.terminology_preferences)) {
    if (query.includes(userTerm)) {
      expanded = expanded.replace(userTerm, brandTerm);
    }
  }

  // Add commonly co-occurring terms from user's history
  const relatedTerms = findRelatedTerms(query, preferences.common_terms);

  return [query, expanded, ...relatedTerms];
}
```

#### 3.5 Context-Aware Search

Use active project context to filter and boost results:

```typescript
interface SearchContext {
  userId: string;
  brandId: string;
  projectId?: string; // Active project
  recentTopics: string[]; // Last 5 conversation topics
  sessionIntent?: string; // Inferred from first query
}

function buildSearchContext(conversation: Conversation): SearchContext {
  return {
    userId: conversation.user_id,
    brandId: conversation.brand_id,
    projectId: conversation.metadata?.project_id,
    recentTopics: extractRecentTopics(conversation.messages),
    sessionIntent: inferSessionIntent(conversation.messages[0]),
  };
}
```

---

## Quality Signals Matrix

### Current vs Target State

| Signal Type | Current | Gap | Priority | Phase |
|-------------|---------|-----|----------|-------|
| **MRR@10** | ✅ 93.4% | None | Maintain | - |
| **User satisfaction** | ❌ Unknown | No direct measure | High | 1 |
| **Engagement depth** | ❌ Not tracked | No tracking | High | 2 |
| **Feedback volume** | ⚠️ Like/dislike only | Need detail | Medium | 1 |
| **Feedback categories** | ❌ Not collected | No structured signals | Medium | 1 |
| **Source feedback** | ❌ Not collected | No source-level data | Medium | 2 |
| **Personalization** | ❌ No memory | No learned preferences | Medium | 3 |
| **Query refinement tracking** | ❌ Not tracked | No session analysis | Low | 2 |

### Signal Reliability Matrix

| Signal | Reliability | Volume | Bias Risk |
|--------|-------------|--------|-----------|
| **MRR@10** | High (controlled evaluation) | Low (50 queries) | Medium (dataset selection) |
| **Explicit feedback** | Medium (user motivation varies) | Medium (5-15% of responses) | High (only strong opinions) |
| **Engagement metrics** | High (objective measurement) | High (all sessions) | Low (captures all users) |
| **Query reformulation** | Medium (intent inference) | High (all sessions) | Medium (may be exploratory) |

### Recommended Signal Weighting

For overall quality scoring:

| Signal | Weight | Rationale |
|--------|--------|-----------|
| MRR@10 (baseline) | 30% | Statistical grounding |
| Positive feedback rate | 25% | Direct user signal |
| Engagement success rate | 25% | Behavioral confirmation |
| Abandonment rate (inverse) | 20% | Failure detection |

---

## Implementation Roadmap

### Phase 1: Enhanced Feedback (1-2 weeks)

**Goal:** Capture richer signals from existing user interactions

| Task | Effort | Files |
|------|--------|-------|
| Add `comment` column to `message_feedback` | 0.5d | Migration, types |
| Add `categories` array column | 0.5d | Migration, types |
| Add `reported` flag and reason | 0.5d | Migration, types |
| Update `ResponseActions.tsx` with feedback modal | 2d | Components |
| Update `feedback-service.ts` with new fields | 1d | Service |
| Create feedback analytics dashboard | 2d | Dashboard |

**Success criteria:**
- Feedback rate increases from ~5% to >15%
- Comments collected on >30% of feedback
- Category distribution provides actionable insights

### Phase 2: Implicit Analytics (2-3 weeks)

**Goal:** Understand user behavior without requiring explicit input

| Task | Effort | Files |
|------|--------|-------|
| Create `search_sessions` schema | 0.5d | Migration |
| Create `useResponseEngagement` hook | 2d | Hooks |
| Implement scroll depth tracking | 1d | Components |
| Implement time-on-response tracking | 1d | Components |
| Track query reformulations | 2d | Services |
| Create engagement analytics dashboard | 3d | Dashboard |

**Success criteria:**
- Engagement metrics on 100% of responses
- Session-level success/abandonment classification
- Query reformulation rate tracked

### Phase 3: Memory Foundation (3-4 weeks)

**Goal:** Build infrastructure for personalization

| Task | Effort | Files |
|------|--------|-------|
| Create `user_search_preferences` schema | 0.5d | Migration |
| Create `source_feedback` schema | 0.5d | Migration |
| Implement topic extraction from conversations | 3d | Services |
| Add source preference tracking | 2d | Components, Services |
| Update re-ranker with preference support | 2d | lib/bos/reranker.ts |
| Enable search query logging | 1d | lib/supabase/chat-service.ts |

**Success criteria:**
- Topic weights populated for active users
- Source preferences captured from feedback
- Re-ranker accepts personalization input

### Phase 4: Personalized Search (4-6 weeks)

**Goal:** Deliver personalized search results

| Task | Effort | Files |
|------|--------|-------|
| Implement user profile embeddings | 2w | New service |
| Add personalized re-ranking weights | 1w | lib/bos/reranker.ts |
| Enable dynamic query expansion | 1w | lib/bos/query-expander.ts |
| Context-aware search routing | 1w | lib/bos/search-service.ts |
| A/B testing framework | 1w | Infrastructure |

**Success criteria:**
- Personalized results for users with >10 conversations
- Measurable improvement in engagement metrics
- No regression in MRR@10

---

## Success Criteria

### Quantitative Targets

| Metric | Current | Phase 1 Target | Phase 4 Target |
|--------|---------|----------------|----------------|
| **MRR@10** | 93.4% | Maintain | Maintain |
| **User satisfaction (positive rate)** | Unknown | >70% | >80% |
| **Feedback rate** | ~5% | >15% | >20% |
| **Query refinement rate** | Unknown | Measured | <20% |
| **Engagement success rate** | Unknown | Measured | >70% |
| **Abandonment rate** | Unknown | Measured | <20% |

### Qualitative Goals

1. **Understanding:** Know why users rate responses positively or negatively
2. **Visibility:** Dashboard showing real-time quality signals
3. **Action:** Feedback drives continuous improvement
4. **Personalization:** Returning users get progressively better results

---

## Appendices

### A. Current Feedback Schema Reference

**Source:** `supabase/migrations/005_message_feedback.sql`

```sql
CREATE TABLE message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);
```

### B. Proposed Enhanced Feedback Migration

```sql
-- Migration: XXX_enhanced_message_feedback.sql

-- Add comment field
ALTER TABLE message_feedback
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS comment_at TIMESTAMPTZ;

-- Add structured categories
ALTER TABLE message_feedback
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Add report mechanism
ALTER TABLE message_feedback
  ADD COLUMN IF NOT EXISTS reported BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_reason TEXT,
  ADD COLUMN IF NOT EXISTS report_details TEXT;

-- Add constraint for report_reason
ALTER TABLE message_feedback
  ADD CONSTRAINT valid_report_reason CHECK (
    report_reason IS NULL OR
    report_reason IN ('harmful', 'off_brand', 'confidential', 'other')
  );

-- Create index for reports
CREATE INDEX IF NOT EXISTS idx_message_feedback_reported
  ON message_feedback(reported)
  WHERE reported = true;
```

### C. Proposed Analytics Schema

```sql
-- Migration: XXX_search_analytics.sql

-- Search session tracking
CREATE TABLE search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Query tracking
  query_count INTEGER DEFAULT 1,
  queries JSONB[] DEFAULT '{}',
  reformulation_count INTEGER DEFAULT 0,

  -- Outcome
  outcome TEXT DEFAULT 'unknown' CHECK (
    outcome IN ('success', 'abandoned', 'reformulated', 'unknown')
  ),

  -- Engagement
  total_duration_ms INTEGER,
  sources_clicked INTEGER DEFAULT 0,
  responses_expanded INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Response engagement tracking
CREATE TABLE response_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  session_id UUID REFERENCES search_sessions(id) ON DELETE SET NULL,

  -- Engagement metrics
  view_duration_ms INTEGER,
  scroll_depth_percent INTEGER CHECK (scroll_depth_percent BETWEEN 0 AND 100),
  expanded BOOLEAN DEFAULT false,
  copied BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,

  -- Source interactions
  sources_viewed INTEGER DEFAULT 0,
  sources_clicked INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_search_sessions_user ON search_sessions(user_id);
CREATE INDEX idx_search_sessions_brand ON search_sessions(brand_id);
CREATE INDEX idx_search_sessions_outcome ON search_sessions(outcome);
CREATE INDEX idx_response_engagement_message ON response_engagement(message_id);
```

### D. Embedding Dimensions Decision Summary

*Condensed from the superseded embedding dimensions audit.*

| Factor | Assessment | Recommendation |
|--------|------------|----------------|
| **Current MRR@10** | 93.4% (exceeds 70% target) | No upgrade needed |
| **Corpus size** | ~50-100 documents | 1536d fully adequate |
| **Storage impact** | +6 MB for 3072d | Negligible |
| **API cost** | No change | Neutral |
| **Migration effort** | 2-3 weeks | Not justified |
| **Quality improvement** | ~1-2% MRR gain | Marginal |

**Verdict:** Stay at 1536 dimensions until:
- MRR@10 drops below 80% with optimization headroom exhausted
- Corpus exceeds 500+ documents
- Semantic nuance becomes a documented pain point

### E. Key Code References

| File | Purpose | Status |
|------|---------|--------|
| `lib/supabase/feedback-service.ts` | Feedback submission/retrieval | ✅ Enhance |
| `supabase/migrations/005_message_feedback.sql` | Feedback schema | ✅ Enhance |
| `components/chat/ResponseActions.tsx` | Feedback UI | ✅ Enhance |
| `components/VercelAnalytics.tsx` | Current analytics | ⚠️ Basic |
| `lib/bos/reranker.ts` | Re-ranking logic | ⚠️ Add personalization |
| `lib/bos/query-expander.ts` | Query expansion | ⚠️ Add dynamic expansion |
| `lib/supabase/chat-service.ts` | Chat operations | ⚠️ Enable query logging |
| `lib/supabase/settings-service.ts` | User preferences | ⚠️ Extend for search |

---

## Conclusion

The current 93.4% MRR@10 demonstrates strong statistical retrieval quality, but **statistical relevance does not equal user satisfaction**. This audit recommends a phased approach to close the satisfaction gap:

1. **Maintain 1536 dimensions** — The ROI of upgrading to 3072 is low given current performance
2. **Enhance explicit feedback** — Capture why users rate responses positively or negatively
3. **Add implicit analytics** — Understand engagement without requiring user action
4. **Build personalization** — Learn user preferences over time for progressively better results

The four-phase roadmap provides a structured path from basic feedback collection to full personalization, with measurable success criteria at each stage.

**Next review:** 6 months or after Phase 2 completion

---

*Report generated by Claude on January 20, 2026*
*Based on BOS codebase analysis and search quality research*

**References:**
- Context Engineering Audit (January 16, 2026)
- Embedding Dimensions Audit (January 20, 2026) — superseded
- OpenAI Embeddings Guide
- MTEB Benchmark Data
