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
    CareerOneStopSource,
    LeverSource,
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

// =====================================================
// THEIRSTACK TESTS
// =====================================================

describe('TheirStack normalize', () => {
    test('should normalize TheirStack API response', async () => {
        const { TheirStackSource } = await import('../../../src/shared/jobSources')

        const mockResponse = {
            data: [
                {
                    id: 'ts-12345',
                    title: 'Senior Backend Engineer',
                    company: 'Tech Startup',
                    location: 'San Francisco, CA',
                    url: 'https://theirstack.com/jobs/12345',
                    salary_min: 150000,
                    salary_max: 200000,
                    posted_at: '2024-12-10',
                    body: 'We are looking for a backend engineer...',
                    remote: true,
                    employment_type: 'Full-time',
                    seniority_level: 'Senior',
                    technologies: ['Python', 'PostgreSQL', 'AWS'],
                },
            ],
        }

        const result = TheirStackSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(1)
        expect(result[0].source_slug).toBe('theirstack')
        expect(result[0].external_id).toBe('theirstack:ts-12345')
        expect(result[0].title).toBe('Senior Backend Engineer')
        expect(result[0].company).toBe('Tech Startup')
        expect(result[0].location).toBe('San Francisco, CA')
        expect(result[0].salary_min).toBe(150000)
        expect(result[0].salary_max).toBe(200000)
        expect(result[0].remote_type).toBe('remote')
        expect(result[0].description).toBe('We are looking for a backend engineer...')
    })

    test('should handle empty response', async () => {
        const { TheirStackSource } = await import('../../../src/shared/jobSources')
        const result = TheirStackSource.normalize({ data: [] }) as NormalizedJob[]
        expect(result).toHaveLength(0)
    })

    test('should produce stable dedupe key', async () => {
        const { TheirStackSource } = await import('../../../src/shared/jobSources')

        const mockJob = {
            id: 'stable-id-123',
            title: 'Engineer',
            company: 'Company',
            url: 'https://example.com/job/123',
        }

        const result1 = TheirStackSource.normalize({ data: [mockJob] }) as NormalizedJob[]
        const result2 = TheirStackSource.normalize({ data: [mockJob] }) as NormalizedJob[]

        // external_id should be stable given same input
        expect(result1[0].external_id).toBe(result2[0].external_id)
        expect(result1[0].external_id).toBe('theirstack:stable-id-123')
    })

    test('should detect remote type from boolean', async () => {
        const { TheirStackSource } = await import('../../../src/shared/jobSources')

        const remoteJob = { id: '1', title: 'Test', remote: true }
        const hybridJob = { id: '2', title: 'Test', hybrid: true }
        const onsiteJob = { id: '3', title: 'Test', location: 'Office' }

        const result = TheirStackSource.normalize({
            data: [remoteJob, hybridJob, onsiteJob],
        }) as NormalizedJob[]

        expect(result[0].remote_type).toBe('remote')
        expect(result[1].remote_type).toBe('hybrid')
        expect(result[2].remote_type).toBeNull() // 'Office' doesn't match remote/hybrid
    })

    test('should be in ALL_SOURCES', async () => {
        const { ALL_SOURCES } = await import('../../../src/shared/jobSources')
        const slugs = ALL_SOURCES.map(s => s.slug)
        expect(slugs).toContain('theirstack')
    })
})

// =====================================================
// CAREERONESTOP TESTS
// =====================================================

describe('CareerOneStop normalize', () => {
    test('should normalize CareerOneStop API response', () => {
        const mockResponse = {
            Jobs: [
                {
                    JvId: 'COS-12345',
                    JobTitle: 'Data Analyst',
                    Company: 'Federal Agency',
                    Location: 'Washington, DC',
                    URL: 'https://www.careeronestop.org/job/12345',
                    JobDesc: 'Analyze data for policy decisions...',
                    DatePosted: '2024-12-10',
                    EmploymentType: 'Full-time',
                    MinSalary: 75000,
                    MaxSalary: 95000,
                },
                {
                    JvId: 'COS-67890',
                    JobTitle: 'Software Developer',
                    Company: 'Tech Contractor',
                    Location: 'Remote, USA',
                    URL: 'https://www.careeronestop.org/job/67890',
                    JobDesc: 'Build government software systems...',
                    DatePosted: '2024-12-09',
                },
            ],
        }

        const result = CareerOneStopSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(2)

        // First job
        expect(result[0].source_slug).toBe('careeronestop')
        expect(result[0].external_id).toBe('careeronestop:COS-12345')
        expect(result[0].title).toBe('Data Analyst')
        expect(result[0].company).toBe('Federal Agency')
        expect(result[0].location).toBe('Washington, DC')
        expect(result[0].external_url).toBe('https://www.careeronestop.org/job/12345')
        expect(result[0].salary_min).toBe(75000)
        expect(result[0].salary_max).toBe(95000)
        expect(result[0].employment_type).toBe('Full-time')

        // Second job (remote, no salary)
        expect(result[1].remote_type).toBe('remote')
        expect(result[1].salary_min).toBeNull()
        expect(result[1].salary_max).toBeNull()
    })

    test('should handle empty response', () => {
        const result = CareerOneStopSource.normalize({ Jobs: [] }) as NormalizedJob[]
        expect(result).toHaveLength(0)
    })

    test('should handle missing fields gracefully', () => {
        const mockResponse = {
            Jobs: [
                {
                    JvId: 'COS-111',
                    JobTitle: 'Entry Level Position',
                    // Missing: Company, Location, URL, JobDesc, DatePosted
                },
            ],
        }

        const result = CareerOneStopSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].external_id).toBe('careeronestop:COS-111')
        expect(result[0].company).toBeNull()
        expect(result[0].location).toBeNull()
        expect(result[0].external_url).toBeNull()
    })

    test('should produce stable dedupe key from JvId', () => {
        const mockJob = {
            JvId: 'stable-id-123',
            JobTitle: 'Engineer',
            Company: 'Company',
            URL: 'https://example.com/job/123',
        }

        const result1 = CareerOneStopSource.normalize({ Jobs: [mockJob] }) as NormalizedJob[]
        const result2 = CareerOneStopSource.normalize({ Jobs: [mockJob] }) as NormalizedJob[]

        // external_id should be stable given same input
        expect(result1[0].external_id).toBe(result2[0].external_id)
        expect(result1[0].external_id).toBe('careeronestop:stable-id-123')
    })

    test('should fallback to URL when JvId is missing', () => {
        const mockJob = {
            JobTitle: 'No ID Job',
            URL: 'https://careeronestop.org/unique-url',
        }

        const result = CareerOneStopSource.normalize({ Jobs: [mockJob] }) as NormalizedJob[]
        expect(result[0].external_id).toBe('careeronestop:https://careeronestop.org/unique-url')
    })

    test('should fallback to title+company when both JvId and URL are missing', () => {
        const mockJob = {
            JobTitle: 'Mystery Job',
            Company: 'Unknown Corp',
        }

        const result = CareerOneStopSource.normalize({ Jobs: [mockJob] }) as NormalizedJob[]
        expect(result[0].external_id).toBe('careeronestop:Mystery Job::Unknown Corp')
    })

    test('should be in ALL_SOURCES', async () => {
        const { ALL_SOURCES } = await import('../../../src/shared/jobSources')
        const slugs = ALL_SOURCES.map(s => s.slug)
        expect(slugs).toContain('careeronestop')
    })
})

describe('Greenhouse normalize', () => {
    test('should normalize Greenhouse API response', () => {
        const { GreenhouseSource } = require('../../../src/shared/jobSources')

        const mockResponse = {
            jobs: [
                {
                    id: 123456,
                    title: 'Senior Full Stack Engineer',
                    description: 'We are looking for an experienced engineer...',
                    posted_at: '2024-12-10T10:00:00Z',
                    absolute_url: 'https://example.greenhouse.io/jobs/123456',
                    employment_type: 'Full-time',
                    offices: [
                        { name: 'San Francisco, CA' },
                        { name: 'New York, NY' },
                    ],
                    departments: [
                        { name: 'Engineering' },
                    ],
                },
                {
                    id: 789012,
                    title: 'Product Manager',
                    description: 'Join our product team...',
                    posted_at: '2024-12-09T15:30:00Z',
                    absolute_url: 'https://example.greenhouse.io/jobs/789012',
                    employment_type: 'Full-time',
                    offices: [
                        { name: 'Remote' },
                    ],
                },
            ],
        }

        const result = GreenhouseSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(2)

        // First job
        expect(result[0].source_slug).toBe('greenhouse')
        expect(result[0].external_id).toBe('greenhouse:123456')
        expect(result[0].title).toBe('Senior Full Stack Engineer')
        expect(result[0].location).toBe('San Francisco, CA, New York, NY')
        expect(result[0].external_url).toBe('https://example.greenhouse.io/jobs/123456')
        expect(result[0].employment_type).toBe('Full-time')
        expect(result[0].description).toBe('We are looking for an experienced engineer...')
        expect(result[0].posted_date).toBe('2024-12-10')

        // Second job with remote
        expect(result[1].external_id).toBe('greenhouse:789012')
        expect(result[1].title).toBe('Product Manager')
        expect(result[1].remote_type).toBe('remote')
    })

    test('should handle empty response', () => {
        const { GreenhouseSource } = require('../../../src/shared/jobSources')

        const result = GreenhouseSource.normalize({ jobs: [] }) as NormalizedJob[]
        expect(result).toHaveLength(0)
    })

    test('should handle missing fields gracefully', () => {
        const { GreenhouseSource } = require('../../../src/shared/jobSources')

        const mockResponse = {
            jobs: [
                {
                    id: 111,
                    title: 'Developer',
                    // Missing: description, posted_at, absolute_url, offices, employment_type
                },
            ],
        }

        const result = GreenhouseSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].external_id).toBe('greenhouse:111')
        expect(result[0].company).toBeNull()
        expect(result[0].location).toBeNull()
        expect(result[0].external_url).toBeNull()
        expect(result[0].posted_date).toBeNull()
    })

    test('should handle jobs with no offices or departments', () => {
        const { GreenhouseSource } = require('../../../src/shared/jobSources')

        const mockResponse = {
            jobs: [
                {
                    id: 222,
                    title: 'Data Engineer',
                    description: 'Data work required',
                    absolute_url: 'https://example.greenhouse.io/jobs/222',
                    // No offices or departments
                },
            ],
        }

        const result = GreenhouseSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].location).toBeNull()
        expect(result[0].remote_type).toBeNull()
// =====================================================
// Lever normalize
// =====================================================

describe('Lever normalize', () => {
    test('should normalize Lever API response', () => {
        const mockResponse = [
            {
                id: 'lever-123',
                text: 'Senior Software Engineer',
                categories: {
                    location: 'San Francisco, CA',
                    commitment: 'Full-time',
                    team: 'Engineering',
                    department: 'Product',
                },
                descriptionPlain: 'We are looking for a senior engineer with 5+ years of experience...',
                hostedUrl: 'https://jobs.lever.co/company/senior-engineer',
                applyUrl: 'https://jobs.lever.co/company/senior-engineer/apply',
                workplaceType: 'on-site',
                salaryRange: {
                    currency: 'USD',
                    min: 150000,
                    max: 200000,
                    interval: 'annual',
                },
                createdAt: '2024-12-10T00:00:00Z',
            },
            {
                id: 'lever-456',
                text: 'Frontend Developer',
                categories: {
                    location: 'New York, NY',
                    commitment: 'Full-time',
                },
                description: 'Join our frontend team...',
                hostedUrl: 'https://jobs.lever.co/company/frontend-dev',
                workplaceType: 'hybrid',
                createdAt: '2024-12-09',
            },
        ]

        const result = LeverSource.normalize(mockResponse) as NormalizedJob[]

        expect(result).toHaveLength(2)

        // First job - full details
        expect(result[0].source_slug).toBe('lever')
        expect(result[0].external_id).toBe('lever-123')
        expect(result[0].title).toBe('Senior Software Engineer')
        expect(result[0].location).toBe('San Francisco, CA')
        expect(result[0].employment_type).toBe('Full-time')
        expect(result[0].remote_type).toBe('onsite')
        expect(result[0].external_url).toBe('https://jobs.lever.co/company/senior-engineer')
        expect(result[0].salary_min).toBe(150000)
        expect(result[0].salary_max).toBe(200000)
        expect(result[0].description).toBe('We are looking for a senior engineer with 5+ years of experience...')

        // Second job - hybrid, partial details
        expect(result[1].external_id).toBe('lever-456')
        expect(result[1].title).toBe('Frontend Developer')
        expect(result[1].remote_type).toBe('hybrid')
        expect(result[1].salary_min).toBeNull()
        expect(result[1].salary_max).toBeNull()
    })

    test('should handle remote workplace type', () => {
        const mockResponse = [
            {
                id: 'lever-remote',
                text: 'Remote Developer',
                categories: {
                    location: 'Anywhere',
                },
                workplaceType: 'remote',
                hostedUrl: 'https://jobs.lever.co/company/remote-dev',
                createdAt: '2024-12-10',
            },
        ]

        const result = LeverSource.normalize(mockResponse) as NormalizedJob[]
        expect(result[0].remote_type).toBe('remote')
    })

    test('should infer remote type from location when workplaceType is missing', () => {
        const mockResponse = [
            {
                id: 'lever-inferred',
                text: 'Remote Position',
                categories: {
                    location: 'Remote - USA',
                },
                hostedUrl: 'https://jobs.lever.co/company/remote-pos',
                createdAt: '2024-12-10',
            },
        ]

        const result = LeverSource.normalize(mockResponse) as NormalizedJob[]
        expect(result[0].remote_type).toBe('remote')
    })

    test('should fallback to applyUrl when hostedUrl is missing', () => {
        const mockResponse = [
            {
                id: 'lever-no-hosted',
                text: 'Job Position',
                categories: {},
                applyUrl: 'https://jobs.lever.co/company/position/apply',
                createdAt: '2024-12-10',
            },
        ]

        const result = LeverSource.normalize(mockResponse) as NormalizedJob[]
        expect(result[0].external_url).toBe('https://jobs.lever.co/company/position/apply')
    })

    test('should handle empty response', () => {
        const result = LeverSource.normalize([]) as NormalizedJob[]
        expect(result).toHaveLength(0)
    })

    test('should filter out jobs without id or text', () => {
        const mockResponse = [
            {
                id: 'lever-valid',
                text: 'Valid Job',
                hostedUrl: 'https://jobs.lever.co/company/job1',
                createdAt: '2024-12-10',
            },
            {
                // Missing id
                text: 'Invalid Job 1',
                hostedUrl: 'https://jobs.lever.co/company/job2',
            },
            {
                id: 'lever-invalid-2',
                // Missing text
                hostedUrl: 'https://jobs.lever.co/company/job3',
            },
        ]

        const result = LeverSource.normalize(mockResponse) as NormalizedJob[]
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Valid Job')
    })

    test('should parse Unix timestamp as posted date', () => {
        const mockResponse = [
            {
                id: 'lever-unix',
                text: 'Job with Unix timestamp',
                hostedUrl: 'https://jobs.lever.co/company/job',
                createdAt: 1702252800000, // 2024-12-11 in milliseconds
            },
        ]

        const result = LeverSource.normalize(mockResponse) as NormalizedJob[]
        expect(result[0].posted_date).toBe('2024-12-11')
    })

    test('should be in ALL_SOURCES', async () => {
        const { ALL_SOURCES } = await import('../../../src/shared/jobSources')
        const slugs = ALL_SOURCES.map(s => s.slug)
        expect(slugs).toContain('greenhouse')
    })

    test('should have correct configuration', async () => {
        const { getSourceConfig } = await import('../../../src/shared/sourceConfig')
        const config = getSourceConfig('greenhouse')

        expect(config.slug).toBe('greenhouse')
        expect(config.mode).toBe('shallow-curated')
        expect(config.enabled).toBe(true)
        expect(config.trustLevel).toBe('high')
        expect(config.maxAgeDays).toBe(30)
        expect(slugs).toContain('lever')
    })
})
