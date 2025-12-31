import type { AITaskName } from '../../src/lib/ai/types'

const BASE_SYSTEM = `You are Ready's AI coaching assistant. Always follow the task contract and provide supportive, actionable guidance.`

export function buildJsonContractPrompt(task: AITaskName, schema?: Record<string, unknown>, strict = false): string {
  const schemaSection = schema ? `Schema (keys required): ${JSON.stringify(schema, null, 2)}` : 'Return a valid JSON object.'
  const strictRules = strict
    ? 'Return ONLY minified JSON. Do not add code fences, explanations, or trailing text. If unsure, return an empty object.'
    : 'Return JSON only. Avoid markdown fences.'

  return [
    BASE_SYSTEM,
    `Task: ${task}`,
    schemaSection,
    strictRules,
    'If a field is missing, use an empty string, empty array, or null where appropriate.',
  ].join('\n')
}

export function buildSystemPrompt(task: AITaskName, requiresJson: boolean, schema?: Record<string, unknown>, strict = false) {
  if (requiresJson) {
    return buildJsonContractPrompt(task, schema, strict)
  }
  return `${BASE_SYSTEM}\nTask: ${task}\nBe concise, high quality, and follow safety constraints.`
}

export function serializeInput(input: unknown): string {
  if (typeof input === 'string') return input
  try {
    return JSON.stringify(input, null, 2)
  } catch {
    return String(input)
  }
}
