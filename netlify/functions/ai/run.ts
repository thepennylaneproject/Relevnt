import crypto from 'crypto'
import { TASK_SPECS } from '../../../src/lib/ai/tasks'
import type { AIRunInput, AIRunResult, AIQuality, UserTier } from '../../../src/lib/ai/types'
import { buildCacheKey, getCache, setCache } from './cache'
import { buildSystemPrompt, serializeInput } from './prompting'
import { normalizeJsonResponse } from './json'
import { checkTierCap, isProviderCircuitOpen, logInvocation, recordProviderResult } from './telemetry'
import { callAimlApi } from './providers/aimlapi'
import { callOpenAI } from './providers/openai'
import { callAnthropic } from './providers/anthropic'
import { qualityRank } from '../../../src/lib/ai/types'
type ProviderName = 'aimlapi' | 'openai' | 'anthropic'

type ModelOption = {
  provider: ProviderName
  model: string
  quality: AIQuality
  supportsJson: boolean
  maxTokens: number
  costPer1k: number
}

const MODEL_REGISTRY: ModelOption[] = [
  {
    provider: 'aimlapi',
    model: 'gpt-4o-mini',
    quality: 'standard',
    supportsJson: true,
    maxTokens: 8_000,
    costPer1k: 0.15,
  },
  {
    provider: 'aimlapi',
    model: 'claude-3-haiku',
    quality: 'low',
    supportsJson: true,
    maxTokens: 8_000,
    costPer1k: 0.1,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    quality: 'standard',
    supportsJson: true,
    maxTokens: 64_000,
    costPer1k: 0.15,
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    quality: 'high',
    supportsJson: true,
    maxTokens: 128_000,
    costPer1k: 0.5,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    quality: 'high',
    supportsJson: true,
    maxTokens: 200_000,
    costPer1k: 0.8,
  },
]

const TASK_PROVIDER_HINTS: Partial<Record<keyof typeof TASK_SPECS, ProviderName[]>> = {
  resume_extract_structured: ['aimlapi', 'openai', 'anthropic'],
  resume_ats_analysis: ['aimlapi', 'openai', 'anthropic'],
  job_match_explanation: ['aimlapi', 'openai'],
  keyword_extraction: ['aimlapi'],
}

const TIER_MAX_QUALITY: Record<UserTier, AIQuality> = {
  free: 'standard',
  pro: 'high',
  premium: 'high',
  coach: 'high',
}

const MAX_ATTEMPTS = Number(process.env.AI_MAX_ATTEMPTS || 3)

export async function runAI(args: AIRunInput): Promise<AIRunResult> {
  const traceId = args.traceId || crypto.randomUUID()
  const spec = TASK_SPECS[args.task]
  if (!spec) {
    return {
      ok: false,
      reason: 'unknown_task',
      error_message: `Unknown task ${args.task}`,
      trace_id: traceId,
    }
  }

  const tier: UserTier = args.tier || 'free'
  const requestedQuality = args.quality || spec.preferred_quality_default
  const clampedQuality = clampQualityForTier(requestedQuality, tier)
  const qualityReason = clampedQuality !== requestedQuality ? 'quality_clamped_to_tier' : undefined

  const schemaVersion = args.schemaVersion || (args.jsonSchema ? 'schema:v1' : undefined)
  const cacheKey = buildCacheKey(args.task, args.input, tier, clampedQuality, schemaVersion)

  if (spec.cache_ttl_seconds) {
    const cached = await getCache(cacheKey)
    if (cached.hit) {
      const output = cached.value
      await logInvocation({
        user_id: args.userId,
        task_name: args.task,
        tier,
        provider: 'cache',
        model: 'cache',
        quality: clampedQuality,
        reason: 'cache_hit',
        input_size: measureSize(args.input),
        output_size: measureSize(output),
        latency_ms: 0,
        cost_estimate: 0,
        cache_hit: true,
        success: true,
        trace_id: traceId,
      })

      return {
        ok: true,
        output,
        provider: 'cache',
        model: 'cache',
        cache_hit: true,
        reason: 'cache_hit',
        trace_id: traceId,
      }
    }
  }

  const cap = await checkTierCap(args.userId ?? null, tier, clampedQuality)
  if (!cap.allowed) {
    return {
      ok: false,
      reason: cap.code || 'tier_cap',
      error_message: cap.message,
      trace_id: traceId,
    }
  }

  const candidates = buildCandidates(args.task, clampedQuality, spec.requires_json, tier)
  let errors: string[] = []
  let lastProvider: string | undefined
  let lastModel: string | undefined

  for (const candidate of candidates) {
    if (isProviderCircuitOpen(candidate.provider)) {
      console.warn(`[AI] Circuit open for ${candidate.provider}`)
      errors.push(`${candidate.provider}: circuit open`)
      continue
    }

    console.log(`[AI] Attempting ${candidate.provider} / ${candidate.model}`)

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const strictJson = spec.requires_json && attempt > 0
      const systemPrompt = buildSystemPrompt(args.task, spec.requires_json, args.jsonSchema, strictJson)
      const userPrompt = serializeInput(args.input)
      const started = Date.now()

      const providerResult = await callProvider(candidate, systemPrompt, userPrompt, spec.max_tokens_hint)
      const latency = Date.now() - started
      lastProvider = candidate.provider
      lastModel = candidate.model

      if (providerResult.success) {
        console.log(`[AI] ${candidate.provider} success`)
        const normalized = spec.requires_json
          ? normalizeJsonResponse(providerResult.content || '', args.jsonSchema)
          : { ok: true, output: providerResult.content, trace_id: traceId }

        if (normalized.ok) {
          const cost = providerResult.cost ?? estimateCost(candidate, userPrompt, providerResult.content)
          recordProviderResult(candidate.provider, true)

          const result: AIRunResult = {
            ok: true,
            output: normalized.output,
            raw: providerResult.raw || providerResult.content,
            provider: candidate.provider,
            model: candidate.model,
            reason: qualityReason || providerResult.reason,
            latency_ms: latency,
            cost_estimate: cost,
            cache_hit: false,
            trace_id: traceId,
          }

          if (spec.cache_ttl_seconds) {
            await setCache(cacheKey, result.output, args.task, tier, clampedQuality, spec.cache_ttl_seconds)
          }

          await logInvocation({
            user_id: args.userId,
            task_name: args.task,
            tier,
            provider: candidate.provider,
            model: candidate.model,
            quality: clampedQuality,
            reason: result.reason,
            input_size: measureSize(args.input),
            output_size: measureSize(result.output),
            latency_ms: latency,
            cost_estimate: cost,
            cache_hit: false,
            success: true,
            trace_id: traceId,
          })

          return result
        }

        console.warn(`[AI] JSON normalization failed for ${candidate.provider}:`, normalized.error_message)
        errors.push(`${candidate.provider}: ${normalized.error_message || 'JSON normalization failed'}`)
      } else {
        console.warn(`[AI] Provider ${candidate.provider} failed:`, providerResult.error)
        errors.push(`${candidate.provider}: ${providerResult.error || 'failed'}`)
      }

      recordProviderResult(candidate.provider, false)
    }
  }

  const finalErrorMessage = errors.join('; ') || 'No provider satisfied requirements'

  await logInvocation({
    user_id: args.userId,
    task_name: args.task,
    tier,
    provider: lastProvider || 'none',
    model: lastModel || 'none',
    quality: clampedQuality,
    reason: 'fallback_exhausted',
    input_size: measureSize(args.input),
    output_size: 0,
    latency_ms: undefined,
    cost_estimate: undefined,
    cache_hit: false,
    success: false,
    error_code: 'fallback_exhausted',
    error_message: finalErrorMessage,
    trace_id: traceId,
  })

  return {
    ok: false,
    reason: 'fallback_exhausted',
    error_message: finalErrorMessage,
    provider: lastProvider,
    model: lastModel,
    trace_id: traceId,
  }
}

function clampQualityForTier(requested: AIQuality, tier: UserTier): AIQuality {
  const maxQuality = TIER_MAX_QUALITY[tier]
  if (qualityRank[requested] > qualityRank[maxQuality]) return maxQuality
  return requested
}

function buildCandidates(task: string, quality: AIQuality, requiresJson: boolean, tier: UserTier): ModelOption[] {
  const hints = TASK_PROVIDER_HINTS[task as keyof typeof TASK_SPECS]
  const preferred = MODEL_REGISTRY.filter(
    (model) =>
      (!hints || hints.includes(model.provider)) &&
      (!requiresJson || model.supportsJson) &&
      qualityRank[model.quality] >= qualityRank[quality]
  )

  const sortedPreferred = preferred.sort((a, b) => a.costPer1k - b.costPer1k)
  const backups = MODEL_REGISTRY.filter(
    (model) =>
      !sortedPreferred.includes(model) &&
      (!requiresJson || model.supportsJson) &&
      qualityRank[model.quality] >= qualityRank[quality]
  ).sort((a, b) => a.costPer1k - b.costPer1k)

  return [...sortedPreferred, ...backups]
}

async function callProvider(
  candidate: ModelOption,
  systemPrompt: string,
  userPrompt: string,
  maxTokensHint?: number
): Promise<{ success: boolean; content?: string; raw?: unknown; cost?: number; error?: string; reason?: string }> {
  const maxTokens = maxTokensHint || candidate.maxTokens
  switch (candidate.provider) {
    case 'aimlapi': {
      const result = await callAimlApi(candidate.model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
      if (result.success) {
        return { success: true, content: result.content, raw: result }
      }
      return { success: false, error: result.error }
    }
    case 'openai': {
      const result = await callOpenAI(userPrompt, systemPrompt, {
        model: candidate.model,
        maxTokens,
        forceJson: true,
      })
      if (result.success) {
        return { success: true, content: result.content, raw: result, cost: result.cost }
      }
      return { success: false, error: result.error }
    }
    case 'anthropic': {
      const result = await callAnthropic(candidate.model, [
        { role: 'user', content: userPrompt },
      ], { systemPrompt, maxTokens })
      if (result.success) {
        return { success: true, content: result.content, raw: result, cost: result.cost }
      }
      return { success: false, error: result.error }
    }
    default:
      return { success: false, error: 'Unknown provider' }
  }
}

function estimateCost(model: ModelOption, input: string, output?: string) {
  const inputTokens = Math.ceil(input.length / 4)
  const outputTokens = Math.ceil((output?.length || 0) / 4)
  const totalTokens = inputTokens + outputTokens
  return (totalTokens / 1000) * model.costPer1k
}

function measureSize(value: unknown) {
  if (value === undefined || value === null) return 0
  if (typeof value === 'string') return value.length
  try {
    return JSON.stringify(value).length
  } catch {
    return String(value).length
  }
}

export const __testing = {
  MODEL_REGISTRY,
  buildCandidates,
  clampQualityForTier,
}
