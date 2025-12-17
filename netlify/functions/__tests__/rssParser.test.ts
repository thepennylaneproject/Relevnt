import { describe, test, expect } from 'vitest'
import { Buffer } from 'node:buffer'
import { parseRSSFeed, sanitizeDescription } from '../utils/rssParser'

describe('RSS Parser', () => {
  describe('parseRSSFeed', () => {
    test('should parse a basic RSS 2.0 feed', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Job Feed</title>
    <link>https://example.com</link>
    <description>Tech Jobs</description>
    <item>
      <title>Senior Engineer</title>
      <link>https://example.com/jobs/1</link>
      <description>Looking for a senior engineer</description>
      <pubDate>Thu, 15 Dec 2024 10:00:00 GMT</pubDate>
      <guid>https://example.com/jobs/1</guid>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items).toHaveLength(1)
      expect(result.title).toBe('Job Feed')
      expect(result.items[0].title).toBe('Senior Engineer')
      expect(result.items[0].link).toBe('https://example.com/jobs/1')
      expect(result.items[0].description).toBe('Looking for a senior engineer')
      expect(result.items[0].guid).toBeDefined()
    })

    test('should parse Atom feeds', () => {
      const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Job Feed</title>
  <link href="https://example.com"/>
  <updated>2024-12-15T10:00:00Z</updated>
  <entry>
    <title>DevOps Engineer</title>
    <link href="https://example.com/jobs/2"/>
    <id>https://example.com/jobs/2</id>
    <published>2024-12-15T10:00:00Z</published>
    <summary>We are looking for a DevOps engineer</summary>
  </entry>
</feed>`

      const result = parseRSSFeed(atomXml)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('DevOps Engineer')
      expect(result.items[0].link).toBe('https://example.com/jobs/2')
      expect(result.items[0].summary).toBe('We are looking for a DevOps engineer')
      expect(result.items[0].guid).toBe('https://example.com/jobs/2')
    })

    test('should handle multiple items', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Jobs</title>
    <item>
      <title>Job 1</title>
      <link>https://example.com/job/1</link>
    </item>
    <item>
      <title>Job 2</title>
      <link>https://example.com/job/2</link>
    </item>
    <item>
      <title>Job 3</title>
      <link>https://example.com/job/3</link>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items).toHaveLength(3)
      expect(result.items[0].title).toBe('Job 1')
      expect(result.items[1].title).toBe('Job 2')
      expect(result.items[2].title).toBe('Job 3')
    })

    test('should handle missing optional fields', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Minimal Job</title>
      <link>https://example.com/job/4</link>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Minimal Job')
      expect(result.items[0].description).toBeUndefined()
      expect(result.items[0].pubDate).toBeUndefined()
    })

    test('should handle HTML content in descriptions', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Job</title>
      <link>https://example.com/job/5</link>
      <description><![CDATA[<p>This is a <b>great</b> job</p>]]></description>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items[0].description).toBeDefined()
    })

    test('should handle encoded content', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Job</title>
      <link>https://example.com/job/6</link>
      <description>Salary: $100,000 - $150,000</description>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items[0].description).toContain('Salary')
      expect(result.items[0].description).toContain('100,000')
    })

    test('should return error for empty feed', () => {
      const result = parseRSSFeed('')

      expect(result.items).toHaveLength(0)
      expect(result.error).toBeDefined()
    })

    test('should return error for invalid XML', () => {
      const invalidXml = '<rss><channel><item><title>Unclosed'

      const result = parseRSSFeed(invalidXml)

      expect(result.items).toHaveLength(0)
      expect(result.error).toBeDefined()
    })

    test('should return error for non-RSS/Atom XML', () => {
      const otherXml = `<?xml version="1.0"?>
<root>
  <data>not a feed</data>
</root>`

      const result = parseRSSFeed(otherXml)

      expect(result.items).toHaveLength(0)
      expect(result.error).toBeDefined()
    })

    test('should handle feeds with no items', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
    <link>https://example.com</link>
    <description>A feed with no jobs</description>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items).toHaveLength(0)
      expect(result.title).toBe('Empty Feed')
      expect(result.error).toBeUndefined()
    })

    test('should extract pubDate in various formats', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Job 1</title>
      <pubDate>Thu, 15 Dec 2024 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Job 2</title>
      <pubDate>2024-12-15T10:00:00Z</pubDate>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items).toHaveLength(2)
      expect(result.items[0].pubDate).toBeDefined()
      expect(result.items[1].pubDate).toBeDefined()
    })

    test('should handle Buffer input', () => {
      const rssXml = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Buffered Job</title>
      <link>https://example.com/job/7</link>
    </item>
  </channel>
</rss>`)

      const result = parseRSSFeed(rssXml)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Buffered Job')
    })

    test('should handle special characters and entities', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Job &amp; Career &lt;2024&gt;</title>
      <description>Salary: $100,000 &mdash; $150,000</description>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items[0].title).toContain('&')
      expect(result.items[0].title).toContain('<')
    })

    test('should prioritize guid over link for ID', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Job</title>
      <link>https://example.com/job/8</link>
      <guid>unique-id-123</guid>
    </item>
  </channel>
</rss>`

      const result = parseRSSFeed(rssXml)

      expect(result.items[0].guid).toBe('unique-id-123')
    })
  })

  describe('sanitizeDescription', () => {
    test('should remove HTML tags from description', () => {
      const html = '<p>Senior Engineer needed</p>'
      const result = sanitizeDescription(html)
      expect(result).toBe('Senior Engineer needed')
    })

    test('should decode HTML entities', () => {
      const html = 'Salary: $100,000 &amp; benefits'
      const result = sanitizeDescription(html)
      expect(result).toContain('&')
    })

    test('should remove script tags', () => {
      const html = '<p>Job</p><script>alert("xss")</script>'
      const result = sanitizeDescription(html)
      expect(result).not.toContain('script')
      expect(result).toContain('Job')
    })

    test('should handle null/undefined', () => {
      expect(sanitizeDescription(null)).toBeNull()
      expect(sanitizeDescription(undefined)).toBeNull()
    })

    test('should trim whitespace', () => {
      const html = '  <p>Job Description</p>  '
      const result = sanitizeDescription(html)
      expect(result).toBe('Job Description')
    })

    test('should collapse multiple spaces', () => {
      const html = '<p>Job    with   multiple   spaces</p>'
      const result = sanitizeDescription(html)
      expect(result).toContain('Job with multiple spaces')
    })
  })
})
