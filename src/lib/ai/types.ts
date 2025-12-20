export type AIQuality = 'low' | 'standard' | 'high'

export const qualityRank: Record<AIQuality, number> = {
  low: 0,
  standard: 1,
  high: 2,
}

export type UserTier = 'free' | 'pro' | 'premium' | 'coach'

// types.ts
export type AITaskSpec = {
  requires_json: boolean
  max_input_chars?: number
  max_tokens_hint?: number
  max_output_tokens_hint?: number // optional, future-safe
  preferred_quality_default: AIQuality
  cache_ttl_seconds?: number
  batchable: boolean
  safety: 'low' | 'medium' | 'high'
}


export type AITaskName =
  | 'resume_extract_structured'
  | 'resume_ats_analysis'
  | 'resume_bullet_rewrite'
  | 'cover_letter_generate'
  | 'job_match_explanation'
  | 'keyword_extraction'
  | 'coach_chat_tip'
  | 'general_chat_assist'
  | 'legacy_structured'
  | 'legacy_text'
  | 'application_question_answer'
  | 'linkedin_profile_analysis'
  | 'portfolio_analysis'
  | 'interview_prepare'
  | 'interview_evaluate'

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

