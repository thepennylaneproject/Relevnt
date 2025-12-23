// netlify/functions/admin_ingest_trigger.ts
/**
 * Admin endpoint to manually trigger job ingestion
 * Protected by ADMIN_SECRET environment variable
 *
 * Directly runs ingestion (optimized to ~80-120s with parallel batches)
 */

import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS } from './utils/supabase'
import { runIngestion } from './ingest_jobs'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret'

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    if (event.httpMethod !== 'POST') {
        return createResponse(405, {
            success: false,
            error: 'Method not allowed',
        })
    }

    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || ''
    if (adminSecret !== ADMIN_SECRET) {
        return createResponse(403, {
            success: false,
            error: 'Forbidden: Invalid admin secret',
        })
    }

    try {
        const body = event.body ? JSON.parse(event.body) : {}
        const { sources } = body

        const sourceSlug = sources && sources.length === 1 ? sources[0] : null

        console.log('admin_ingest_trigger: starting direct ingestion', { sourceSlug, sources })

        // Run ingestion directly (optimized to ~80-120s with parallel batches)
        const result = await runIngestion(sourceSlug)

        console.log('admin_ingest_trigger: ingestion completed', {
            totalInserted: result.totalInserted,
            totalDuplicates: result.totalDuplicates,
            totalFailed: result.totalFailed,
        })

        return createResponse(200, {
            success: true,
            message: `Ingestion completed for ${sourceSlug || 'all sources'}`,
            data: {
                totalInserted: result.totalInserted,
                totalDuplicates: result.totalDuplicates,
                totalFailed: result.totalFailed,
            },
        })
    } catch (err) {
        console.error('admin_ingest_trigger: failed', err)
        return createResponse(500, {
            success: false,
            error: 'Failed to trigger ingestion',
            message: err instanceof Error ? err.message : String(err),
        })
    }
}
