// netlify/functions/ingest_jobs_worker-background.ts
/**
 * Background Job Ingestion Worker
 * 
 * Called by jobs_cron.ts or admin_ingest_trigger.ts
 * Has 15-minute timeout thanks to -background suffix.
 * 
 * IMPORTANT: The -background suffix ONLY works for HTTP-triggered functions,
 * NOT for scheduled functions. That's why we split into trigger + worker.
 */
import type { Config } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

export default async (req: Request) => {
    const startedAt = Date.now()
    console.log('ingest_jobs_worker-background: starting')

    try {
        const body = await req.json().catch(() => ({}))
        const triggeredBy = body?.triggeredBy || 'manual'
        const sourceSlug = body?.source || body?.source_slug || null

        console.log('ingest_jobs_worker-background: running ingestion', {
            triggeredBy,
            sourceSlug
        })

        const results = await runIngestion(sourceSlug, triggeredBy)

        const summary = results.reduce<Record<string, number>>((acc, r) => {
            acc[r.source] = r.count
            return acc
        }, {})

        console.log('ingest_jobs_worker-background: completed', {
            durationMs: Date.now() - startedAt,
            sources: results.length,
            totalInserted: results.reduce((sum, r) => sum + r.count, 0),
            summary
        })

        // Background functions don't return meaningful responses to clients
        // (client gets 202 immediately), but we log for debugging
    } catch (err) {
        console.error('ingest_jobs_worker-background: failed', {
            durationMs: Date.now() - startedAt,
            error: err instanceof Error ? err.message : String(err)
        })
    }
}

export const config: Config = {
    // No schedule - this is invoked via HTTP by the scheduled trigger or admin
}
