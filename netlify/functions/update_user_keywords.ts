import type { Handler } from '@netlify/functions'
import { supabase } from './utils/supabase'

export const handler: Handler = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: 'Missing body' }
    }

    const { user_id, resume_text } = JSON.parse(event.body)

    if (!user_id || !resume_text) {
      return { statusCode: 400, body: 'Missing required fields' }
    }

    const { data: extracted, error: extractErr } =
      await supabase.rpc('extract_keywords', { input_text: resume_text })

    if (extractErr) {
      console.error('Keyword extraction failed:', extractErr)
      return { statusCode: 500, body: 'Keyword extraction failed' }
    }

    const { error: upsertErr } = await supabase
      .from('user_keywords')
      .upsert({
        user_id,
        keywords: extracted,
        updated_at: new Date().toISOString()
      })

    if (upsertErr) {
      console.error('Keyword upsert failed:', upsertErr)
      return { statusCode: 500, body: 'Keyword upsert failed' }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, keywords: extracted })
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { statusCode: 500, body: 'Server error' }
  }
}