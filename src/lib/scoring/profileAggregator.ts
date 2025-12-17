/**
 * ============================================================================
 * PROFILE AGGREGATOR
 * ============================================================================
 * Aggregates user data from all sources into a unified UserMatchProfile.
 * 
 * Data Sources:
 * - profiles table (basic info)
 * - career_profiles table (experience, skills, certifications)
 * - job_preferences table (titles, salary, location, keywords)
 * - user_personas + persona_preferences (if persona-based matching)
 * - resumes table (extracted skills)
 * ============================================================================
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserMatchProfile } from './types'

// ============================================================================
// TYPES
// ============================================================================

interface ProfileRow {
    id: string
    email?: string | null
    full_name?: string | null
}

interface CareerProfileRow {
    years_experience?: number | null
    current_title?: string | null
    skills?: string[] | null
    skills_primary?: string[] | null
    certifications?: string[] | null
}

interface JobPreferencesRow {
    primary_title?: string | null
    related_titles?: string[] | null
    seniority_levels?: string[] | null
    min_salary?: number | null
    remote_preference?: string | null
    preferred_locations?: string[] | null
    include_keywords?: string[] | null
    avoid_keywords?: string[] | null
    exclude_companies?: string[] | null
    exclude_titles?: string[] | null
}

interface PersonaPreferencesRow {
    job_title_keywords?: string[] | null
    min_salary?: number | null
    max_salary?: number | null
    required_skills?: string[] | null
    nice_to_have_skills?: string[] | null
    remote_preference?: string | null
    locations?: string[] | null
    industries?: string[] | null
    company_size?: string[] | null
    excluded_companies?: string[] | null
    mission_values?: string[] | null
    growth_focus?: string[] | null
}

interface ResumeRow {
    skills_extracted?: string[] | null
    parsed_text?: string | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely extract array or return empty array.
 */
function safeArray<T>(value: T[] | null | undefined): T[] {
    return value ?? []
}

/**
 * Merge arrays and dedupe.
 */
function mergeArrays<T>(...arrays: (T[] | null | undefined)[]): T[] {
    const merged = new Set<T>()
    for (const arr of arrays) {
        if (arr) {
            for (const item of arr) {
                merged.add(item)
            }
        }
    }
    return Array.from(merged)
}

/**
 * Extract keywords from resume text.
 */
function extractKeywordsFromResumeText(text: string | null): string[] {
    if (!text) return []

    // Simple keyword extraction - can be enhanced later
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    const wordCounts = new Map<string, number>()

    for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    }

    // Filter to words that appear multiple times (likely important)
    const significant = Array.from(wordCounts.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([word]) => word)

    return significant
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Create an empty/default profile when user data is not available.
 */
export function createEmptyProfile(userId: string, personaId?: string | null): UserMatchProfile {
    return {
        user_id: userId,
        persona_id: personaId ?? null,

        // From CareerProfile
        years_experience: null,
        current_title: null,
        skills: [],
        certifications: [],

        // From JobPreferences
        seniority_levels: [],
        primary_title: '',
        related_titles: [],
        min_salary: null,
        max_salary: null,
        remote_preference: 'any',
        preferred_locations: [],
        include_keywords: [],
        avoid_keywords: [],
        exclude_companies: [],
        exclude_titles: [],

        // From PersonaPreferences
        required_skills: [],
        nice_to_have_skills: [],
        industries: [],
        company_sizes: [],
        mission_values: [],
        growth_focus: [],

        // From Resume
        resume_skills: [],
        resume_keywords: [],
    }
}

/**
 * Aggregate user profile from all data sources.
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param personaId - Optional persona ID for persona-specific preferences
 * @returns Aggregated user profile
 */
export async function aggregateUserProfile(
    supabase: SupabaseClient,
    userId: string,
    personaId?: string | null
): Promise<UserMatchProfile> {
    const profile = createEmptyProfile(userId, personaId)

    // Load data in parallel
    const [
        careerProfileResult,
        jobPreferencesResult,
        resumeResult,
        personaPreferencesResult,
    ] = await Promise.all([
        // Career profile
        supabase
            .from('career_profiles')
            .select('years_experience, current_title, skills, skills_primary, certifications')
            .eq('user_id', userId)
            .maybeSingle(),

        // Job preferences
        supabase
            .from('job_preferences')
            .select('primary_title, related_titles, seniority_levels, min_salary, remote_preference, preferred_locations, include_keywords, avoid_keywords, exclude_companies, exclude_titles')
            .eq('user_id', userId)
            .maybeSingle(),

        // Primary resume
        supabase
            .from('resumes')
            .select('skills_extracted, parsed_text')
            .eq('user_id', userId)
            .eq('is_primary', true)
            .maybeSingle(),

        // Persona preferences (if persona provided)
        personaId
            ? supabase
                .from('persona_preferences')
                .select('job_title_keywords, min_salary, max_salary, required_skills, nice_to_have_skills, remote_preference, locations, industries, company_size, excluded_companies, mission_values, growth_focus')
                .eq('persona_id', personaId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
    ])

    // Process career profile
    if (careerProfileResult.data) {
        const cp = careerProfileResult.data as CareerProfileRow
        profile.years_experience = cp.years_experience ?? null
        profile.current_title = cp.current_title ?? null
        profile.skills = mergeArrays(cp.skills, cp.skills_primary)
        profile.certifications = safeArray(cp.certifications)
    }

    // Process job preferences
    if (jobPreferencesResult.data) {
        const jp = jobPreferencesResult.data as JobPreferencesRow
        profile.primary_title = jp.primary_title ?? ''
        profile.related_titles = safeArray(jp.related_titles)
        profile.seniority_levels = safeArray(jp.seniority_levels)
        profile.min_salary = jp.min_salary ?? null
        profile.remote_preference = jp.remote_preference ?? 'any'
        profile.preferred_locations = safeArray(jp.preferred_locations)
        profile.include_keywords = safeArray(jp.include_keywords)
        profile.avoid_keywords = safeArray(jp.avoid_keywords)
        profile.exclude_companies = safeArray(jp.exclude_companies)
        profile.exclude_titles = safeArray(jp.exclude_titles)
    }

    // Process resume
    if (resumeResult.data) {
        const resume = resumeResult.data as ResumeRow
        profile.resume_skills = safeArray(resume.skills_extracted)
        profile.resume_keywords = extractKeywordsFromResumeText(resume.parsed_text ?? null)
    }

    // Process persona preferences (override/merge with base preferences)
    if (personaPreferencesResult.data) {
        const pp = personaPreferencesResult.data as PersonaPreferencesRow

        // Persona can override certain preferences
        if (pp.min_salary !== undefined) profile.min_salary = pp.min_salary
        if (pp.max_salary !== undefined) profile.max_salary = pp.max_salary
        if (pp.remote_preference) profile.remote_preference = pp.remote_preference

        // Merge arrays
        profile.related_titles = mergeArrays(profile.related_titles, pp.job_title_keywords)
        profile.required_skills = safeArray(pp.required_skills)
        profile.nice_to_have_skills = safeArray(pp.nice_to_have_skills)
        profile.preferred_locations = mergeArrays(profile.preferred_locations, pp.locations)
        profile.industries = safeArray(pp.industries)
        profile.company_sizes = safeArray(pp.company_size)
        profile.exclude_companies = mergeArrays(profile.exclude_companies, pp.excluded_companies)
        profile.mission_values = safeArray(pp.mission_values)
        profile.growth_focus = safeArray(pp.growth_focus)
    }

    return profile
}
