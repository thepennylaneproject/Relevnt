// netlify/functions/search_jobs.ts
/**
 * Search jobs in the jobs table with filters.
 * 
 * Supports:
 * - GET /.netlify/functions/search_jobs?q=engineer&location=remote&...
 * - POST /.netlify/functions/search_jobs with JSON body
 * 
 * Query parameters / body fields:
 * - q: free text search (searches title, company, description)
 * - location: filter by location (partial match)
 * - remote_type: 'remote' | 'hybrid' | 'onsite'
 * - min_salary: minimum salary_min value
 * - max_salary: maximum salary_max value
 * - source_slug: filter by source (can be array or comma-separated)
 * - limit: number of results (default 20, max 100)
 * - offset: offset for pagination (default 0)
 */

import type { Handler, HandlerResponse } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface SearchParams {
    q?: string
    location?: string
    remote_type?: 'remote' | 'hybrid' | 'onsite' | null
    min_salary?: number
    max_salary?: number
    source_slug?: string[]
    limit?: number
    offset?: number
}

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
}

function parseSearchParams(event: any): SearchParams {
    const qs = event.queryStringParameters || {}
    let body: any = {}

    if (event.body) {
        try {
            body = JSON.parse(event.body)
        } catch {
            // Ignore JSON parse errors
        }
    }

    // Merge query string and body (body takes precedence)
    const merged = { ...qs, ...body }

    // Parse source_slug as array
    let sourceSlugs: string[] = []
    if (merged.source_slug) {
        if (Array.isArray(merged.source_slug)) {
            sourceSlugs = merged.source_slug
        } else if (typeof merged.source_slug === 'string') {
            sourceSlugs = merged.source_slug.split(',').map((s: string) => s.trim())
        }
    }

    return {
        q: merged.q || undefined,
        location: merged.location || undefined,
        remote_type: merged.remote_type || undefined,
        min_salary: merged.min_salary ? Number(merged.min_salary) : undefined,
        max_salary: merged.max_salary ? Number(merged.max_salary) : undefined,
        source_slug: sourceSlugs.length > 0 ? sourceSlugs : undefined,
        limit: Math.min(Math.max(1, Number(merged.limit) || 20), 100),
        offset: Math.max(0, Number(merged.offset) || 0),
    }
}

export const handler: Handler = async (event): Promise<HandlerResponse> => {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: '',
        }
    }

    try {
        const params = parseSearchParams(event)
        const supabase = createAdminClient()

        // Build query
        let query = supabase
            .from('jobs')
            .select('*', { count: 'exact' })

        // Free text search on title, company, description
        if (params.q) {
            const searchTerm = `%${params.q}%`
            query = query.or(
                `title.ilike.${searchTerm},company.ilike.${searchTerm},description.ilike.${searchTerm}`
            )
        }

        // Location filter (partial match)
        if (params.location) {
            query = query.ilike('location', `%${params.location}%`)
        }

        // Remote type filter
        if (params.remote_type) {
            query = query.eq('remote_type', params.remote_type)
        }

        // Salary filters
        if (params.min_salary) {
            query = query.gte('salary_min', params.min_salary)
        }
        if (params.max_salary) {
            query = query.lte('salary_max', params.max_salary)
        }

        // Source slug filter
        if (params.source_slug && params.source_slug.length > 0) {
            query = query.in('source_slug', params.source_slug)
        }

        // Only active jobs
        query = query.eq('is_active', true)

        // Order by posted_date descending, then created_at
        query = query
            .order('posted_date', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })

        // Pagination
        query = query.range(params.offset!, params.offset! + params.limit! - 1)

        const { data, error, count } = await query

        if (error) {
            console.error('search_jobs: query error', error)
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    error: 'Database query failed',
                }),
            }
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                data: data || [],
                pagination: {
                    total: count ?? 0,
                    limit: params.limit,
                    offset: params.offset,
                    hasMore: (params.offset! + params.limit!) < (count ?? 0),
                },
            }),
        }
    } catch (err) {
        console.error('search_jobs: unexpected error', err)
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
            }),
        }
    }
}

