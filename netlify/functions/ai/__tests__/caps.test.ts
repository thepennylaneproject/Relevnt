import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runAI } from '../run'
import * as telemetry from '../telemetry'
import * as aimlapi from '../providers/aimlapi'
import * as openai from '../providers/openai'
import * as anthropic from '../providers/anthropic'
import { __testing as cacheTesting } from '../cache'

vi.mock('../providers/aimlapi')
vi.mock('../providers/openai')
vi.mock('../providers/anthropic')

describe('Tier caps and fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cacheTesting.memoryCache.clear()
    vi.spyOn(telemetry, 'logInvocation').mockResolvedValue()
    vi.spyOn(telemetry, 'recordProviderResult').mockImplementation(() => {})
    vi.spyOn(telemetry, 'isProviderCircuitOpen').mockReturnValue(false)
  })

  it('blocks when daily cap fails', async () => {
    vi.spyOn(telemetry, 'checkTierCap').mockResolvedValue({
      allowed: false,
      code: 'daily_cap',
      message: 'Daily cap reached',
    })
    vi.mocked(aimlapi.callAimlApi).mockResolvedValue({ success: true, content: '{"ok":true}' })

    const result = await runAI({
      task: 'keyword_extraction',
      input: { text: 'hello' },
      userId: 'user-cap',
      tier: 'free',
    })

    expect(result.ok).toBe(false)
    expect(result.reason).toBe('daily_cap')
  })

  it('respects fallback attempts', async () => {
    vi.spyOn(telemetry, 'checkTierCap').mockResolvedValue({ allowed: true })
    vi.mocked(aimlapi.callAimlApi).mockResolvedValue({ success: false, content: '', error: 'unavailable' })
    vi.mocked(openai.callOpenAI).mockResolvedValue({ success: false, error: 'offline' })
    vi.mocked(anthropic.callAnthropic).mockResolvedValue({ success: false, content: '', error: 'offline' })

    const result = await runAI({
      task: 'keyword_extraction',
      input: { text: 'hello' },
      userId: 'user-fallback',
      tier: 'pro',
    })

    // With no other providers mocked as success, fallback_exhausted is expected
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('fallback_exhausted')
  })
})
