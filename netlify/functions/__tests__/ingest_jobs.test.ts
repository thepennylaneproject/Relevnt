/**
 * Tests for job ingestion pipeline
 * 
 * Run with: npm test -- ingest_jobs.test.ts
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    JoobleSource,
    TheMuseSource,
    ReedUKSource,
    USAJobsSource,
    RemoteOKSource,
    type NormalizedJob,
} from '../../../src/shared/jobSources'

// =====================================================
// NORMALIZE FUNCTION TESTS
// =====================================================

describe('Jooble normalize', () => {
    test('should normalize Jooble API response', () => {
        const mockResponse = {
            jobs: [
                {
                    id: '12345',
                    title: 'Senior Software Engineer',
                    company: 'Tech Corp',
                    location: 'Remote, USA',
                    link: 'https://jooble.org/job/12345',
                    snippet: 'Looking for an experienced engineer...',
                    salary: '$120,000 - $150,000',
                    type: 'Full-time',
                    updated: '2024-12-10',
                },
                {
                    id: '67890',
                    title: 'Frontend Developer',
                    company: 'Startup Inc',
                    location: 'New York, NY',
                    link: 'https://jooble.org/job/67890',
                    snippet: 'Join our growing team...',
                    salary: '',
                    type: 'Contract',
                    updated: '2024-12-09',
                },
            ],
        }

        const result = JoobleSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(2)

        // First job
        expect(result[0].source_slug).toBe('jooble')
        expect(result[0].title).toBe('Senior Software Engineer')
        expect(result[0].company).toBe('Tech Corp')
        expect(result[0].location).toBe('Remote, USA')
        expect(result[0].external_url).toBe('https://jooble.org/job/12345')
        expect(result[0].salary_min).toBe(120000)
        expect(result[0].salary_max).toBe(150000)
        expect(result[0].remote_type).toBe('remote')

        // Second job (no salary)
        expect(result[1].salary_min).toBeNull()
        expect(result[1].salary_max).toBeNull()
    })

    test('should handle empty response', () => {
        const result = JoobleSource.normalize({ jobs: [] }) as NormalizedJob[]
        expect(result).toHaveLength(0)
    })

    test('should handle missing fields gracefully', () => {
        const mockResponse = {
            jobs: [
                {
                    id: '123',
                    title: 'Developer',
                    // Missing: company, location, link, snippet, salary, type, updated
                },
            ],
        }

        const result = JoobleSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].company).toBeNull()
        expect(result[0].location).toBeNull()
        expect(result[0].external_url).toBeNull()
    })
})

describe('The Muse normalize', () => {
    test('should normalize The Muse API response', () => {
        const mockResponse = {
            results: [
                {
                    id: 999,
                    name: 'Product Manager',
                    company: { name: 'Big Tech' },
                    locations: [
                        { name: 'San Francisco, CA' },
                        { name: 'New York, NY' },
                    ],
                    levels: [{ name: 'Senior' }, { name: 'Mid-Level' }],
                    refs: { landing_page: 'https://themuse.com/jobs/999' },
                    publication_date: '2024-12-08',
                    contents: '<p>We are looking for a PM...</p>',
                },
            ],
        }

        const result = TheMuseSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(1)
        expect(result[0].source_slug).toBe('themuse')
        expect(result[0].title).toBe('Product Manager')
        expect(result[0].company).toBe('Big Tech')
        expect(result[0].location).toBe('San Francisco, CA, New York, NY')
        expect(result[0].employment_type).toBe('Senior, Mid-Level')
        expect(result[0].external_url).toBe('https://themuse.com/jobs/999')
        expect(result[0].description).toBe('<p>We are looking for a PM...</p>')
    })

    test('should handle empty locations and levels', () => {
        const mockResponse = {
            results: [
                {
                    id: 111,
                    name: 'Intern',
                    company: { name: 'Startup' },
                    locations: [],
                    levels: [],
                    refs: {},
                },
            ],
        }

        const result = TheMuseSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].location).toBeNull()
        expect(result[0].employment_type).toBeNull()
        expect(result[0].external_url).toBeNull()
    })
})

describe('Reed UK normalize', () => {
    test('should normalize Reed UK API response', () => {
        const mockResponse = {
            results: [
                {
                    jobId: 54321,
                    jobTitle: 'Backend Engineer',
                    employerName: 'UK Tech Ltd',
                    locationName: 'London, UK',
                    jobUrl: 'https://reed.co.uk/jobs/54321',
                    minimumSalary: 60000,
                    maximumSalary: 80000,
                    date: '2024-12-07',
                    isPermanent: true,
                    jobDescription: 'Building scalable systems...',
                },
            ],
        }

        const result = ReedUKSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(1)
        expect(result[0].source_slug).toBe('reed_uk')
        expect(result[0].external_id).toBe('reed_uk:54321')
        expect(result[0].title).toBe('Backend Engineer')
        expect(result[0].company).toBe('UK Tech Ltd')
        expect(result[0].location).toBe('London, UK')
        expect(result[0].salary_min).toBe(60000)
        expect(result[0].salary_max).toBe(80000)
        expect(result[0].employment_type).toBe('permanent')
    })

    test('should handle contract jobs', () => {
        const mockResponse = {
            results: [
                {
                    jobId: 11111,
                    jobTitle: 'DevOps Contractor',
                    employerName: 'Agency',
                    isPermanent: false,
                },
            ],
        }

        const result = ReedUKSource.normalize(mockResponse) as NormalizedJob[]
        expect(result[0].employment_type).toBe('contract')
    })

    test('should prefer contractType over isPermanent', () => {
        const mockResponse = {
            results: [
                {
                    jobId: 22222,
                    jobTitle: 'Consultant',
                    contractType: 'temp-to-perm',
                    isPermanent: false,
                },
            ],
        }

        const result = ReedUKSource.normalize(mockResponse) as NormalizedJob[]
        expect(result[0].employment_type).toBe('temp-to-perm')
    })
})

describe('USAJobs normalize', () => {
    test('should normalize USAJobs API response', () => {
        const mockResponse = {
            SearchResult: {
                SearchResultItems: [
                    {
                        MatchedObjectId: 'USA-123456',
                        MatchedObjectDescriptor: {
                            PositionTitle: 'IT Specialist',
                            OrganizationName: 'Department of Defense',
                            PositionLocation: [
                                {
                                    LocationName: 'Washington',
                                    CityName: 'Washington',
                                    CountrySubDivisionCode: 'DC',
                                    CountryCode: 'US',
                                },
                            ],
                            PositionSchedule: [{ Name: 'Full-Time' }],
                            PositionRemuneration: [
                                { MinimumRange: '80000', MaximumRange: '120000' },
                            ],
                            PublicationStartDate: '2024-12-01',
                            PositionURI: 'https://usajobs.gov/jobs/123456',
                            QualificationSummary: 'Must have IT experience...',
                        },
                    },
                ],
            },
        }

        const result = USAJobsSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(1)
        expect(result[0].source_slug).toBe('usajobs')
        expect(result[0].external_id).toBe('USA-123456')
        expect(result[0].title).toBe('IT Specialist')
        expect(result[0].company).toBe('Department of Defense')
        expect(result[0].salary_min).toBe(80000)
        expect(result[0].salary_max).toBe(120000)
        expect(result[0].employment_type).toBe('Full-Time')
    })

    test('should handle empty search results', () => {
        const mockResponse = {
            SearchResult: {
                SearchResultItems: [],
            },
        }

        const result = USAJobsSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(0)
    })
})

describe('RemoteOK normalize', () => {
    test('should normalize RemoteOK API response', () => {
        const mockResponse = [
            {
                id: 'rok123',
                position: 'React Developer',
                company: 'Remote First Co',
                location: 'Worldwide',
                url: 'https://remoteok.com/jobs/rok123',
                salary_min: 100000,
                salary_max: 140000,
                date: '2024-12-10',
                description: 'Build React apps...',
            },
        ]

        const result = RemoteOKSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(1)
        expect(result[0].source_slug).toBe('remoteok')
        expect(result[0].title).toBe('React Developer')
        expect(result[0].remote_type).toBe('remote')
    })

    test('should filter out invalid entries', () => {
        const mockResponse = [
            { id: null, position: null }, // Invalid
            { id: 'valid', position: 'Engineer' }, // Valid
            {}, // Invalid - no id or position
        ]

        const result = RemoteOKSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Engineer')
    })
})

// =====================================================
// INTEGRATION TESTS
// =====================================================

describe('ALL_SOURCES configuration', () => {
    test('new sources should be in ALL_SOURCES', async () => {
        const { ALL_SOURCES } = await import('../../../src/shared/jobSources')

        const slugs = ALL_SOURCES.map(s => s.slug)

        expect(slugs).toContain('jooble')
        expect(slugs).toContain('themuse')
        expect(slugs).toContain('reed_uk')
        expect(slugs).toContain('usajobs')
        expect(slugs).toContain('remoteok')
        expect(slugs).toContain('remotive')
        expect(slugs).toContain('himalayas')
    })

    test('all sources should have required fields', async () => {
        const { ALL_SOURCES } = await import('../../../src/shared/jobSources')

        for (const source of ALL_SOURCES) {
            expect(source.slug).toBeDefined()
            expect(source.displayName).toBeDefined()
            expect(source.fetchUrl).toBeDefined()
            expect(typeof source.normalize).toBe('function')
        }
    })
})

// =====================================================
// EDGE CASE TESTS
// =====================================================

describe('Edge cases', () => {
    test('should handle null/undefined input gracefully', () => {
        expect(JoobleSource.normalize(null)).toEqual([])
        expect(JoobleSource.normalize(undefined)).toEqual([])
        expect(TheMuseSource.normalize(null)).toEqual([])
        expect(ReedUKSource.normalize({})).toEqual([])
    })

    test('should handle non-array jobs field', () => {
        expect(JoobleSource.normalize({ jobs: 'not an array' })).toEqual([])
        expect(TheMuseSource.normalize({ results: 123 })).toEqual([])
    })

    test('should produce valid NormalizedJob format', () => {
        const mockJoobleResponse = {
            jobs: [{ id: '1', title: 'Test Job' }],
        }

        const result = JoobleSource.normalize(mockJoobleResponse) as NormalizedJob[]

        // Check all required fields exist
        expect(result[0]).toHaveProperty('source_slug')
        expect(result[0]).toHaveProperty('external_id')
        expect(result[0]).toHaveProperty('title')
        expect(result[0]).toHaveProperty('company')
        expect(result[0]).toHaveProperty('location')
        expect(result[0]).toHaveProperty('employment_type')
        expect(result[0]).toHaveProperty('remote_type')
        expect(result[0]).toHaveProperty('posted_date')
        expect(result[0]).toHaveProperty('created_at')
        expect(result[0]).toHaveProperty('external_url')
        expect(result[0]).toHaveProperty('salary_min')
        expect(result[0]).toHaveProperty('salary_max')
        expect(result[0]).toHaveProperty('competitiveness_level')
        expect(result[0]).toHaveProperty('description')
    })
})
