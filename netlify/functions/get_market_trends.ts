
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { aggregateUserProfile } from '../../src/lib/scoring'
import { requireAuth } from './utils/auth'

export const handler: Handler = async (event) => {
    const supabase = createAdminClient()

    try {
        // Auth Check
        const user = await requireAuth(event)
        const userId = user.id

        // 1. Aggregate User Profile
        const profile = await aggregateUserProfile(supabase, userId)
        if (!profile) {
            return { statusCode: 404, body: 'User profile not found' }
        }

        const targetTitles = [profile.primary_title, ...profile.related_titles].filter(Boolean)
        if (targetTitles.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'No target titles defined. Update your profile to see market trends.',
                    topSkills: [],
                    skillGaps: []
                })
            }
        }

        // 2. Query Jobs for Target Titles
        const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('required_skills, preferred_skills')
            .or(targetTitles.slice(0, 5).map(t => `title.ilike.%${t}%`).join(','))
            .not('required_skills', 'is', null)
            .order('created_at', { ascending: false })
            .limit(100)

        if (jobsError) {
            console.error('[MarketTrends] Failed to fetch jobs:', jobsError)
            return { statusCode: 500, body: 'Failed to fetch job data' }
        }

        // 3. Aggregate Skills
        const skillCounts: Record<string, number> = {}
        let totalJobs = jobs?.length || 0

        jobs?.forEach(job => {
            const allJobSkills = [
                ...(Array.isArray(job.required_skills) ? job.required_skills : []),
                ...(Array.isArray(job.preferred_skills) ? job.preferred_skills : [])
            ]

            const uniqueSkills = new Set(allJobSkills.map(s => s.toLowerCase().trim()))
            uniqueSkills.forEach(skill => {
                if (skill) {
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1
                }
            })
        })

        // 4. Calculate Scores and Gaps
        const sortedSkills = Object.entries(skillCounts)
            .map(([skill, count]) => ({
                skill,
                count,
                demandScore: Math.round((count / totalJobs) * 100)
            }))
            .sort((a, b) => b.count - a.count)

        const userSkills = new Set([
            ...profile.skills.map(s => s.toLowerCase().trim()),
            ...profile.resume_skills.map(s => s.toLowerCase().trim()),
            ...profile.required_skills.map(s => s.toLowerCase().trim())
        ])

        const topSkills = sortedSkills.slice(0, 10)
        const skillGaps = sortedSkills
            .filter(s => !userSkills.has(s.skill))
            .slice(0, 5)

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                targetTitles,
                totalJobsAnalyzed: totalJobs,
                topSkills,
                skillGaps,
                timestamp: new Date().toISOString()
            })
        }

    } catch (err: any) {
        if (err.message === 'Unauthorized') {
            return { statusCode: 401, body: 'Unauthorized' }
        }
        console.error('[MarketTrends] Unexpected error:', err)
        return { statusCode: 500, body: err.message }
    }
}
