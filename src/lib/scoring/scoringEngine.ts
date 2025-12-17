/**
 * ============================================================================
 * SCORING ENGINE
 * ============================================================================
 * Main scoring engine that combines all factors to produce a match score.
 * 
 * Scoring Model (0-100):
 * - Hard Requirements: 40 pts max
 *   - Required Skills: 0-25
 *   - Experience Level: 0-10
 *   - Location Compatibility: 0-5
 * - Preference Alignment: 35 pts max
 *   - Title Relevance: 0-15
 *   - Salary Fit: 0-10
 *   - Industry Fit: 0-5
 *   - Company Attributes: 0-5
 * - Bonus Factors: 25 pts max
 *   - Nice-to-Have Skills: 0-10
 *   - Keyword Density: 0-5
 *   - Recency: 0-5
 *   - Competition: 0-5
 * ============================================================================
 */

import type {
    UserMatchProfile,
    EnhancedJobRow,
    ScoreBreakdown,
    MatchResult,
    MatchQuality,
    ScoringOptions,
    FactorResult,
} from './types'
import { MATCH_QUALITY_THRESHOLDS, MAX_SCORES } from './types'

// Factor scoring functions
import { scoreSkills } from './factors/skillsScore'
import { scoreExperience } from './factors/experienceScore'
import { scoreSalary } from './factors/salaryScore'
import { scoreLocation } from './factors/locationScore'
import { scoreTitle } from './factors/titleScore'
import { scoreIndustry, scoreCompanyAttributes } from './factors/industryScore'
import { scoreKeywords, scoreRecency, scoreCompetition } from './factors/bonusFactors'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Determine match quality from total score.
 */
function getMatchQuality(score: number): MatchQuality {
    if (score >= MATCH_QUALITY_THRESHOLDS.excellent) return 'excellent'
    if (score >= MATCH_QUALITY_THRESHOLDS.good) return 'good'
    if (score >= MATCH_QUALITY_THRESHOLDS.fair) return 'fair'
    return 'poor'
}

/**
 * Collect top reasons from all factors.
 */
function collectTopReasons(breakdown: ScoreBreakdown, limit: number = 4): string[] {
    const allReasons: Array<{ reason: string; score: number }> = []

    const factors: Array<{ factor: FactorResult; weight: number }> = [
        { factor: breakdown.required_skills, weight: 3 },
        { factor: breakdown.experience_level, weight: 2 },
        { factor: breakdown.title_relevance, weight: 2 },
        { factor: breakdown.salary_fit, weight: 2 },
        { factor: breakdown.location_compatibility, weight: 1 },
        { factor: breakdown.industry_fit, weight: 1 },
        { factor: breakdown.nice_to_have_skills, weight: 1 },
        { factor: breakdown.recency, weight: 1 },
    ]

    for (const { factor, weight } of factors) {
        for (const reason of factor.reasons) {
            if (reason.trim()) {
                allReasons.push({ reason, score: factor.score * weight })
            }
        }
    }

    // Sort by importance (score * weight) and take top N
    allReasons.sort((a, b) => b.score - a.score)

    return allReasons.slice(0, limit).map(r => r.reason)
}

/**
 * Collect warnings from factors.
 */
function collectWarnings(breakdown: ScoreBreakdown): string[] {
    const warnings: string[] = []

    const factors = [
        breakdown.required_skills,
        breakdown.experience_level,
        breakdown.salary_fit,
        breakdown.location_compatibility,
    ]

    for (const factor of factors) {
        for (const reason of factor.reasons) {
            if (reason.startsWith('⚠️')) {
                warnings.push(reason)
            }
        }
    }

    return warnings
}

/**
 * Combine user skills from all sources.
 */
function combineUserSkills(profile: UserMatchProfile): string[] {
    const allSkills = new Set<string>()

    for (const skill of profile.skills) allSkills.add(skill)
    for (const skill of profile.required_skills) allSkills.add(skill)
    for (const skill of profile.nice_to_have_skills) allSkills.add(skill)
    for (const skill of profile.resume_skills) allSkills.add(skill)

    return Array.from(allSkills)
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Score a single job against a user profile.
 * 
 * @param job - Enhanced job data
 * @param profile - Aggregated user profile
 * @param options - Scoring options
 * @returns Match result with score breakdown
 */
export function scoreJob(
    job: EnhancedJobRow,
    profile: UserMatchProfile,
    options?: ScoringOptions
): MatchResult {
    const description = job.description || ''
    const allUserSkills = combineUserSkills(profile)

    // ===== HARD REQUIREMENTS (40 pts) =====

    // Skills (required: 0-25, nice-to-have: 0-10)
    const skillsResult = scoreSkills(
        allUserSkills,
        job.required_skills,
        job.preferred_skills,
        description
    )

    // Experience level (0-10)
    const experienceResult = scoreExperience(
        profile.years_experience,
        profile.seniority_levels,
        job.seniority_level,
        job.experience_years_min,
        job.experience_years_max
    )

    // Location compatibility (0-5)
    const locationResult = scoreLocation(
        profile.remote_preference,
        profile.preferred_locations,
        job.remote_type,
        job.location
    )

    // ===== PREFERENCE ALIGNMENT (35 pts) =====

    // Title relevance (0-15)
    const titleResult = scoreTitle(
        profile.primary_title,
        profile.related_titles,
        job.title
    )

    // Salary fit (0-10)
    const salaryResult = scoreSalary(
        profile.min_salary,
        profile.max_salary,
        job.salary_min,
        job.salary_max
    )

    // Industry fit (0-5)
    const industryResult = scoreIndustry(
        profile.industries,
        job.industry,
        job.company,
        description
    )

    // Company attributes (0-5)
    const companyResult = scoreCompanyAttributes(
        profile.company_sizes,
        profile.mission_values,
        job.company_size,
        description
    )

    // ===== BONUS FACTORS (25 pts) =====

    // Keyword density (0-5)
    const keywordResult = scoreKeywords(
        profile.include_keywords,
        profile.avoid_keywords,
        description
    )

    // Recency (0-5)
    const recencyResult = scoreRecency(job.posted_date)

    // Competition (0-5)
    const competitionResult = scoreCompetition(job.competitiveness_level)

    // ===== BUILD BREAKDOWN =====

    const breakdown: ScoreBreakdown = {
        // Hard Requirements
        required_skills: skillsResult.required,
        experience_level: experienceResult,
        location_compatibility: locationResult,

        // Preference Alignment
        title_relevance: titleResult,
        salary_fit: salaryResult,
        industry_fit: industryResult,
        company_attributes: companyResult,

        // Bonus Factors
        nice_to_have_skills: skillsResult.niceToHave,
        keyword_density: keywordResult,
        recency: recencyResult,
        competition: competitionResult,
    }

    // ===== CALCULATE TOTAL SCORE =====

    const hardRequirements =
        breakdown.required_skills.score +
        breakdown.experience_level.score +
        breakdown.location_compatibility.score

    const preferenceAlignment =
        breakdown.title_relevance.score +
        breakdown.salary_fit.score +
        breakdown.industry_fit.score +
        breakdown.company_attributes.score

    const bonusFactors =
        breakdown.nice_to_have_skills.score +
        breakdown.keyword_density.score +
        breakdown.recency.score +
        breakdown.competition.score

    const totalScore = Math.min(
        MAX_SCORES.total,
        hardRequirements + preferenceAlignment + bonusFactors
    )

    // ===== BUILD RESULT =====

    const result: MatchResult = {
        job_id: job.id,
        total_score: Math.round(totalScore),
        score_breakdown: breakdown,
        match_quality: getMatchQuality(totalScore),
        top_reasons: collectTopReasons(breakdown),
        warnings: collectWarnings(breakdown),
        skill_gaps: options?.includeSkillGaps ? skillsResult.gaps : [],
    }

    return result
}

/**
 * Score a batch of jobs against a user profile.
 * 
 * @param jobs - Array of enhanced jobs
 * @param profile - Aggregated user profile
 * @param options - Scoring options
 * @returns Array of match results, sorted by score descending
 */
export function scoreJobBatch(
    jobs: EnhancedJobRow[],
    profile: UserMatchProfile,
    options?: ScoringOptions
): MatchResult[] {
    const minScore = options?.minScore ?? 0

    const results: MatchResult[] = []

    for (const job of jobs) {
        // Skip excluded companies
        if (profile.exclude_companies.length > 0 && job.company) {
            const isExcluded = profile.exclude_companies.some(exc =>
                job.company!.toLowerCase().includes(exc.toLowerCase())
            )
            if (isExcluded) continue
        }

        // Skip excluded titles
        if (profile.exclude_titles.length > 0) {
            const isExcluded = profile.exclude_titles.some(exc =>
                job.title.toLowerCase().includes(exc.toLowerCase())
            )
            if (isExcluded) continue
        }

        const result = scoreJob(job, profile, options)

        if (result.total_score >= minScore) {
            results.push(result)
        }
    }

    // Sort by score descending
    results.sort((a, b) => b.total_score - a.total_score)

    return results
}
