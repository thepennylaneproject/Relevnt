/**
 * ============================================================================
 * SCORING ENGINE INDEX
 * ============================================================================
 * Main entry point for the ATS-aligned job matching scoring engine.
 * 
 * Usage:
 * ```typescript
 * import { scoreJob, scoreJobBatch, aggregateUserProfile, enrichJob } from '@/lib/scoring'
 * 
 * // Aggregate user profile from all data sources
 * const profile = await aggregateUserProfile(supabase, userId, personaId)
 * 
 * // Score a batch of jobs
 * const results = scoreJobBatch(jobs, profile, { minScore: 20 })
 * 
 * // Enrich a job with metadata (during ingestion)
 * const enrichment = enrichJob(job.title, job.description)
 * ```
 * ============================================================================
 */

// Types
export type {
    UserMatchProfile,
    EnhancedJobRow,
    ScoreBreakdown,
    MatchResult,
    MatchQuality,
    ScoringOptions,
    WeightConfig,
    FactorResult,
} from './types'

export { DEFAULT_WEIGHTS, MATCH_QUALITY_THRESHOLDS, MAX_SCORES } from './types'

// Core scoring engine
export { scoreJob, scoreJobBatch } from './scoringEngine'

// Profile aggregation
export { aggregateUserProfile, createEmptyProfile } from './profileAggregator'

// Job enrichment
export { enrichJob, type JobEnrichment } from './jobEnricher'

// Skill matching utilities
export {
    matchSkill,
    countSkillMatches,
    getCanonicalSkill,
    getCanonicalSkills,
    hasSkillOverlap,
    SKILL_ALIASES,
} from './skillMatcher'

// Seniority matching utilities
export {
    extractSeniorityFromTitle,
    extractSeniorityFromDescription,
    extractExperienceYears,
    extractExperienceRange,
    yearsToSeniorityLevel,
    seniorityToYears,
    matchSeniority,
    compareSeniority,
    SENIORITY_YEARS,
    SENIORITY_ORDER,
} from './seniorityMatcher'

// Individual scoring factors (for advanced customization)
export { scoreSkills } from './factors/skillsScore'
export { scoreExperience } from './factors/experienceScore'
export { scoreSalary } from './factors/salaryScore'
export { scoreLocation } from './factors/locationScore'
export { scoreTitle } from './factors/titleScore'
export { scoreIndustry, scoreCompanyAttributes } from './factors/industryScore'
export { scoreKeywords, scoreRecency, scoreCompetition } from './factors/bonusFactors'
