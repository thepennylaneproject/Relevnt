/**
 * =============================================================================
 * V2 SCHEMA TYPES
 * =============================================================================
 * Type definitions for V2 tables:
 * - job_matches (extended)
 * - auto_apply_rules, auto_apply_logs
 * - relevance_tuner_settings
 * - user_skills, learning_recommendations
 * - coach_client_relationships
 * =============================================================================
 */

// =============================================================================
// JOB MATCHES (V2 Extended)
// =============================================================================

/**
 * Match factors breakdown for scoring transparency
 */
export interface MatchFactors {
    skill_score?: number
    salary_score?: number
    location_score?: number
    remote_score?: number
    industry_score?: number
    [key: string]: number | undefined
}

/**
 * Job match linking a user's persona to a job with scoring details
 */
export interface JobMatch {
    id: string
    user_id: string
    persona_id?: string | null
    job_id: string
    match_score: number
    match_factors?: MatchFactors | null
    explanation?: string | null
    is_dismissed: boolean
    values_alignment?: number | null
    created_at: string
    expires_at?: string | null
}

// =============================================================================
// AUTO APPLY RULES
// =============================================================================

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

/**
 * Auto-apply rule configuration
 */
export interface AutoApplyRule {
    id: string
    user_id: string
    persona_id?: string | null
    name: string
    enabled: boolean
    match_score_threshold?: number | null
    max_applications_per_week: number
    exclude_companies?: string[] | null
    include_only_companies?: string[] | null
    require_all_keywords?: string[] | null
    active_days?: DayOfWeek[] | null
    created_at: string
    updated_at: string
}

/**
 * Input for creating an auto-apply rule
 */
export interface CreateAutoApplyRuleInput {
    name: string
    persona_id?: string | null
    enabled?: boolean
    match_score_threshold?: number | null
    max_applications_per_week?: number
    exclude_companies?: string[]
    include_only_companies?: string[]
    require_all_keywords?: string[]
    active_days?: DayOfWeek[]
}

/**
 * Input for updating an auto-apply rule
 */
export type UpdateAutoApplyRuleInput = Partial<CreateAutoApplyRuleInput>

// =============================================================================
// AUTO APPLY LOGS
// =============================================================================

export type AutoApplyStatus = 'submitted' | 'failed' | 'withdrawn'

/**
 * Log entry for an auto-apply submission
 */
export interface AutoApplyLog {
    id: string
    user_id: string
    rule_id?: string | null
    job_id?: string | null
    status?: AutoApplyStatus | null
    submission_url?: string | null
    error_message?: string | null
    created_at: string
    withdrawn_at?: string | null
}

// =============================================================================
// RELEVANCE TUNER SETTINGS
// =============================================================================

/**
 * Relevance scoring weight configuration
 */
export interface RelevanceTunerSettings {
    id: string
    user_id: string
    name: string
    skill_weight: number
    salary_weight: number
    location_weight: number
    remote_weight: number
    industry_weight: number
    is_default: boolean
    created_at: string
    updated_at: string
}

/**
 * Input for creating relevance tuner settings
 */
export interface CreateRelevanceTunerInput {
    name: string
    skill_weight?: number
    salary_weight?: number
    location_weight?: number
    remote_weight?: number
    industry_weight?: number
    is_default?: boolean
}

/**
 * Input for updating relevance tuner settings
 */
export type UpdateRelevanceTunerInput = Partial<CreateRelevanceTunerInput>

/**
 * Default relevance weights
 */
export const DEFAULT_RELEVANCE_WEIGHTS: Omit<RelevanceTunerSettings, 'id' | 'user_id' | 'name' | 'is_default' | 'created_at' | 'updated_at'> = {
    skill_weight: 0.3,
    salary_weight: 0.25,
    location_weight: 0.15,
    remote_weight: 0.2,
    industry_weight: 0.1,
}

// =============================================================================
// USER SKILLS
// =============================================================================

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type SkillSource = 'resume' | 'input' | 'inferred'

/**
 * User skill entry
 */
export interface UserSkill {
    id: string
    user_id: string
    skill_name: string
    proficiency_level?: ProficiencyLevel | null
    source?: SkillSource | null
    created_at: string
}

/**
 * Input for creating a user skill
 */
export interface CreateUserSkillInput {
    skill_name: string
    proficiency_level?: ProficiencyLevel
    source?: SkillSource
}

// =============================================================================
// LEARNING RECOMMENDATIONS
// =============================================================================

/**
 * Recommended course info
 */
export interface RecommendedCourse {
    name: string
    url?: string
    provider?: string
    duration?: string
}

/**
 * AI-generated learning recommendation
 */
export interface LearningRecommendation {
    id: string
    user_id: string
    persona_id?: string | null
    target_skill: string
    reason_text?: string | null
    recommended_courses?: RecommendedCourse[] | null
    estimated_duration_weeks?: number | null
    created_at: string
    expires_at?: string | null
}

// =============================================================================
// COACH CLIENT RELATIONSHIPS
// =============================================================================

export type RelationshipStatus = 'active' | 'paused' | 'ended'

/**
 * Coach-client relationship entry
 */
export interface CoachClientRelationship {
    id: string
    coach_id: string
    client_id: string
    status: RelationshipStatus
    notes?: string | null
    created_at: string
    updated_at: string
}

/**
 * Input for creating a coach-client relationship (coach only)
 */
export interface CreateCoachClientInput {
    client_id: string
    status?: RelationshipStatus
    notes?: string
}

/**
 * Input for updating a coach-client relationship (coach only)
 */
export interface UpdateCoachClientInput {
    status?: RelationshipStatus
    notes?: string
}
