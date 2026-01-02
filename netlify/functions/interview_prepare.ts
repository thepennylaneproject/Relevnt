import type { Handler } from '@netlify/functions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  console.warn('DEPRECATED_FUNCTION_HIT: interview_prepare')

  return {
    statusCode: 410,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      error: 'This endpoint has moved to Ready and will be removed.',
      function: 'interview_prepare',
    }),
  }
}
