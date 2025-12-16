import { describe, it, expect } from 'vitest'
import { stripJsonFences, safeJsonParse, normalizeJsonResponse } from '../json'

describe('JSON helpers', () => {
  it('strips markdown fences', () => {
    const input = '```json\n{"a":1}\n```'
    expect(stripJsonFences(input)).toBe('{"a":1}')
  })

  it('parses valid JSON', () => {
    const parsed = safeJsonParse('{"ok":true}')
    expect(parsed.ok).toBe(true)
    expect(parsed.value).toEqual({ ok: true })
  })

  it('detects schema mismatches', () => {
    const normalized = normalizeJsonResponse('{"other":1}', { ok: true })
    expect(normalized.ok).toBe(false)
    expect(normalized.error_code).toBe('json_schema_mismatch')
  })
})
