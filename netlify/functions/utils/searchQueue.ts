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
        // Marketing & Social Media
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
        { keywords: 'SEO specialist', location: 'remote' },
        { keywords: 'email marketing', location: 'US' },
        { keywords: 'influencer marketing', location: 'remote' },
        { keywords: 'content creator', location: 'remote' },
        { keywords: 'brand manager', location: 'US' },
        { keywords: 'communications manager', location: 'US' },
        { keywords: 'public relations', location: 'remote' },

        // Creative & Design
        { keywords: 'graphic designer', location: 'remote' },
        { keywords: 'UI/UX designer', location: 'remote' },
        { keywords: 'video editor', location: 'remote' },
        { keywords: 'motion graphics', location: 'remote' },
        { keywords: 'photographer', location: 'US' },
        { keywords: 'art director', location: 'US' },
        { keywords: 'illustrator', location: 'remote' },

        // Beauty & Cosmetology
        { keywords: 'cosmetology instructor', location: 'US' },
        { keywords: 'beauty school', location: 'US' },
        { keywords: 'esthetician', location: 'US' },
        { keywords: 'beauty educator', location: 'US' },
        { keywords: 'salon manager', location: 'US' },
        { keywords: 'hair stylist', location: 'US' },
        { keywords: 'makeup artist', location: 'US' },
        { keywords: 'nail technician', location: 'US' },
        { keywords: 'spa manager', location: 'US' },
        { keywords: 'beauty consultant', location: 'US' },

        // Healthcare
        { keywords: 'registered nurse', location: 'US' },
        { keywords: 'healthcare administrator', location: 'US' },
        { keywords: 'medical assistant', location: 'US' },
        { keywords: 'physical therapist', location: 'US' },
        { keywords: 'mental health counselor', location: 'remote' },
        { keywords: 'pharmacy technician', location: 'US' },

        // Education
        { keywords: 'teacher', location: 'US' },
        { keywords: 'instructional designer', location: 'remote' },
        { keywords: 'curriculum developer', location: 'remote' },
        { keywords: 'academic advisor', location: 'US' },
        { keywords: 'education coordinator', location: 'US' },
        { keywords: 'training specialist', location: 'remote' },

        // Tech (diverse roles, not just engineering)
        { keywords: 'software engineer', location: 'remote' },
        { keywords: 'data analyst', location: 'remote' },
        { keywords: 'product manager', location: 'remote' },
        { keywords: 'project manager', location: 'remote' },
        { keywords: 'scrum master', location: 'remote' },
        { keywords: 'technical writer', location: 'remote' },
        { keywords: 'QA engineer', location: 'remote' },
        { keywords: 'devops engineer', location: 'remote' },
        { keywords: 'cybersecurity analyst', location: 'remote' },
        { keywords: 'customer success', location: 'remote' },
        { keywords: 'sales engineer', location: 'US' },
        { keywords: 'backend developer', location: 'remote' },
        { keywords: 'frontend developer', location: 'remote' },
        { keywords: 'machine learning engineer', location: 'remote' },
        { keywords: 'systems engineer', location: 'remote' },

        // Business & Finance
        { keywords: 'accountant', location: 'US' },
        { keywords: 'financial analyst', location: 'remote' },
        { keywords: 'business analyst', location: 'remote' },
        { keywords: 'human resources', location: 'US' },
        { keywords: 'recruiter', location: 'remote' },
        { keywords: 'operations manager', location: 'US' },
        { keywords: 'executive assistant', location: 'remote' },
        { keywords: 'office manager', location: 'US' },
        { keywords: 'financial advisor', location: 'US' },
        { keywords: 'tax consultant', location: 'remote' },

        // Hospitality & Retail
        { keywords: 'hotel manager', location: 'US' },
        { keywords: 'restaurant manager', location: 'US' },
        { keywords: 'event coordinator', location: 'US' },
        { keywords: 'retail manager', location: 'US' },
        { keywords: 'customer service', location: 'remote' },

        // Trades & Skilled Labor
        { keywords: 'electrician', location: 'US' },
        { keywords: 'plumber', location: 'US' },
        { keywords: 'HVAC technician', location: 'US' },
        { keywords: 'maintenance technician', location: 'US' },
        { keywords: 'automotive technician', location: 'US' },

        // Remote-first general
        { keywords: 'work from home', location: 'remote' },
        { keywords: 'remote', location: 'remote' },
        { keywords: 'hybrid', location: 'US' },

        // Additional high-demand roles for diversity
        { keywords: 'nurse practitioner', location: 'US' },
        { keywords: 'therapist', location: 'remote' },
        { keywords: 'consultant', location: 'remote' },
        { keywords: 'architect', location: 'remote' },
        { keywords: 'specialist', location: 'remote' },
        { keywords: 'administrator', location: 'US' },
        { keywords: 'coordinator', location: 'US' },
        { keywords: 'analyst', location: 'remote' },
    ]

    // All sources that support keyword-based searches
    const sources = [
        'jooble',           // Global aggregator with POST search
        'reed_uk',          // UK jobs with keyword search
        'careerjet',        // Global aggregator
        'remoteok',         // Remote jobs
        'remotive',         // Remote jobs
        'himalayas',        // Remote jobs
        'jobicy',           // Remote jobs
        'arbeitnow',        // European jobs
        'themuse',          // US jobs
        'adzuna_us',        // US aggregator
        'usajobs',          // Federal jobs
        'careeronestop',    // US government aggregator
        'jobdatafeeds',     // Global job aggregator with keyword support
        'jobspy',           // ✅ Multi-board web scraper (when enabled)
    ]

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

    const sources = [
        'jooble', 'reed_uk', 'careerjet', 'remoteok', 'remotive',
        'himalayas', 'jobicy', 'arbeitnow', 'themuse', 'adzuna_us',
        'usajobs', 'careeronestop'
    ]
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
