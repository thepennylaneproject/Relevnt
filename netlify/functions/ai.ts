import type { Handler } from '@netlify/functions'
import { runAI } from './ai/run'
import { routeLegacyTask, isLegacyTask } from './ai/legacyTaskRouter'
import { createAdminClient, verifyToken } from './utils/supabase'
import type { UserTier } from '../../src/lib/ai/types'

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

    // Extract user identity from Supabase JWT
    const authHeader = event.headers.authorization || event.headers.Authorization
    const { userId, error: authError } = await verifyToken(authHeader)
    if (authError) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: authError }),
      }
    }

    let tier: UserTier = 'premium'
    try {
      const supabaseAdmin = createAdminClient()
      const { data } = await supabaseAdmin.auth.getUser(userId!)
      const rawTier = (data?.user?.user_metadata as any)?.tier
      const normalized = typeof rawTier === 'string' ? rawTier.toLowerCase() : ''
      if (normalized === 'starter') {
        tier = 'free'
      } else if (normalized === 'pro' || normalized === 'premium' || normalized === 'free' || normalized === 'coach') {
        tier = normalized as UserTier
      }
    } catch (err) {
      console.warn('Unable to resolve tier from metadata; defaulting to premium', err)
    }

    // Legacy task support (TaskName from frontend hooks and legacy task files)
    if (isLegacyTask(task)) {
      const routed = await routeLegacyTask(task, input, {
        userId,
        tier,
        traceId: body.traceId,
      })

      return {
        statusCode: routed.ok ? 200 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: routed.ok,
          data: routed.output,
          error: routed.error_message,
          provider: routed.provider,
          model: routed.model,
          trace_id: routed.trace_id,
        }),
      }
    }

    console.log('🔄 Routing AI request to backend...');
    const response = await runAI({
      task: task as any,
      input,
      userId,
      tier: tier as any,
      traceId: body.traceId,
    })

    console.log('✅ AI Router response:', { success: response.ok, hasData: !!response.output, error: response.error_message });

    return {
      statusCode: response.ok ? 200 : 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...response,
        success: response.ok,
        data: response.output,
        error: response.error_message,
      }),
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
        ok: false,
        success: false,
        error_message: err instanceof Error ? err.message : 'AI task failed on the server',
        details: err instanceof Error ? err.stack : String(err),
      }),
    }
  }
}

export { handler }
