/**
 * Jobs table cleanup function
 *
 * Runs daily to delete stale jobs older than 90 days
 * Uses background function for extended timeout (can be long-running for large deletes)
 *
 * Retention logic:
 * - 0-30 days: Active ingestion (fresh)
 * - 30-90 days: Archive/historical (kept for context)
 * - 90+ days: Deleted (genuinely stale)
 */

import type { Handler, HandlerContext } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

export const handler: Handler = async (
  event: any,
  context: HandlerContext
) => {
  const startedAt = Date.now()
  const supabase = createAdminClient()

  console.log('[JobsCleanup] Starting stale jobs cleanup (90+ days)')

  try {
    // Get total jobs BEFORE cleanup
    const { count: totalBefore } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })

    // Calculate cutoff date: 90 days ago
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    const cutoffIso = cutoffDate.toISOString()

    console.log(`[JobsCleanup] Total jobs before cleanup: ${totalBefore}`)
    console.log(`[JobsCleanup] Deleting jobs with posted_date < ${cutoffIso}`)

    // Delete jobs older than 90 days
    const { data: deleted, error, count } = await supabase
      .from('jobs')
      .delete()
      .lt('posted_date', cutoffIso)
      .select('id', { count: 'exact' })

    if (error) {
      console.error('[JobsCleanup] Delete failed:', error)
      throw error
    }

    const deletedCount = count ?? 0

    // Get total jobs AFTER cleanup
    const { count: totalAfter } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })

    // Also count jobs with NULL posted_date (these won't be deleted but are problematic)
    const { count: nullPostedCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .is('posted_date', null)

    const duration = Date.now() - startedAt

    console.log(`[JobsCleanup] Successfully deleted ${deletedCount} jobs older than 90 days`)
    console.log(`[JobsCleanup] Total jobs: ${totalBefore} → ${totalAfter} (net change: ${totalAfter - totalBefore})`)
    console.log(`[JobsCleanup] Jobs with NULL posted_date: ${nullPostedCount} (these won't be deleted)`)
    console.log(`[JobsCleanup] Cleanup took ${duration}ms`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Jobs cleanup completed',
        deletedCount,
        cutoffDate: cutoffIso,
        durationMs: duration,
        totalBefore,
        totalAfter,
        netChange: totalAfter - totalBefore,
        jobsWithNullPostedDate: nullPostedCount,
      }),
    }
  } catch (err) {
    const duration = Date.now() - startedAt
    console.error(`[JobsCleanup] Fatal error after ${duration}ms:`, err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        durationMs: duration,
      }),
    }
  }
}
