import type { Handler } from '@netlify/functions'
import { routeAIRequest } from './ai/ai-router'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    }
  }

  let body: any
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Invalid JSON body' }),
    }
  }

  const task = body.task as string | undefined
  const input = body.input

  if (!task) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Missing task name' }),
    }
  }

  try {
    // Extract user info from context if available (Netlify Identity)
    // For now, we'll use a placeholder or extract from headers if passed
    const userId = 'user_placeholder'
    const tier = 'premium' // Default to premium for now to ensure AI access, or extract from user metadata

    const response = await routeAIRequest({
      task,
      input,
      userId,
      tier,
    })

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    }
  } catch (err) {
    console.error('AI function error for task', task, err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'AI task failed on the server',
      }),
    }
  }
}

export { handler }