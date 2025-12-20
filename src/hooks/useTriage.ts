
import { useMemo } from 'react'
import { useApplications } from './useApplications'
import { useNotifications } from './useNotifications'
import useMatchJobs from './useMatchJobs'

export interface TriageAction {
    id: string
    type: 'follow_up' | 'practice' | 'apply' | 'notification' | 'market_update'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    link: string
    meta?: any
}

export function useTriage() {
    const { applications, loading: appsLoading } = useApplications()
    const { notifications, loading: notifsLoading } = useNotifications()
    const { matches, loading: matchesLoading } = useMatchJobs()

    const actions = useMemo<TriageAction[]>(() => {
        const list: TriageAction[] = []

        // 1. High-priority follow-ups (Applied > 7 days ago with no update)
        applications.forEach(app => {
            if (app.status === 'applied') {
                const appliedDate = new Date(app.applied_date)
                const daysSinceApplied = Math.floor((new Date().getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))

                if (daysSinceApplied >= 7) {
                    list.push({
                        id: `followup-${app.id}`,
                        type: 'follow_up',
                        priority: daysSinceApplied >= 14 ? 'high' : 'medium',
                        title: `Follow up: ${app.position} at ${app.company}`,
                        description: `Applied ${daysSinceApplied} days ago. A quick nudge can revive the process.`,
                        link: `/applications`,
                        meta: { appId: app.id }
                    })
                }
            }
        })

        // 2. Interview Practice (If in 'interviewing' or 'in-progress' status)
        const activeApps = applications.filter(a => a.status === 'interviewing' || (a.status === 'in-progress' && a.interview_date))
        activeApps.forEach(app => {
            list.push({
                id: `practice-${app.id}`,
                type: 'practice',
                priority: 'high',
                title: `Practice for ${app.company}`,
                description: `You have an active interest or interview scheduled. Tune your performance.`,
                link: `/interview-prep`,
                meta: { appId: app.id }
            })
        })

        // 3. Top Tier Matches (>90%)
        matches.filter(m => m.score >= 90).slice(0, 3).forEach(m => {
            list.push({
                id: `apply-${m.job.id}`,
                type: 'apply',
                priority: 'high',
                title: `Elite Match: ${m.job.title}`,
                description: `${Math.round(m.score)}% match for your profile. Apply before it's stale.`,
                link: `/jobs`,
                meta: { jobId: m.job.id }
            })
        })

        // 4. Unread Notifications
        notifications.filter(n => !n.is_read).slice(0, 3).forEach(n => {
            list.push({
                id: `notif-${n.id}`,
                type: 'notification',
                priority: 'medium',
                title: n.title,
                description: n.message,
                link: n.link || '/dashboard'
            })
        })

        return list.sort((a, b) => {
            const priorityScore = { high: 3, medium: 2, low: 1 }
            return priorityScore[b.priority] - priorityScore[a.priority]
        })
    }, [applications, notifications, matches])

    return {
        actions,
        loading: appsLoading || notifsLoading || matchesLoading
    }
}
