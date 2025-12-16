// netlify/functions/auto_apply/types.ts
// TypeScript types for Auto-Apply rule engine

/**
 * Auto-Apply Rule from database
 */
export interface AutoApplyRule {
    id: string
    user_id: string
    persona_id: string | null
    name: string
    enabled: boolean
    match_score_threshold: number | null
    max_applications_per_week: number | null
    exclude_companies: string[] | null
    include_only_companies: string[] | null
    require_all_keywords: string[] | null
    active_days: string[] | null // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    created_at: string
    updated_at: string
    last_run_at?: string | null
    total_applications?: number
    successful_applications?: number
    failed_applications?: number
}

/**
 * Auto-Apply Queue Entry from database
 */
export interface AutoApplyQueueEntry {
    id: string
    user_id: string
    persona_id: string | null
    job_id: string
    rule_id: string
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    priority: number
    metadata: Record<string, unknown> | null
    created_at: string
    scheduled_for: string
    processed_at: string | null
}

/**
 * User Persona from database
 */
export interface UserPersona {
    id: string
    user_id: string
    name: string
    description: string | null
    is_active: boolean
    resume_id: string | null
    created_at: string
    updated_at: string
}

/**
 * Job Match from database
 */
export interface JobMatch {
    id: string
    user_id: string
    job_id: string
    persona_id: string | null
    match_score: number
    match_factors: Record<string, unknown> | null
    explanation: string | null
    is_dismissed: boolean
    created_at: string
    expires_at: string | null
}

/**
 * Job from database
 */
export interface Job {
    id: string
    title: string
    company: string | null
    location: string | null
    description: string | null
    external_url: string | null
    employment_type: string | null
    remote_type: string | null
    salary_min: number | null
    salary_max: number | null
    posted_date: string | null
    created_at: string
    is_active: boolean
}

/**
 * User context for rule evaluation
 */
export interface UserContext {
    user_id: string
    tier: 'free' | 'pro' | 'premium' | 'coach'
    current_week_application_count: number
    total_applications: number
    has_resume: boolean
}

/**
 * Input to rule evaluation function
 */
export interface RuleEvaluationInput {
    rule: AutoApplyRule
    persona: UserPersona | null
    job: Job
    match: JobMatch
    now: Date
    userContext: UserContext
}

/**
 * Severity level for evaluation results
 */
export type EvaluationSeverity = 'info' | 'warn' | 'block'

/**
 * Output from rule evaluation function
 */
export interface RuleEvaluationResult {
    eligible: boolean
    reasons: string[]
    severity: EvaluationSeverity
    computed?: {
        match_score?: number
        current_week_count?: number
        active_day_matched?: boolean
        company_filter_matched?: boolean
        keywords_matched?: boolean
        safety_checks_passed?: boolean
    }
}

/**
 * Auto-Apply Log entry
 */
export interface AutoApplyLog {
    id?: string
    user_id: string
    rule_id: string | null
    job_id: string | null
    persona_id: string | null
    status: 'queued' | 'skipped' | 'submitted' | 'failed' | 'withdrawn'
    submission_url: string | null
    error_message: string | null
    created_at?: string
    withdrawn_at?: string | null
    trace_id?: string | null
    attempt_count?: number
    artifacts?: Record<string, unknown> | null
}
