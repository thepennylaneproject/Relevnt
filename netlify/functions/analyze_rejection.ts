
import { createClient } from '@supabase/supabase-js'
import { routeLegacyTask } from './ai/legacyTaskRouter'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Note: In Netlify functions we use service role key for admin access, 
// but we should verify user ownership if possible or trust the caller who has a valid user token.
// Actually, standard pattern here is to create a client with the user's token if passed, 
// OR use service key but verify ownership manually. 


export const handler = async (event: any, context: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' }
    }

    try {
        const { applicationId, rejectionText } = JSON.parse(event.body)

        if (!applicationId || !rejectionText) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing applicationId or rejectionText' }) }
        }

        // 1. Verify User (optional security step, good practice)
        // Extract token
        const authHeader = event.headers.authorization
        if (!authHeader) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
        }
        const token = authHeader.split(' ')[1]

        // Create Supabase client with user's token to respect RLS
        // (This works nicely if RLS is set up, which it is)
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
        // Wait, using Service Key bypasses RLS. 
        // To respect RLS we should use the Anon Key + setSession, or just use Service Key and verify ownership manually.
        // Given we are updating a specific row, let's use Service Key for reliability but check ownership.

        // Verify ownership
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
        }

        // Check application belongs to user
        const { data: appData, error: appError } = await supabase
            .from('applications')
            .select('user_id')
            .eq('id', applicationId)
            .single()

        if (appError || !appData || appData.user_id !== user.id) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
        }

        // 2. Call AI via Modular Router
        const result = await routeLegacyTask('rejection-coaching', {
            rejectionText
        }, {
            userId: user.id,
            tier: 'premium', // Default to premium for this analysis
        })

        if (!result.ok) {
            throw new Error(result.error_message || 'AI generation failed')
        }

        const analysis = (result.output as any)?.data || result.output

        // 3. Update Application
        const { error: updateError } = await supabase
            .from('applications')
            .update({
                rejection_analysis: analysis,
                status: 'rejected' // Ensure status is rejected
            })
            .eq('id', applicationId)

        if (updateError) {
            throw updateError
        }

        return {
            statusCode: 200,
            body: JSON.stringify(analysis),
        }

    } catch (error: any) {
        console.error('Error analyzing rejection:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        }
    }
}
