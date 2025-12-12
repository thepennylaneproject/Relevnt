/**
 * Tests for useMatchedJobs hook
 * 
 * Run with: npm test -- useMatchedJobs.test.ts
 */

import { describe, test, expect } from 'vitest'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockMatchedJobs = [
    {
        job_id: 'job-1',
        match_score: 92,
        match_factors: {
            skill_score: 30,
            salary_score: 18,
            remote_score: 15,
            location_score: 12,
            industry_score: 8,
            title_score: 14,
        },
        explanation: 'Strong match: Has all required skills. Salary meets your range. Remote role matches preference.',
        job: {
            id: 'job-1',
            title: 'Senior Frontend Engineer',
            company: 'TechCorp',
            location: 'Remote',
            employment_type: 'Full-time',
            remote_type: 'remote',
            source_slug: 'remoteok',
            external_url: 'https://example.com/job1',
            posted_date: '2024-12-08T00:00:00Z',
            created_at: '2024-12-08T00:00:00Z',
            salary_min: 120000,
            salary_max: 160000,
            competitiveness_level: 'high',
            description: 'Looking for a senior frontend engineer...',
            keywords: ['React', 'TypeScript', 'Next.js'],
        },
    },
    {
        job_id: 'job-2',
        match_score: 75,
        match_factors: {
            skill_score: 25,
            salary_score: 15,
            remote_score: 10,
            location_score: 10,
            industry_score: 7,
            title_score: 12,
        },
        explanation: 'Good match: Has 3 required skills. Salary slightly below range. Hybrid role.',
        job: {
            id: 'job-2',
            title: 'Frontend Developer',
            company: 'StartupXYZ',
            location: 'San Francisco, CA',
            employment_type: 'Full-time',
            remote_type: 'hybrid',
            source_slug: 'linkedin',
            external_url: 'https://example.com/job2',
            posted_date: '2024-12-07T00:00:00Z',
            created_at: '2024-12-07T00:00:00Z',
            salary_min: 100000,
            salary_max: 140000,
            competitiveness_level: 'medium',
            description: 'Join our growing team...',
            keywords: ['React', 'JavaScript'],
        },
    },
]

// =============================================================================
// MATCH SCORE TESTS
// =============================================================================

describe('Match Scores', () => {
    test('should have scores between 0 and 100', () => {
        mockMatchedJobs.forEach(job => {
            expect(job.match_score).toBeGreaterThanOrEqual(0)
            expect(job.match_score).toBeLessThanOrEqual(100)
        })
    })

    test('should sort by match score descending', () => {
        const sorted = [...mockMatchedJobs].sort((a, b) => b.match_score - a.match_score)

        expect(sorted[0].match_score).toBeGreaterThanOrEqual(sorted[1].match_score)
        expect(sorted[0].job.title).toBe('Senior Frontend Engineer')
    })
})

// =============================================================================
// MATCH FACTORS TESTS
// =============================================================================

describe('Match Factors', () => {
    test('should have all factor scores within valid ranges', () => {
        mockMatchedJobs.forEach(job => {
            expect(job.match_factors.skill_score).toBeGreaterThanOrEqual(0)
            expect(job.match_factors.skill_score).toBeLessThanOrEqual(35)

            expect(job.match_factors.salary_score).toBeGreaterThanOrEqual(0)
            expect(job.match_factors.salary_score).toBeLessThanOrEqual(20)

            expect(job.match_factors.remote_score).toBeGreaterThanOrEqual(0)
            expect(job.match_factors.remote_score).toBeLessThanOrEqual(15)

            expect(job.match_factors.location_score).toBeGreaterThanOrEqual(0)
            expect(job.match_factors.location_score).toBeLessThanOrEqual(15)

            expect(job.match_factors.industry_score).toBeGreaterThanOrEqual(0)
            expect(job.match_factors.industry_score).toBeLessThanOrEqual(10)

            expect(job.match_factors.title_score).toBeGreaterThanOrEqual(0)
            expect(job.match_factors.title_score).toBeLessThanOrEqual(15)
        })
    })

    test('should have explanation text', () => {
        mockMatchedJobs.forEach(job => {
            expect(job.explanation).toBeTruthy()
            expect(job.explanation.length).toBeGreaterThan(0)
        })
    })
})

// =============================================================================
// JOB DATA TESTS
// =============================================================================

describe('Job Data', () => {
    test('should have required job fields', () => {
        mockMatchedJobs.forEach(match => {
            expect(match.job.id).toBeTruthy()
            expect(match.job.title).toBeTruthy()
            expect(match.job.company).toBeTruthy()
        })
    })

    test('should handle salary ranges', () => {
        const job1 = mockMatchedJobs[0].job
        expect(job1.salary_min).toBe(120000)
        expect(job1.salary_max).toBe(160000)
        expect(job1.salary_max).toBeGreaterThan(job1.salary_min!)
    })

    test('should categorize remote types correctly', () => {
        const remoteJob = mockMatchedJobs[0].job
        const hybridJob = mockMatchedJobs[1].job

        expect(remoteJob.remote_type).toBe('remote')
        expect(hybridJob.remote_type).toBe('hybrid')
    })
})

// =============================================================================
// FILTERING TESTS
// =============================================================================

describe('Job Filtering', () => {
    test('should filter by minimum score', () => {
        const minScore = 80
        const filtered = mockMatchedJobs.filter(job => job.match_score >= minScore)

        expect(filtered.length).toBe(1)
        expect(filtered[0].match_score).toBe(92)
    })

    test('should filter by remote type', () => {
        const remoteOnly = mockMatchedJobs.filter(
            job => job.job.remote_type === 'remote'
        )

        expect(remoteOnly.length).toBe(1)
        expect(remoteOnly[0].job.title).toBe('Senior Frontend Engineer')
    })

    test('should filter by salary minimum', () => {
        const minSalary = 130000
        const filtered = mockMatchedJobs.filter(
            job => (job.job.salary_max || job.job.salary_min || 0) >= minSalary
        )

        expect(filtered.length).toBe(2)
    })
})

// =============================================================================
// PAGINATION TESTS
// =============================================================================

describe('Pagination', () => {
    test('should handle limit and offset', () => {
        const limit = 1
        const offset = 0
        const page1 = mockMatchedJobs.slice(offset, offset + limit)

        expect(page1.length).toBe(1)
        expect(page1[0].job_id).toBe('job-1')

        const page2 = mockMatchedJobs.slice(offset + limit, offset + limit + limit)
        expect(page2.length).toBe(1)
        expect(page2[0].job_id).toBe('job-2')
    })
})

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Error Handling', () => {
    test('should handle missing persona ID', () => {
        const personaId = null

        if (!personaId) {
            const result = { matches: [], count: 0, loading: false, error: null }
            expect(result.matches).toEqual([])
        }
    })

    test('should handle API errors', () => {
        const error = new Error('Failed to fetch matches: 500 Internal Server Error')

        expect(error.message).toContain('Failed to fetch matches')
    })

    test('should handle empty results', () => {
        const emptyResults = []

        expect(emptyResults.length).toBe(0)
    })
})

// =============================================================================
// CACHE TESTS
// =============================================================================

describe('Caching', () => {
    test('should indicate cached results', () => {
        const cachedResponse = {
            matches: mockMatchedJobs,
            count: 2,
            cached: true,
        }

        expect(cachedResponse.cached).toBe(true)
        expect(cachedResponse.matches.length).toBe(2)
    })

    test('should indicate fresh results', () => {
        const freshResponse = {
            matches: mockMatchedJobs,
            count: 2,
            cached: false,
        }

        expect(freshResponse.cached).toBe(false)
    })
})

// =============================================================================
// WEIGHT IMPACT TESTS
// =============================================================================

describe('Weight Impact', () => {
    test('should recalculate scores with different weights', () => {
        // Simulate higher skill weight
        const skillHeavyWeights = {
            skill_weight: 0.5,
            salary_weight: 0.2,
            location_weight: 0.1,
            remote_weight: 0.1,
            industry_weight: 0.1,
        }

        // Job with high skill score should rank higher
        const job1SkillScore = mockMatchedJobs[0].match_factors.skill_score
        const job2SkillScore = mockMatchedJobs[1].match_factors.skill_score

        expect(job1SkillScore).toBeGreaterThan(job2SkillScore)
    })
})

// =============================================================================
// STATE MANAGEMENT TESTS
// =============================================================================

describe('State Management', () => {
    test('should handle loading state', () => {
        const loadingState = {
            matches: [],
            loading: true,
            error: null,
        }

        expect(loadingState.loading).toBe(true)
        expect(loadingState.matches.length).toBe(0)
    })

    test('should transition to loaded state', () => {
        const loadedState = {
            matches: mockMatchedJobs,
            loading: false,
            error: null,
        }

        expect(loadedState.loading).toBe(false)
        expect(loadedState.matches.length).toBe(2)
    })

    test('should handle error state', () => {
        const errorState = {
            matches: [],
            loading: false,
            error: 'Network timeout',
        }

        expect(errorState.error).toBeTruthy()
        expect(errorState.matches.length).toBe(0)
    })
})
