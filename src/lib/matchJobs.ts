/**
 * =============================================================================
 * PERSONA-AWARE JOB MATCHING ENGINE
 * =============================================================================
 * 
 * Matches jobs against persona preferences and generates explainable scores.
 * 
 * Scoring breakdown (0-100):
 * - Skills: 0-35 (required skills: 25, nice-to-have: 10)
 * - Salary: 0-20
 * - Remote: 0-15
 * - Location: 0-15
 * - Industry: 0-10
 * - Title: 0-15
 * 
 * =============================================================================
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import type { UserPersona, PersonaPreferences } from '../types/v2-personas'
import type { WeightConfig } from '../types/v2-schema'
import { DEFAULT_RELEVANCE_WEIGHTS } from '../types/v2-schema'

// =============================================================================
// TYPES
// =============================================================================

export interface MatchFactors {
    skill_score: number
    salary_score: number
    location_score: number
    remote_score: number
    industry_score: number
    title_score: number
}

export interface JobDetails {
    id: string
    title: string
    company: string | null
    location: string | null
    industry: string | null
    company_size: string | null
    employment_type: string | null
    remote_type: string | null
    source_slug: string | null
    external_url: string | null
    posted_date: string | null
    created_at: string | null
    salary_min: number | null
    salary_max: number | null
    competitiveness_level: string | null
    description: string | null
    keywords: string[] | null
}

export interface MatchedJob {
    job_id: string
    match_score: number
    match_factors: MatchFactors
    explanation: string
    job: JobDetails
}

type DbJob = Database['public']['Tables']['jobs']['Row']

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize string for case-insensitive comparison
 */
function normalize(str: string | null | undefined): string {
    return (str || '').toLowerCase().trim()
}

/**
 * Extract keywords from text (simple tokenization)
 */
function extractKeywords(text: string | null): string[] {
    if (!text) return []
    return text
        .toLowerCase()
        .split(/[\s,;.]+/)
        .map(s => s.trim())
        .filter(s => s.length > 2)
}

/**
 * Check if arrays have any overlap
 */
function hasOverlap(arr1: string[], arr2: string[]): boolean {
    const set1 = new Set(arr1.map(normalize))
    return arr2.some(item => set1.has(normalize(item)))
}

/**
 * Count overlapping items between two arrays
 */
function countOverlap(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1.map(normalize))
    return arr2.filter(item => set1.has(normalize(item))).length
}

/**
 * Clamp score to valid range
 */
function clamp(value: number, min: number = 0, max: number = 100): number {
    return Math.max(min, Math.min(max, value))
}

/**
 * Normalize weights to sum to 1.0
 */
function normalizeWeights(weights: WeightConfig): WeightConfig {
    const sum = weights.skill_weight + weights.salary_weight + weights.location_weight + weights.remote_weight + weights.industry_weight

    if (sum === 0) {
        return DEFAULT_RELEVANCE_WEIGHTS
    }

    return {
        skill_weight: weights.skill_weight / sum,
        salary_weight: weights.salary_weight / sum,
        location_weight: weights.location_weight / sum,
        remote_weight: weights.remote_weight / sum,
        industry_weight: weights.industry_weight / sum,
    }
}

/**
 * Calculate weighted score from individual factor scores
 * Factors have different max values, so we normalize them first
 */
function calculateWeightedScore(
    factors: MatchFactors,
    weights: WeightConfig
): number {
    // Normalize weights to sum to 1.0
    const normalizedWeights = normalizeWeights(weights)

    // Normalize factor scores to 0-1 range based on their max values
    const normalizedSkill = factors.skill_score / 35      // skill max: 35
    const normalizedSalary = factors.salary_score / 20    // salary max: 20
    const normalizedRemote = factors.remote_score / 15    // remote max: 15
    const normalizedLocation = factors.location_score / 15 // location max: 15
    const normalizedIndustry = factors.industry_score / 10 // industry max: 10
    const normalizedTitle = factors.title_score / 15      // title max: 15

    // Apply weights (excluding title which doesn't have a dedicated weight)
    // Title score is distributed proportionally across other factors
    const weightedScore = (
        normalizedSkill * normalizedWeights.skill_weight +
        normalizedSalary * normalizedWeights.salary_weight +
        normalizedRemote * normalizedWeights.remote_weight +
        normalizedLocation * normalizedWeights.location_weight +
        normalizedIndustry * normalizedWeights.industry_weight
    )

    // Add title bonus (up to 10 points)
    const titleBonus = normalizedTitle * 10

    // Scale to 0-100 range (weighted portion is 90 points, title is 10 points)
    return clamp((weightedScore * 90) + titleBonus, 0, 100)
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Score skills match (0-35)
 * - Required skills: 25 points max
 * - Nice-to-have skills: 10 points max
 */
function scoreSkills(
    job: DbJob,
    prefs: PersonaPreferences
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    // Job skills from keywords or description
    const jobKeywords = job.keywords || []
    const jobDescription = job.description || ''
    const jobSkills = [...jobKeywords, ...extractKeywords(jobDescription)]

    // Required skills
    const requiredSkills = prefs.required_skills || []
    if (requiredSkills.length > 0) {
        const matchedRequired = requiredSkills.filter(skill =>
            jobSkills.some(jk => normalize(jk).includes(normalize(skill)))
        )

        if (matchedRequired.length === 0) {
            // Missing all required skills - heavy penalty
            reasons.push('⚠️ Missing required skills')
            return { score: 0, reasons }
        }

        const requiredScore = Math.min(25, (matchedRequired.length / requiredSkills.length) * 25)
        score += requiredScore

        if (matchedRequired.length === requiredSkills.length) {
            reasons.push(`✓ Has all ${requiredSkills.length} required skills`)
        } else {
            reasons.push(`✓ Has ${matchedRequired.length}/${requiredSkills.length} required skills`)
        }
    }

    // Nice-to-have skills
    const niceToHaveSkills = prefs.nice_to_have_skills || []
    if (niceToHaveSkills.length > 0) {
        const matchedNice = niceToHaveSkills.filter(skill =>
            jobSkills.some(jk => normalize(jk).includes(normalize(skill)))
        )

        if (matchedNice.length > 0) {
            const niceScore = Math.min(10, matchedNice.length * 2)
            score += niceScore
            reasons.push(`+ ${matchedNice.length} bonus skill${matchedNice.length > 1 ? 's' : ''}`)
        }
    }

    return { score: clamp(score, 0, 35), reasons }
}

/**
 * Score salary fit (0-20)
 */
function scoreSalary(
    job: DbJob,
    prefs: PersonaPreferences
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    const minSalary = prefs.min_salary
    const maxSalary = prefs.max_salary
    const jobMin = job.salary_min
    const jobMax = job.salary_max

    if (!jobMin && !jobMax) {
        // No salary info available
        return { score: 5, reasons: ['Salary not specified'] }
    }

    const jobSalary = jobMax || jobMin || 0

    if (minSalary && jobSalary < minSalary) {
        score = 5
        reasons.push(`Salary $${(jobSalary / 1000).toFixed(0)}k below your minimum`)
    } else if (maxSalary && jobSalary > maxSalary) {
        score = 15
        reasons.push(`✓ Salary $${(jobSalary / 1000).toFixed(0)}k exceeds your target`)
    } else if (minSalary && maxSalary && jobSalary >= minSalary && jobSalary <= maxSalary) {
        score = 20
        reasons.push(`✓ Salary $${(jobSalary / 1000).toFixed(0)}k fits your range perfectly`)
    } else if (minSalary && jobSalary >= minSalary) {
        score = 18
        reasons.push(`✓ Salary $${(jobSalary / 1000).toFixed(0)}k meets your minimum`)
    } else {
        score = 10
    }

    return { score: clamp(score, 0, 20), reasons }
}

/**
 * Score remote preference match (0-15)
 */
function scoreRemote(
    job: DbJob,
    prefs: PersonaPreferences
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    const preference = prefs.remote_preference
    const jobRemoteType = normalize(job.remote_type)

    if (!preference || preference === 'any') {
        return { score: 8, reasons: ['No remote preference set'] }
    }

    const pref = normalize(preference)

    if (pref === jobRemoteType) {
        // Perfect match
        score = 15
        reasons.push(`✓ ${preference.charAt(0).toUpperCase() + preference.slice(1)} role matches preference`)
    } else if (pref === 'remote' && jobRemoteType === 'hybrid') {
        // Compatible
        score = 10
        reasons.push('Hybrid role (you prefer remote)')
    } else if (pref === 'hybrid' && (jobRemoteType === 'remote' || jobRemoteType === 'onsite')) {
        score = 8
        reasons.push(`${job.remote_type} role (you prefer hybrid)`)
    } else if (pref === 'onsite' && jobRemoteType === 'hybrid') {
        score = 8
        reasons.push('Hybrid role (you prefer onsite)')
    } else {
        score = 3
        reasons.push(`${job.remote_type || 'Unknown'} role (doesn't match preference)`)
    }

    return { score: clamp(score, 0, 15), reasons }
}

/**
 * Score location match (0-15)
 */
function scoreLocation(
    job: DbJob,
    prefs: PersonaPreferences
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    const preferredLocations = prefs.locations || []
    const jobLocation = normalize(job.location)

    if (preferredLocations.length === 0) {
        return { score: 8, reasons: ['No location preference set'] }
    }

    if (!jobLocation) {
        return { score: 5, reasons: ['Job location not specified'] }
    }

    // Check for exact or partial match
    const exactMatch = preferredLocations.find(loc =>
        jobLocation.includes(normalize(loc))
    )

    if (exactMatch) {
        score = 15
        reasons.push(`✓ Located in ${exactMatch}`)
    } else {
        // Check for state/country match
        const partialMatch = preferredLocations.some(loc => {
            const locParts = normalize(loc).split(/[\s,]+/)
            return locParts.some(part => jobLocation.includes(part) && part.length > 2)
        })

        if (partialMatch) {
            score = 10
            reasons.push('Location partially matches preferences')
        } else {
            score = 3
            reasons.push(`Located in ${job.location}`)
        }
    }

    return { score: clamp(score, 0, 15), reasons }
}

/**
 * Score industry match (0-10)
 */
function scoreIndustry(
    job: DbJob,
    prefs: PersonaPreferences
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    const preferredIndustries = prefs.industries || []
    if (preferredIndustries.length === 0) {
        return { score: 5, reasons: [] }
    }

    const jobText = normalize(`${job.company} ${job.description}`)

    const matchedIndustries = preferredIndustries.filter(industry =>
        jobText.includes(normalize(industry))
    )

    if (matchedIndustries.length > 0) {
        score = Math.min(10, matchedIndustries.length * 5)
        reasons.push(`✓ ${matchedIndustries[0]} industry`)
    } else {
        score = 3
    }

    return { score: clamp(score, 0, 10), reasons }
}

/**
 * Score job title match (0-15)
 */
function scoreTitle(
    job: DbJob,
    prefs: PersonaPreferences
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    const titleKeywords = prefs.job_title_keywords || []
    if (titleKeywords.length === 0) {
        return { score: 8, reasons: [] }
    }

    const jobTitle = normalize(job.title)

    const matchedKeywords = titleKeywords.filter(keyword =>
        jobTitle.includes(normalize(keyword))
    )

    if (matchedKeywords.length > 0) {
        score = Math.min(15, matchedKeywords.length * 8)
        reasons.push(`✓ Title matches "${matchedKeywords[0]}"`)
    } else {
        score = 3
    }

    return { score: clamp(score, 0, 15), reasons }
}

// =============================================================================
// EXPLANATION GENERATOR
// =============================================================================

/**
 * Generate human-readable explanation from scoring factors
 */
function generateExplanation(
    factors: MatchFactors,
    allReasons: string[]
): string {
    const parts: string[] = []

    // Filter out empty reasons and format
    const meaningfulReasons = allReasons.filter(r => r.trim().length > 0)

    if (meaningfulReasons.length === 0) {
        return 'This job partially matches your preferences.'
    }

    // Take top 3-4 most important reasons
    const topReasons = meaningfulReasons.slice(0, 4)

    return topReasons.join('. ') + '.'
}

// =============================================================================
// MAIN MATCHING FUNCTION
// =============================================================================

/**
 * Match jobs for a specific persona
 */
export async function matchJobsForPersona(
    supabase: SupabaseClient<Database>,
    userId: string,
    personaId: string,
    options?: {
        minScore?: number
        limit?: number
        offset?: number
        weightConfig?: WeightConfig
    }
): Promise<MatchedJob[]> {
    const minScore = options?.minScore ?? 0
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    const weights = options?.weightConfig || DEFAULT_RELEVANCE_WEIGHTS

    // 1. Load persona and preferences
    const { data: persona, error: personaError } = await supabase
        .from('user_personas')
        .select(`
      *,
      persona_preferences (*)
    `)
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()

    if (personaError || !persona) {
        throw new Error('Persona not found or access denied')
    }

    const preferences = (persona as any).persona_preferences?.[0] as PersonaPreferences | null

    if (!preferences) {
        throw new Error('Persona preferences not found')
    }

    // 2. Load active jobs
    const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false })
        .limit(500) // Process more jobs, filter later

    if (jobsError) {
        throw new Error(`Failed to load jobs: ${jobsError.message}`)
    }

    if (!jobs || jobs.length === 0) {
        return []
    }

    // 3. Score each job
    const matches: MatchedJob[] = []

    for (const job of jobs) {
        // Check excluded companies
        const excludedCompanies = preferences.excluded_companies || []
        if (excludedCompanies.length > 0 && job.company) {
            const isExcluded = excludedCompanies.some(exc =>
                normalize(job.company).includes(normalize(exc))
            )
            if (isExcluded) continue
        }

        // Score individual factors
        const skillResult = scoreSkills(job, preferences)
        const salaryResult = scoreSalary(job, preferences)
        const remoteResult = scoreRemote(job, preferences)
        const locationResult = scoreLocation(job, preferences)
        const industryResult = scoreIndustry(job, preferences)
        const titleResult = scoreTitle(job, preferences)

        const factors: MatchFactors = {
            skill_score: skillResult.score,
            salary_score: salaryResult.score,
            remote_score: remoteResult.score,
            location_score: locationResult.score,
            industry_score: industryResult.score,
            title_score: titleResult.score,
        }

        // Calculate weighted score using custom or default weights
        const totalScore = calculateWeightedScore(factors, weights)

        // Filter by minimum score
        if (totalScore < minScore) continue

        // Combine all reasons
        const allReasons = [
            ...skillResult.reasons,
            ...salaryResult.reasons,
            ...remoteResult.reasons,
            ...locationResult.reasons,
            ...industryResult.reasons,
            ...titleResult.reasons,
        ]

        const explanation = generateExplanation(factors, allReasons)

        matches.push({
            job_id: job.id,
            match_score: clamp(totalScore, 0, 100),
            match_factors: factors,
            explanation,
            job: {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                industry: job.industry,
                company_size: job.company_size,
                employment_type: job.employment_type,
                remote_type: job.remote_type,
                source_slug: job.source_slug,
                external_url: job.external_url,
                posted_date: job.posted_date,
                created_at: job.created_at,
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                competitiveness_level: job.competitiveness_level,
                description: job.description,
                keywords: job.keywords,
            },
        })
    }

    // 4. Sort by score (descending) and apply pagination
    matches.sort((a, b) => b.match_score - a.match_score)

    return matches.slice(offset, offset + limit)
}
