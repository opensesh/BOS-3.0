# Deep Research Implementation Plan

**Goal:** Build a Perplexity-style Deep Research feature in-app using Anthropic + Perplexity APIs, optimized for performance and cost-efficiency.

---

## Executive Summary

Deploy a lightweight, parallelized research pipeline:

1. **Fast classification** → route simple queries directly to Perplexity, complex queries to orchestration.
2. **Lean planning** → Claude decomposes into 3–5 sub-questions (not 7+).
3. **Batched search** → single parallel Perplexity round per iteration; no bloat.
4. **Single synthesis** → one synthesis pass per round; gap analysis drives optional round 2 only.
5. **Hard cost caps** → max 2 rounds, max 10 Perplexity calls total, max 5 sub-questions.

**Expected latency:** 30–60 seconds for moderate complexity, <10 seconds for simple.  
**Cost per research:** $0.10–$0.30 (Anthropic) + $0.05–$0.15 (Perplexity) depending on depth.

---

## Architecture Overview

```
User Question
    ↓
[1. Classify Complexity] (Claude, <5s)
    ├─ Simple → Perplexity once → Polish → Done
    └─ Moderate/Complex → Full Pipeline
        ↓
[2. Plan & Decompose] (Claude, <3s)
    ├─ Output: 3–5 sub-questions with queries
    ↓
[3. Parallel Search Workers] (Perplexity, <15s)
    ├─ All sub-questions in parallel
    ├─ Consolidate into structured notes
    ↓
[4. Synthesize & Gap Analysis] (Claude, <10s)
    ├─ Output: draft answer + gap list
    ↓
[5. Optional Refinement] (If gaps exist, <30s)
    ├─ Targeted Perplexity calls on gaps
    ├─ Re-synthesize once
    ├─ Final answer
```

---

## Phase 1: Setup & Data Model

### 1.1 Entities (Supabase / Prisma)

```typescript
// Core session type
type ResearchSession = {
  id: string;
  userId: string;
  question: string;
  complexity: "simple" | "moderate" | "complex";
  status: "pending" | "running" | "completed" | "failed";
  plan: ResearchPlan | null;
  notes: Note[];
  finalAnswer: string | null;
  totalCost: number; // Track spend
  totalLatency: number; // Track speed
  createdAt: Date;
  completedAt: Date | null;
};

// Plan output from classifier + planner
type ResearchPlan = {
  sessionId: string;
  overallGoal: string;
  subquestions: SubQuestion[];
  maxRounds: number; // 1 or 2 only
  classifiedComplexity: "simple" | "moderate" | "complex";
};

// Sub-question (minimal)
type SubQuestion = {
  id: string;
  planId: string;
  text: string;
  queries: string[]; // 1–2 queries per sub-question
  priority: "high" | "medium";
};

// Search result (one per query execution)
type Note = {
  id: string;
  sessionId: string;
  subquestionId: string;
  query: string;
  summary: string; // 3–5 bullets
  keyPoints: string[];
  citations: Citation[];
  confidence: "high" | "med" | "low";
  round: number; // 1 or 2
};

type Citation = {
  url: string;
  title: string;
};

// Gap identified in synthesis
type Gap = {
  id: string;
  sessionId: string;
  description: string;
  priority: "high" | "medium" | "low";
  query: string; // Single focused query, not an array
};
```

---

## Phase 2: Core Endpoints & Logic

### 2.1 Classifier (Claude) — <5 seconds

**Purpose:** Route query to lightweight or full pipeline.

**Input:**
```json
{
  "question": "user question"
}
```

**Claude Prompt:**

```
You are a research complexity classifier.

Analyze this question and output JSON:
- complexity: "simple" | "moderate" | "complex"
- maxRounds: 1 if simple, 2 if moderate/complex
- estimatedSubquestions: 1–5 (prefer fewer)
- reasoning: one sentence

Rules:
- Simple: factual, single-topic, answerable in one web search
- Moderate: multi-faceted but <4 sub-topics
- Complex: requires deep exploration, new analysis, or multiple perspectives

Question: {question}
```

**Output:**
```json
{
  "complexity": "moderate",
  "maxRounds": 2,
  "estimatedSubquestions": 3,
  "reasoning": "Requires technical depth and comparison across frameworks"
}
```

**Cost & latency:** ~50 tokens in, ~50 out → ~$0.002, <2s.

**Branching:**
- If `complexity == "simple"`: Skip planning. Call Perplexity once with `search_context_size: "low"`, optionally Claude to polish. **Done in <15s.**
- Else: Proceed to planning.

---

### 2.2 Planner (Claude) — <3 seconds

**Purpose:** Decompose question into minimal, non-overlapping sub-questions with search queries.

**Input:**
```json
{
  "question": "user question",
  "complexity": "moderate",
  "estimatedSubquestions": 3
}
```

**Claude Prompt:**

```
You are a research planning agent. Decompose the question into 3–5 non-overlapping sub-questions.

For each sub-question:
- Write a clear, specific sub-question (1 sentence)
- Provide 1–2 concrete search queries that will directly answer it
- Mark priority: "high" (essential to main answer) or "medium" (supporting)

Output strict JSON:

{
  "subquestions": [
    {
      "id": "q1",
      "text": "...",
      "queries": ["query1", "query2"],
      "priority": "high"
    }
  ]
}

Question: {question}
```

**Output:**
```json
{
  "subquestions": [
    {
      "id": "q1",
      "text": "What are the key differences between React and Vue for state management?",
      "queries": ["React state management vs Vue", "Vue composition API vs React hooks"],
      "priority": "high"
    },
    {
      "id": "q2",
      "text": "Which framework has better developer experience and community support?",
      "queries": ["React vs Vue community 2025 adoption"],
      "priority": "medium"
    },
    {
      "id": "q3",
      "text": "What is the performance impact of each framework's state system?",
      "queries": ["React rendering performance 2025", "Vue 3 performance benchmarks"],
      "priority": "high"
    }
  ]
}
```

**Cost & latency:** ~150 tokens in, ~200 out → ~$0.005, <2s.

**Save:** Persist `ResearchPlan` to DB. Mark session `status = "running"`.

---

### 2.3 Parallel Search Workers (Perplexity) — <15 seconds

**Purpose:** Execute all queries in parallel, normalize results.

**For each sub-question:**

1. Extract `queries` array.
2. Fire Perplexity calls in parallel:
   ```typescript
   const results = await Promise.all(
     subquestion.queries.map(q =>
       perplexity.search(q, {
         search_context_size: "medium", // Default; "low" for fast, "high" for round 2
         max_results: 8
       })
     )
   );
   ```

3. Normalize each result into a `Note`:

```typescript
function normalizePerplexityResult(
  result: PerplexityResponse,
  subquestionId: string,
  query: string,
  round: number
): Note {
  return {
    id: uuid(),
    sessionId: sessionId,
    subquestionId,
    query,
    summary: bulletsFromAnswer(result.answer, 3), // Extract 3 bullets
    keyPoints: extractKeyPoints(result.answer),
    citations: result.citations.map(c => ({ url: c.url, title: c.title })),
    confidence: assessConfidence(result.answer), // heuristic
    round
  };
}
```

**Parallelization:**
```typescript
const allNotes = await Promise.all(
  plan.subquestions.map(async (sq) => {
    const results = await Promise.all(
      sq.queries.map(q => perplexity.search(q, opts))
    );
    return results.map((r, i) => 
      normalizePerplexityResult(r, sq.id, sq.queries[i], 1)
    );
  })
).then(notes => notes.flat());
```

**Cost & latency:**  
- 5 sub-questions × 1.5 queries avg = ~7–8 Perplexity calls → <15s total.
- Cost: ~$0.05–$0.08 (Sonar API typical).

**Save:** Persist all `Note`s with `round=1`.

---

### 2.4 Synthesizer (Claude) — <10 seconds

**Purpose:** Merge notes into a cohesive answer, identify gaps.

**Input to Claude:**
```json
{
  "question": "original user question",
  "plan": { "subquestions": [...] },
  "notes": [
    {
      "subquestionId": "q1",
      "summary": ["bullet1", "bullet2"],
      "citations": [...]
    }
  ]
}
```

**Claude Prompt:**

```
You are a research synthesizer. Given notes from web searches, produce a clear, cited answer.

Rules:
1. Use ONLY the provided notes; do NOT invent facts.
2. Group answer by sub-question or topic.
3. Preserve all citations as inline markdown links: [text](url)
4. At the end, output a JSON block with gaps:

---
## Gaps & Next Steps (for internal use)

{"gaps": [{"description": "...", "query": "...", "priority": "high"}]}

Guidelines for gaps:
- Include only high/medium priority gaps that would materially improve the answer
- Suggest a single, specific search query per gap
- If gaps are few or low-priority, set an empty array

Question: {question}

Notes:
{notes formatted clearly}
```

**Output:**
```markdown
# Answer to: [original question]

## State Management Approaches

### React
- Uses hooks (useState, useReducer, useContext)
- Integrates with external libraries (Redux, Zustand, Jotai)
- Citations: [React Docs](https://react.dev) [Redux](https://redux.js.org)

### Vue
- Reactive refs and reactive() function
- Composition API mirrors React hooks
- Pinia as the official store
- Citations: [Vue Docs](https://vuejs.org) [Pinia](https://pinia.vuejs.org)

## Community & Ecosystem

...

---

## Gaps & Next Steps

{"gaps": [{"description": "Performance metrics comparing React and Vue rendering speed in 2025", "query": "React vs Vue performance benchmark 2025", "priority": "high"}]}
```

**Parse output:**
1. Extract markdown answer (everything before `---`).
2. Extract JSON gap block.
3. Save answer + gaps to DB.

**Cost & latency:** ~1500 tokens in, ~1000 out → ~$0.01, <5s.

---

### 2.5 Gap Analysis & Optional Round 2

**Logic:**

```typescript
if (
  round === 1 &&
  plan.maxRounds >= 2 &&
  gaps.length > 0 &&
  gaps.some(g => g.priority === "high")
) {
  // Fire round 2
  const round2Notes = await Promise.all(
    gaps.map(gap => perplexity.search(gap.query, { search_context_size: "high" }))
  ).then(results =>
    results.map((r, i) =>
      normalizePerplexityResult(r, gaps[i].id, gaps[i].query, 2)
    )
  );

  // Save round 2 notes
  await db.notes.insertMany(round2Notes);

  // Re-synthesize with all notes (round 1 + round 2)
  const finalAnswer = await synthesize({
    notes: [...round1Notes, ...round2Notes],
    ...
  });

  return { answer: finalAnswer, completedAt: now(), status: "completed" };
}
```

**Cost & latency:**  
- If triggered: 3–5 gap queries at `search_context_size: "high"` → <15s, ~$0.08–$0.12.
- Final synthesis: <5s, ~$0.01.

**Total if round 2 runs:** ~40–50s, ~$0.20–$0.30 all-in.

---

## Phase 3: Success Criteria & Monitoring

### 3.1 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Simple query latency** | <15s | From question submit to final answer |
| **Moderate query latency** | <45s | " |
| **Complex query latency** | <75s (with round 2) | " |
| **API cost per research (moderate)** | <$0.20 | Claude + Perplexity spend tracked |
| **Parallelization efficiency** | >80% | (sum of parallel call times) / actual wall time |
| **Citation accuracy** | 95%+ | Manual spot-check: links are valid, quotes match |
| **Gap detection rate** | >70% | Synthesizer identifies real missing pieces |

### 3.2 Success Criteria (Launch Readiness)

- [ ] Classifier routes correctly (A/B test: simple queries take <15s, skip planning).
- [ ] Planner outputs max 5 sub-questions; all are non-overlapping.
- [ ] Parallel search completes in <15s for 4–5 queries.
- [ ] Synthesizer produces answer with inline citations; no hallucinations in manual review.
- [ ] Gap detection triggers round 2 for 60%+ of "complex" queries; skips it for 80%+ of "simple".
- [ ] Full moderate research completes in <50s, <$0.20 cost.
- [ ] User can see "Research process" toggle showing sub-questions, notes, gaps.

### 3.3 Monitoring & Alerting

**Log key metrics for each session:**

```typescript
const sessionMetrics = {
  sessionId: string;
  complexity: string;
  classifyTime: number;
  planTime: number;
  searchTime: number;
  synthesizeTime: number;
  round2Time: number | null;
  totalTime: number;
  totalCost: number;
  notesCount: number;
  gapsCount: number;
  round2Triggered: boolean;
  createdAt: Date;
};
```

**Dashboard:**
- Median latency by complexity.
- Cost per session.
- Round 2 trigger rate.
- Parallel API utilization.

**Alerts:**
- If `totalTime > 90s`: investigate slow Perplexity or Claude calls.
- If `totalCost > $0.50`: review unnecessary round 2 triggers or extra queries.
- If `notesCount > 15` for simple queries: tighten planner constraints.

---

## Phase 4: Implementation Checklist

### Backend (Node.js / Next.js API route)

- [ ] **Classifier endpoint:** POST `/api/research/classify`
  - Input: `{ question }`
  - Output: `{ complexity, maxRounds, estimatedSubquestions }`
  
- [ ] **Planner endpoint:** POST `/api/research/plan`
  - Input: `{ question, complexity }`
  - Output: `{ subquestions[] }`
  
- [ ] **Search workers:** Parallel executor
  - Input: `{ subquestions[], maxRounds }`
  - Output: `{ notes[] }` (round 1)
  
- [ ] **Synthesizer endpoint:** POST `/api/research/synthesize`
  - Input: `{ question, notes[], plan }`
  - Output: `{ answer, gaps[] }`
  
- [ ] **Main orchestrator:** POST `/api/research` (ties all above together)
  - Input: `{ question, userId }`
  - Output: streams session updates or returns final `ResearchSession`
  - Handles classification → planning → search → synthesis → optional round 2
  
- [ ] **Metrics logging:** Log all `sessionMetrics` to DB / analytics.

### Frontend (React / BOS)

- [ ] **Research input form:** Question text, "Quick" vs "Deep" toggle (maps to maxRounds).
- [ ] **Status indicator:** Show "Planning", "Searching", "Synthesizing", "Done".
- [ ] **Timeline view:** Expandable sections per sub-question; show notes grouped by priority.
- [ ] **Final answer panel:** Render markdown with clickable citations.
- [ ] **Toggle: "Show research process"** → collapse/expand timeline and notes.
- [ ] **Rerun button:** "Research deeper on [sub-question]" for specific refinement.

### Database (Supabase schema)

```sql
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  complexity TEXT NOT NULL,
  status TEXT NOT NULL,
  plan JSONB,
  final_answer TEXT,
  total_cost DECIMAL,
  total_latency INT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE research_plans (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  subquestions JSONB NOT NULL,
  max_rounds INT,
  created_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id)
);

CREATE TABLE research_notes (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  subquestion_id TEXT NOT NULL,
  query TEXT NOT NULL,
  summary TEXT,
  key_points TEXT[],
  citations JSONB,
  confidence TEXT,
  round INT,
  created_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id)
);

CREATE TABLE research_gaps (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  description TEXT NOT NULL,
  query TEXT,
  priority TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id)
);

CREATE TABLE session_metrics (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  classify_time INT,
  plan_time INT,
  search_time INT,
  synthesize_time INT,
  round2_time INT,
  total_time INT,
  total_cost DECIMAL,
  notes_count INT,
  gaps_count INT,
  round2_triggered BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES research_sessions(id)
);
```

---

## Phase 5: Cost & Latency Projections

### Single Research Session (Moderate Complexity)

| Step | API Calls | Latency | Cost |
|------|-----------|---------|------|
| Classify | 1× Claude | 2s | $0.002 |
| Plan | 1× Claude | 2s | $0.005 |
| Search (round 1) | 6× Perplexity (parallel) | 12s | $0.06 |
| Synthesize | 1× Claude | 5s | $0.01 |
| **Subtotal (no round 2)** | 9 calls | **21s** | **$0.077** |
| Search (round 2, if triggered) | 3× Perplexity (parallel) | 12s | $0.08 |
| Synthesize (round 2) | 1× Claude | 5s | $0.01 |
| **Total with round 2** | 12 calls | **38s** | **$0.167** |

**Note:** Most sessions end at synthesis (no round 2) due to low-gap thresholds.

### Scaling (100 daily research sessions)

- **Daily API cost:** 100 sessions × $0.15 avg = **$15/day** (~$450/month).
- **Daily latency:** Avg 30s per session → good UX.
- **Throughput:** With parallelization, 100 concurrent users = ~6 parallel sessions, well within API rate limits.

---

## Phase 6: Iteration & Tuning

### First 2 Weeks (Stability)

1. Validate classifier routes queries correctly.
2. Monitor synthesizer for hallucinations; adjust prompt if needed.
3. Check citation quality; validate links don't 404.
4. Measure actual latency vs projections; optimize slow steps.

### Weeks 3–4 (Optimization)

1. Tune `maxRounds` thresholds based on user feedback.
2. Experiment with `search_context_size`: Does `"high"` improve gap detection? Cost it.
3. A/B test: "Show research process" UX variant (expanded vs collapsed by default).
4. Optional: Add "rerun with more queries" button for power users.

### Month 2+ (Feature Expansion)

1. Persist and allow users to "branch" a research (start new round from existing notes).
2. Add collaborative research (multi-user, shared sessions).
3. Fine-tune prompts based on common failure cases.
4. Consider caching of sub-question answers for repeated topics.

---

## Appendix: Example Flow (User Perspective)

**User:** "Compare React and Vue for a new project in 2025"

**Timeline:**

```
T+0:00  User submits question
        ↓
T+0:02  Classifier: moderate complexity, max 2 rounds
        ↓
T+0:05  Planner: 3 sub-questions (state mgmt, ecosystem, performance)
        ↓ 
T+0:17  Search workers: 6 queries run in parallel
        → 6 notes collected with citations
        ↓
T+0:22  Synthesizer: produces draft answer + 2 high-priority gaps
        ↓
T+0:25  [Gap analysis: triggers round 2]
        ↓
T+0:37  Round 2 search: 2 focused queries on missing pieces
        ↓
T+0:42  Final synthesizer: merges all notes, polished answer
        ↓
T+0:45  User sees complete answer with "Research process" button
        Cost: ~$0.17, latency: 45s
```

**User clicks "Research process":**
```
[Expanding timeline...]

Q1: State Management (HIGH)
  ✓ Query 1: "React state management vs Vue"
    - Bullets from note
    - Citations: [React Docs] [Vue Docs]
  ✓ Query 2: "React hooks vs Vue composition API"
    - Bullets from note
    - Citations: [...]

Q2: Ecosystem & Community (MEDIUM)
  ✓ Query: "React vs Vue community 2025"
    - Bullets
    - Citations

Q3: Performance (HIGH)
  [Round 2 - Gap Refinement]
  ✓ Query: "React rendering performance benchmarks 2025"
    - New data: X ms vs Y ms
    - Citations: [...]
```

---

## Appendix: Key Configuration Parameters

```typescript
// Classifier constraints
const CLASSIFIER_CONFIG = {
  maxSubquestionsForSimple: 1,
  maxSubquestionsForModerate: 4,
  maxSubquestionsForComplex: 5,
  maxRoundsSimple: 1,
  maxRoundsModerate: 2,
  maxRoundsComplex: 2,
};

// Search worker config
const SEARCH_CONFIG = {
  maxQueriesPerSubquestion: 2,
  maxTotalQueriesPerRound: 10,
  defaultSearchContextSize: "medium", // or "low" for fast, "high" for deep
  maxResultsPerQuery: 8,
};

// Synthesizer config
const SYNTHESIS_CONFIG = {
  maxGapsPerRound: 5,
  gapPriorityThreshold: "high", // Only trigger round 2 for high-priority gaps
  bulletsPerNote: 3,
};

// Cost & latency hard caps
const LIMITS = {
  maxTotalLatencyMs: 90_000, // 90 seconds
  maxTotalCostUsd: 0.50,
  maxTotalApiCalls: 12, // Classifier + Planner + searches + synthesizers
};
```

---

## Questions for Next Phase

1. **Streaming UX:** Should we stream progress updates to the frontend (e.g., "Planning...", "Searching...", "Synthesizing...")? Recommend yes for good UX.
2. **Caching:** Should we cache sub-question answers by topic? Useful for frequent queries (e.g., "Compare X and Y tech").
3. **Multi-language:** Do we support non-English questions? Requires testing; Perplexity should handle it but may add latency.
4. **User feedback:** After synthesis, ask "Does this answer your question?" to tune gap detection.
5. **Admin controls:** Should admins be able to override `maxRounds` or `search_context_size` per user tier?

---

**Document Status:** Ready for development, January 2026.  
**Next Review:** After first 100 sessions.
