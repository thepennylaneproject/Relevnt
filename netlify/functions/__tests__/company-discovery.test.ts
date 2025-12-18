import { describe, test, expect, vi, beforeEach } from 'vitest'
import { detectATSFromContent } from '../utils/atsDetector'
import { crawlCareersPage, discoverFromGitHubLists } from '../utils/company-discovery'

// Mock fetch
global.fetch = vi.fn()

describe('Company Discovery & ATS Detection', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('detectATSFromContent', () => {
        test('should detect Lever from URL', () => {
            const result = detectATSFromContent('https://jobs.lever.co/acme-inc')
            expect(result).not.toBeNull()
            expect(result?.type).toBe('lever')
            expect(result?.slug).toBe('acme-inc')
        })

        test('should detect Greenhouse from data attribute', () => {
            const html = '<div id="grnhse_app" gh-board-token="acmetoken"></div>'
            const result = detectATSFromContent(html)
            expect(result).not.toBeNull()
            expect(result?.type).toBe('greenhouse')
            expect(result?.token).toBe('acmetoken')
        })

        test('should detect Greenhouse from embed script', () => {
            const html = '<script src="https://boards.greenhouse.io/embed/client-test.js"></script>'
            const result = detectATSFromContent(html)
            expect(result).not.toBeNull()
            expect(result?.type).toBe('greenhouse')
        })

        test('should detect Workday', () => {
            const result = detectATSFromContent('https://acme.myworkdayjobs.com/Careers')
            expect(result).not.toBeNull()
            expect(result?.type).toBe('workday')
        })
    })

    describe('crawlCareersPage', () => {
        test('should find careers link in HTML', async () => {
            const mockHtml = `
        <html>
          <body>
            <nav>
              <a href="/about">About</a>
              <a href="https://acme.com/careers">Careers</a>
            </nav>
          </body>
        </html>
      `

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml)
            } as Response)

            const result = await crawlCareersPage('acme.com')
            expect(result).toBe('https://acme.com/careers')
        })

        test('should handle relative careers links', async () => {
            const mockHtml = '<a href="/jobs">Jobs</a>'

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml)
            } as Response)

            const result = await crawlCareersPage('startup.io')
            expect(result).toBe('https://startup.io/jobs')
        })
    })

    describe('discoverFromGitHubLists', () => {
        test('should parse GitHub JSON list', async () => {
            const mockData = [
                { name: 'Acme Corp', website: 'https://acme.com' },
                { name: 'Startup Inc', website: 'https://startup.io' }
            ]

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            } as Response)

            const result = await discoverFromGitHubLists()
            expect(result.length).toBeGreaterThan(0)
            expect(result[0].name).toBe('Acme Corp')
            expect(result[0].domain).toBe('acme.com')
        })
    })
})
