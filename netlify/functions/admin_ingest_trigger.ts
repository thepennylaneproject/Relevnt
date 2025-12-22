// netlify/functions/admin_ingest_trigger.ts
/**
 * Admin endpoint to manually trigger job ingestion
 * Protected by ADMIN_SECRET environment variable
 * 
 * Now triggers the background worker instead of running ingestion directly,
 * to avoid timeout issues with long-running ingestion.
 */

import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS } from './utils/supabase'

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

        // Determine source slug if single source requested
        const sourceSlug = sources && sources.length === 1 ? sources[0] : null

        console.log('admin_ingest_trigger: triggering background worker', { sourceSlug, sources })

        // Trigger the background worker instead of running directly
        // This avoids timeout issues since background functions have 15-min limit
        const host = event.headers.host || 'relevnt-fresh.netlify.app'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const baseUrl = `${protocol}://${host}`
        
        console.log(`admin_ingest_trigger: calling worker at ${baseUrl}`)

        const workerResponse = await fetch(`${baseUrl}/.netlify/functions/ingest_jobs_worker-background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                triggeredBy: 'admin',
                source: sourceSlug,
            })
        })

        console.log('admin_ingest_trigger: worker triggered', { status: workerResponse.status })

        // Background functions return 202 Accepted immediately
        return createResponse(202, {
            success: true,
            message: `Background ingestion triggered for ${sourceSlug || 'all sources'}`,
            workerStatus: workerResponse.status,
            note: 'Ingestion is running in the background. Check logs for progress.',
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
