export const TASK_SPECS: Record<AITaskName, AITaskSpec> = {
  // Core resume pipeline
  resume_extract_structured: {
    requires_json: true,
    max_input_chars: 120_000,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 30,
    batchable: false,
    safety: 'high',
  },

  resume_ats_analysis: {
    requires_json: true,
    max_tokens_hint: 4_000,
    max_output_tokens_hint: 1_200,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 10,
    batchable: false,
    safety: 'medium',
  },

  resume_bullet_rewrite: {
    requires_json: false,
    max_tokens_hint: 3_000,
    max_output_tokens_hint: 600,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 10,
    batchable: true,
    safety: 'medium',
  },

  // Generative writing
  cover_letter_generate: {
    requires_json: false,
    max_tokens_hint: 6_000,
    max_output_tokens_hint: 1_500,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 5, // consider 5 min
    batchable: false,
    safety: 'medium',
  },

  // Matching & explanations
  job_match_explanation: {
    requires_json: true,
    max_tokens_hint: 4_000,
    max_output_tokens_hint: 1_000,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 5,
    batchable: false,
    safety: 'medium',
  },

  keyword_extraction: {
    requires_json: true,
    max_tokens_hint: 2_000,
    max_output_tokens_hint: 400,
    preferred_quality_default: 'low',
    cache_ttl_seconds: 60 * 60,
    batchable: true,
    safety: 'low',
  },

  // Coach + chat UX
  coach_chat_tip: {
    requires_json: false,
    max_tokens_hint: 3_000,
    max_output_tokens_hint: 500,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 5,
    batchable: false,
    safety: 'medium',
  },

  general_chat_assist: {
    requires_json: false,
    max_tokens_hint: 3_000,
    max_output_tokens_hint: 800,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 3,
    batchable: false,
    safety: 'low',
  },

  // Legacy support
  legacy_structured: {
    requires_json: true,
    max_tokens_hint: 6_000,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 5,
    batchable: false,
    safety: 'medium',
  },

  legacy_text: {
    requires_json: false,
    max_tokens_hint: 6_000,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 5,
    batchable: false,
    safety: 'medium',
  },

  // Application helper
  application_question_answer: {
    requires_json: true,
    max_tokens_hint: 4_000,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 10,
    batchable: false,
    safety: 'high',
  },
}
import type { AITaskName, AITaskSpec } from './types'
