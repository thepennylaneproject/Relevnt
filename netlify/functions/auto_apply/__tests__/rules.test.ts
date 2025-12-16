/**
 * Unit tests for auto-apply rule evaluation engine
 * Tests all rule checks: safety gates, match score, weekly cap, active days, company filters, keywords
 * 
 * Run with: npm test -- rules.test.ts
 */

import { describe, test, expect } from 'vitest'
import { evaluateRule } from '../rules'
import type {
    RuleEvaluationInput,
    AutoApplyRule,
    UserPersona,
    Job,
    JobMatch,
    UserContext,
} from '../types'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockRule: AutoApplyRule = {
    id: 'rule-123',
    user_id: 'user-123',
    persona_id: 'persona-123',
    name: 'Test Rule',
    enabled: true,
    match_score_threshold: 70,
    max_applications_per_week: 10,
    exclude_companies: [],
    include_only_companies: null,
    require_all_keywords: null,
    active_days: null,
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
}

const mockPersona: UserPersona = {
    id: 'persona-123',
    user_id: 'user-123',
    name: 'Frontend Developer',
    description: 'React/TypeScript focus',
    is_active: true,
    resume_id: 'resume-123',
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
}

const mockJob: Job = {
    id: 'job-123',
    title: 'Senior Frontend Engineer',
    company: 'Tech Corp',
    location: 'Remote',
    description: 'Build amazing React applications with TypeScript',
    external_url: 'https://example.com/apply',
    employment_type: 'full-time',
    remote_type: 'remote',
    salary_min: 120000,
    salary_max: 160000,
    posted_date: '2024-12-10T00:00:00Z',
    created_at: '2024-12-10T00:00:00Z',
    is_active: true,
}

const mockMatch: JobMatch = {
    id: 'match-123',
    user_id: 'user-123',
    job_id: 'job-123',
    persona_id: 'persona-123',
    match_score: 85,
    match_factors: {},
    explanation: 'Strong match',
    is_dismissed: false,
    created_at: '2024-12-10T00:00:00Z',
    expires_at: '2024-12-17T00:00:00Z',
}

const mockUserContext: UserContext = {
    user_id: 'user-123',
    tier: 'pro',
    current_week_application_count: 3,
    total_applications: 25,
    has_resume: true,
}

// =============================================================================
// SAFETY GATES TESTS
// =============================================================================

describe('Safety Gates', () => {
    test('should BLOCK if persona has no resume_id', () => {
        const personaWithoutResume: UserPersona = {
            ...mockPersona,
            resume_id: null,
        }

        const input: RuleEvaluationInput = {
            rule: mockRule,
            persona: personaWithoutResume,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(false)
        expect(result.severity).toBe('block')
        expect(result.reasons).toContain('BLOCK: Persona does not have a resume attached (resume_id is null)')
    })

    test('should BLOCK if job has no external_url', () => {
        const jobWithoutUrl: Job = {
            ...mockJob,
            external_url: null,
        }

        const input: RuleEvaluationInput = {
            rule: mockRule,
            persona: mockPersona,
            job: jobWithoutUrl,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(false)
        expect(result.severity).toBe('block')
        expect(result.reasons).toContain('BLOCK: Job does not have a valid application URL (external_url is missing)')
    })

    test('should BLOCK if persona is null', () => {
        const input: RuleEvaluationInput = {
            rule: mockRule,
            persona: null,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(false)
        expect(result.severity).toBe('block')
        expect(result.reasons).toContain('BLOCK: No persona specified for this rule')
    })

    test('should pass safety gates with valid persona and job', () => {
        const input: RuleEvaluationInput = {
            rule: mockRule,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.computed?.safety_checks_passed).toBe(true)
    })
})

// =============================================================================
// MATCH SCORE THRESHOLD TESTS
// =============================================================================

describe('Match Score Threshold', () => {
    test('should BLOCK if match score below threshold', () => {
        const lowScoreMatch: JobMatch = {
            ...mockMatch,
            match_score: 50,
        }

        const input: RuleEvaluationInput = {
            rule: mockRule, // threshold is 70
            persona: mockPersona,
            job: mockJob,
            match: lowScoreMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(false)
        expect(result.severity).toBe('block')
        expect(result.reasons.some(r => r.includes('below threshold'))).toBe(true)
    })

    test('should pass if match score meets threshold', () => {
        const input: RuleEvaluationInput = {
            rule: mockRule, // threshold is 70
            persona: mockPersona,
            job: mockJob,
            match: mockMatch, // score is 85
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.computed?.match_score).toBe(85)
    })

    test('should pass if no threshold configured', () => {
        const ruleWithoutThreshold: AutoApplyRule = {
            ...mockRule,
            match_score_threshold: null,
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithoutThreshold,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
    })
})

// =============================================================================
// WEEKLY CAP TESTS
// =============================================================================

describe('Weekly Application Cap', () => {
    test('should BLOCK if weekly cap reached', () => {
        const contextAtCap: UserContext = {
            ...mockUserContext,
            current_week_application_count: 10, // equals max_applications_per_week
        }

        const input: RuleEvaluationInput = {
            rule: mockRule, // max_applications_per_week is 10
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: contextAtCap,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(false)
        expect(result.severity).toBe('block')
        expect(result.reasons.some(r => r.includes('Weekly cap reached'))).toBe(true)
    })

    test('should pass if under weekly cap', () => {
        const input: RuleEvaluationInput = {
            rule: mockRule, // max is 10
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext, // current is 3
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.computed?.current_week_count).toBe(3)
    })

    test('should pass if no weekly cap configured', () => {
        const ruleWithoutCap: AutoApplyRule = {
            ...mockRule,
            max_applications_per_week: null,
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithoutCap,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
    })
})

// =============================================================================
// ACTIVE DAYS TESTS
// =============================================================================

describe('Active Days', () => {
    test('should WARN if current day not in active days', () => {
        const thursdayRule: AutoApplyRule = {
            ...mockRule,
            active_days: ['mon', 'tue', 'wed', 'thu', 'fri'], // weekdays only
        }

        const saturdayDate = new Date('2024-12-14T12:00:00Z') // Saturday

        const input: RuleEvaluationInput = {
            rule: thursdayRule,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: saturdayDate,
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        // Should still be eligible (warn, not block) but with warning
        expect(result.eligible).toBe(true)
        expect(result.severity).toBe('warn')
        expect(result.reasons.some(r => r.includes('not in active days'))).toBe(true)
    })

    test('should pass if current day in active days', () => {
        const weekdayRule: AutoApplyRule = {
            ...mockRule,
            active_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        }

        const thursdayDate = new Date('2024-12-12T12:00:00Z') // Thursday

        const input: RuleEvaluationInput = {
            rule: weekdayRule,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: thursdayDate,
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.computed?.active_day_matched).toBe(true)
    })

    test('should pass if no active days configured (all days active)', () => {
        const ruleWithoutActiveDays: AutoApplyRule = {
            ...mockRule,
            active_days: null,
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithoutActiveDays,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-14T12:00:00Z'), // Saturday
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
    })
})

// =============================================================================
// COMPANY FILTERS TESTS
// =============================================================================

describe('Company Filters', () => {
    test('should WARN if company in exclude list', () => {
        const ruleWithExcludes: AutoApplyRule = {
            ...mockRule,
            exclude_companies: ['Tech Corp', 'BadCo'],
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithExcludes,
            persona: mockPersona,
            job: mockJob, // company is "Tech Corp"
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true) // warns but doesn't block
        expect(result.severity).toBe('warn')
        expect(result.reasons.some(r => r.includes('in exclude list'))).toBe(true)
    })

    test('should WARN if company not in include_only list', () => {
        const ruleWithIncludes: AutoApplyRule = {
            ...mockRule,
            include_only_companies: ['GoodCo', 'BestCo'],
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithIncludes,
            persona: mockPersona,
            job: mockJob, // company is "Tech Corp", not in list
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true) // warns but doesn't block
        expect(result.severity).toBe('warn')
        expect(result.reasons.some(r => r.includes('not in include_only list'))).toBe(true)
    })

    test('should pass if company in include_only list', () => {
        const ruleWithIncludes: AutoApplyRule = {
            ...mockRule,
            include_only_companies: ['Tech Corp', 'Another Corp'],
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithIncludes,
            persona: mockPersona,
            job: mockJob, // company is "Tech Corp"
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.computed?.company_filter_matched).toBe(true)
    })

    test('should pass if no company filters configured', () => {
        const ruleWithoutFilters: AutoApplyRule = {
            ...mockRule,
            exclude_companies: null,
            include_only_companies: null,
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithoutFilters,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
    })
})

// =============================================================================
// KEYWORD REQUIREMENTS TESTS
// =============================================================================

describe('Keyword Requirements', () => {
    test('should WARN if required keywords missing', () => {
        const ruleWithKeywords: AutoApplyRule = {
            ...mockRule,
            require_all_keywords: ['React', 'TypeScript', 'GraphQL'],
        }

        const jobWithoutGraphQL: Job = {
            ...mockJob,
            description: 'Build amazing React applications with TypeScript', // no GraphQL
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithKeywords,
            persona: mockPersona,
            job: jobWithoutGraphQL,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true) // warns but doesn't block
        expect(result.severity).toBe('warn')
        expect(result.reasons.some(r => r.includes('Missing required keywords'))).toBe(true)
        expect(result.reasons.some(r => r.includes('GraphQL'))).toBe(true)
    })

    test('should pass if all required keywords present', () => {
        const ruleWithKeywords: AutoApplyRule = {
            ...mockRule,
            require_all_keywords: ['React', 'TypeScript'],
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithKeywords,
            persona: mockPersona,
            job: mockJob, // has React and TypeScript in description
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.computed?.keywords_matched).toBe(true)
    })

    test('should be case-insensitive for keyword matching', () => {
        const ruleWithKeywords: AutoApplyRule = {
            ...mockRule,
            require_all_keywords: ['REACT', 'typescript'],
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithKeywords,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
    })

    test('should check both title and description for keywords', () => {
        const ruleWithKeywords: AutoApplyRule = {
            ...mockRule,
            require_all_keywords: ['Frontend'],
        }

        const jobWithKeywordInTitle: Job = {
            ...mockJob,
            title: 'Senior Frontend Engineer',
            description: 'Work on backend systems', // keyword only in title
        }

        const input: RuleEvaluationInput = {
            rule: ruleWithKeywords,
            persona: mockPersona,
            job: jobWithKeywordInTitle,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.computed?.keywords_matched).toBe(true)
    })
})

// =============================================================================
// INTEGRATION / COMBINED TESTS
// =============================================================================

describe('Combined Rule Evaluation', () => {
    test('should be eligible if all checks pass', () => {
        const strictRule: AutoApplyRule = {
            ...mockRule,
            match_score_threshold: 70,
            max_applications_per_week: 10,
            active_days: ['thu', 'fri'],
            exclude_companies: ['BadCo'],
            require_all_keywords: ['React'],
        }

        const input: RuleEvaluationInput = {
            rule: strictRule,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch, // score 85
            now: new Date('2024-12-12T12:00:00Z'), // Thursday
            userContext: mockUserContext, // 3 applications this week
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(true)
        expect(result.severity).toBe('info')
    })

    test('should not be eligible if any blocking check fails', () => {
        const strictRule: AutoApplyRule = {
            ...mockRule,
            match_score_threshold: 90, // score is 85, will fail
        }

        const input: RuleEvaluationInput = {
            rule: strictRule,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.eligible).toBe(false)
        expect(result.severity).toBe('block')
    })

    test('should return computed metrics for all checks', () => {
        const input: RuleEvaluationInput = {
            rule: mockRule,
            persona: mockPersona,
            job: mockJob,
            match: mockMatch,
            now: new Date('2024-12-12T12:00:00Z'),
            userContext: mockUserContext,
        }

        const result = evaluateRule(input)

        expect(result.computed).toBeDefined()
        expect(result.computed?.safety_checks_passed).toBeDefined()
        expect(result.computed?.match_score).toBe(85)
        expect(result.computed?.current_week_count).toBe(3)
    })
})
