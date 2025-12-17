import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { RSSSource, type NormalizedJob } from '../../../src/shared/jobSources'

describe('RSSSource normalize', () => {
  beforeEach(() => {
    // Mock current date for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-12-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should normalize a basic RSS item', () => {
    const items = [
      {
        item: {
          title: 'Senior Engineer',
          link: 'https://example.com/jobs/1',
          description: 'We are looking for a senior engineer',
          pubDate: '2024-12-15T10:00:00Z',
          guid: 'job-1',
        },
        feedSource: {
          name: 'Tech Jobs Feed',
          feedUrl: 'https://example.com/feed',
          defaultCompany: 'TechCorp',
          defaultLocation: 'San Francisco, CA',
        },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Senior Engineer')
    expect(result[0].source_slug).toBe('rss')
    expect(result[0].external_url).toBe('https://example.com/jobs/1')
    expect(result[0].company).toBe('TechCorp')
    expect(result[0].location).toBe('San Francisco, CA')
    expect(result[0].description).toBe('We are looking for a senior engineer')
    expect(result[0].posted_date).toBeDefined()
  })

  test('should use item link for external_id when guid not present', () => {
    const items = [
      {
        item: {
          title: 'Developer',
          link: 'https://example.com/jobs/2',
        },
        feedSource: {
          name: 'Job Board',
          feedUrl: 'https://example.com/feed',
        },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].external_id).toBe('rss:https://example.com/jobs/2')
  })

  test('should use title+date for external_id when neither guid nor link present', () => {
    const items = [
      {
        item: {
          title: 'Job Title',
          pubDate: '2024-12-15',
        },
        feedSource: {
          name: 'Job Board',
          feedUrl: 'https://example.com/feed',
        },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].external_id).toContain('rss:')
    expect(result[0].external_id).toContain('Job Title')
    expect(result[0].external_id).toContain('2024-12-15')
  })

  test('should infer remote type from location', () => {
    const items = [
      {
        item: {
          title: 'Remote Job',
          link: 'https://example.com/jobs/3',
        },
        feedSource: {
          name: 'Remote Board',
          feedUrl: 'https://example.com/feed',
          defaultLocation: 'Remote',
        },
        feedUrl: 'https://example.com/feed',
      },
      {
        item: {
          title: 'Hybrid Job',
          link: 'https://example.com/jobs/4',
        },
        feedSource: {
          name: 'Hybrid Board',
          feedUrl: 'https://example.com/feed',
          defaultLocation: 'New York (Hybrid)',
        },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].remote_type).toBe('remote')
    expect(result[1].remote_type).toBe('hybrid')
  })

  test('should skip items without title', () => {
    const items = [
      {
        item: {
          link: 'https://example.com/jobs/5',
        },
        feedSource: {
          name: 'Board',
          feedUrl: 'https://example.com/feed',
        },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result).toHaveLength(0)
  })

  test('should skip invalid/non-object items', () => {
    const items = [
      {
        item: null,
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
      {
        item: 'not an object',
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
      {
        item: {
          title: 'Valid Job',
          link: 'https://example.com/jobs/6',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid Job')
  })

  test('should handle empty input', () => {
    const result = RSSSource.normalize([]) as NormalizedJob[]
    expect(result).toHaveLength(0)
  })

  test('should use summary field when description not present', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/7',
          summary: 'This is a summary',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].description).toContain('summary')
  })

  test('should use content field when both description and summary not present', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/8',
          content: 'This is content',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].description).toContain('content')
  })

  test('should strip HTML from description', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/9',
          description: '<p>This is <b>bold</b> text</p>',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    const desc = result[0].description || ''
    expect(desc).not.toContain('<p>')
    expect(desc).not.toContain('<b>')
    expect(desc).toContain('bold text')
  })

  test('should handle multiple items from different feeds', () => {
    const items = [
      {
        item: {
          title: 'Job 1',
          link: 'https://example.com/jobs/10',
          guid: 'job-10',
        },
        feedSource: {
          name: 'Feed A',
          feedUrl: 'https://feedA.com',
          defaultCompany: 'CompanyA',
        },
        feedUrl: 'https://feedA.com',
      },
      {
        item: {
          title: 'Job 2',
          link: 'https://example.com/jobs/11',
          guid: 'job-11',
        },
        feedSource: {
          name: 'Feed B',
          feedUrl: 'https://feedB.com',
          defaultCompany: 'CompanyB',
        },
        feedUrl: 'https://feedB.com',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result).toHaveLength(2)
    expect(result[0].company).toBe('CompanyA')
    expect(result[1].company).toBe('CompanyB')
    expect((result[0].data_raw as any).feedUrl).toBe('https://feedA.com')
    expect((result[1].data_raw as any).feedUrl).toBe('https://feedB.com')
  })

  test('should set salary fields to null', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/12',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].salary_min).toBeNull()
    expect(result[0].salary_max).toBeNull()
  })

  test('should set employment_type to null', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/13',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].employment_type).toBeNull()
  })

  test('should preserve raw item data', () => {
    const rawItem = {
      title: 'Job',
      link: 'https://example.com/jobs/14',
      customField: 'customValue',
    }

    const items = [
      {
        item: rawItem,
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    const rawData = result[0].data_raw as any
    expect(rawData.item).toEqual(expect.objectContaining(rawItem))
  })

  test('should handle missing feed source gracefully', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/15',
        },
        feedSource: undefined,
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result).toHaveLength(1)
    expect(result[0].company).toBeNull()
    expect(result[0].location).toBeNull()
  })

  test('should parse published date in Atom format', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/16',
          published: '2024-12-15T10:00:00Z',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].posted_date).toBeDefined()
  })

  test('should use guid field as external_id when present', () => {
    const items = [
      {
        item: {
          title: 'Job',
          link: 'https://example.com/jobs/17',
          guid: 'unique-guid-123',
        },
        feedSource: { name: 'Board', feedUrl: 'https://example.com/feed' },
        feedUrl: 'https://example.com/feed',
      },
    ]

    const result = RSSSource.normalize(items) as NormalizedJob[]

    expect(result[0].external_id).toBe('rss:unique-guid-123')
  })
})
