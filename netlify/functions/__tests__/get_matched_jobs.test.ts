/**
 * =============================================================================
 * TESTS: GET MATCHED JOBS API ENDPOINT
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { matchJobsForPersona } from '../../../src/lib/matchJobs'
import type { PersonaPreferences } from '../../../src/types/v2-personas'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockUserId = 'user-123'
const mockPersonaId = 'persona-456'

const mockPersona = {
    id: mockPersonaId,
    user_id: mockUserId,
    name: 'Senior Engineer',
    description: 'Looking for senior engineering roles',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
}

const mockPreferences: PersonaPreferences = {
    id: 'pref-789',
    persona_id: mockPersonaId,
    job_title_keywords: ['engineer', 'developer'],
    min_salary: 100000,
    max_salary: 150000,
    required_skills: ['React', 'TypeScript'],
    nice_to_have_skills: ['Node.js', 'GraphQL'],
    remote_preference: 'remote',
    locations: ['San Francisco', 'New York'],
    industries: ['Technology', 'SaaS'],
    company_size: ['startup', 'mid-size'],
    excluded_companies: ['BadCorp'],
    mission_values: [],
    growth_focus: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
}

const mockJobs = [
    // High match job
    {
        id: 'job-1',
        title: 'Senior React Engineer',
        company: 'GoodCorp',
        location: 'San Francisco, CA',
        employment_type: 'Full-time',
        remote_type: 'remote',
        source_slug: 'test',
        external_url: 'https://example.com/job1',
        posted_date: '2024-01-05',
        created_at: '2024-01-05T00:00:00Z',
        salary_min: 120000,
        salary_max: 150000,
        competitiveness_level: 'moderate',
        description: 'We are looking for a React and TypeScript expert. Node.js experience is a plus.',
        keywords: ['React', 'TypeScript', 'Node.js'],
        is_active: true,
        dedup_key: null,
        external_id: null,
        external_job_id: null,
        external_source: null,
        extracted_structure: null,
        is_official: null,
        job_type: null,
        normalized_company: null,
        normalized_location: null,
        normalized_title: null,
        original_posting_url: null,
        probability_estimate: null,
        ranking_score: null,
        raw: null,
        raw_payload: null,
        requirements: null,
        responsibilities: null,
        salary_range: null,
        saved_date: null,
        source: null,
        source_id: null,
        source_url: null,
        status: null,
        updated_at: null,
        url: null,
        user_id: null,
        benefits: null,
        company_logo_url: null,
        match_reasons: null,
        match_score: null,
    },
    // Missing required skills - should be filtered or low score
    {
        id: 'job-2',
        title: 'Python Developer',
        company: 'OtherCorp',
        location: 'Remote',
        employment_type: 'Full-time',
        remote_type: 'remote',
        source_slug: 'test',
        external_url: 'https://example.com/job2',
        posted_date: '2024-01-04',
        created_at: '2024-01-04T00:00:00Z',
        salary_min: 130000,
        salary_max: 160000,
        competitiveness_level: 'low',
        description: 'Python, Django, PostgreSQL',
        keywords: ['Python', 'Django', 'PostgreSQL'],
        is_active: true,
        dedup_key: null,
        external_id: null,
        external_job_id: null,
        external_source: null,
        extracted_structure: null,
        is_official: null,
        job_type: null,
        normalized_company: null,
        normalized_location: null,
        normalized_title: null,
        original_posting_url: null,
        probability_estimate: null,
        ranking_score: null,
        raw: null,
        raw_payload: null,
        requirements: null,
        responsibilities: null,
        salary_range: null,
        saved_date: null,
        source: null,
        source_id: null,
        source_url: null,
        status: null,
        updated_at: null,
        url: null,
        user_id: null,
        benefits: null,
        company_logo_url: null,
        match_reasons: null,
        match_score: null,
    },
    // Excluded company - should be filtered
    {
        id: 'job-3',
        title: 'Senior TypeScript Developer',
        company: 'BadCorp',
        location: 'New York, NY',
        employment_type: 'Full-time',
        remote_type: 'remote',
        source_slug: 'test',
        external_url: 'https://example.com/job3',
        posted_date: '2024-01-06',
        created_at: '2024-01-06T00:00:00Z',
        salary_min: 140000,
        salary_max: 170000,
        competitiveness_level: 'moderate',
        description: 'React, TypeScript, GraphQL',
        keywords: ['React', 'TypeScript', 'GraphQL'],
        is_active: true,
        dedup_key: null,
        external_id: null,
        external_job_id: null,
        external_source: null,
        extracted_structure: null,
        is_official: null,
        job_type: null,
        normalized_company: null,
        normalized_location: null,
        normalized_title: null,
        original_posting_url: null,
        probability_estimate: null,
        ranking_score: null,
        raw: null,
        raw_payload: null,
        requirements: null,
        responsibilities: null,
        salary_range: null,
        saved_date: null,
        source: null,
        source_id: null,
        source_url: null,
        status: null,
        updated_at: null,
        url: null,
        user_id: null,
        benefits: null,
        company_logo_url: null,
        match_reasons: null,
        match_score: null,
    },
    // Good match but onsite
    {
        id: 'job-4',
        title: 'Frontend Engineer',
        company: 'LocalCorp',
        location: 'San Francisco, CA',
        employment_type: 'Full-time',
        remote_type: 'onsite',
        source_slug: 'test',
        external_url: 'https://example.com/job4',
        posted_date: '2024-01-03',
        created_at: '2024-01-03T00:00:00Z',
        salary_min: 110000,
        salary_max: 140000,
        competitiveness_level: 'moderate',
        description: 'React and TypeScript required',
        keywords: ['React', 'TypeScript'],
        is_active: true,
        dedup_key: null,
        external_id: null,
        external_job_id: null,
        external_source: null,
        extracted_structure: null,
        is_official: null,
        job_type: null,
        normalized_company: null,
        normalized_location: null,
        normalized_title: null,
        original_posting_url: null,
        probability_estimate: null,
        ranking_score: null,
        raw: null,
        raw_payload: null,
        requirements: null,
        responsibilities: null,
        salary_range: null,
        saved_date: null,
        source: null,
        source_id: null,
        source_url: null,
        status: null,
        updated_at: null,
        url: null,
        user_id: null,
        benefits: null,
        company_logo_url: null,
        match_reasons: null,
        match_score: null,
    },
]

// =============================================================================
// MOCK SUPABASE CLIENT
// =============================================================================

function createMockSupabase(): SupabaseClient {
    return {
        from: (table: string) => {
            if (table === 'user_personas') {
                return {
                    select: () => ({
                        eq: (col: string, val: any) => ({
                            eq: (col2: string, val2: any) => ({
                                single: async () => ({
                                    data: {
                                        ...mockPersona,
                                        persona_preferences: [mockPreferences],
                                    },
                                    error: null,
                                }),
                            }),
                        }),
                    }),
                }
            }
            if (table === 'jobs') {
                return {
                    select: () => ({
                        eq: () => ({
                            order: () => ({
                                limit: async () => ({
                                    data: mockJobs,
                                    error: null,
                                }),
                            }),
                        }),
                    }),
                }
            }
            return {} as any
        },
    } as any
}

// =============================================================================
// TESTS
// =============================================================================

describe('matchJobsForPersona', () => {
    let mockSupabase: SupabaseClient

    beforeEach(() => {
        mockSupabase = createMockSupabase()
    })

    it('should return matched jobs sorted by score', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        expect(matches).toBeDefined()
        expect(Array.isArray(matches)).toBe(true)
        expect(matches.length).toBeGreaterThan(0)

        // Should be sorted by score descending
        for (let i = 0; i < matches.length - 1; i++) {
            expect(matches[i].match_score).toBeGreaterThanOrEqual(matches[i + 1].match_score)
        }
    })

    it('should score job with required skills higher', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        const job1 = matches.find(m => m.job_id === 'job-1') // Has React + TypeScript
        const job2 = matches.find(m => m.job_id === 'job-2') // Has Python (no required skills)

        expect(job1).toBeDefined()

        if (job1 && job2) {
            expect(job1.match_score).toBeGreaterThan(job2.match_score)
            expect(job1.match_factors.skill_score).toBeGreaterThan(job2.match_factors.skill_score)
        }
    })

    it('should exclude jobs from excluded companies', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        const badCorpJob = matches.find(m => m.job_id === 'job-3')
        expect(badCorpJob).toBeUndefined()
    })

    it('should score remote jobs higher for remote preference', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        const remoteJob = matches.find(m => m.job_id === 'job-1')
        const onsiteJob = matches.find(m => m.job_id === 'job-4')

        if (remoteJob && onsiteJob) {
            expect(remoteJob.match_factors.remote_score).toBeGreaterThan(onsiteJob.match_factors.remote_score)
        }
    })

    it('should score salary within range higher', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        const job1 = matches.find(m => m.job_id === 'job-1') // $120k-$150k (in range)

        expect(job1).toBeDefined()
        if (job1) {
            expect(job1.match_factors.salary_score).toBeGreaterThan(10)
        }
    })

    it('should generate explanations for all matches', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        for (const match of matches) {
            expect(match.explanation).toBeDefined()
            expect(typeof match.explanation).toBe('string')
            expect(match.explanation.length).toBeGreaterThan(0)
        }
    })

    it('should include match factors breakdown', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId)

        for (const match of matches) {
            expect(match.match_factors).toBeDefined()
            expect(typeof match.match_factors.skill_score).toBe('number')
            expect(typeof match.match_factors.salary_score).toBe('number')
            expect(typeof match.match_factors.remote_score).toBe('number')
            expect(typeof match.match_factors.location_score).toBe('number')
            expect(typeof match.match_factors.industry_score).toBe('number')
            expect(typeof match.match_factors.title_score).toBe('number')
        }
    })

    it('should filter by minimum score', async () => {
        const matches = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId, {
            minScore: 50,
        })

        for (const match of matches) {
            expect(match.match_score).toBeGreaterThanOrEqual(50)
        }
    })

    it('should apply limit and offset', async () => {
        const matches1 = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId, {
            limit: 2,
        })
        expect(matches1.length).toBeLessThanOrEqual(2)

        const matches2 = await matchJobsForPersona(mockSupabase, mockUserId, mockPersonaId, {
            offset: 1,
            limit: 2,
        })
        expect(matches2.length).toBeLessThanOrEqual(2)

        // Offset should skip first result
        if (matches1.length > 0 && matches2.length > 0) {
            expect(matches2[0].job_id).not.toBe(matches1[0].job_id)
        }
    })

    it('should throw error if persona not found', async () => {
        const badSupabase = {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            single: async () => ({
                                data: null,
                                error: { message: 'Not found' },
                            }),
                        }),
                    }),
                }),
            }),
        } as any

        await expect(
            matchJobsForPersona(badSupabase, mockUserId, 'invalid-id')
        ).rejects.toThrow()
    })

    it('should handle jobs without salary info', async () => {
        const noSalaryJob = {
            ...mockJobs[0],
            id: 'job-no-salary',
            salary_min: null,
            salary_max: null,
        }

        const customSupabase = {
            from: (table: string) => {
                if (table === 'user_personas') {
                    return {
                        select: () => ({
                            eq: (col: string, val: any) => ({
                                eq: (col2: string, val2: any) => ({
                                    single: async () => ({
                                        data: {
                                            ...mockPersona,
                                            persona_preferences: [mockPreferences],
                                        },
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    }
                }
                if (table === 'jobs') {
                    return {
                        select: () => ({
                            eq: () => ({
                                order: () => ({
                                    limit: async () => ({
                                        data: [noSalaryJob],
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    }
                }
                return {} as any
            },
        } as any

        const matches = await matchJobsForPersona(customSupabase, mockUserId, mockPersonaId)

        const match = matches.find(m => m.job_id === 'job-no-salary')
        expect(match).toBeDefined()
        if (match) {
            expect(match.match_factors.salary_score).toBeGreaterThanOrEqual(0)
        }
    })
})
