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
    console.log('📥 AI Function called with task:', task);
    console.log('Input preview:', typeof input === 'string' ? input.substring(0, 100) + '...' : input);

    // Extract user info from context if available (Netlify Identity)
    // For now, we'll use a placeholder or extract from headers if passed
    const userId = 'user_placeholder'
    const tier = 'premium' // Default to premium for now to ensure AI access, or extract from user metadata

    console.log('🔄 Routing AI request to backend...');
    const response = await routeAIRequest({
      task,
      input,
      userId,
      tier,
    })

    console.log('✅ AI Router response:', { success: response.success, hasData: !!response.data, error: response.error });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    }
  } catch (err) {
    console.error('❌ AI function error for task', task);
    console.error('Error details:', err);
    console.error('Error message:', err instanceof Error ? err.message : String(err));
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'AI task failed on the server',
        details: err instanceof Error ? err.stack : String(err),
      }),
    }
  }
}

export { handler }