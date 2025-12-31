/**
 * Task: Career Narrative Generation
 * 
 * Generates compelling career narratives for Ready users
 */

import { routeLegacyTask } from '../legacyTaskRouter'

export interface NarrativeRequest {
    profile: any
    voiceSettings: any
}

export interface NarrativeResponse {
    success: boolean
    origin?: string
    pivot?: string
    value?: string
    future?: string
    error?: string
}

/**
 * Generate career narratives
 */
export async function generateNarrative(
    data: NarrativeRequest
): Promise<NarrativeResponse> {
    try {
        const response = await routeLegacyTask('generate-career-narrative', {
            profile: data.profile,
            voice: data.voiceSettings,
        })

        if (!response.ok || !response.output) {
            throw new Error(response.error_message || 'AI routing failed')
        }

        const payload = (response.output as any).data || response.output

        return {
            success: true,
            origin: payload.origin,
            pivot: payload.pivot,
            value: payload.value,
            future: payload.future,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

const handler = generateNarrative
export { handler }
export default handler
