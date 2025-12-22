
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Note: In Netlify functions we use service role key for admin access, 
// but we should verify user ownership if possible or trust the caller who has a valid user token.
// Actually, standard pattern here is to create a client with the user's token if passed, 
// OR use service key but verify ownership manually. 

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

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

        // 2. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `You are a career coach analyzing a job rejection email. 
          Extract the following in JSON format:
          - reason: The stated or implied reason (e.g., "Role filled", "Experience mismatch", "Generic").
          - tone: The tone of the email (e.g., "Professional", "Cold", "Encouraging").
          - suggestions: Array of actionable improvements based on the feedback (if any) or general advice.
          - silver_lining: A brief, encouraging 1-sentence takeaway.
          
          If the email is generic, note that and suggest typical improvements (networking etc).`
                },
                {
                    role: "user",
                    content: rejectionText
                }
            ],
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')

        // 3. Update Application
        const { error: updateError } = await supabase
            .from('applications')
            .update({
                rejection_analysis: result,
                status: 'rejected' // Ensure status is rejected
            })
            .eq('id', applicationId)

        if (updateError) {
            throw updateError
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result),
        }

    } catch (error: any) {
        console.error('Error analyzing rejection:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        }
    }
}
