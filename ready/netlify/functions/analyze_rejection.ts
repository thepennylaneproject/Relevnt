import { createClient } from '@supabase/supabase-js'
import { routeLegacyTask } from './ai/legacyTaskRouter'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' }
    }

    try {
        const { rejectionText, context } = JSON.parse(event.body)

        if (!rejectionText) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing rejectionText' }) }
        }

        // Verify User
        const authHeader = event.headers.authorization
        if (!authHeader) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
        }
        const token = authHeader.split(' ')[1]

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

        // Verify ownership
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
        }

        // Call AI for rejection coaching
        const result = await routeLegacyTask('rejection-coaching', {
            rejectionText,
            context: context || {}
        }, {
            userId: user.id,
            tier: 'premium',
        })

        if (!result.ok) {
            throw new Error(result.error_message || 'AI generation failed')
        }

        const analysis = (result.output as any)?.data || result.output

        // Optionally save to database for tracking
        try {
            await supabase
                .from('rejection_analyses')
                .insert({
                    user_id: user.id,
                    rejection_text: rejectionText,
                    analysis: analysis,
                    created_at: new Date().toISOString()
                })
        } catch (dbErr) {
            console.warn('Failed to save rejection analysis:', dbErr)
            // Continue anyway
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                data: analysis,
                trace_id: result.trace_id
            }),
        }

    } catch (error: any) {
        console.error('Error analyzing rejection:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        }
    }
}
