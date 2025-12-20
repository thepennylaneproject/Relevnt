/**
 * ============================================================================
 * SCORING ENGINE TYPES
 * ============================================================================
 * Type definitions for the ATS-aligned job matching scoring engine.
 * 
 * Scoring Model (0-100):
 * - Hard Requirements: 40 pts max (skills: 25, experience: 10, location: 5)
 * - Preference Alignment: 35 pts max (title: 15, salary: 10, industry: 5, company: 5)
 * - Bonus Factors: 25 pts max (nice-to-have: 10, keywords: 5, recency: 5, competition: 5)
 * ============================================================================
 */

import type { SeniorityLevel, EducationLevel, CompanySize } from '../../shared/types'

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

/**
 * Aggregated user profile from all data sources.
 * This is the unified input for scoring.
 */
export interface UserMatchProfile {
    // Identity
    user_id: string
    persona_id?: string | null

    // From CareerProfile
    years_experience: number | null
    current_title: string | null
    skills: string[]
    certifications: string[]

    // From JobPreferences
    seniority_levels: string[]
    primary_title: string
    related_titles: string[]
    min_salary: number | null
    max_salary: number | null
    remote_preference: string  // 'remote' | 'hybrid' | 'onsite' | 'any'
    preferred_locations: string[]
    include_keywords: string[]
    avoid_keywords: string[]
    exclude_companies: string[]
    exclude_titles: string[]

    // From PersonaPreferences (if persona-based)
    required_skills: string[]
    nice_to_have_skills: string[]
    industries: string[]
    company_sizes: string[]
    mission_values: string[]
    growth_focus: string[]

    // From Resume
    resume_skills: string[]
    resume_keywords: string[]
}

// ============================================================================
// JOB TYPES
// ============================================================================

/**
 * Enhanced job row with ATS fields for scoring.
 */
export interface EnhancedJobRow {
    id: string
    title: string
    company: string | null
    location: string | null
    employment_type: string | null
    remote_type: string | null
    source_slug: string | null
    external_url: string | null
    posted_date: string | null
    created_at: string
    salary_min: number | null
    salary_max: number | null
    competitiveness_level: string | null
    description: string | null
    keywords: string[] | null

    // ATS-aligned fields
    seniority_level: SeniorityLevel | string | null
    experience_years_min: number | null
    experience_years_max: number | null
    required_skills: string[] | null
    preferred_skills: string[] | null
    education_level: EducationLevel | string | null
    industry: string | null
    company_size: CompanySize | string | null
    probability_estimate?: number | null
    growth_score?: number | null
    hiring_momentum?: number | null
}

// ============================================================================
// SCORE BREAKDOWN
// ============================================================================

/**
 * Individual scoring factor result.
 */
export interface FactorResult {
    score: number
    maxScore: number
    reasons: string[]
}

/**
 * Detailed breakdown of all scoring factors.
 */
export interface ScoreBreakdown {
    // Hard Requirements (40 pts max)
    required_skills: FactorResult      // 0-25
    experience_level: FactorResult     // 0-10
    location_compatibility: FactorResult // 0-5

    // Preference Alignment (35 pts max)
    title_relevance: FactorResult      // 0-15
    salary_fit: FactorResult           // 0-10
    industry_fit: FactorResult         // 0-5
    company_attributes: FactorResult   // 0-5

    // Bonus Factors (25 pts max)
    nice_to_have_skills: FactorResult  // 0-10
    keyword_density: FactorResult      // 0-5
    recency: FactorResult              // 0-5
    competition: FactorResult          // 0-5
}

/**
 * Match quality classification based on score.
 */
export type MatchQuality = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * Final match result for a job.
 */
export interface MatchResult {
    job_id: string
    total_score: number
    score_breakdown: ScoreBreakdown
    match_quality: MatchQuality
    top_reasons: string[]
    warnings: string[]
    skill_gaps: string[]
}

// ============================================================================
// SCORING OPTIONS
// ============================================================================

/**
 * Weight configuration for scoring factors.
 * Values should sum to 1.0 for normalized weighting.
 */
export interface WeightConfig {
    skill_weight: number
    salary_weight: number
    location_weight: number
    remote_weight: number
    industry_weight: number
    experience_weight: number
    title_weight: number
}

/**
 * Default weights for scoring.
 */
export const DEFAULT_WEIGHTS: WeightConfig = {
    skill_weight: 0.25,
    salary_weight: 0.15,
    location_weight: 0.10,
    remote_weight: 0.15,
    industry_weight: 0.10,
    experience_weight: 0.15,
    title_weight: 0.10,
}

/**
 * Scoring engine options.
 */
export interface ScoringOptions {
    weights?: Partial<WeightConfig>
    minScore?: number
    includeSkillGaps?: boolean
    includeDebugInfo?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Score thresholds for match quality classification.
 */
export const MATCH_QUALITY_THRESHOLDS = {
    excellent: 80,  // 80-100
    good: 60,       // 60-79
    fair: 40,       // 40-59
    poor: 0,        // 0-39
} as const

/**
 * Max scores for each factor category.
 */
export const MAX_SCORES = {
    // Hard Requirements
    required_skills: 25,
    experience_level: 10,
    location_compatibility: 5,

    // Preference Alignment
    title_relevance: 15,
    salary_fit: 10,
    industry_fit: 5,
    company_attributes: 5,

    // Bonus Factors
    nice_to_have_skills: 10,
    keyword_density: 5,
    recency: 5,
    competition: 5,

    // Totals
    hard_requirements: 40,
    preference_alignment: 35,
    bonus_factors: 25,
    total: 100,
} as const
