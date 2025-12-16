// netlify/functions/auto_apply/rules.ts
// Deterministic rule evaluation engine for Auto-Apply system
// NO AI CALLS - Pure TypeScript logic only

import type {
    RuleEvaluationInput,
    RuleEvaluationResult,
    EvaluationSeverity,
    AutoApplyRule,
    Job,
    UserContext,
    UserPersona,
} from './types'

/**
 * Main rule evaluation function
 * Evaluates whether a job should be queued for auto-apply based on rule criteria
 * 
 * @returns Result with eligible flag, reasons array, and severity level
 */
export function evaluateRule(input: RuleEvaluationInput): RuleEvaluationResult {
    const reasons: string[] = []
    const blocks: string[] = []
    const warnings: string[] = []
    const infos: string[] = []

    const computed: RuleEvaluationResult['computed'] = {}

    // 1. Safety Gates (BLOCKING)
    const safetyResult = checkSafetyGates(input.persona, input.job)
    if (!safetyResult.passed) {
        blocks.push(...safetyResult.reasons)
        computed.safety_checks_passed = false
    } else {
        computed.safety_checks_passed = true
    }

    // 2. Match Score Threshold
    const scoreResult = checkMatchScoreThreshold(input.rule, input.match.match_score)
    computed.match_score = input.match.match_score
    if (!scoreResult.passed) {
        blocks.push(...scoreResult.reasons)
    } else {
        infos.push(...scoreResult.reasons)
    }

    // 3. Weekly Cap
    const capResult = checkWeeklyCap(input.rule, input.userContext)
    computed.current_week_count = input.userContext.current_week_application_count
    if (!capResult.passed) {
        blocks.push(...capResult.reasons)
    } else if (capResult.reasons.length > 0) {
        infos.push(...capResult.reasons)
    }

    // 4. Active Days
    const activeDayResult = checkActiveDays(input.rule, input.now)
    computed.active_day_matched = activeDayResult.passed
    if (!activeDayResult.passed) {
        warnings.push(...activeDayResult.reasons)
    } else if (activeDayResult.reasons.length > 0) {
        infos.push(...activeDayResult.reasons)
    }

    // 5. Company Filters
    const companyResult = checkCompanyFilters(input.rule, input.job)
    computed.company_filter_matched = companyResult.passed
    if (!companyResult.passed) {
        warnings.push(...companyResult.reasons)
    } else if (companyResult.reasons.length > 0) {
        infos.push(...companyResult.reasons)
    }

    // 6. Keyword Requirements
    const keywordResult = checkKeywordRequirements(input.rule, input.job)
    computed.keywords_matched = keywordResult.passed
    if (!keywordResult.passed) {
        warnings.push(...keywordResult.reasons)
    } else if (keywordResult.reasons.length > 0) {
        infos.push(...keywordResult.reasons)
    }

    // 7. Persona Compatibility (optional, soft check)
    const personaResult = checkPersonaCompatibility(input.persona, input.job)
    if (personaResult.reasons.length > 0) {
        infos.push(...personaResult.reasons)
    }

    // Determine overall eligibility and severity
    const hasBlocks = blocks.length > 0
    const hasWarnings = warnings.length > 0

    let severity: EvaluationSeverity = 'info'
    if (hasBlocks) {
        severity = 'block'
    } else if (hasWarnings) {
        severity = 'warn'
    }

    // Eligible only if no blocks
    const eligible = !hasBlocks

    // Combine all reasons
    reasons.push(...blocks, ...warnings, ...infos)

    return {
        eligible,
        reasons,
        severity,
        computed,
    }
}

/**
 * Check safety gates: resume exists, job URL present
 */
function checkSafetyGates(
    persona: UserPersona | null,
    job: Job
): { passed: boolean; reasons: string[] } {
    const reasons: string[] = []

    // Must have persona with resume
    if (!persona) {
        reasons.push('BLOCK: No persona specified for this rule')
        return { passed: false, reasons }
    }

    if (!persona.resume_id) {
        reasons.push('BLOCK: Persona does not have a resume attached (resume_id is null)')
        return { passed: false, reasons }
    }

    // Must have valid job URL
    if (!job.external_url || job.external_url.trim() === '') {
        reasons.push('BLOCK: Job does not have a valid application URL (external_url is missing)')
        return { passed: false, reasons }
    }

    return { passed: true, reasons: [] }
}

/**
 * Check match score against threshold
 */
function checkMatchScoreThreshold(
    rule: AutoApplyRule,
    matchScore: number
): { passed: boolean; reasons: string[] } {
    const reasons: string[] = []

    if (rule.match_score_threshold == null) {
        // No threshold set, pass by default
        return { passed: true, reasons: ['No match score threshold configured'] }
    }

    if (matchScore >= rule.match_score_threshold) {
        reasons.push(`Match score ${matchScore} meets threshold ${rule.match_score_threshold}`)
        return { passed: true, reasons }
    }

    reasons.push(
        `BLOCK: Match score ${matchScore} below threshold ${rule.match_score_threshold}`
    )
    return { passed: false, reasons }
}

/**
 * Check weekly application cap
 */
function checkWeeklyCap(
    rule: AutoApplyRule,
    userContext: UserContext
): { passed: boolean; reasons: string[] } {
    const reasons: string[] = []

    if (rule.max_applications_per_week == null) {
        // No cap set, pass by default
        return { passed: true, reasons: ['No weekly cap configured'] }
    }

    const currentCount = userContext.current_week_application_count
    const maxCap = rule.max_applications_per_week

    if (currentCount >= maxCap) {
        reasons.push(
            `BLOCK: Weekly cap reached (${currentCount}/${maxCap})`
        )
        return { passed: false, reasons }
    }

    reasons.push(`Weekly applications: ${currentCount}/${maxCap}`)
    return { passed: true, reasons }
}

/**
 * Check if current day is in active days
 */
function checkActiveDays(
    rule: AutoApplyRule,
    now: Date
): { passed: boolean; reasons: string[] } {
    const reasons: string[] = []

    if (!rule.active_days || rule.active_days.length === 0) {
        // No restriction, all days active
        return { passed: true, reasons: ['All days active (no active_days restriction)'] }
    }

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const currentDay = dayNames[now.getDay()]

    const activeDaysLower = rule.active_days.map((d) => d.toLowerCase())

    if (activeDaysLower.includes(currentDay)) {
        reasons.push(`Current day (${currentDay}) is in active days`)
        return { passed: true, reasons }
    }

    reasons.push(
        `WARN: Current day (${currentDay}) not in active days [${rule.active_days.join(', ')}]`
    )
    return { passed: false, reasons }
}

/**
 * Check company include/exclude filters
 */
function checkCompanyFilters(
    rule: AutoApplyRule,
    job: Job
): { passed: boolean; reasons: string[] } {
    const reasons: string[] = []

    const company = (job.company || '').toLowerCase().trim()

    if (!company) {
        // No company info, can't filter
        return { passed: true, reasons: ['Job has no company info, skipping company filters'] }
    }

    // Check exclude list first (takes precedence)
    if (rule.exclude_companies && rule.exclude_companies.length > 0) {
        const excludeLower = rule.exclude_companies.map((c) => c.toLowerCase().trim())
        const isExcluded = excludeLower.some((excluded) => company.includes(excluded))

        if (isExcluded) {
            reasons.push(`WARN: Company "${job.company}" is in exclude list`)
            return { passed: false, reasons }
        }
    }

    // Check include list (if present, must match)
    if (rule.include_only_companies && rule.include_only_companies.length > 0) {
        const includeLower = rule.include_only_companies.map((c) => c.toLowerCase().trim())
        const isIncluded = includeLower.some((included) => company.includes(included))

        if (!isIncluded) {
            reasons.push(
                `WARN: Company "${job.company}" not in include_only list [${rule.include_only_companies.join(', ')}]`
            )
            return { passed: false, reasons }
        }

        reasons.push(`Company "${job.company}" matches include_only filter`)
        return { passed: true, reasons }
    }

    // No filters or passed all checks
    reasons.push('Company filters passed')
    return { passed: true, reasons }
}

/**
 * Check keyword requirements in job title + description
 */
function checkKeywordRequirements(
    rule: AutoApplyRule,
    job: Job
): { passed: boolean; reasons: string[] } {
    const reasons: string[] = []

    if (!rule.require_all_keywords || rule.require_all_keywords.length === 0) {
        // No keyword requirements
        return { passed: true, reasons: ['No keyword requirements configured'] }
    }

    const title = (job.title || '').toLowerCase()
    const description = (job.description || '').toLowerCase()
    const fullText = `${title} ${description}`

    const missingKeywords: string[] = []

    for (const keyword of rule.require_all_keywords) {
        const keywordLower = keyword.toLowerCase().trim()
        if (!fullText.includes(keywordLower)) {
            missingKeywords.push(keyword)
        }
    }

    if (missingKeywords.length > 0) {
        reasons.push(
            `WARN: Missing required keywords: ${missingKeywords.join(', ')}`
        )
        return { passed: false, reasons }
    }

    reasons.push(
        `All required keywords found: ${rule.require_all_keywords.join(', ')}`
    )
    return { passed: true, reasons }
}

/**
 * Optional: Check persona preference compatibility
 * This is a soft check for informational purposes
 */
function checkPersonaCompatibility(
    persona: UserPersona | null,
    job: Job
): { reasons: string[] } {
    const reasons: string[] = []

    if (!persona) {
        return { reasons }
    }

    // Could add persona-specific checks here if needed
    // For now, just informational
    reasons.push(`Using persona: ${persona.name}`)

    return { reasons }
}
