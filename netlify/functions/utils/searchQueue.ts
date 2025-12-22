// netlify/functions/utils/searchQueue.ts
/**
 * Search Queue System
 * 
 * Manages intelligent, rate-aware job search execution.
 * Prioritizes searches based on user demand and freshness.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface SearchTask {
    id: string
    source_slug: string
    keywords: string | null
    location: string | null
    params: Record<string, any>
    priority: number
    last_run_at: string | null
    next_run_after: string
    run_count: number
}

export interface SourceRateLimit {
    source_slug: string
    max_per_hour: number
    cooldown_minutes: number
    is_active: boolean
}

/**
 * Get the next batch of search tasks to execute
 */
export async function getNextSearchTasks(
    supabase: SupabaseClient,
    limit: number = 10
): Promise<SearchTask[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from('search_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('next_run_after', now)
        .order('priority', { ascending: false })
        .order('last_run_at', { ascending: true, nullsFirst: true })
        .limit(limit)

    if (error) {
        console.error('[SearchQueue] Failed to fetch tasks:', error)
        return []
    }

    return data || []
}

/**
 * Mark a task as running
 */
export async function markTaskRunning(
    supabase: SupabaseClient,
    taskId: string
): Promise<void> {
    await supabase
        .from('search_queue')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', taskId)
}

/**
 * Complete a task and schedule next run
 */
export async function completeTask(
    supabase: SupabaseClient,
    taskId: string,
    resultCount: number,
    cooldownMinutes: number
): Promise<void> {
    const now = new Date()
    const nextRun = new Date(now.getTime() + cooldownMinutes * 60 * 1000)

    await supabase
        .from('search_queue')
        .update({
            status: 'pending',
            last_run_at: now.toISOString(),
            next_run_after: nextRun.toISOString(),
            last_result_count: resultCount,
            updated_at: now.toISOString()
        })
        .eq('id', taskId)
}


/**
 * Get source rate limits
 */
export async function getSourceRateLimits(
    supabase: SupabaseClient
): Promise<Map<string, SourceRateLimit>> {
    const { data, error } = await supabase
        .from('source_rate_limits')
        .select('*')
        .eq('is_active', true)

    if (error || !data) {
        console.error('[SearchQueue] Failed to fetch rate limits:', error)
        return new Map()
    }

    return new Map(data.map(r => [r.source_slug, r]))
}

/**
 * Seed the queue with default searches if empty
 */
export async function seedDefaultSearches(
    supabase: SupabaseClient
): Promise<number> {
    // Check if queue has pending items
    const { count } = await supabase
        .from('search_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    if ((count || 0) > 20) {
        return 0 // Queue is healthy
    }

    const defaultSearches = [
        { keywords: 'social media marketing', location: 'remote' },
        { keywords: 'content strategy', location: 'remote' },
        { keywords: 'marketing manager', location: 'US' },
        { keywords: 'digital marketing', location: 'remote' },
        { keywords: 'social media manager', location: 'US' },
        { keywords: 'content marketing', location: 'remote' },
        { keywords: 'brand strategy', location: 'US' },
        { keywords: 'copywriter', location: 'remote' },
        { keywords: 'marketing director', location: 'US' },
        { keywords: 'creative director', location: 'remote' },
    ]

    const sources = ['careerjet', 'remoteok', 'remotive', 'himalayas', 'jobicy']

    const tasks: Partial<SearchTask>[] = []

    for (const search of defaultSearches) {
        for (const source of sources) {
            tasks.push({
                source_slug: source,
                keywords: search.keywords,
                location: search.location,
                priority: 50,
                params: {}
            })
        }
    }

    const { error } = await supabase
        .from('search_queue')
        .upsert(tasks, {
            onConflict: 'source_slug,keywords,location',
            ignoreDuplicates: true
        })

    if (error) {
        console.error('[SearchQueue] Failed to seed defaults:', error)
        return 0
    }

    console.log(`[SearchQueue] Seeded ${tasks.length} default search tasks`)
    return tasks.length
}

/**
 * Seed queue from user search interests
 */
export async function seedFromUserInterests(
    supabase: SupabaseClient
): Promise<number> {
    const { data: interests, error } = await supabase
        .from('user_search_interests')
        .select('keywords, location, user_count, weight')
        .order('weight', { ascending: false })
        .limit(50)

    if (error || !interests) {
        console.error('[SearchQueue] Failed to fetch user interests:', error)
        return 0
    }

    const sources = ['careerjet', 'remoteok', 'remotive', 'himalayas']
    const tasks: any[] = []

    for (const interest of interests) {
        // Priority based on user count and weight
        const priority = Math.min(100, Math.round(50 + (interest.user_count * 5) + (interest.weight * 10)))

        for (const source of sources) {
            tasks.push({
                source_slug: source,
                keywords: interest.keywords,
                location: interest.location || 'US',
                priority,
                params: {}
            })
        }
    }

    if (tasks.length === 0) return 0

    const { error: upsertError } = await supabase
        .from('search_queue')
        .upsert(tasks, {
            onConflict: 'source_slug,keywords,location',
            ignoreDuplicates: false
        })

    if (upsertError) {
        console.error('[SearchQueue] Failed to seed from interests:', upsertError)
        return 0
    }

    console.log(`[SearchQueue] Seeded ${tasks.length} tasks from user interests`)
    return tasks.length
}
