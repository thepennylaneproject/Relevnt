// netlify/functions/admin_ingest_trigger.ts
/**
 * Admin endpoint to manually trigger job ingestion
 * Protected by ADMIN_SECRET environment variable
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

        // If sources array is provided, run only those sources
        // Otherwise run all sources
        const sourceSlug = sources && sources.length === 1 ? sources[0] : null

        console.log('admin_ingest_trigger: starting ingestion', { sourceSlug, sources })

        const results = await runIngestion(sourceSlug, 'admin')

        return createResponse(200, {
            success: true,
            results,
            message: `Ingestion triggered for ${sourceSlug || 'all sources'}`,
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
