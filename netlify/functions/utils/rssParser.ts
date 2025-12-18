/**
 * RSS/Atom feed parser utility
 * Safely parses and extracts job data from RSS/Atom feeds
 */

import { XMLParser } from 'fast-xml-parser'

export interface RSSItem {
  title?: string
  link?: string
  description?: string
  content?: string
  author?: string
  pubDate?: string
  published?: string // Atom format
  updated?: string // Atom format
  guid?: string
  id?: string // Atom format
  summary?: string // Atom format
  [key: string]: any
}

export interface ParsedRSSFeed {
  items: RSSItem[]
  title?: string
  description?: string
  link?: string
  lastBuildDate?: string
  error?: string
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '')
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text.length > 0 ? text : null
}

/**
 * Extract first valid URL from a string or array of strings
 */
function extractUrl(value: any): string | null {
  if (!value) return null

  const urls = Array.isArray(value) ? value : [value]
  for (const url of urls) {
    const str = String(url).trim()
    if (str && (str.startsWith('http://') || str.startsWith('https://'))) {
      return str
    }
  }
  return null
}

/**
 * Safely parse an RSS or Atom feed
 * Returns items array and feed metadata even if parsing is partially successful
 */
export function parseRSSFeed(feedXml: string | Buffer): ParsedRSSFeed {
  if (!feedXml) {
    return {
      items: [],
      error: 'Empty feed content',
    }
  }

  try {
    const xmlStr = typeof feedXml === 'string' ? feedXml : feedXml.toString()

    // Configure XML parser for RSS/Atom compatibility
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      parseTagValue: true,
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Always treat these as arrays
        if (name === 'item' || name === 'entry') return true
        return false
      },
      unpairedTags: ['br', 'hr', 'img', 'link', 'meta'],
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      trimValues: true,
    })

    const parsed = parser.parse(xmlStr)

    // Handle both RSS and Atom formats
    const rssRoot = parsed.rss || parsed.feed
    if (!rssRoot) {
      return {
        items: [],
        error: 'No RSS or Atom root element found',
      }
    }

    // Extract feed metadata
    const channel = rssRoot.channel || rssRoot
    const title = channel.title || rssRoot.title || undefined
    const description = channel.description || rssRoot.subtitle || undefined
    const link = channel.link || rssRoot.id || undefined
    const lastBuildDate = channel.lastBuildDate || rssRoot.updated || undefined

    // Extract items (RSS uses 'item', Atom uses 'entry')
    let items = channel.item || channel.entry || []

    // Ensure items is always an array
    if (!Array.isArray(items)) {
      items = items ? [items] : []
    }

    // Normalize items to standard format
    const normalizedItems: RSSItem[] = items
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => {
        // Atom format uses 'id', RSS uses 'guid'
        const id =
          item.id ||
          item.guid ||
          item['@_id'] ||
          item.link ||
          item['@_href'] ||
          item.title ||
          ''

        return {
          title: item.title || item['@_title'] || undefined,
          link: extractUrl(item.link || item['@_href']) || undefined,
          description:
            item.description ||
            item.summary ||
            item['@_summary'] ||
            item.content ||
            item['content:encoded'] ||
            undefined,
          author: item.author || item['@_author'] || undefined,
          pubDate:
            item.pubDate ||
            item.published ||
            item.updated ||
            item['@_published'] ||
            undefined,
          guid: id ? String(id) : undefined,
          ...item,
        }
      })

    return {
      items: normalizedItems,
      title,
      description,
      link,
      lastBuildDate,
    }
  } catch (err) {
    console.error('RSS parsing error:', err)
    return {
      items: [],
      error: `Failed to parse RSS: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Fetch and parse an RSS feed from URL
 */
export async function fetchAndParseRSSFeed(feedUrl: string, timeout = 10000): Promise<ParsedRSSFeed> {
  if (!feedUrl) {
    return {
      items: [],
      error: 'Empty feed URL',
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(feedUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; relevnt-job-ingestion/1.0; +https://relevnt.com)',
        Accept: 'application/rss+xml, application/atom+xml, text/xml, */*;q=0.1',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        items: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const contentType = response.headers.get('content-type') || ''
    if (
      !contentType.includes('xml') &&
      !contentType.includes('rss') &&
      !contentType.includes('atom') &&
      !contentType.includes('text')
    ) {
      return {
        items: [],
        error: `Unexpected content-type: ${contentType}`,
      }
    }

    const text = await response.text()
    const parsed = parseRSSFeed(text)

    if (parsed.error && parsed.items.length === 0) {
      return parsed
    }

    return parsed
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        items: [],
        error: `Feed fetch timeout after 10s`,
      }
    }
    return {
      items: [],
      error: `Failed to fetch feed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Sanitize HTML description to plain text
 */
export function sanitizeDescription(description: string | null | undefined): string | null {
  return stripHtml(description)
}
