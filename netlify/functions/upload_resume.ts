// netlify/functions/upload_resume.ts
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

type UploadResumePayload = {
  user_id: string
  title?: string
  parsed_text: string
  file_name: string
  mime_type: string
  file_size_bytes: number
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  let payload: UploadResumePayload
  try {
    payload = JSON.parse(event.body) as UploadResumePayload
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }

  const { user_id, title, parsed_text, file_name, mime_type, file_size_bytes } = payload

  if (!user_id || !parsed_text || !file_name || !mime_type || typeof file_size_bytes !== 'number') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error:
          'Missing required fields: user_id, parsed_text, file_name, mime_type, file_size_bytes',
      }),
    }
  }

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id,
        title: title || file_name || 'Imported resume',
        parsed_text,
        file_name,
        mime_type,
        file_size_bytes,
      })
      .select('id, title, is_default, ats_score, created_at, updated_at')
      .single()

    if (error) {
      console.error('upload_resume: insert error', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save resume' }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        resume: data,
      }),
    }
  } catch (err) {
    console.error('upload_resume: unexpected error', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error' }),
    }
  }
}