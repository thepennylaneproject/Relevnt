-- ============================================================================
-- ADMIN DASHBOARD FOUNDATION
-- ============================================================================
-- Tables for real-time monitoring, performance metrics, and alerting

-- ============================================================================
-- 1. ADMIN ALERTS TABLE
-- ============================================================================
-- Tracks system alerts: failures, timeouts, data quality issues
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR NOT NULL, -- 'source_failure', 'timeout', 'quality_issue', 'constraint_violation'
    severity VARCHAR NOT NULL, -- 'critical', 'high', 'medium', 'low'
    title TEXT NOT NULL,
    description TEXT,
    source_slug TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    triggered_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- ============================================================================
-- 2. SOURCE PERFORMANCE METRICS TABLE
-- ============================================================================
-- Aggregated performance metrics per source (7-day and 30-day windows)
CREATE TABLE IF NOT EXISTS source_performance_metrics (
    source_slug TEXT PRIMARY KEY,

    -- 7-day metrics
    success_rate_7d FLOAT DEFAULT 0,
    avg_jobs_per_run_7d INT DEFAULT 0,
    total_runs_7d INT DEFAULT 0,
    failed_runs_7d INT DEFAULT 0,

    -- 30-day metrics
    success_rate_30d FLOAT DEFAULT 0,
    avg_jobs_per_run_30d INT DEFAULT 0,
    total_runs_30d INT DEFAULT 0,
    failed_runs_30d INT DEFAULT 0,

    -- Current status
    consecutive_failures INT DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP,
    is_degraded BOOLEAN DEFAULT FALSE,

    -- Health calculation
    health_score INT DEFAULT 100, -- 0-100
    health_factors JSONB DEFAULT '{"success_rate": 0, "failures": 0, "freshness": 0, "duplicates": 0}',

    -- Tracking
    updated_at TIMESTAMP DEFAULT NOW(),
    last_run_at TIMESTAMP
);

-- ============================================================================
-- 3. DAILY INGESTION METRICS TABLE
-- ============================================================================
-- Time-series metrics for trends and analytics
CREATE TABLE IF NOT EXISTS daily_ingestion_metrics (
    date DATE PRIMARY KEY,

    -- Aggregate counts
    total_runs INT DEFAULT 0,
    total_inserted INT DEFAULT 0,
    total_duplicates INT DEFAULT 0,
    total_failed INT DEFAULT 0,

    -- Rates and averages
    success_rate FLOAT DEFAULT 0, -- percentage 0-100
    avg_duration_seconds INT DEFAULT 0,
    sources_with_errors INT DEFAULT 0,

    -- Quality metrics
    duplicate_rate_percent FLOAT DEFAULT 0,

    -- Tracking
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. JOB SOURCE HEALTH TABLE (extends existing)
-- ============================================================================
-- If this table doesn't exist, create it. Otherwise we'll just track health.
-- This is for per-source health information

CREATE TABLE IF NOT EXISTS job_source_health (
    source_slug TEXT PRIMARY KEY,

    -- Status tracking
    is_healthy BOOLEAN DEFAULT TRUE,
    is_degraded BOOLEAN DEFAULT FALSE,

    -- Failure tracking
    consecutive_failures INT DEFAULT 0,
    last_failure_at TIMESTAMP,
    last_failure_reason TEXT,

    -- Success tracking
    last_success_at TIMESTAMP,
    success_count_24h INT DEFAULT 0,

    -- Tracking
    updated_at TIMESTAMP DEFAULT NOW(),
    last_checked_at TIMESTAMP
);

-- ============================================================================
-- 5. INGESTION ACTIVITY LOG (for recent activity feed)
-- ============================================================================
-- Lightweight log of recent ingestion runs for real-time feed
CREATE TABLE IF NOT EXISTS ingestion_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    run_id UUID,
    sources_requested TEXT[], -- Array of source slugs
    trigger_type VARCHAR, -- 'scheduled', 'manual', 'retry'

    -- Status
    status VARCHAR, -- 'running', 'success', 'partial', 'failed'

    -- Metrics
    total_inserted INT DEFAULT 0,
    total_duplicates INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    duration_seconds INT,

    -- Details
    error_message TEXT,
    progress_percent INT DEFAULT 0, -- 0-100 if running

    -- Tracking
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Indexes for admin_alerts
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON admin_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_source ON admin_alerts (source_slug);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON admin_alerts (is_read, is_dismissed) WHERE is_dismissed = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON admin_alerts (severity);

-- Indexes for source_performance_metrics
CREATE INDEX IF NOT EXISTS idx_perf_health ON source_performance_metrics (health_score);
CREATE INDEX IF NOT EXISTS idx_perf_success_rate ON source_performance_metrics (success_rate_7d);
CREATE INDEX IF NOT EXISTS idx_perf_updated ON source_performance_metrics (updated_at DESC);

-- Indexes for daily_ingestion_metrics
CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_ingestion_metrics (date DESC);

-- Indexes for job_source_health
CREATE INDEX IF NOT EXISTS idx_health_status ON job_source_health (is_healthy);
CREATE INDEX IF NOT EXISTS idx_health_degraded ON job_source_health (is_degraded) WHERE is_degraded = TRUE;
CREATE INDEX IF NOT EXISTS idx_health_updated ON job_source_health (updated_at DESC);

-- Indexes for ingestion_activity_log
CREATE INDEX IF NOT EXISTS idx_activity_created ON ingestion_activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_status ON ingestion_activity_log (status);
CREATE INDEX IF NOT EXISTS idx_activity_started ON ingestion_activity_log (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed ON ingestion_activity_log (created_at DESC, status) WHERE status IN ('running', 'success', 'partial', 'failed');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Allow authenticated users to read alerts and metrics
GRANT SELECT ON admin_alerts TO authenticated;
GRANT SELECT ON source_performance_metrics TO authenticated;
GRANT SELECT ON daily_ingestion_metrics TO authenticated;
GRANT SELECT ON job_source_health TO authenticated;
GRANT SELECT ON ingestion_activity_log TO authenticated;

-- Allow service role (backend functions) to write to these tables
GRANT ALL ON admin_alerts TO service_role;
GRANT ALL ON source_performance_metrics TO service_role;
GRANT ALL ON daily_ingestion_metrics TO service_role;
GRANT ALL ON job_source_health TO service_role;
GRANT ALL ON ingestion_activity_log TO service_role;

