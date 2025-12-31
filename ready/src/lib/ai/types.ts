/**
 * Ready AI Types - Interview/Career Coaching Focus Only
 */

export type AIQuality = 'low' | 'standard' | 'high'

export const qualityRank: Record<AIQuality, number> = {
  low: 0,
  standard: 1,
  high: 2,
}

export type UserTier = 'free' | 'pro' | 'premium' | 'coach'

export type AITaskSpec = {
  requires_json: boolean
  max_input_chars?: number
  max_tokens_hint?: number
  max_output_tokens_hint?: number
  preferred_quality_default: AIQuality
  cache_ttl_seconds?: number
  batchable: boolean
  safety: 'low' | 'medium' | 'high'
}

/**
 * Ready-specific AI task names (no job-related tasks)
 */
export type AITaskName =
  | 'interview-prep'
  | 'interview-evaluate'
  | 'skill-gap'
  | 'career-narrative'
  | 'salary-negotiation'
  | 'linkedin-analyze'
  | 'portfolio-analyze'
  | 'rejection-coaching'

export interface AIRunInput<T = unknown> {
  task: AITaskName
  input: T
  userId?: string | null
  tier?: UserTier
  quality?: AIQuality
  traceId?: string
  jsonSchema?: Record<string, unknown>
  schemaVersion?: string
}

export interface AIRunResult {
  ok: boolean
  output?: unknown
  raw?: unknown
  provider?: string
  model?: string
  reason?: string
  latency_ms?: number
  cost_estimate?: number
  cache_hit?: boolean
  trace_id: string
  error_code?: string
  error_message?: string
}
