// netlify/functions/utils/supabase.ts

import type {
  Handler,
  HandlerEvent,
  HandlerContext,
  HandlerResponse,
} from '@netlify/functions'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function handleCORS(): HandlerResponse {
  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
    },
    body: '',
  }
}

export function createResponse(
  statusCode: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

function getSupabaseUrl(): string {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  if (!url) {
    throw new Error('SUPABASE_URL / VITE_SUPABASE_URL is not set in environment')
  }
  return url
}

function getSupabaseServiceKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!serviceKey && !anonKey) {
    throw new Error(
      'No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.'
    )
  }

  return serviceKey || (anonKey as string)
}

/**
 * Server side admin client.
 * Uses service role key if available, falls back to anon key.
 */
export function createAdminClient(): SupabaseClient {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceKey()

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

/**
 * Authenticated client for a specific user token.
 * Uses anon key and forwards the JWT in the Authorization header.
 */
export function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const url = getSupabaseUrl()
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY is not set in environment')
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  })
}

// Default export used by some older functions
// This is an admin client so server code can call from(), upsert(), rpc(), etc.
export const supabase: SupabaseClient = createAdminClient()

// ---------------------------------------------------------------------------
// Auth helper for Netlify Functions
// ---------------------------------------------------------------------------

export async function verifyToken(
  authHeader?: string | null
): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader) {
    return { userId: null, error: 'Missing Authorization header' }
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return { userId: null, error: 'Invalid Authorization header' }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.getUser(token)

    if (error || !data?.user) {
      return {
        userId: null,
        error: error?.message || 'Invalid token or user not found',
      }
    }

    return { userId: data.user.id, error: null }
  } catch (err: any) {
    console.error('verifyToken failed', err)
    return { userId: null, error: 'Auth verification failed' }
  }
}

// ---------------------------------------------------------------------------
// Error wrapper for handlers
// ---------------------------------------------------------------------------

type NetlifyHandler = (
  event: HandlerEvent,
  context: HandlerContext
) => Promise<HandlerResponse>

export function withErrorHandler(handler: NetlifyHandler): Handler {
  return async (event, context) => {
    try {
      if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
      }

      const result = await handler(event, context)

      return {
        ...result,
        headers: {
          ...CORS_HEADERS,
          ...(result.headers || {}),
        },
      }
    } catch (err: any) {
      console.error('Unhandled error in Netlify function', err)

      return createResponse(500, {
        success: false,
        error: 'Internal server error',
        message: err?.message || String(err),
      })
    }
  }
}