-- ============================================
-- Deep Research Tables Migration
-- ============================================
-- Creates tables for storing research sessions, plans, notes, gaps, and metrics
-- for the Deep Research feature.

-- ============================================
-- Research Sessions
-- ============================================
-- Main table for tracking research sessions
CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN (
        'initializing', 'classifying', 'planning', 'searching',
        'synthesizing', 'gap_analysis', 'round2_searching',
        'round2_synthesizing', 'completed', 'failed'
    )),
    complexity TEXT CHECK (complexity IN ('simple', 'moderate', 'complex')),
    current_round INTEGER NOT NULL DEFAULT 1,
    final_answer TEXT,
    citations JSONB DEFAULT '[]'::jsonb,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);

-- Index for brand lookup
CREATE INDEX IF NOT EXISTS idx_research_sessions_brand_id ON research_sessions(brand_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);

-- Index for recent sessions
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at DESC);

-- ============================================
-- Research Plans
-- ============================================
-- Stores the decomposed sub-questions for each research session
CREATE TABLE IF NOT EXISTS research_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    original_query TEXT NOT NULL,
    sub_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_estimated_time INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_research_plans_session_id ON research_plans(session_id);

-- ============================================
-- Research Notes
-- ============================================
-- Stores individual research notes from each sub-question search
CREATE TABLE IF NOT EXISTS research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    sub_question_id TEXT NOT NULL,
    content TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_research_notes_session_id ON research_notes(session_id);

-- Index for sub-question lookup
CREATE INDEX IF NOT EXISTS idx_research_notes_sub_question_id ON research_notes(sub_question_id);

-- ============================================
-- Research Gaps
-- ============================================
-- Tracks identified knowledge gaps and their resolution
CREATE TABLE IF NOT EXISTS research_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    round INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    suggested_query TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_research_gaps_session_id ON research_gaps(session_id);

-- Index for unresolved gaps
CREATE INDEX IF NOT EXISTS idx_research_gaps_resolved ON research_gaps(resolved) WHERE NOT resolved;

-- ============================================
-- Session Metrics
-- ============================================
-- Performance and cost metrics for research sessions
CREATE TABLE IF NOT EXISTS research_session_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE UNIQUE,
    total_duration_ms INTEGER NOT NULL DEFAULT 0,
    classification_duration_ms INTEGER NOT NULL DEFAULT 0,
    planning_duration_ms INTEGER NOT NULL DEFAULT 0,
    search_duration_ms INTEGER NOT NULL DEFAULT 0,
    synthesis_duration_ms INTEGER NOT NULL DEFAULT 0,
    round2_duration_ms INTEGER,
    total_queries INTEGER NOT NULL DEFAULT 0,
    total_citations INTEGER NOT NULL DEFAULT 0,
    gaps_found INTEGER NOT NULL DEFAULT 0,
    gaps_resolved INTEGER NOT NULL DEFAULT 0,
    parallelization_efficiency DECIMAL(3,2) DEFAULT 0.00 CHECK (parallelization_efficiency >= 0 AND parallelization_efficiency <= 1),
    estimated_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_research_session_metrics_session_id ON research_session_metrics(session_id);

-- ============================================
-- Updated At Trigger
-- ============================================
-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_research_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for research_sessions
DROP TRIGGER IF EXISTS trigger_research_sessions_updated_at ON research_sessions;
CREATE TRIGGER trigger_research_sessions_updated_at
    BEFORE UPDATE ON research_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_research_sessions_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
-- Enable RLS on all tables
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_session_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for research_sessions
-- ============================================
-- Users can view their own sessions
CREATE POLICY "Users can view own research sessions"
    ON research_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own research sessions"
    ON research_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own research sessions"
    ON research_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own research sessions"
    ON research_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for research_plans
-- ============================================
-- Users can view plans for their sessions
CREATE POLICY "Users can view own research plans"
    ON research_plans FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_plans.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- Users can insert plans for their sessions
CREATE POLICY "Users can insert own research plans"
    ON research_plans FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_plans.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- ============================================
-- RLS Policies for research_notes
-- ============================================
-- Users can view notes for their sessions
CREATE POLICY "Users can view own research notes"
    ON research_notes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_notes.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- Users can insert notes for their sessions
CREATE POLICY "Users can insert own research notes"
    ON research_notes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_notes.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- ============================================
-- RLS Policies for research_gaps
-- ============================================
-- Users can view gaps for their sessions
CREATE POLICY "Users can view own research gaps"
    ON research_gaps FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_gaps.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- Users can insert gaps for their sessions
CREATE POLICY "Users can insert own research gaps"
    ON research_gaps FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_gaps.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- Users can update gaps for their sessions
CREATE POLICY "Users can update own research gaps"
    ON research_gaps FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_gaps.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- ============================================
-- RLS Policies for research_session_metrics
-- ============================================
-- Users can view metrics for their sessions
CREATE POLICY "Users can view own research session metrics"
    ON research_session_metrics FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_session_metrics.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- Users can insert metrics for their sessions
CREATE POLICY "Users can insert own research session metrics"
    ON research_session_metrics FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM research_sessions
        WHERE research_sessions.id = research_session_metrics.session_id
        AND research_sessions.user_id = auth.uid()
    ));

-- ============================================
-- Anonymous/Service Role Access
-- ============================================
-- Allow service role full access (for API routes)
CREATE POLICY "Service role has full access to research_sessions"
    ON research_sessions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to research_plans"
    ON research_plans FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to research_notes"
    ON research_notes FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to research_gaps"
    ON research_gaps FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to research_session_metrics"
    ON research_session_metrics FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE research_sessions IS 'Tracks deep research sessions with their status, results, and citations';
COMMENT ON TABLE research_plans IS 'Stores decomposed sub-questions for research sessions';
COMMENT ON TABLE research_notes IS 'Individual research notes from sub-question searches';
COMMENT ON TABLE research_gaps IS 'Identified knowledge gaps and their resolution status';
COMMENT ON TABLE research_session_metrics IS 'Performance and cost metrics for research sessions';
