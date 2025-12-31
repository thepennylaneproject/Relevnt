import type { AIRunResult } from '../../src/lib/ai/types'

export function stripJsonFences(payload: string): string {
  const trimmed = payload.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
  }
  return trimmed
}

export function safeJsonParse<T = unknown>(payload: string): { ok: boolean; value?: T; error?: string } {
  try {
    const cleaned = stripJsonFences(payload)
    const parsed = JSON.parse(cleaned) as T
    return { ok: true, value: parsed }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}

export function validateAgainstSchema(value: any, schema?: Record<string, unknown>): { ok: boolean; error?: string } {
  if (!schema) return { ok: true }
  if (typeof value !== 'object' || value === null) return { ok: false, error: 'Response was not an object' }

  // Lightweight presence validation: ensure all top-level keys in schema exist
  const missing = Object.keys(schema).filter((key) => !(key in value))
  if (missing.length) {
    return { ok: false, error: `Missing keys: ${missing.join(', ')}` }
  }
  return { ok: true }
}

export function normalizeJsonResponse(raw: string, schema?: Record<string, unknown>): AIRunResult {
  const parsed = safeJsonParse(raw)
  if (!parsed.ok) {
    return {
      ok: false,
      error_code: 'json_parse_failed',
      error_message: parsed.error,
      trace_id: '',
    }
  }

  const schemaCheck = validateAgainstSchema(parsed.value, schema)
  if (!schemaCheck.ok) {
    return {
      ok: false,
      error_code: 'json_schema_mismatch',
      error_message: schemaCheck.error,
      trace_id: '',
    }
  }

  return {
    ok: true,
    output: parsed.value,
    trace_id: '',
  }
}
