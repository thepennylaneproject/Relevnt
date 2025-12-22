
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { requireAuth } from './utils/auth'

export const handler: Handler = async (event) => {
    const supabase = createAdminClient()

    try {
        // Auth Check
        const user = await requireAuth(event)
        const userId = user.id

        // 1. Fetch Applications for the user
        const { data: apps, error: appsError } = await supabase
            .from('applications')
            .select('id, status, resume_id, company, position, resume_snapshot')
            .eq('user_id', userId)

        if (appsError) {
            console.error('[AppPerformance] Failed to fetch apps:', appsError)
            return { statusCode: 500, body: 'Failed to fetch application data' }
        }

        if (!apps || apps.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'No applications found yet.',
                    performanceByResume: []
                })
            }
        }

        // 2. Fetch Resumes to get names
        const { data: resumes, error: resumesError } = await supabase
            .from('resumes')
            .select('id, name')
            .eq('user_id', userId)

        const resumeMap = new Map((resumes || []).map(r => [r.id, r.name]))

        // 3. Aggregate Stats by Resume
        const stats: Record<string, {
            resumeId: string,
            resumeName: string,
            total: number,
            interviews: number,
            rejections: number,
            applied: number
        }> = {}

        apps.forEach(app => {
            const resumeId = app.resume_id || 'unknown'
            const resumeName = app.resume_snapshot?.name || resumeMap.get(resumeId) || 'Unknown Version'

            if (!stats[resumeId]) {
                stats[resumeId] = {
                    resumeId,
                    resumeName,
                    total: 0,
                    interviews: 0,
                    rejections: 0,
                    applied: 0
                }
            }

            const s = stats[resumeId]
            s.total++

            if (app.status === 'interviewing' || app.status === 'offer' || app.status === 'accepted') {
                s.interviews++
            } else if (app.status === 'rejected') {
                s.rejections++
            } else if (app.status === 'applied') {
                s.applied++
            }
        })

        // 4. Calculate Rates and Find Best
        const performance = Object.values(stats).map(s => ({
            ...s,
            interviewRate: s.total > 0 ? Math.round((s.interviews / s.total) * 100) : 0,
            rejectionRate: s.total > 0 ? Math.round((s.rejections / s.total) * 100) : 0
        }))

        // Sort by interview rate, secondary by total volume
        const sorted = [...performance].sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total)

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                performanceByResume: sorted,
                totalApplications: apps.length,
                timestamp: new Date().toISOString()
            })
        }

    } catch (err: any) {
        if (err.message === 'Unauthorized') {
            return { statusCode: 401, body: 'Unauthorized' }
        }
        console.error('[AppPerformance] Unexpected error:', err)
        return { statusCode: 500, body: err.message }
    }
}
