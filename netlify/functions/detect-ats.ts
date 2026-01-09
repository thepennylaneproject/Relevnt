// netlify/functions/detect-ats.ts
/**
 * ATS Detection
 *
 * Processes the ats_detection_queue to detect which ATS platform a company uses.
 * When detected, creates a company_target entry for automatic job ingestion.
 *
 * Supported ATS platforms:
 * - Greenhouse: boards.greenhouse.io/{company} or /embed/job_board
 * - Lever: jobs.lever.co/{company}
 * - Ashby: jobs.ashbyhq.com/{company}
 *
 * This enables the "growth flywheel" - new companies discovered from aggregator
 * results get their ATS detected and added to direct scraping.
 */
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

const MAX_ITEMS_PER_RUN = 20
const REQUEST_TIMEOUT = 5000 // 5 seconds

interface ATSDetectionResult {
  ats: 'greenhouse' | 'lever' | 'ashby' | null
  slug: string | null
  url: string | null
}

interface DetectionQueueItem {
  id: string
  company_id: string
  domain: string
  status: string
}

/**
 * Attempt to detect ATS from domain
 */
async function detectATS(domain: string): Promise<ATSDetectionResult> {
  // Extract company name from domain (e.g., "stripe.com" -> "stripe")
  const companyName = domain.replace(/\.(com|io|co|org|net|ai|app|dev)$/, '').split('.').pop() || domain

  // Try each ATS pattern
  const patterns = [
    {
      ats: 'greenhouse' as const,
      url: `https://boards.greenhouse.io/${companyName}`,
      slugExtractor: (url: string) => url.split('/').pop() || null
    },
    {
      ats: 'lever' as const,
      url: `https://jobs.lever.co/${companyName}`,
      slugExtractor: (url: string) => url.split('/').pop() || null
    },
    {
      ats: 'ashby' as const,
      url: `https://jobs.ashbyhq.com/${companyName}`,
      slugExtractor: (url: string) => url.split('/').pop() || null
    }
  ]

  for (const pattern of patterns) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const response = await fetch(pattern.url, {
        method: 'HEAD', // HEAD request to check existence without downloading body
        redirect: 'follow',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        // Found the ATS
        const slug = pattern.slugExtractor(pattern.url)
        console.log(`[DetectATS] Found ${pattern.ats} for ${domain}: ${pattern.url}`)
        return {
          ats: pattern.ats,
          slug,
          url: pattern.url
        }
      }
    } catch (err) {
      // Network error or timeout - continue to next pattern
      continue
    }
  }

  // Also try common URL patterns on the company's own domain
  const ownDomainPatterns = [
    { url: `https://${domain}/careers`, atsIndicator: 'greenhouse' as const },
    { url: `https://careers.${domain}`, atsIndicator: null },
    { url: `https://jobs.${domain}`, atsIndicator: null }
  ]

  for (const pattern of ownDomainPatterns) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const response = await fetch(pattern.url, {
        method: 'GET', // GET to check for ATS indicators in HTML
        redirect: 'follow',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const html = await response.text()

        // Check for ATS indicators in the HTML
        if (html.includes('boards.greenhouse.io') || html.includes('greenhouse.io/embed')) {
          // Extract Greenhouse board token from embed URL
          const match = html.match(/boards\.greenhouse\.io\/embed\/job_board\?for=([a-zA-Z0-9]+)/)
            || html.match(/boards\.greenhouse\.io\/([a-zA-Z0-9]+)/)
          if (match) {
            console.log(`[DetectATS] Found Greenhouse (embedded) for ${domain}: ${match[1]}`)
            return {
              ats: 'greenhouse',
              slug: match[1],
              url: `https://boards.greenhouse.io/${match[1]}`
            }
          }
        }

        if (html.includes('jobs.lever.co')) {
          const match = html.match(/jobs\.lever\.co\/([a-zA-Z0-9-]+)/)
          if (match) {
            console.log(`[DetectATS] Found Lever (embedded) for ${domain}: ${match[1]}`)
            return {
              ats: 'lever',
              slug: match[1],
              url: `https://jobs.lever.co/${match[1]}`
            }
          }
        }

        if (html.includes('jobs.ashbyhq.com')) {
          const match = html.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/)
          if (match) {
            console.log(`[DetectATS] Found Ashby (embedded) for ${domain}: ${match[1]}`)
            return {
              ats: 'ashby',
              slug: match[1],
              url: `https://jobs.ashbyhq.com/${match[1]}`
            }
          }
        }
      }
    } catch (err) {
      // Continue to next pattern
      continue
    }
  }

  return { ats: null, slug: null, url: null }
}

export const handler: Handler = async (event) => {
  const startedAt = Date.now()
  const supabase = createAdminClient()

  console.log('[DetectATS] Starting ATS detection')

  try {
    // Get pending items from queue
    const { data: queueItems, error: queueError } = await supabase
      .from('ats_detection_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(MAX_ITEMS_PER_RUN)

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`)
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('[DetectATS] No pending items in queue')
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No pending items',
          processed: 0
        })
      }
    }

    console.log(`[DetectATS] Processing ${queueItems.length} items`)

    const results: Array<{ domain: string; status: string; ats?: string }> = []
    let detected = 0
    let notFound = 0
    let errors = 0

    for (const item of queueItems as DetectionQueueItem[]) {
      if (!item.domain) {
        // No domain - mark as error
        await supabase
          .from('ats_detection_queue')
          .update({
            status: 'error',
            error_message: 'No domain provided',
            last_checked_at: new Date().toISOString()
          })
          .eq('id', item.id)

        errors++
        results.push({ domain: item.domain || 'unknown', status: 'error' })
        continue
      }

      try {
        const detection = await detectATS(item.domain)

        if (detection.ats && detection.slug) {
          // Found ATS - update company and create target
          const updateFields: Record<string, any> = {
            ats_type: detection.ats,
            careers_page_url: detection.url,
            ats_detected_at: new Date().toISOString()
          }

          // Add platform-specific slug
          if (detection.ats === 'greenhouse') {
            updateFields.greenhouse_board_token = detection.slug
          } else if (detection.ats === 'lever') {
            updateFields.lever_slug = detection.slug
          } else if (detection.ats === 'ashby') {
            updateFields.ashby_slug = detection.slug
          }

          // Update company
          await supabase
            .from('companies')
            .update(updateFields)
            .eq('id', item.company_id)

          // Create company_target for ingestion
          await supabase.from('company_targets').upsert({
            platform: detection.ats,
            company_slug: detection.slug,
            company_id: item.company_id,
            status: 'active',
            min_interval_minutes: 1440, // 24 hours
            priority: 100
          }, {
            onConflict: 'platform,company_slug',
            ignoreDuplicates: false
          })

          // Update queue
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
          results.push({ domain: item.domain, status: 'detected', ats: detection.ats })

        } else {
          // No ATS found
          await supabase
            .from('ats_detection_queue')
            .update({
              status: 'not_found',
              last_checked_at: new Date().toISOString()
            })
            .eq('id', item.id)

          notFound++
          results.push({ domain: item.domain, status: 'not_found' })
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)

        await supabase
          .from('ats_detection_queue')
          .update({
            status: 'error',
            error_message: errorMessage,
            last_checked_at: new Date().toISOString()
          })
          .eq('id', item.id)

        errors++
        results.push({ domain: item.domain, status: 'error' })
      }
    }

    const durationMs = Date.now() - startedAt
    console.log(`[DetectATS] Completed: ${detected} detected, ${notFound} not found, ${errors} errors in ${durationMs}ms`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        durationMs,
        processed: queueItems.length,
        detected,
        notFound,
        errors,
        results
      })
    }

  } catch (err) {
    console.error('[DetectATS] Fatal error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }
}

// Run every 2 hours
export const config: Config = {
  schedule: '0 */2 * * *'
}
