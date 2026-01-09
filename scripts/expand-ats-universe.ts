/**
 * Expand ATS Universe
 * 
 * Programmatically discovers new company domains using search signals.
 * Usage: npx tsx scripts/expand-ats-universe.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Placeholder for a real search API (e.g., Brave Search, SerpApi, Google)
async function performWebSearch(query: string): Promise<{ url: string }[]> {
  console.log(`🔍 Searching: ${query}`)
  // In a real implementation, this would call an external API.
  // For this demonstration/script, we return an empty array or could mock results.
  return []
}

const QUERIES = [
  '"jobs" "Greenhouse" site:*.com',
  '"jobs" "Lever" site:*.com',
  '"jobs" "Ashby" site:*.com',
  '"jobs" "myworkdayjobs.com"',
  '"careers" "Greenhouse"',
  '"join us" "Greenhouse"'
]

async function discover() {
  console.log('🚀 Starting ATS Universe Expansion Discovery...')

  for (const query of QUERIES) {
    const results = await performWebSearch(query)
    
    for (const result of results) {
      try {
        const url = new URL(result.url)
        const domain = url.hostname.replace(/^www\./i, '')
        
        // 1. Create/Find company (minimal info)
        const { data: company, error: compError } = await supabase
          .from('companies')
          .upsert({
            name: domain.split('.')[0], // Fallback name
            domain: domain,
            discovered_via: 'search_discovery',
            discovery_metadata: {
              first_discovered_query: query,
              first_discovered_url: result.url,
              discovered_at: new Date().toISOString()
            }
          }, { onConflict: 'domain' })
          .select()
          .single()

        if (compError) continue

        // 2. Add to detection queue
        await supabase
          .from('ats_detection_queue')
          .upsert({
            company_id: company.id,
            domain: domain,
            status: 'pending',
            discovery_source: 'search_discovery',
            discovery_query: query,
            discovered_url: result.url
          }, { onConflict: 'company_id' })

      } catch (err) {
        console.error(`Error processing result ${result.url}:`, err)
      }
    }
  }

  console.log('✅ Discovery pass complete.')
}

discover().catch(console.error)
