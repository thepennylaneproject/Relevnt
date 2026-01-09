/**
 * Seed ATS Targets
 * 
 * Usage: npx tsx scripts/seed-ats-targets.ts --source=enlyft --file=path/to/companies.json
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SeedEntry {
  name: string
  domain: string
  employee_count?: number
  revenue?: number
  industry?: string
}

async function seed(source: string, filePath: string) {
  console.log(`🌱 Seeding from ${source} (${filePath})...`)
  
  const rawData = fs.readFileSync(path.resolve(filePath), 'utf8')
  const entries: SeedEntry[] = JSON.parse(rawData)

  let added = 0
  let skipped = 0

  for (const entry of entries) {
    if (!entry.domain) {
      skipped++
      continue
    }

    // 1. Upsert into companies
    const { data: company, error: compError } = await supabase
      .from('companies')
      .upsert({
        name: entry.name,
        domain: entry.domain,
        employee_count: entry.employee_count,
        industry: entry.industry,
        discovered_via: 'manual_seed',
        discovery_metadata: {
          seed_source: source,
          seeded_at: new Date().toISOString(),
          original_revenue: entry.revenue
        }
      }, { onConflict: 'domain' })
      .select()
      .single()

    if (compError) {
      console.error(`Error seeding ${entry.name}:`, compError.message)
      continue
    }

    // 2. Add to detection queue
    const { error: queueError } = await supabase
      .from('ats_detection_queue')
      .upsert({
        company_id: company.id,
        domain: entry.domain,
        status: 'pending',
        discovery_source: source,
        discovery_query: `seed_file:${path.basename(filePath)}`
      }, { onConflict: 'company_id' })

    if (queueError) {
      console.error(`Error queueing ${entry.name}:`, queueError.message)
    } else {
      added++
    }
  }

  console.log(`✅ Finished: ${added} added/updated, ${skipped} skipped.`)
}

const args = process.argv.slice(2)
const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1]
const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1]

if (!sourceArg || !fileArg) {
  console.error('Usage: npx tsx scripts/seed-ats-targets.ts --source=<source_name> --file=<path_to_json>')
  process.exit(1)
}

seed(sourceArg, fileArg).catch(console.error)
