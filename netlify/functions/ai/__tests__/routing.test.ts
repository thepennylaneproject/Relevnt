import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runAI } from '../run'
import { __testing as cacheTesting } from '../cache'
import * as aimlapi from '../providers/aimlapi'
import * as openai from '../providers/openai'
import * as anthropic from '../providers/anthropic'
import * as telemetry from '../telemetry'

vi.mock('../providers/aimlapi')
vi.mock('../providers/openai')
vi.mock('../providers/anthropic')

describe('AI routing decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cacheTesting.memoryCache.clear()
    vi.spyOn(telemetry, 'checkTierCap').mockResolvedValue({ allowed: true })
    vi.spyOn(telemetry, 'logInvocation').mockResolvedValue()
    vi.spyOn(telemetry, 'recordProviderResult').mockImplementation(() => {})
    vi.spyOn(telemetry, 'isProviderCircuitOpen').mockReturnValue(false)
  })

  it('falls back to OpenAI when AIMLAPI fails', async () => {
    vi.mocked(aimlapi.callAimlApi).mockResolvedValue({ success: false, content: '', error: 'boom' })
    vi.mocked(openai.callOpenAI).mockResolvedValue({ success: true, content: '{"ok":true}' })
    vi.mocked(anthropic.callAnthropic).mockResolvedValue({ success: false, content: '', error: 'skip' })

    const result = await runAI({
      task: 'resume_extract_structured',
      input: { resume: 'data' },
      userId: 'user1',
      tier: 'pro',
    })

    expect(result.ok).toBe(true)
    expect(result.provider).toBe('openai')
  })

  it('clamps quality for free tier to standard', async () => {
    vi.mocked(aimlapi.callAimlApi).mockResolvedValue({ success: true, content: '{"ok":true}' })

    const result = await runAI({
      task: 'keyword_extraction',
      input: { text: 'keywords' },
      userId: 'user2',
      tier: 'free',
      quality: 'high',
    })

    expect(result.ok).toBe(true)
    expect(result.reason).toBe('quality_clamped_to_tier')
    expect(result.provider).toBe('aimlapi')
  })

  it('uses cache on repeated calls', async () => {
    vi.mocked(aimlapi.callAimlApi).mockResolvedValue({ success: true, content: '{"cached":true}' })

    const first = await runAI({
      task: 'resume_extract_structured',
      input: { resume: 'cached-run' },
      userId: 'user3',
      tier: 'pro',
    })
    expect(first.cache_hit).toBeFalsy()

    const second = await runAI({
      task: 'resume_extract_structured',
      input: { resume: 'cached-run' },
      userId: 'user3',
      tier: 'pro',
    })

    expect(second.ok).toBe(true)
    expect(second.cache_hit).toBe(true)
    expect(vi.mocked(aimlapi.callAimlApi)).toHaveBeenCalledTimes(1)
  })
})
