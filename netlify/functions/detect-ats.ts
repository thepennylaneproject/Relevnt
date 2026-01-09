// netlify/functions/detect-ats.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

type ATSConfidence = 'low' | 'medium' | 'high'

interface ATSDetectionResult {
  ats: string
  slug: string
  url: string
  confidence: ATSConfidence
  discovery_url?: string
}

interface ATSDetector {
  ats: string
  columnName: string
  detect: (domain: string, companyName: string) => Promise<ATSDetectionResult | null>
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function sanitizeSlug(input?: string) {
  if (!input) return null
  return input.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function extractDomainRoot(domain: string) {
  return domain.replace(/^www\./i, '').split('.')[0] || domain
}

const HTML_MARKERS = [
  { ats: 'greenhouse', pattern: /boards\.greenhouse\.io|gh-application|grnhse/i },
  { ats: 'lever', pattern: /jobs\.lever\.co|lever-jobs|lever-job/i },
  { ats: 'ashby', pattern: /jobs\.ashbyhq\.com|ashby-embed|ashbyhq/i },
  { ats: 'smartrecruiters', pattern: /smartrecruiters\.com\/models\/|smartrecruiters-jobs/i },
  { ats: 'workday', pattern: /myworkdayjobs\.com|wd-app|workday/i },
  { ats: 'recruitee', pattern: /\.recruitee\.com|recruitee-offers/i },
  { ats: 'breezyhr', pattern: /\.breezy\.hr|breezy-jobs/i },
  { ats: 'jazzhr', pattern: /\.applytojob\.com|jazzhr/i },
  { ats: 'personio', pattern: /\.personio\.de|\.personio\.com|personio-jobs/i }
]

async function detectByHTML(url: string): Promise<Partial<ATSDetectionResult> | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return null
    const html = await response.text()
    
    for (const marker of HTML_MARKERS) {
      if (marker.pattern.test(html)) {
        return { ats: marker.ats, confidence: 'medium', discovery_url: url }
      }
    }
  } catch (err) {
    // Silent fail for crawl
  }
  return null
}

const detectors: ATSDetector[] = [
  {
    ats: 'greenhouse',
    columnName: 'greenhouse_board_token',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [root, sanitizeSlug(companyName)].filter(Boolean) as string[]
      for (const slug of candidates) {
        const url = `https://boards.greenhouse.io/${slug}`
        try {
          const res = await fetch(url, { method: 'HEAD' })
          if (res.ok) return { ats: 'greenhouse', slug, url, confidence: 'high' }
        } catch {}
      }
      return null
    }
  },
  {
    ats: 'lever',
    columnName: 'lever_slug',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [root, sanitizeSlug(companyName)].filter(Boolean) as string[]
      for (const slug of candidates) {
        const url = `https://jobs.lever.co/${slug}`
        try {
          const res = await fetch(url, { method: 'HEAD' })
          if (res.ok) return { ats: 'lever', slug, url, confidence: 'high' }
        } catch {}
      }
      return null
    }
  },
  {
    ats: 'ashby',
    columnName: 'ashby_slug',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [root, sanitizeSlug(companyName)].filter(Boolean) as string[]
      for (const slug of candidates) {
        const url = `https://jobs.ashbyhq.com/${slug}`
        try {
          const res = await fetch(url, { method: 'HEAD' })
          if (res.ok) return { ats: 'ashby', slug, url, confidence: 'high' }
        } catch {}
      }
      return null
    }
  },
  {
    ats: 'smartrecruiters',
    columnName: 'smartrecruiters_slug',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [root, sanitizeSlug(companyName)].filter(Boolean) as string[]
      for (const slug of candidates) {
        const apiUrl = `https://jobs.smartrecruiters.com/api/v1/companies/${slug}/jobs?limit=1`
        try {
          const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
          if (res.ok) return { ats: 'smartrecruiters', slug, url: `https://jobs.smartrecruiters.com/${slug}`, confidence: 'high' }
        } catch {}
      }
      return null
    }
  },
  {
    ats: 'workday',
    columnName: 'workday_tenant_url',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const variations = [root, sanitizeSlug(companyName)].filter(Boolean) as string[]
      const wdNumbers = ['1', '5', '12']
      const boards = ['External', 'Careers', 'External_Career_Site']
      for (const v of variations) {
        for (const wd of wdNumbers) {
          for (const b of boards) {
            const url = `https://${v}.wd${wd}.myworkdayjobs.com/en-US/${b}`
            try {
              const res = await fetch(`${url}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 1, offset: 0, searchText: '' })
              })
              if (res.ok) return { ats: 'workday', slug: v, url, confidence: 'high' }
            } catch {}
            await delay(50)
          }
        }
      }
      return null
    }
  }
]

async function detectATS(domain: string, companyName: string): Promise<ATSDetectionResult | null> {
  // 1. Direct Signal (High Confidence)
  for (const detector of detectors) {
    try {
      const result = await detector.detect(domain, companyName)
      if (result) return result
    } catch {}
    await delay(50)
  }

  // 2. Career Site Discovery (Medium Confidence via HTML)
  const discoveryPaths = ['/careers', '/jobs', '/join-us', '/about/careers', '/about/jobs']
  for (const path of discoveryPaths) {
    const url = `https://${domain}${path}`
    const result = await detectByHTML(url)
    if (result && result.ats) {
      // Find slug for common platforms if possible
      const root = extractDomainRoot(domain)
      return {
        ats: result.ats,
        slug: root, // Best guess
        url: result.discovery_url || url,
        confidence: result.confidence as ATSConfidence,
        discovery_url: url
      }
    }
    await delay(100)
  }

  return null
}

async function processQueue() {
  const supabase = createAdminClient()
  const { data: queue, error } = await supabase
    .from('ats_detection_queue')
    .select('*, companies(name)')
    .eq('status', 'pending')
    .limit(10)

  if (error || !queue?.length) return { processed: 0 }

  let detected = 0
  let notFound = 0
  let errors = 0

  for (const item of queue) {
    const domain = item.domain || ''
    const companyName = item.companies?.name || ''

    if (!domain) {
      await supabase.from('ats_detection_queue')
        .update({ status: 'error', error_message: 'No domain', last_checked_at: new Date().toISOString() })
        .eq('id', item.id)
      errors++
      continue
    }

    const detection = await detectATS(domain, companyName)

    if (detection) {
      const detector = detectors.find(d => d.ats === detection.ats)
      const columnName = detector?.columnName || `${detection.ats}_slug`
      const columnValue = detection.ats === 'workday' ? detection.url : detection.slug

      // Update Company
      await supabase.from('companies')
        .update({
          [columnName]: columnValue,
          ats_type: detection.ats,
          ats_confidence_score: detection.confidence,
          careers_page_url: detection.url,
          ats_detected_at: new Date().toISOString(),
          discovery_metadata: {
            source: item.discovery_source || 'detect-ats',
            query: item.discovery_query || null,
            discovered_at_url: detection.discovery_url || null
          }
        })
        .eq('id', item.company_id)

      // Auto-insert into company_targets ONLY if high confidence
      if (detection.confidence === 'high') {
        await supabase.from('company_targets').upsert({
          platform: detection.ats,
          company_slug: detection.slug,
          company_id: item.company_id,
          status: 'active',
          min_interval_minutes: detection.ats === 'workday' ? 2880 : 1440,
          priority: 100
        }, { onConflict: 'platform,company_slug' })
      }

      await supabase.from('ats_detection_queue')
        .update({
          status: 'detected',
          detected_ats: detection.ats,
          detected_slug: detection.slug,
          confidence_score: detection.confidence,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', item.id)

      detected++
    } else {
      await supabase.from('ats_detection_queue')
        .update({ status: 'not_found', last_checked_at: new Date().toISOString() })
        .eq('id', item.id)
      notFound++
    }
    await delay(300)
  }

  return { processed: queue.length, detected, notFound, errors }
}

export const handler: Handler = async () => {
  try {
    const result = await processQueue()
    return { statusCode: 200, body: JSON.stringify(result) }
  } catch (error) {
    console.error('[DetectATS] Fatal:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Detection failed' }) }
  }
}

export const config: Config = { schedule: '0 */2 * * *' }
