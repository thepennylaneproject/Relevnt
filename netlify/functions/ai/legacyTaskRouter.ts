import { runAI } from './run'
import type { AIQuality, UserTier } from '../../../src/lib/ai/types'
import type { TaskName } from '../../../src/types/ai-responses.types'

type LegacyTaskKey = TaskName | 'probability-estimate' | 'salary-negotiation' | 'posting-finder'

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
  'job-extraction': 'extract-jobs',
  'job-ranking': 'rank-jobs',
  'job-matching': 'match-jobs',
  'cover-letter-gen': 'generate-cover-letter',
  'interview-prep': 'prepare-interview',
  'skill-gap-analysis': 'analyze-skills-gap',
  'qa-helper': 'probability-estimate',
  'ats-optimizer': 'optimize-resume',
  'resume-rewrite': 'rewrite-text',
  'resume_rewrite': 'rewrite-text',
}

const LEGACY_CONFIG: Record<string, LegacyTaskConfig> = {
  'extract-resume': {
    instructions: 'Extract structured resume data: contact info, title, summary, skills, experience (company, title, dates, bullets), education, and certifications.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        fullName: 'string',
        email: 'string',
        phone: 'string',
        title: 'string',
        summary: 'string',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
      },
    },
  },
  'analyze-resume': {
    instructions: 'Score resume for ATS fit. Return atsScore (0-100), keywordMatches, improvements, and formattingSuggestions arrays.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        atsScore: 'number',
        keywordMatches: [],
        improvements: [],
        formattingSuggestions: [],
      },
    },
  },
  'optimize-resume': {
    instructions: 'Improve resume for ATS and recruiters. Return optimizedResume text plus improvements array and atsScore.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        optimizedResume: 'string',
        improvements: [],
        atsScore: 'number',
      },
    },
    quality: 'high',
  },
  'refine-bullet-points': {
    instructions: 'Rewrite each original bullet into stronger, quantified bullet points.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        refined: [],
      },
    },
  },
  'analyze-job-description': {
    instructions: 'Parse a job description. Return key skills, qualifications, experienceLevel, and optional salary.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        skills: [],
        qualifications: [],
        experienceLevel: 'string',
        salary: 'string',
      },
    },
  },
  'extract-jobs': {
    instructions: 'Extract individual jobs from text/HTML. Include title, company, link, and description for each job.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        jobs: [],
      },
    },
  },
  'match-jobs': {
    instructions: 'Match a candidate to jobs. Return matches with jobId, title, company, matchScore, and reasoning.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        matches: [],
      },
    },
  },
  'rank-jobs': {
    instructions: 'Rank a candidate’s jobs by fit. Return ranked list with jobId, title, company, rank, score, and reasoning.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        ranked: [],
      },
    },
  },
  'analyze-skills-gap': {
    instructions: 'Identify missing skills and recommendations for a target role. Return currentSkills, missingSkills, recommendations, and priority (high/medium/low).',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        currentSkills: [],
        missingSkills: [],
        recommendations: [],
        priority: 'string',
      },
    },
  },
  'generate-cover-letter': {
    instructions: 'Generate a concise, tailored cover letter using the provided resume and job context.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: { coverLetter: 'string' },
    },
    quality: 'high',
  },
  'prepare-interview': {
    instructions: 'Produce interview preparation guidance with questions, tips, and commonAnswers (question => sample answer).',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        questions: [],
        tips: [],
        commonAnswers: {},
      },
    },
  },
  'interview-coach': {
    instructions: 'Provide concise feedback to improve an interview response. Keep it brief and actionable.',
    requiresJson: false,
  },
  'interview-score': {
    instructions: 'Score an interview response from 1-10 and provide feedback text.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        score: 'number',
        feedback: 'string',
      },
    },
  },
  'generate-bullets': {
    instructions: 'Generate resume-ready bullet points for the provided context.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: { bullets: [] },
    },
  },
  'rewrite-text': {
    instructions: 'Rewrite text to be clearer, more concise, and achievement-focused.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: { rewritten: 'string' },
    },
  },
  'suggest-skills': {
    instructions: 'Suggest relevant skills based on the provided experience and target role.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: { skills: [] },
    },
  },
  'probability-estimate': {
    instructions: 'Estimate interview/offer probability. Return probability (0-1), factors, recommendations, and explanation.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        probability: 'number',
        factors: [],
        recommendations: [],
        explanation: 'string',
      },
    },
  },
  'salary-negotiation': {
    instructions: 'Provide a salary negotiation plan with targetRange, talking points, and counteroffer suggestions.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        targetRange: 'string',
        strategy: 'string',
        responses: [],
      },
    },
    quality: 'high',
  },
  'posting-finder': {
    instructions: 'Find the official job posting URL. Return url, source, confidence, and reasoning.',
    requiresJson: true,
    schema: {
      success: 'boolean',
      data: {
        url: 'string',
        source: 'string',
        confidence: 'number',
        reasoning: 'string',
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
