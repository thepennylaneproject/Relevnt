/**
 * ============================================================================
 * JOB ENRICHER
 * ============================================================================
 * Extracts structured metadata from job titles and descriptions.
 * 
 * Features:
 * - Seniority level extraction
 * - Experience years extraction
 * - Required vs preferred skills separation
 * - Education level detection
 * - Industry inference
 * ============================================================================
 */

import type { SeniorityLevel, EducationLevel } from '../../shared/types'
import {
    extractSeniorityFromTitle,
    extractSeniorityFromDescription,
    extractExperienceYears,
    extractExperienceRange,
} from './seniorityMatcher'

// ============================================================================
// TYPES
// ============================================================================

export interface JobEnrichment {
    seniority_level: SeniorityLevel | null
    experience_years_min: number | null
    experience_years_max: number | null
    required_skills: string[]
    preferred_skills: string[]
    education_level: EducationLevel | null
    industry: string | null
}

// ============================================================================
// PATTERNS
// ============================================================================

/**
 * Patterns to identify required skills sections.
 */
const REQUIRED_SKILLS_PATTERNS = [
    /required\s*(?:skills?|qualifications?|experience)?:?\s*([^]*?)(?=preferred|nice[- ]to[- ]have|bonus|what we offer|$)/i,
    /must[- ]have:?\s*([^]*?)(?=nice[- ]to[- ]have|preferred|bonus|$)/i,
    /requirements?:?\s*([^]*?)(?=preferred|nice[- ]to[- ]have|benefits|$)/i,
    /what you['']ll need:?\s*([^]*?)(?=nice[- ]to[- ]have|bonus|$)/i,
]

/**
 * Patterns to identify preferred skills sections.
 */
const PREFERRED_SKILLS_PATTERNS = [
    /preferred\s*(?:skills?|qualifications?)?:?\s*([^]*?)(?=what we offer|benefits|$)/i,
    /nice[- ]to[- ]have:?\s*([^]*?)(?=what we offer|benefits|$)/i,
    /bonus\s*(?:points?|skills?)?:?\s*([^]*?)(?=what we offer|benefits|$)/i,
    /ideally[, ]+you['']?(?:ll)?(?:have)?:?\s*([^]*?)(?=what we offer|$)/i,
]

/**
 * Education level patterns.
 */
const EDUCATION_PATTERNS: Array<{ level: EducationLevel; patterns: RegExp[] }> = [
    {
        level: 'phd',
        patterns: [/\b(ph\.?d\.?|doctorate|doctoral)\b/i],
    },
    {
        level: 'master',
        patterns: [/\b(master'?s?|m\.?s\.?|m\.?a\.?|mba|m\.?eng\.?)\b(?:\s+degree)?/i],
    },
    {
        level: 'bachelor',
        patterns: [
            /\b(bachelor'?s?|b\.?s\.?|b\.?a\.?|b\.?eng\.?|undergraduate)\b(?:\s+degree)?/i,
            /\b(4[- ]year|four[- ]year)\s+degree\b/i,
            /\bdegree\s+in\s+(computer science|engineering|business)/i,
        ],
    },
    {
        level: 'associate',
        patterns: [/\b(associate'?s?|a\.?s\.?|a\.?a\.?|2[- ]year)\b(?:\s+degree)?/i],
    },
    {
        level: 'high_school',
        patterns: [/\b(high school|ged|secondary education)\b/i],
    },
]

/**
 * Industry detection patterns.
 */
const INDUSTRY_PATTERNS: Array<{ industry: string; patterns: RegExp[] }> = [
    {
        industry: 'tech',
        patterns: [/\b(software|saas|technology|tech company|it services|cloud|platform)\b/i],
    },
    {
        industry: 'finance',
        patterns: [/\b(financial|banking|investment|trading|fintech|insurance|wealth management)\b/i],
    },
    {
        industry: 'healthcare',
        patterns: [/\b(healthcare|medical|hospital|clinical|pharmaceutical|biotech|health tech)\b/i],
    },
    {
        industry: 'retail',
        patterns: [/\b(retail|e-?commerce|consumer|shopping|marketplace)\b/i],
    },
    {
        industry: 'education',
        patterns: [/\b(education|edtech|university|school|learning|academic)\b/i],
    },
    {
        industry: 'media',
        patterns: [/\b(media|entertainment|publishing|content|news|advertising|creative agency)\b/i],
    },
    {
        industry: 'consulting',
        patterns: [/\b(consulting|professional services|advisory|management consulting)\b/i],
    },
]

/**
 * Common technical skill patterns to extract.
 */
const SKILL_EXTRACTION_PATTERNS = [
    // Programming languages
    /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin|scala|r)\b/gi,
    // Frameworks
    /\b(react|angular|vue|node\.?js|django|flask|spring|rails|laravel|express|next\.?js)\b/gi,
    // Databases
    /\b(postgresql|mysql|mongodb|redis|elasticsearch|dynamodb|cassandra|sqlite)\b/gi,
    // Cloud
    /\b(aws|azure|gcp|google cloud|amazon web services|heroku|vercel|netlify)\b/gi,
    // DevOps
    /\b(docker|kubernetes|k8s|terraform|ansible|jenkins|github actions|ci\/cd)\b/gi,
    // Data/ML
    /\b(machine learning|ml|ai|tensorflow|pytorch|pandas|spark|kafka|airflow|tableau|power bi)\b/gi,
]

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract skills from a text blob.
 */
function extractSkillsFromText(text: string): string[] {
    const skills = new Set<string>()

    for (const pattern of SKILL_EXTRACTION_PATTERNS) {
        const matches = text.matchAll(pattern)
        for (const match of matches) {
            skills.add(match[0].toLowerCase())
        }
    }

    return Array.from(skills)
}

/**
 * Extract skills from a specific section of the description.
 */
function extractSkillsFromSection(description: string, patterns: RegExp[]): string[] {
    for (const pattern of patterns) {
        const match = description.match(pattern)
        if (match && match[1]) {
            return extractSkillsFromText(match[1])
        }
    }
    return []
}

/**
 * Extract education level from description.
 */
function extractEducationLevel(description: string): EducationLevel | null {
    for (const { level, patterns } of EDUCATION_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern.test(description)) {
                return level
            }
        }
    }
    return null
}

/**
 * Infer industry from description.
 */
function inferIndustry(description: string): string | null {
    for (const { industry, patterns } of INDUSTRY_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern.test(description)) {
                return industry
            }
        }
    }
    return null
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Enrich a job with structured metadata extracted from title and description.
 * 
 * @param title - Job title
 * @param description - Job description
 * @returns Enrichment data
 */
export function enrichJob(title: string, description: string): JobEnrichment {
    const result: JobEnrichment = {
        seniority_level: null,
        experience_years_min: null,
        experience_years_max: null,
        required_skills: [],
        preferred_skills: [],
        education_level: null,
        industry: null,
    }

    // Extract seniority level
    result.seniority_level = extractSeniorityFromTitle(title) ?? extractSeniorityFromDescription(description)

    // Extract experience years
    const expRange = extractExperienceRange(description)
    if (expRange) {
        result.experience_years_min = expRange.min
        result.experience_years_max = expRange.max
    } else {
        const years = extractExperienceYears(description)
        if (years !== null) {
            result.experience_years_min = years
        }
    }

    // Extract required skills
    result.required_skills = extractSkillsFromSection(description, REQUIRED_SKILLS_PATTERNS)

    // Extract preferred skills
    result.preferred_skills = extractSkillsFromSection(description, PREFERRED_SKILLS_PATTERNS)

    // If no structured extraction, try to extract all skills from description
    if (result.required_skills.length === 0 && result.preferred_skills.length === 0) {
        const allSkills = extractSkillsFromText(description)
        // Put all in required if we can't distinguish
        result.required_skills = allSkills
    }

    // Extract education level
    result.education_level = extractEducationLevel(description)

    // Infer industry
    result.industry = inferIndustry(description)

    return result
}
