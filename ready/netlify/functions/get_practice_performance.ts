import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { requireAuth } from './utils/auth'

export const handler: Handler = async (event) => {
    const supabase = createAdminClient()

    try {
        // Auth Check
        const user = await requireAuth(event)
        const userId = user.id

        // Fetch interview sessions for the user
        const { data: sessions, error: sessionsError } = await supabase
            .from('interview_sessions')
            .select('id, score, question, created_at, interview_prep_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (sessionsError) {
            console.error('[Performance] Failed to fetch sessions:', sessionsError)
            return { statusCode: 500, body: 'Failed to fetch session data' }
        }

        if (!sessions || sessions.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'No practice sessions found yet.',
                    performanceByPrep: [],
                    overallStats: {
                        totalSessions: 0,
                        averageScore: 0,
                        highScoreCount: 0,
                        lowScoreCount: 0
                    }
                })
            }
        }

        // Aggregate stats by interview prep
        const stats: Record<string, {
            prepId: string,
            total: number,
            scores: number[],
            avgScore: number,
            highScores: number,
            lowScores: number
        }> = {}

        sessions.forEach(session => {
            const prepId = session.interview_prep_id || 'standalone'
            
            if (!stats[prepId]) {
                stats[prepId] = {
                    prepId,
                    total: 0,
                    scores: [],
                    avgScore: 0,
                    highScores: 0,
                    lowScores: 0
                }
            }

            const s = stats[prepId]
            s.total++
            
            if (session.score !== null && session.score !== undefined) {
                s.scores.push(session.score)
                if (session.score >= 7) {
                    s.highScores++
                } else if (session.score <= 4) {
                    s.lowScores++
                }
            }
        })

        // Calculate averages
        const performance = Object.values(stats).map(s => ({
            ...s,
            avgScore: s.scores.length > 0 
                ? Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10
                : 0
        }))

        // Overall stats
        const allScores = sessions
            .filter(s => s.score !== null && s.score !== undefined)
            .map(s => s.score as number)
        
        const overallStats = {
            totalSessions: sessions.length,
            averageScore: allScores.length > 0 
                ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
                : 0,
            highScoreCount: allScores.filter(s => s >= 7).length,
            lowScoreCount: allScores.filter(s => s <= 4).length
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                performanceByPrep: performance,
                overallStats,
                totalSessions: sessions.length,
                timestamp: new Date().toISOString()
            })
        }

    } catch (err: any) {
        if (err.message === 'Unauthorized') {
            return { statusCode: 401, body: 'Unauthorized' }
        }
        console.error('[Performance] Unexpected error:', err)
        return { statusCode: 500, body: err.message }
    }
}
