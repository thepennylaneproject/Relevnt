// netlify/functions/track_event.ts
/**
 * Analytics event tracking endpoint
 * Accepts batched events from the client and stores them in the database
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient, createResponse, handleCORS, verifyToken } from './utils/supabase'

type AnalyticsEvent = {
    event_name: string
    properties?: Record<string, any>
    page_path?: string
    user_agent?: string
    referrer?: string
    event_time?: string
    session_id?: string
}

type BatchPayload = {
    events: AnalyticsEvent[]
    session_id?: string
}

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

    try {
        const authHeader = event.headers.authorization || null
        const { userId } = await verifyToken(authHeader)

        // Parse request body
        const body: BatchPayload = event.body ? JSON.parse(event.body) : {}
        const { events, session_id } = body

        if (!events || !Array.isArray(events) || events.length === 0) {
            return createResponse(400, {
                success: false,
                error: 'Invalid payload: events array required',
            })
        }

        // Validate and sanitize each event
        const validatedEvents = events.map((evt) => {
            // Ensure no PII in properties (basic check)
            const sanitizedProperties = evt.properties || {}

            // Remove any potential PII fields
            delete sanitizedProperties.email
            delete sanitizedProperties.phone
            delete sanitizedProperties.ssn
            delete sanitizedProperties.resume_text
            delete sanitizedProperties.job_description_full

            return {
                user_id: userId || null,
                session_id: session_id || evt.session_id || null,
                event_name: evt.event_name,
                event_time: evt.event_time || new Date().toISOString(),
                properties: sanitizedProperties,
                page_path: evt.page_path || null,
                user_agent: evt.user_agent || event.headers['user-agent'] || null,
                referrer: evt.referrer || event.headers.referer || null,
            }
        })

        // Insert events in batch
        const supabase = createAdminClient()
        const { error } = await supabase.from('analytics_events').insert(validatedEvents)

        if (error) {
            console.error('track_event: failed to insert events', error)
            return createResponse(500, {
                success: false,
                error: 'Failed to store events',
            })
        }

        console.log(`track_event: stored ${validatedEvents.length} events`)

        return createResponse(200, {
            success: true,
            count: validatedEvents.length,
        })
    } catch (err) {
        console.error('track_event: unexpected error', err)
        return createResponse(500, {
            success: false,
            error: 'Internal server error',
            message: err instanceof Error ? err.message : String(err),
        })
    }
}
