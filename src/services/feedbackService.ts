/**
 * =============================================================================
 * Feedback Service
 * =============================================================================
 * 
 * Service for managing job feedback signals and automatic preference tuning.
 * 
 * Features:
 * - Record positive/negative feedback on jobs
 * - Track signal patterns by job attributes
 * - Automatically adjust persona preferences when threshold reached
 * - Support undo functionality
 * 
 * =============================================================================
 */

import { supabase } from '../lib/supabase'
import type { PersonaPreferences } from '../types/v2-personas'

// =============================================================================
// TYPES
// =============================================================================

export interface FeedbackSignal {
    id: string
    user_id: string
    persona_id: string
    job_id: string
    feedback_type: 'positive' | 'negative' | string
    industry?: string | null
    company_size?: string | null
    remote_type?: string | null
    location?: string | null
    created_at: string
}

export interface RecordFeedbackInput {
    personaId: string
    jobId: string
    type: 'positive' | 'negative'
    attributes: {
        industry?: string | null
        company_size?: string | null
        remote_type?: string | null
        location?: string | null
    }
}

export interface FeedbackStats {
    industries: Record<string, { positive: number; negative: number }>
    companySizes: Record<string, { positive: number; negative: number }>
    remoteTypes: Record<string, { positive: number; negative: number }>
    locations: Record<string, { positive: number; negative: number }>
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Number of signals required to trigger preference adjustment */
const SIGNAL_THRESHOLD = 3

/** Weight adjustment amounts */
const NEGATIVE_ADJUSTMENT = -0.15
const POSITIVE_ADJUSTMENT = 0.10

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Record a feedback signal for a job
 */
export async function recordFeedback(input: RecordFeedbackInput): Promise<FeedbackSignal> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
        .from('feedback_signals')
        .upsert({
            user_id: user.id,
            persona_id: input.personaId,
            job_id: input.jobId,
            feedback_type: input.type,
            industry: input.attributes.industry,
            company_size: input.attributes.company_size,
            remote_type: input.attributes.remote_type,
            location: input.attributes.location,
        }, {
            onConflict: 'persona_id,job_id',
        })
        .select()
        .single()

    if (error) {
        console.error('Error recording feedback:', error)
        throw new Error('Failed to record feedback')
    }

    // Process threshold checks after recording
    await processSignalThresholds(input.personaId)

    return data
}

/**
 * Remove a feedback signal (for undo functionality)
 */
export async function removeFeedbackSignal(jobId: string, personaId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('Not authenticated')
    }

    const { error } = await supabase
        .from('feedback_signals')
        .delete()
        .eq('job_id', jobId)
        .eq('persona_id', personaId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error removing feedback signal:', error)
        throw new Error('Failed to remove feedback signal')
    }
}

/**
 * Get all feedback signals for a persona
 */
export async function getSignalsForPersona(personaId: string): Promise<FeedbackSignal[]> {
    const { data, error } = await supabase
        .from('feedback_signals')
        .select('*')
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching signals:', error)
        throw new Error('Failed to fetch signals')
    }

    return data || []
}

/**
 * Get feedback statistics for a persona (for Settings display)
 */
export async function getFeedbackStats(personaId: string): Promise<FeedbackStats> {
    const signals = await getSignalsForPersona(personaId)

    const stats: FeedbackStats = {
        industries: {},
        companySizes: {},
        remoteTypes: {},
        locations: {},
    }

    for (const signal of signals) {
        // Industries
        if (signal.industry) {
            if (!stats.industries[signal.industry]) {
                stats.industries[signal.industry] = { positive: 0, negative: 0 }
            }
            if (signal.feedback_type === 'positive') {
                stats.industries[signal.industry].positive++
            } else {
                stats.industries[signal.industry].negative++
            }
        }

        // Company sizes
        if (signal.company_size) {
            if (!stats.companySizes[signal.company_size]) {
                stats.companySizes[signal.company_size] = { positive: 0, negative: 0 }
            }
            if (signal.feedback_type === 'positive') {
                stats.companySizes[signal.company_size].positive++
            } else {
                stats.companySizes[signal.company_size].negative++
            }
        }

        // Remote types
        if (signal.remote_type) {
            if (!stats.remoteTypes[signal.remote_type]) {
                stats.remoteTypes[signal.remote_type] = { positive: 0, negative: 0 }
            }
            if (signal.feedback_type === 'positive') {
                stats.remoteTypes[signal.remote_type].positive++
            } else {
                stats.remoteTypes[signal.remote_type].negative++
            }
        }

        // Locations
        if (signal.location) {
            if (!stats.locations[signal.location]) {
                stats.locations[signal.location] = { positive: 0, negative: 0 }
            }
            if (signal.feedback_type === 'positive') {
                stats.locations[signal.location].positive++
            } else {
                stats.locations[signal.location].negative++
            }
        }
    }

    return stats
}

// =============================================================================
// PREFERENCE ADJUSTMENT
// =============================================================================

/**
 * Check if any attribute has reached the threshold and adjust preferences
 */
async function processSignalThresholds(personaId: string): Promise<void> {
    const signals = await getSignalsForPersona(personaId)
    
    // Get current persona preferences
    const { data: persona, error: personaError } = await supabase
        .from('user_personas')
        .select('*, preferences:persona_preferences(*)')
        .eq('id', personaId)
        .single()

    if (personaError || !persona) {
        console.error('Error fetching persona:', personaError)
        return
    }

    const preferences = persona.preferences as PersonaPreferences | null
    if (!preferences) {
        console.warn('Persona has no preferences')
        return
    }

    // Group signals by attribute
    const industrySignals = groupSignalsByAttribute(signals, 'industry')
    const companySizeSignals = groupSignalsByAttribute(signals, 'company_size')

    let needsUpdate = false
    const updates: Partial<PersonaPreferences> = {}

    // Check industries
    for (const [industry, groupedSignals] of Object.entries(industrySignals)) {
        const negatives = groupedSignals.filter(s => s.feedback_type === 'negative')
        const positives = groupedSignals.filter(s => s.feedback_type === 'positive')

        if (negatives.length >= SIGNAL_THRESHOLD) {
            // Remove from industries list (if present)
            const currentIndustries = preferences.industries || []
            if (currentIndustries.includes(industry)) {
                updates.industries = currentIndustries.filter(i => i !== industry)
                needsUpdate = true
            }
            // Add to excluded_companies is not applicable for industries, skip
        }

        if (positives.length >= SIGNAL_THRESHOLD) {
            // Add to industries list (if not present)
            const currentIndustries = preferences.industries || []
            if (!currentIndustries.includes(industry)) {
                updates.industries = [...currentIndustries, industry]
                needsUpdate = true
            }
        }
    }

    // Check company sizes
    for (const [companySize, groupedSignals] of Object.entries(companySizeSignals)) {
        const negatives = groupedSignals.filter(s => s.feedback_type === 'negative')
        const positives = groupedSignals.filter(s => s.feedback_type === 'positive')

        if (negatives.length >= SIGNAL_THRESHOLD) {
            const currentSizes = preferences.company_size || []
            if (currentSizes.includes(companySize)) {
                updates.company_size = currentSizes.filter(s => s !== companySize)
                needsUpdate = true
            }
        }

        if (positives.length >= SIGNAL_THRESHOLD) {
            const currentSizes = preferences.company_size || []
            if (!currentSizes.includes(companySize)) {
                updates.company_size = [...currentSizes, companySize]
                needsUpdate = true
            }
        }
    }

    // Update preferences if needed
    if (needsUpdate && preferences.id) {
        const { error: updateError } = await supabase
            .from('persona_preferences')
            .update(updates)
            .eq('id', preferences.id)

        if (updateError) {
            console.error('Error updating preferences:', updateError)
        }
    }
}

/**
 * Group signals by a specific attribute
 */
function groupSignalsByAttribute(
    signals: FeedbackSignal[],
    attribute: keyof Pick<FeedbackSignal, 'industry' | 'company_size' | 'remote_type' | 'location'>
): Record<string, FeedbackSignal[]> {
    const grouped: Record<string, FeedbackSignal[]> = {}

    for (const signal of signals) {
        const value = signal[attribute]
        if (value) {
            if (!grouped[value]) {
                grouped[value] = []
            }
            grouped[value].push(signal)
        }
    }

    return grouped
}
