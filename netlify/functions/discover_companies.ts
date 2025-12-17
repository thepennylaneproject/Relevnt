/**
 * Discover Companies Daemon
 * Runs hourly to discover new companies and update priorities
 *
 * Scheduled via:
 * - Netlify scheduled functions (with CRON)
 * - or external cron service
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import {
  runCompanyDiscovery,
  detectPlatformsInBatch,
  type DiscoveredCompany,
} from './utils/company-discovery'
import {
  updateCompanyPrioritiesML,
  findGrowthCompanies,
} from './utils/ml-prioritization'

export interface DiscoveryRunResult {
  run_id: string
  started_at: string
  completed_at: string
  duration_ms: number
  status: 'success' | 'failed' | 'partial'
  stats: {
    companies_discovered: number
    platforms_detected: number
    companies_added: number
    companies_updated: number
    priorities_updated: number
    growth_companies_identified: number
  }
  sources: string[]
  errors: string[]
}

/**
 * Main discovery and prioritization daemon
 */
async function runDiscoveryDaemon(): Promise<DiscoveryRunResult> {
  const supabase = createAdminClient()
  const runId = `discovery-${Date.now()}`
  const startedAt = new Date().toISOString()
  const errors: string[] = []

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Starting discovery daemon: ${runId}`)
  console.log(`${'='.repeat(80)}\n`)

  const stats = {
    companies_discovered: 0,
    platforms_detected: 0,
    companies_added: 0,
    companies_updated: 0,
    priorities_updated: 0,
    growth_companies_identified: 0,
  }

  const sources: string[] = []

  try {
    // ========================================================================
    // PHASE 1: Discover new companies
    // ========================================================================
    console.log('📡 PHASE 1: Discovering new companies...\n')

    let discoveredCompanies: DiscoveredCompany[] = [];
    try {
      discoveredCompanies = await runCompanyDiscovery();
      stats.companies_discovered = discoveredCompanies.length;

      const sourcesSet = new Set(discoveredCompanies.map(c => c.source));
      sources.push(...Array.from(sourcesSet));

      console.log(`✓ Discovered ${discoveredCompanies.length} companies from ${sources.length} sources\n`);
    } catch (err) {
      const msg = `Discovery failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`✗ ${msg}\n`);
    }

    // ========================================================================
    // PHASE 2: Detect platforms for new companies
    // ========================================================================
    if (discoveredCompanies.length > 0) {
      console.log('🔍 PHASE 2: Detecting job board platforms...\n')

      try {
        const detected = await detectPlatformsInBatch(discoveredCompanies, 5);
        stats.platforms_detected = detected.length;

        console.log(`✓ Detected platforms for ${detected.length} companies\n`)

        // Insert into companies table
        const toInsert = detected.map(d => ({
          name: d.company_name,
          domain: d.domain,
          lever_slug: d.lever_slug,
          greenhouse_board_token: d.greenhouse_board_token,
          discovered_via: 'careers_page',
          is_active: true,
          priority_tier: 'standard',
          sync_frequency_hours: 24,
        }));

        const { data, error } = await supabase
          .from('companies')
          .upsert(toInsert, {
            onConflict: 'domain',
            ignoreDuplicates: false,
          })
          .select('id');

        if (error) {
          const msg = `Failed to upsert companies: ${error.message}`;
          errors.push(msg);
          console.error(`✗ ${msg}\n`);
        } else {
          stats.companies_added = data?.length || 0;
          console.log(`✓ Added/updated ${stats.companies_added} companies in registry\n`);
        }
      } catch (err) {
        const msg = `Platform detection failed: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(`✗ ${msg}\n`);
      }
    }

    // ========================================================================
    // PHASE 3: Update priorities based on ML signals
    // ========================================================================
    console.log('🧠 PHASE 3: Updating priorities with ML signals...\n')

    try {
      const priorityUpdate = await updateCompanyPrioritiesML(supabase);
      stats.priorities_updated = priorityUpdate.updated;

      console.log(
        `✓ Priority updates: ${priorityUpdate.updated} companies ` +
        `(${priorityUpdate.promoted} promoted, ${priorityUpdate.demoted} demoted)\n`
      );
    } catch (err) {
      const msg = `Priority update failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`✗ ${msg}\n`);
    }

    // ========================================================================
    // PHASE 4: Identify growth companies
    // ========================================================================
    console.log('📈 PHASE 4: Identifying high-growth companies...\n')

    try {
      const growthCompanies = await findGrowthCompanies(supabase, 0.5);
      stats.growth_companies_identified = growthCompanies.length;

      if (growthCompanies.length > 0) {
        console.log(`✓ Found ${growthCompanies.length} companies with accelerating hiring:`);
        growthCompanies.slice(0, 5).forEach((c) => {
          const momentum = (c.momentum * 100).toFixed(0);
          console.log(`  • ${c.spike_info.description} (${momentum}% growth)`);
        });
        console.log();
      }
    } catch (err) {
      const msg = `Growth detection failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`✗ ${msg}\n`);
    }

    // ========================================================================
    // PHASE 5: Log results
    // ========================================================================
    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const status = errors.length === 0 ? 'success' : errors.length < 3 ? 'partial' : 'failed';

    console.log(`${'='.repeat(80)}`)
    console.log(`Discovery daemon complete: ${status.toUpperCase()}`)
    console.log(`${'='.repeat(80)}\n`)

    console.log('📊 Summary:')
    console.log(`  Companies discovered: ${stats.companies_discovered}`)
    console.log(`  Platforms detected: ${stats.platforms_detected}`)
    console.log(`  Companies added: ${stats.companies_added}`)
    console.log(`  Priorities updated: ${stats.priorities_updated}`)
    console.log(`  Growth companies found: ${stats.growth_companies_identified}`)
    console.log(`  Duration: ${(durationMs / 1000).toFixed(1)}s`)

    if (errors.length > 0) {
      console.log(`\n⚠️ Errors (${errors.length}):`)
      errors.forEach(e => console.log(`  • ${e}`));
    }

    console.log();

    // Store result in audit table
    try {
      await supabase.from('discovery_runs').insert({
        run_id: runId,
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: durationMs,
        status,
        stats,
        sources,
        errors: errors.length > 0 ? errors : null,
      });
    } catch (err) {
      console.warn('Failed to store discovery run result:', err);
    }

    return {
      run_id: runId,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      status,
      stats,
      sources,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Discovery daemon failed: ${msg}\n`);

    return {
      run_id: runId,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - new Date(startedAt).getTime(),
      status: 'failed',
      stats,
      sources,
      errors: [msg, ...errors],
    };
  }
}

/**
 * HTTP handler (can be invoked manually or via cron)
 */
export const handler: Handler = async (event) => {
  // Security: Verify admin secret if provided
  if (process.env.ADMIN_SECRET) {
    const token = event.headers['x-admin-token'] || event.headers['authorization'];
    if (!token || token !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
  }

  try {
    const result = await runDiscoveryDaemon();

    return {
      statusCode: 200,
      body: JSON.stringify(result, null, 2),
    };
  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
    };
  }
}

// Export for use in other contexts
export { runDiscoveryDaemon };
