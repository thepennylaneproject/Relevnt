import { runAI } from './run'
import type { AIQuality, UserTier } from '../../src/lib/ai/types'

// Legacy task router - stripped of Relevnt-specific tasks
// Ready-specific tasks will be added here as needed

type LegacyTaskKey = 
  | 'mirror-assessment'
  | 'practice-question'
  | 'practice-evaluate'
  | 'skill-gap-analysis'
  | 'learning-resources'

type LegacyTaskConfig = {
  instructions: string
  requiresJson?: boolean
  schema?: Record<string, unknown>
  quality?: AIQuality
}

const DEFAULT_SCHEMA: Record<string, unknown> = {
  success: 'boolean',
  data: {},
}

const TASK_ALIASES: Record<string, LegacyTaskKey> = {
  'self-assessment': 'mirror-assessment',
  'interview-question': 'practice-question',
  'answer-evaluate': 'practice-evaluate',
  'skill-gap': 'skill-gap-analysis',
  'learn-resources': 'learning-resources',
}

const LEGACY_CONFIG: Record<string, LegacyTaskConfig> = {
  'mirror-assessment': {
    instructions: 'Analyze candidate readiness based on their self-assessment. Return strengths, areas for improvement, and readiness score.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        strengths: [],
        improvements: [],
        readinessScore: 'number',
        recommendations: [],
      },
    },
    quality: 'high',
  },
  'practice-question': {
    instructions: 'Generate interview questions based on the role, company, and skill areas. Return structured questions with hints.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        questions: [],
      },
    },
  },
  'practice-evaluate': {
    instructions: 'Evaluate an interview response. Provide score (1-10), strengths, areas to improve, and suggested better answer.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        score: 'number',
        feedback: 'string',
        strengths: [],
        areas_to_improve: [],
        suggested_better_answer: 'string',
      },
    },
    quality: 'high',
  },
  'skill-gap-analysis': {
    instructions: 'Identify skill gaps between current skills and target role requirements. Return gaps with priority and learning suggestions.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        currentSkills: [],
        requiredSkills: [],
        gaps: [],
        learningPath: [],
      },
    },
  },
  'learning-resources': {
    instructions: 'Suggest learning resources for the identified skill gaps. Include courses, tutorials, and practice opportunities.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        resources: [],
        estimatedTime: 'string',
        priorityOrder: [],
      },
    },
  },
}

function normalizeTaskKey(task: string): string {
  const normalized = task.toLowerCase().replace(/_/g, '-')
  return (TASK_ALIASES[normalized] as string) || normalized
}

export function isLegacyTask(task: string): boolean {
  const key = normalizeTaskKey(task)
  return Boolean(LEGACY_CONFIG[key])
}

export async function routeLegacyTask(
  task: string,
  payload: unknown,
  opts: { userId?: string | null; tier?: UserTier; traceId?: string; quality?: AIQuality } = {}
) {
  const key = normalizeTaskKey(task)
  const config =
    LEGACY_CONFIG[key] ||
    ({
      instructions: `Complete the "${key}" task and return a JSON object with success and data fields.`,
      requiresJson: true,
      schema: DEFAULT_SCHEMA,
    } as LegacyTaskConfig)

  const requiresJson = config.requiresJson !== false

  const prompt = [
    `Task: ${key}`,
    config.instructions,
    'Payload:',
    JSON.stringify(payload ?? {}, null, 2),
    requiresJson
      ? 'Return valid JSON matching the schema.'
      : 'Return a concise text response.',
  ].join('\n\n')

  return runAI({
    task: requiresJson ? 'legacy_structured' : 'legacy_text',
    input: prompt,
    userId: opts.userId ?? null,
    tier: opts.tier || 'premium',
    quality: config.quality ?? opts.quality,
    jsonSchema: requiresJson ? config.schema || DEFAULT_SCHEMA : undefined,
    schemaVersion: requiresJson ? `legacy:${key}:v1` : undefined,
    traceId: opts.traceId,
  })
}
