
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { routeLegacyTask } from './ai/legacyTaskRouter'
import type { UserTier } from '../../src/lib/ai/types'

// Type for settings summary received from client
interface SettingsSummary {
    settings_configured: boolean
    missing: string[]
    persona: {
        id: string | null
        title: string | null
    }
    hard_constraints: {
        seniority_levels: string[]
    remote_preference: 'remote' | 'hybrid' | 'onsite' | null
        min_salary: number | null
        needs_sponsorship: boolean | null
    }
    soft_preferences: {
        skill_emphasis: string[]
        relocation: string | null
        travel: string | null
    }
    operational: {
        automation_enabled: boolean
        auto_apply_max_apps_per_day: number | null
        notifications: {
            high_match: boolean
            application_updates: boolean
            weekly_digest: boolean
        }
    }
}

// Helper to fetch user tier
async function getUserTier(userId: string): Promise<UserTier> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single()

    if (error || !data) {
        console.warn('Could not fetch user tier, defaulting to free', error)
        return 'free'
    }
    return (data.tier as UserTier) || 'free'
}

// Build system instruction from settings constraints
function buildConstraintInstruction(summary: SettingsSummary): string {
    const lines: string[] = []
    
    lines.push('## User Context')
    lines.push('')
    
    // Persona first - this is the context lens
    if (summary.persona.title) {
        lines.push(`**Active persona**: ${summary.persona.title}`)
        lines.push('')
    }
    
    lines.push('## Hard Constraints')
    lines.push('')
    lines.push('You MUST obey the following. Do not recommend options that violate them.')
    lines.push('')
    
    // Seniority - enforceable language
    if (summary.hard_constraints.seniority_levels.length > 0) {
        lines.push(`**Seniority**: Only recommend roles within these levels: ${summary.hard_constraints.seniority_levels.join(', ')}.`)
    }
    
    // Remote preference - symmetric and explicit
    if (summary.hard_constraints.remote_preference) {
        const remote = summary.hard_constraints.remote_preference
        if (remote === 'remote') {
            lines.push('**Work location**: Remote only. Do not suggest hybrid or onsite positions.')
        } else if (remote === 'hybrid') {
            lines.push('**Work location**: Hybrid preferred. Do not suggest remote-only or onsite-only unless you explain why.')
        } else if (remote === 'onsite') {
            lines.push('**Work location**: Onsite preferred. Do not suggest remote-only or hybrid unless you explain why.')
        }
    }
    
    // Salary
    if (summary.hard_constraints.min_salary !== null) {
        const salaryK = Math.round(summary.hard_constraints.min_salary / 1000)
        lines.push(`**Minimum salary**: $${salaryK}K or higher. Do not suggest roles below this.`)
    }
    
    // Sponsorship: only mention when true (hard exclusion)
    // false and null: omit entirely to reduce noise
    if (summary.hard_constraints.needs_sponsorship === true) {
        lines.push('**Visa sponsorship**: Required. Only consider roles that offer sponsorship.')
    }
    
    lines.push('')
    lines.push('## Soft Preferences')
    lines.push('')
    lines.push('You may bend these if clearly beneficial, but note the departure explicitly.')
    lines.push('')
    
    if (summary.soft_preferences.skill_emphasis.length > 0) {
        lines.push(`**Skill emphasis**: ${summary.soft_preferences.skill_emphasis.join(', ')}`)
    }
    
    if (summary.soft_preferences.relocation) {
        lines.push(`**Relocation**: ${summary.soft_preferences.relocation}`)
    }
    
    if (summary.soft_preferences.travel) {
        lines.push(`**Travel**: ${summary.soft_preferences.travel}`)
    }
    
    return lines.join('\n')
}

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    if (event.httpMethod !== 'POST') {
        return createResponse(405, { error: 'Method not allowed' })
    }

    // 1. Auth
    const authHeader = event.headers.authorization || event.headers.Authorization
    const { userId, error: authError } = await verifyToken(authHeader)
    if (authError || !userId) {
        return createResponse(401, { error: authError || 'Unauthorized' })
    }

    try {
        // 2. Parse Body
        const body = JSON.parse(event.body || '{}')
        const {
            question,
            mode = 'default',
            roleTitle,
            companyName,
            jobDescription,
            resumeContext,
            settingsSummary,
        } = body

        if (!question || typeof question !== 'string') {
            return createResponse(400, { error: 'Missing question' })
        }

        // 3. Check settingsSummary
        // If settingsSummary is missing entirely, treat as incomplete
        if (!settingsSummary) {
            return createResponse(200, {
                ok: false,
                incomplete_settings: true,
                missing: [],
                message: 'Settings summary not provided. Please update your client or configure your settings.',
            })
        }

        // If settings_configured is false, refuse with structured response
        if (!settingsSummary.settings_configured) {
            const missingLabels: Record<string, string> = {
                persona: 'Active persona',
                seniority_levels: 'Seniority',
                remote_preference: 'Remote preference',
            }
            const missingList = (settingsSummary.missing || [])
                .map((key: string) => missingLabels[key] || key)
                .join(', ')

            return createResponse(200, {
                ok: false,
                incomplete_settings: true,
                missing: settingsSummary.missing || [],
                message: `To give reliable help, I need a couple settings first: ${missingList || 'some settings'}. Once those are set, I can answer without guessing.`,
            })
        }

        // 4. Get Tier
        const tier = await getUserTier(userId)

        // 5. Build constraint instruction
        const constraintInstruction = buildConstraintInstruction(settingsSummary as SettingsSummary)

        // 6. Run AI via Modular Router
        const result = await routeLegacyTask('application-question-answer', {
            question,
            mode,
            context: {
                roleTitle,
                companyName,
                jobDescriptionExcerpt: jobDescription ? jobDescription.slice(0, 1000) : 'N/A',
                resumeContext: resumeContext || 'No resume context provided.',
                constraintInstruction,
            }
        }, {
            userId,
            tier,
            traceId: body.traceId
        })

        if (!result.ok) {
            console.error('AI run failed', result)
            return createResponse(502, {
                error: 'AI generation failed',
                details: result.error_message
            })
        }

        // Output normalization (handle the { success: true, data: { ... } } wrapper)
        const output = (result.output as any)?.data || result.output

        return createResponse(200, {
            ok: true,
            output: output,
            trace_id: result.trace_id,
            provider: result.provider,
            model: result.model,
            cache_hit: result.cache_hit,
        })
    } catch (err: any) {
        console.error('application_helper error', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
