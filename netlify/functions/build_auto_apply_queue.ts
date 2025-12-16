// netlify/functions/auto_apply/build_queue.ts
// Auto-Apply Queue Builder - Evaluates jobs against rules and queues eligible ones
// NO SUBMISSION - Only queueing

import type { Handler, HandlerEvent } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { requireAuth } from './utils/auth'
import { evaluateRule } from './auto_apply/rules'
import type {
    AutoApplyRule,
    UserPersona,
    Job,
    JobMatch,
    UserContext,
    AutoApplyLog,
    RuleEvaluationInput,
} from './auto_apply/types'

/**
 * POST /.netlify/functions/build_auto_apply_queue
 * 
 * Builds the auto-apply queue for a user by evaluating job matches against rules
 * 
 * Authentication:
 * - User JWT via Authorization header, OR
 * - Admin secret via X-Admin-Secret header + user_id in body
 */
export const handler: Handler = async (event) => {
    try {
        // Only allow POST
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
            }
        }

        // Check for admin override
        const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
        const isAdmin = adminSecret === process.env.ADMIN_SECRET && adminSecret !== undefined

        let userId: string

        if (isAdmin) {
            // Admin mode: get user_id from request body
            const body = JSON.parse(event.body || '{}')
            userId = body.user_id

            if (!userId) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'user_id required for admin mode' }),
                }
            }

            console.log(`[Admin] Building queue for user ${userId}`)
        } else {
            // Normal mode: require JWT authentication
            const user = await requireAuth(event)
            userId = user.id
        }

        const supabase = createAdminClient()

        // 1. Load user profile and tier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

        if (profileError) {
            console.error('Failed to load user profile:', profileError)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to load user profile' }),
            }
        }

        const userTier = (profile?.tier as 'free' | 'pro' | 'premium' | 'coach') || 'free'

        // 2. Load enabled auto_apply_rules for this user
        const { data: rules, error: rulesError } = await supabase
            .from('auto_apply_rules')
            .select('*')
            .eq('user_id', userId)
            .eq('enabled', true)

        if (rulesError) {
            console.error('Failed to load rules:', rulesError)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to load auto-apply rules' }),
            }
        }

        if (!rules || rules.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No enabled auto-apply rules found',
                    queued: 0,
                    skipped: 0,
                    logs: [],
                }),
            }
        }

        let totalQueued = 0
        let totalSkipped = 0
        const allLogs: AutoApplyLog[] = []

        // 3. Process each rule
        for (const rule of rules as AutoApplyRule[]) {
            console.log(`Processing rule: ${rule.name} (${rule.id})`)

            // Load persona if specified
            let persona: UserPersona | null = null
            if (rule.persona_id) {
                const { data: personaData, error: personaError } = await supabase
                    .from('user_personas')
                    .select('*')
                    .eq('id', rule.persona_id)
                    .eq('user_id', userId)
                    .maybeSingle()

                if (personaError) {
                    console.warn(`Failed to load persona ${rule.persona_id}: `, personaError)
                } else if (personaData) {
                    persona = personaData as UserPersona
                }
            }

            // Get current week application count for this user
            const { data: currentWeekApps, error: countError } = await supabase
                .from('auto_apply_logs')
                .select('id')
                .eq('user_id', userId)
                .eq('status', 'queued')
                .gte('created_at', getStartOfWeek().toISOString())

            const currentWeekCount = currentWeekApps?.length || 0

            if (countError) {
                console.warn('Failed to count current week applications:', countError)
            }

            const userContext: UserContext = {
                user_id: userId,
                tier: userTier,
                current_week_application_count: currentWeekCount,
                total_applications: 0, // Could query total if needed
                has_resume: !!persona?.resume_id,
            }

            // 4. Query job_matches for candidates
            const { data: matches, error: matchesError } = await supabase
                .from('job_matches')
                .select(`
    *,
    jobs(*)
        `)
                .eq('user_id', userId)
                .eq('is_dismissed', false)
                .order('match_score', { ascending: false })
                .limit(100) // Top 100 matches

            if (matchesError) {
                console.error('Failed to load job matches:', matchesError)
                continue
            }

            if (!matches || matches.length === 0) {
                console.log(`No job matches found for rule ${rule.name}`)
                continue
            }

            // 5. Evaluate each candidate
            for (const match of matches) {
                const job = Array.isArray((match as any).jobs)
                    ? (match as any).jobs[0]
                    : (match as any).jobs

                if (!job) {
                    console.warn(`No job data for match ${match.id}`)
                    continue
                }

                // Check if already queued or applied
                const { data: existing, error: existingError } = await supabase
                    .from('auto_apply_queue')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('job_id', job.id)
                    .eq('rule_id', rule.id)
                    .maybeSingle()

                if (existing) {
                    console.log(`Job ${job.id} already queued for rule ${rule.id}`)
                    continue
                }

                // Also check if already applied
                const { data: appliedExists, error: appliedError } = await supabase
                    .from('applications')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('job_id', job.id)
                    .neq('status', 'withdrawn')
                    .maybeSingle()

                if (appliedExists) {
                    console.log(`Job ${job.id} already applied`)
                    continue
                }

                // Evaluate rule
                const evalInput: RuleEvaluationInput = {
                    rule,
                    persona,
                    job: job as Job,
                    match: match as JobMatch,
                    now: new Date(),
                    userContext,
                }

                const result = evaluateRule(evalInput)

                if (result.eligible) {
                    // Queue this job
                    const { error: queueError } = await supabase
                        .from('auto_apply_queue')
                        .insert({
                            user_id: userId,
                            persona_id: rule.persona_id,
                            job_id: job.id,
                            rule_id: rule.id,
                            status: 'pending',
                            priority: 0,
                            metadata: {
                                match_score: match.match_score,
                                evaluation_reasons: result.reasons,
                                computed: result.computed,
                            },
                            scheduled_for: new Date().toISOString(),
                        })

                    if (queueError) {
                        console.error(`Failed to queue job ${job.id}: `, queueError)

                        // Log the skip
                        allLogs.push({
                            user_id: userId,
                            rule_id: rule.id,
                            job_id: job.id,
                            persona_id: rule.persona_id,
                            status: 'skipped',
                            submission_url: null,
                            error_message: `Failed to insert into queue: ${queueError.message} `,
                        })
                        totalSkipped++
                    } else {
                        console.log(`Queued job ${job.id} for rule ${rule.id}`)

                        // Log the queue action
                        allLogs.push({
                            user_id: userId,
                            rule_id: rule.id,
                            job_id: job.id,
                            persona_id: rule.persona_id,
                            status: 'queued',
                            submission_url: job.external_url,
                            error_message: null,
                        })
                        totalQueued++
                    }
                } else {
                    // Not eligible - log why
                    console.log(`Skipped job ${job.id}: ${result.reasons.join('; ')} `)

                    allLogs.push({
                        user_id: userId,
                        rule_id: rule.id,
                        job_id: job.id,
                        persona_id: rule.persona_id,
                        status: 'skipped',
                        submission_url: job.external_url,
                        error_message: result.reasons.join('; '),
                    })
                    totalSkipped++
                }
            }

            // Update rule last_run_at
            await supabase
                .from('auto_apply_rules')
                .update({ last_run_at: new Date().toISOString() })
                .eq('id', rule.id)
        }

        // 6. Write all logs to database
        if (allLogs.length > 0) {
            const { error: logError } = await supabase
                .from('auto_apply_logs')
                .insert(allLogs)

            if (logError) {
                console.error('Failed to write logs:', logError)
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Queue building complete',
                queued: totalQueued,
                skipped: totalSkipped,
                rules_processed: rules.length,
                logs: allLogs.map(log => ({
                    job_id: log.job_id,
                    rule_id: log.rule_id,
                    status: log.status,
                    reasons: log.error_message,
                })),
            }),
        }
    } catch (error) {
        console.error('Unexpected error in build_auto_apply_queue:', error)

        if ((error as Error).message === 'Unauthorized') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' }),
            }
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message,
            }),
        }
    }
}

/**
 * Get start of current week (Monday 00:00:00)
 */
function getStartOfWeek(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Monday is 1
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
}
