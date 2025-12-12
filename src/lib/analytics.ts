// src/lib/analytics.ts
/**
 * Analytics Client
 * Batches and sends analytics events to the server
 * Features: batching, retry, offline handling
 */

import { supabase } from './supabase'

export type AnalyticsEventData = {
    event_name: string
    properties?: Record<string, any>
    page_path?: string
    session_id?: string
}

class AnalyticsClient {
    private queue: AnalyticsEventData[] = []
    private sessionId: string
    private flushInterval: number = 10000 // 10 seconds
    private batchSize: number = 20
    private flushTimer: ReturnType<typeof setTimeout> | null = null
    private isOnline: boolean = navigator.onLine
    private endpoint: string = '/.netlify/functions/track_event'

    constructor() {
        this.sessionId = this.generateSessionId()
        this.setupFlushTimer()
        this.setupOnlineListener()
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    }

    private setupFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flush()
        }, this.flushInterval)
    }

    private setupOnlineListener(): void {
        window.addEventListener('online', () => {
            this.isOnline = true
            this.flush()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
        })
    }

    /**
     * Track an analytics event
     */
    track(event_name: string, properties?: Record<string, any>): void {
        const event: AnalyticsEventData = {
            event_name,
            properties: properties || {},
            page_path: window.location.pathname,
            session_id: this.sessionId,
        }

        this.queue.push(event)

        if (import.meta.env.DEV) {
            console.log('[Analytics]', event_name, properties)
        }

        // Flush immediately if batch size reached
        if (this.queue.length >= this.batchSize) {
            this.flush()
        }
    }

    /**
     * Flush queued events to the server
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0 || !this.isOnline) {
            return
        }

        const eventsToSend = [...this.queue]
        this.queue = []

        try {
            const { data: session } = await supabase.auth.getSession()
            const accessToken = session?.session?.access_token || null

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`
            }

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    events: eventsToSend.map((evt) => ({
                        ...evt,
                        event_time: new Date().toISOString(),
                        user_agent: navigator.userAgent,
                        referrer: document.referrer,
                    })),
                    session_id: this.sessionId,
                }),
            })

            if (!response.ok) {
                console.error('[Analytics] Failed to send events:', response.statusText)
                // Re-queue events for retry (with limit to avoid infinite growth)
                if (this.queue.length < 100) {
                    this.queue.push(...eventsToSend)
                }
            }
        } catch (err) {
            console.error('[Analytics] Error sending events:', err)
            // Re-queue events for retry
            if (this.queue.length < 100) {
                this.queue.push(...eventsToSend)
            }
        }
    }

    /**
     * Cleanup on unmount
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer)
        }
        this.flush()
    }
}

// Singleton instance
export const analytics = new AnalyticsClient()

// Flush on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        analytics.flush()
    })
}
