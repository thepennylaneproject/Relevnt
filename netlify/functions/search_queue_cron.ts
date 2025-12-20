// netlify/functions/search_queue_cron.ts
/**
 * Search Queue Cron
 * 
 * Runs every 15 minutes to execute prioritized search tasks.
 * Uses the search queue for intelligent, rate-aware job fetching.
 */
import type { Config } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import {
    getNextSearchTasks,
    getSourceRateLimits,
    markTaskRunning,
    completeTask,
    seedDefaultSearches,
    seedFromUserInterests,
    type SearchTask,
    type SourceRateLimit
} from './utils/searchQueue'
import { ingestFromSource } from './ingest_jobs'

const MAX_TASKS_PER_RUN = 15
const MAX_CONCURRENT = 5

export default async () => {
    const startedAt = Date.now()
    const supabase = createAdminClient()

    console.log('[SearchQueueCron] Starting queue-driven ingestion')

    try {
        // 1. Ensure queue has tasks
        await seedDefaultSearches(supabase)
        await seedFromUserInterests(supabase)

        // 2. Get rate limits
        const rateLimits = await getSourceRateLimits(supabase)

        // 3. Get next batch of tasks
        const tasks = await getNextSearchTasks(supabase, MAX_TASKS_PER_RUN)

        if (tasks.length === 0) {
            console.log('[SearchQueueCron] No pending tasks')
            return new Response(JSON.stringify({
                success: true,
                message: 'No pending tasks',
                durationMs: Date.now() - startedAt
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        console.log(`[SearchQueueCron] Processing ${tasks.length} tasks`)

        // 4. Group tasks by source for rate limiting
        const tasksBySource = new Map<string, SearchTask[]>()
        for (const task of tasks) {
            const list = tasksBySource.get(task.source_slug) || []
            list.push(task)
            tasksBySource.set(task.source_slug, list)
        }

        // 5. Execute tasks with concurrency control
        const results: { taskId: string; source: string; count: number; success: boolean }[] = []
        const executing: Promise<void>[] = []

        for (const [sourceSlug, sourceTasks] of tasksBySource) {
            const limit = rateLimits.get(sourceSlug)
            const cooldown = limit?.cooldown_minutes || 30

            for (const task of sourceTasks) {
                // Wait if too many concurrent
                if (executing.length >= MAX_CONCURRENT) {
                    await Promise.race(executing)
                }

                const taskPromise = executeTask(supabase, task, cooldown, results)
                executing.push(taskPromise)

                // Remove completed promises
                taskPromise.finally(() => {
                    const idx = executing.indexOf(taskPromise)
                    if (idx > -1) executing.splice(idx, 1)
                })
            }
        }

        // Wait for all to complete
        await Promise.all(executing)

        const totalJobs = results.reduce((sum, r) => sum + r.count, 0)
        const successCount = results.filter(r => r.success).length

        console.log('[SearchQueueCron] Completed', {
            durationMs: Date.now() - startedAt,
            tasksExecuted: results.length,
            successCount,
            totalJobsIngested: totalJobs
        })

        return new Response(JSON.stringify({
            success: true,
            durationMs: Date.now() - startedAt,
            tasksExecuted: results.length,
            successCount,
            totalJobsIngested: totalJobs,
            results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (err) {
        console.error('[SearchQueueCron] Failed:', err)
        return new Response(JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            durationMs: Date.now() - startedAt
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

async function executeTask(
    supabase: ReturnType<typeof createAdminClient>,
    task: SearchTask,
    cooldownMinutes: number,
    results: { taskId: string; source: string; count: number; success: boolean }[]
): Promise<void> {
    try {
        await markTaskRunning(supabase, task.id)

        console.log(`[SearchQueueCron] Executing: ${task.source_slug} - "${task.keywords}" (${task.location})`)

        // Build search params
        const searchParams = {
            keywords: task.keywords || 'software developer',
            location: task.location || 'US',
            ...task.params
        }

        // Execute the search via existing ingestion
        const count = await ingestFromSource(task.source_slug, searchParams, 'queue')

        await completeTask(supabase, task.id, count, cooldownMinutes)

        results.push({
            taskId: task.id,
            source: task.source_slug,
            count,
            success: true
        })

    } catch (err) {
        console.error(`[SearchQueueCron] Task ${task.id} failed:`, err)

        // Mark as pending again with longer cooldown
        await completeTask(supabase, task.id, 0, cooldownMinutes * 2)

        results.push({
            taskId: task.id,
            source: task.source_slug,
            count: 0,
            success: false
        })
    }
}

export const config: Config = {
    schedule: '*/15 * * * *' // Every 15 minutes
}
