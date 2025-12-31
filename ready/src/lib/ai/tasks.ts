/**
 * Ready AI Task Specifications
 * Only interview preparation and career coaching tasks
 */
import type { AITaskName, AITaskSpec } from './types'

export const TASK_SPECS: Record<AITaskName, AITaskSpec> = {
  // Interview Preparation
  'interview-prep': {
    requires_json: true,
    max_tokens_hint: 6_000,
    max_output_tokens_hint: 2_000,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 30,
    batchable: false,
    safety: 'medium',
  },

  'interview-evaluate': {
    requires_json: true,
    max_tokens_hint: 4_000,
    max_output_tokens_hint: 1_500,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 1, // Don't cache evaluations to allow retries
    batchable: false,
    safety: 'medium',
  },

  // Skill & Career Analysis
  'skill-gap': {
    requires_json: true,
    max_tokens_hint: 4_000,
    max_output_tokens_hint: 1_200,
    preferred_quality_default: 'standard',
    cache_ttl_seconds: 60 * 60,
    batchable: false,
    safety: 'medium',
  },

  'career-narrative': {
    requires_json: true,
    max_tokens_hint: 5_000,
    max_output_tokens_hint: 1_500,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 30,
    batchable: false,
    safety: 'medium',
  },

  // Negotiation & Coaching
  'salary-negotiation': {
    requires_json: true,
    max_tokens_hint: 4_000,
    max_output_tokens_hint: 1_200,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 15,
    batchable: false,
    safety: 'medium',
  },

  'rejection-coaching': {
    requires_json: true,
    max_tokens_hint: 4_000,
    max_output_tokens_hint: 1_200,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 30,
    batchable: false,
    safety: 'medium',
  },

  // Profile Analysis
  'linkedin-analyze': {
    requires_json: true,
    max_tokens_hint: 8_000,
    max_output_tokens_hint: 2_000,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 60,
    batchable: false,
    safety: 'medium',
  },

  'portfolio-analyze': {
    requires_json: true,
    max_tokens_hint: 10_000,
    max_output_tokens_hint: 2_000,
    preferred_quality_default: 'high',
    cache_ttl_seconds: 60 * 60,
    batchable: false,
    safety: 'medium',
  },
}
