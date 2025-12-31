/**
 * ============================================================================
 * READY AI RESPONSE TYPES - Type Definitions
 * ============================================================================
 * 
 * Defines the shape of data returned from AI tasks in the Ready project.
 * Removed job-related types from the Relevnt original.
 * ============================================================================
 */

// ============================================================================
// SINGLE-VALUE RESPONSES
// ============================================================================

export interface StringResponse {
  success: boolean;
  result: string;
  error?: string;
}

export interface NumberResponse {
  success: boolean;
  result: number;
  error?: string;
}

// ============================================================================
// RESUME ANALYSIS RESPONSES
// ============================================================================

export interface ResumeExtractionBrainstorm {
  suggestedSkills?: string[]
  alternateTitles?: string[]
  relatedKeywords?: string[]
  positioningNotes?: string
}

export interface ResumeExtractionData {
  fullName: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]

  experience: {
    title: string
    company: string
    location?: string
    startDate?: string
    endDate?: string
    current?: boolean
    bullets?: string[]
  }[]

  education: {
    institution: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
  }[]

  certifications?: {
    name: string
    issuer?: string
    year?: string
  }[]

  brainstorming?: ResumeExtractionBrainstorm | null
}

export interface ResumeExtractionResponse {
  success: boolean
  data: ResumeExtractionData
  error?: string
}

export interface ResumeAnalysisResponse {
  success: boolean;
  data: {
    atsScore: number;
    keywordMatches: string[];
    improvements: string[];
    formattingSuggestions: string[];
  };
  error?: string;
}

export interface ResumeOptimizationResponse {
  success: boolean;
  data: {
    optimizedResume: string;
    improvements: string[];
    atsScore: number;
  };
  error?: string;
}

export interface BulletPointRefinementResponse {
  success: boolean;
  data: {
    refined: Array<{
      originalBullet: string;
      refinedBullets: string[];
    }>;
  };
  error?: string;
}

// ============================================================================
// SKILLS & CAREER ANALYSIS
// ============================================================================

export interface SkillsGapResponse {
  success: boolean;
  data: {
    currentSkills: string[];
    missingSkills: string[];
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  };
  error?: string;
}

// ============================================================================
// DOCUMENTS & NARRATIVE
// ============================================================================

export interface CareerNarrativeResponse {
  success: boolean;
  data: {
    origin: string;
    pivot: string;
    value: string;
    future: string;
  };
  error?: string;
}

// ============================================================================
// INTERVIEW & COACHING
// ============================================================================

export interface InterviewPrepResponse {
  success: boolean;
  data: {
    questions: string[];
    tips: string[];
    commonAnswers: Record<string, string>;
  };
  error?: string;
}

export interface SalaryNegotiationResponse {
  success: boolean;
  data: {
    targetRange: string;
    strategy: string;
    responses: string[];
  };
  error?: string;
}

export interface RejectionCoachingResponse {
  success: boolean;
  data: {
    analysis: string;
    missingSkills: string[];
    nextSteps: string[];
  };
  error?: string;
}

export interface NetworkingDraftResponse {
  success: boolean;
  data: {
    draft: string;
    strategy?: string;
  };
  error?: string;
}

// ============================================================================
// UTILITIES & STATE
// ============================================================================

export interface UsageStats {
  taskName: string;
  usageThisMonth: number;
  tierLimit: number;
  canUseFeature: boolean;
  daysUntilReset: number;
}

export interface AIError {
  message: string;
  code: 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'PARSE_ERROR' | 'UNKNOWN';
  retryable: boolean;
  details?: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  timeoutMs: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: UsageStats;
}

export interface GenerateBulletsResponse {
  success: boolean
  data: {
    bullets: string[]
  }
  error?: string
}

export interface RewriteTextResponse {
  success: boolean
  data: {
    rewritten: string
  }
  error?: string
}

export interface SuggestSkillsResponse {
  success: boolean
  data: {
    skills: string[]
  }
  error?: string
}

// ============================================================================
// UNION TYPE FOR ALL RESPONSES
// ============================================================================

export type AITaskResponse =
  | ResumeExtractionResponse
  | ResumeAnalysisResponse
  | ResumeOptimizationResponse
  | BulletPointRefinementResponse
  | SkillsGapResponse
  | InterviewPrepResponse
  | GenerateBulletsResponse
  | RewriteTextResponse
  | SuggestSkillsResponse
  | CareerNarrativeResponse
  | SalaryNegotiationResponse
  | RejectionCoachingResponse
  | NetworkingDraftResponse

export const TASK_RESPONSE_TYPES = {
  'extract-resume': {} as ResumeExtractionResponse,
  'analyze-resume': {} as ResumeAnalysisResponse,
  'optimize-resume': {} as ResumeOptimizationResponse,
  'refine-bullet-points': {} as BulletPointRefinementResponse,
  'analyze-skills-gap': {} as SkillsGapResponse,
  'prepare-interview': {} as InterviewPrepResponse,
  'generate-bullets': {} as GenerateBulletsResponse,
  'rewrite-text': {} as RewriteTextResponse,
  'suggest-skills': {} as SuggestSkillsResponse,
  'generate-career-narrative': {} as CareerNarrativeResponse,
  'salary-negotiation': {} as SalaryNegotiationResponse,
  'rejection-coaching': {} as RejectionCoachingResponse,
  'networking-draft': {} as NetworkingDraftResponse,
} as const

export type TaskName = keyof typeof TASK_RESPONSE_TYPES;

// ============================================================================
// TIER LIMITS CONFIGURATION
// ============================================================================

export const TIER_LIMITS = {
  free: {
    'extract-resume': 5,
    'analyze-resume': 5,
    'optimize-resume': 3,
    'refine-bullet-points': 3,
    'analyze-skills-gap': 3,
    'prepare-interview': 2,
    'generate-bullets': 5,
    'rewrite-text': 5,
    'suggest-skills': 5,
    'generate-career-narrative': 2,
  },
  pro: {
    'extract-resume': 50,
    'analyze-resume': 50,
    'optimize-resume': 30,
    'refine-bullet-points': 30,
    'analyze-skills-gap': 30,
    'prepare-interview': 20,
    'generate-bullets': 50,
    'rewrite-text': 50,
    'suggest-skills': 50,
    'generate-career-narrative': 20,
  },
  premium: {
    'extract-resume': Infinity,
    'analyze-resume': Infinity,
    'optimize-resume': Infinity,
    'refine-bullet-points': Infinity,
    'analyze-skills-gap': Infinity,
    'prepare-interview': Infinity,
    'generate-bullets': Infinity,
    'rewrite-text': Infinity,
    'suggest-skills': Infinity,
    'generate-career-narrative': Infinity,
    'salary-negotiation': Infinity,
    'rejection-coaching': Infinity,
  },
} as const;

export type UserTierForAI = 'starter' | 'free' | 'pro' | 'premium' | 'admin';

export function getTaskLimit(tier: UserTierForAI, task: TaskName): number {
  const tierLimits =
    (TIER_LIMITS as Partial<Record<UserTierForAI, Record<TaskName, number>>>)[tier];

  if (!tierLimits) {
    return Infinity;
  }

  const limit = (tierLimits as any)[task];

  if (typeof limit !== 'number') {
    return Infinity;
  }

  return limit;
}
