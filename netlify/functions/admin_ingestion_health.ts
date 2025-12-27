// netlify/functions/admin_ingestion_health.ts
/**
 * Admin endpoint to fetch ingestion health and recent runs
 * Protected by ADMIN_SECRET environment variable
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient, createResponse, handleCORS } from './utils/supabase'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret'

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.queryStringParameters?.admin_secret
    if (adminSecret !== ADMIN_SECRET) {
        return createResponse(403, {
            success: false,
            error: 'Forbidden: Invalid admin secret',
        })
    }

    try {
        const supabase = createAdminClient()

        // Fetch latest run summary
        const { data: latestRun, error: latestRunError } = await supabase
            .from('job_ingestion_runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (latestRunError) {
            console.error('admin_ingestion_health: failed to fetch latest run', latestRunError)
        }

        // Fetch source health
        const { data: sourceHealth, error: sourceHealthError } = await supabase
            .from('job_source_health')
            .select('*')
            .order('source')

        if (sourceHealthError) {
            console.error('admin_ingestion_health: failed to fetch source health', sourceHealthError)
            return createResponse(500, {
                success: false,
                error: 'Failed to fetch source health',
            })
        }

        // Fetch last 20 runs
        const { data: recentRuns, error: recentRunsError } = await supabase
            .from('job_ingestion_runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(20)

        if (recentRunsError) {
            console.error('admin_ingestion_health: failed to fetch recent runs', recentRunsError)
            return createResponse(500, {
                success: false,
                error: 'Failed to fetch recent runs',
            })
        }

        // Fetch recent healing attempts (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: healingHistory, error: healingError } = await supabase
            .from('ingestion_healing_log')
            .select('*')
            .gte('attempted_at', oneDayAgo)
            .order('attempted_at', { ascending: false })
            .limit(50)

        if (healingError) {
            console.warn('admin_ingestion_health: failed to fetch healing history', healingError)
            // Don't fail the whole request, just exclude healing data
        }

        // Calculate healing stats
        const healingStats = {
            total24h: healingHistory?.length || 0,
            successful: healingHistory?.filter((h: any) => h.healing_result === 'success').length || 0,
            failed: healingHistory?.filter((h: any) => h.healing_result === 'failed').length || 0,
            escalated: healingHistory?.filter((h: any) => h.healing_result === 'escalated').length || 0,
        }

        return createResponse(200, {
            success: true,
            data: {
                latestRun: latestRun || null,
                sourceHealth: sourceHealth || [],
                recentRuns: recentRuns || [],
                healingHistory: healingHistory || [],
                healingStats,
            },
        })
    } catch (err) {
        console.error('admin_ingestion_health: unexpected error', err)
        return createResponse(500, {
            success: false,
            error: 'Internal server error',
            message: err instanceof Error ? err.message : String(err),
        })
    }
}
