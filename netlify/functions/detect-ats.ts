// netlify/functions/detect-ats.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface ATSDetectionResult {
  ats: string
  slug: string
  url: string
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

const detectors: ATSDetector[] = [
  {
    ats: 'greenhouse',
    columnName: 'greenhouse_board_token',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [
        root,
        sanitizeSlug(companyName),
        companyName.toLowerCase().replace(/\s+/g, '')
      ].filter(Boolean) as string[]

      for (const slug of candidates) {
        const url = `https://boards.greenhouse.io/${slug}`
        try {
          const response = await fetch(url, { method: 'HEAD' })
          if (response.ok) {
            return { ats: 'greenhouse', slug, url }
          }
        } catch {
          continue
        }
        await delay(100)
      }
      return null
    }
  },
  {
    ats: 'lever',
    columnName: 'lever_slug',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [
        root,
        sanitizeSlug(companyName)
      ].filter(Boolean) as string[]

      for (const slug of candidates) {
        const url = `https://jobs.lever.co/${slug}`
        try {
          const response = await fetch(url)
          if (response.ok) {
            return { ats: 'lever', slug, url }
          }
        } catch {
          continue
        }
        await delay(100)
      }
      return null
    }
  },
  {
    ats: 'ashby',
    columnName: 'ashby_slug',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [
        root,
        sanitizeSlug(companyName),
        companyName.toLowerCase().replace(/\s+/g, '')
      ].filter(Boolean) as string[]

      for (const slug of candidates) {
        const url = `https://jobs.ashbyhq.com/${slug}`
        try {
          const response = await fetch(url)
          if (response.ok) {
            return { ats: 'ashby', slug, url }
          }
        } catch {
          continue
        }
        await delay(100)
      }
      return null
    }
  },
  {
    ats: 'smartrecruiters',
    columnName: 'smartrecruiters_slug',
    detect: async (domain, companyName) => {
      const root = extractDomainRoot(domain)
      const candidates = [
        root,
        sanitizeSlug(companyName),
        companyName
      ].filter(Boolean) as string[]

      for (const slug of candidates) {
        const url = `https://jobs.smartrecruiters.com/api/v1/companies/${slug}/jobs?limit=1`
        try {
          const response = await fetch(url, { headers: { Accept: 'application/json' } })
          if (response.ok) {
            return {
              ats: 'smartrecruiters',
              slug,
              url: `https://jobs.smartrecruiters.com/${slug}`
            }
          }
        } catch {
          continue
        }
        await delay(100)
      }
      return null
    }
  },
  {
    ats: 'recruitee',
    columnName: 'recruitee_slug',
    detect: async (domain) => {
      const slug = extractDomainRoot(domain)
      const url = `https://${slug}.recruitee.com/api/offers`
      try {
        const response = await fetch(url)
        if (!response.ok) return null
        const data = await response.json()
        if (Array.isArray(data.offers)) {
          return { ats: 'recruitee', slug, url: `https://${slug}.recruitee.com` }
        }
      } catch {}
      return null
    }
  },
  {
    ats: 'breezyhr',
    columnName: 'breezyhr_slug',
    detect: async (domain) => {
      const slug = extractDomainRoot(domain)
      const url = `https://${slug}.breezy.hr/json`
      try {
        const response = await fetch(url)
        if (!response.ok) return null
        const data = await response.json()
        if (Array.isArray(data)) {
          return { ats: 'breezyhr', slug, url: `https://${slug}.breezy.hr` }
        }
      } catch {}
      return null
    }
  },
  {
    ats: 'personio',
    columnName: 'personio_slug',
    detect: async (domain) => {
      const slug = extractDomainRoot(domain)
      const jsonUrl = `https://${slug}.jobs.personio.com/search.json`
      try {
        const response = await fetch(jsonUrl)
        if (response.ok) {
          return { ats: 'personio', slug, url: `https://${slug}.jobs.personio.com` }
        }
      } catch {}
      try {
        const xmlUrl = `https://${slug}.jobs.personio.com/xml`
        const response = await fetch(xmlUrl)
        if (response.ok && response.headers.get('content-type')?.includes('xml')) {
          return { ats: 'personio', slug, url: `https://${slug}.jobs.personio.com` }
        }
      } catch {}
      return null
    }
  },
  {
    ats: 'jazzhr',
    columnName: 'jazzhr_slug',
    detect: async (domain) => {
      const slug = extractDomainRoot(domain)
      const url = `https://${slug}.applytojob.com/apply/jobs`
      try {
        const response = await fetch(url)
        if (response.ok) {
          return { ats: 'jazzhr', slug, url: `https://${slug}.applytojob.com` }
        }
      } catch {}
      return null
    }
  },
  {
    ats: 'workday',
    columnName: 'workday_tenant_url',
    detect: async (domain, companyName) => {
      const variations = [
        extractDomainRoot(domain),
        sanitizeSlug(companyName)
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase())

      const wdNumbers = ['1', '5', '12']
      const boards = ['External', 'Careers', 'External_Career_Site']
      if (companyName) {
        boards.push(`${sanitizeSlug(companyName)}_Careers`)
      }

      for (const variation of variations) {
        for (const wd of wdNumbers) {
          for (const board of boards) {
            const boardUrl = `https://${variation}.wd${wd}.myworkdayjobs.com/en-US/${board}`
            try {
              const response = await fetch(`${boardUrl}/jobs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ limit: 1, offset: 0, searchText: '' })
              })
              if (response.ok) {
                return { ats: 'workday', slug: variation, url: boardUrl }
              }
            } catch {}
            await delay(150)
          }
        }
      }
      return null
    }
  }
]

async function detectATS(domain: string, companyName: string): Promise<ATSDetectionResult | null> {
  for (const detector of detectors) {
    try {
      const result = await detector.detect(domain, companyName)
      if (result) {
        return result
      }
    } catch (error) {
      console.error(`DetectATS error for ${detector.ats}:`, error)
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
    .limit(20)

  if (error || !queue?.length) {
    return { processed: 0 }
  }

  let detected = 0
  let notFound = 0
  let errors = 0

  for (const item of queue) {
    const domain = item.domain || ''
    const companyName = item.companies?.name || ''

    if (!domain) {
      await supabase
        .from('ats_detection_queue')
        .update({
          status: 'error',
          error_message: 'No domain provided',
          last_checked_at: new Date().toISOString()
        })
        .eq('id', item.id)
      errors++
      continue
    }

    const detection = await detectATS(domain, companyName)

    if (detection) {
      const detector = detectors.find((d) => d.ats === detection.ats)
      const columnName = detector?.columnName || `${detection.ats}_slug`
      const columnValue =
        detection.ats === 'workday' ? detection.url : detection.slug

      await supabase
        .from('companies')
        .update({
          [columnName]: columnValue,
          ats_type: detection.ats,
          careers_page_url: detection.url,
          ats_detected_at: new Date().toISOString()
        })
        .eq('id', item.company_id)

      await supabase.from('company_targets').upsert(
        {
          platform: detection.ats,
          company_slug: detection.slug,
          company_id: item.company_id,
          status: 'active',
          min_interval_minutes: detection.ats === 'workday' ? 2880 : 1440,
          priority: 100
        },
        {
          onConflict: 'platform,company_slug',
          ignoreDuplicates: false
        }
      )

      await supabase
        .from('ats_detection_queue')
        .update({
          status: 'detected',
          detected_ats: detection.ats,
          detected_slug: detection.slug,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', item.id)

      detected++
    } else {
      await supabase
        .from('ats_detection_queue')
        .update({
          status: 'not_found',
          last_checked_at: new Date().toISOString()
        })
        .eq('id', item.id)

      notFound++
    }

    await delay(500)
  }

  return {
    processed: queue.length,
    detected,
    notFound,
    errors
  }
}

export const handler: Handler = async () => {
  try {
    const result = await processQueue()
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('[DetectATS] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Detection failed' })
    }
  }
}

export const config: Config = {
  schedule: '0 */2 * * *'
}
