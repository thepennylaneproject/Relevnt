/**
 * ============================================================================
 * AI RESPONSE TYPES - Complete Type Definitions
 * ============================================================================
 * 
 * 🎓 LEARNING NOTE: These types define the exact shape of data returned
 * from each AI task. This prevents bugs and enables IDE autocomplete.
 * 
 * When a new AI task is added:
 * 1. Add its response type here
 * 2. Update the AITaskResponse union at the bottom
 * 3. Hook automatically handles it (no hook code changes needed!)
 * ============================================================================
 */

// ============================================================================
// SINGLE-VALUE RESPONSES
// ============================================================================

/**
 * Generic string response for tasks that return single text results
 */
export interface StringResponse {
  success: boolean;
  result: string;
  error?: string;
}

/**
 * Generic number response for scores/rankings
 */
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

/**
 * Resume analysis - evaluate resume quality and ATS compatibility
 */
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

/**
 * Resume optimization - improve resume for ATS and hiring managers
 */
export interface ResumeOptimizationResponse {
  success: boolean;
  data: {
    optimizedResume: string;
    improvements: string[];
    atsScore: number;
  };
  error?: string;
}

/**
 * Bullet point refinement - improve resume bullet points
 */
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
// JOB ANALYSIS RESPONSES
// ============================================================================

/**
 * Job description analysis - extract key requirements and skills
 */
export interface JobAnalysisResponse {
  success: boolean;
  data: {
    skills: string[];
    qualifications: string[];
    experienceLevel: string;
    salary?: string;
  };
  error?: string;
}

/**
 * Job extraction - parse job listings from text/HTML
 */
export interface JobExtractionResponse {
  success: boolean;
  data: {
    jobs: Array<{
      title: string;
      company: string;
      link: string;
      description: string;
    }>;
  };
  error?: string;
}

// ============================================================================
// JOB MATCHING RESPONSES
// ============================================================================

/**
 * Job matching - compare resume to jobs and find matches
 */
export interface JobMatchingResponse {
  success: boolean;
  data: {
    matches: Array<{
      jobId: string;
      title: string;
      company: string;
      matchScore: number;
      reasoning: string;
    }>;
  };
  error?: string;
}

/**
 * Job ranking - rank jobs by fit to resume
 */
export interface JobRankingResponse {
  success: boolean;
  data: {
    ranked: Array<{
      jobId: string;
      title: string;
      company: string;
      rank: number;
      score: number;
      reasoning: string;
    }>;
  };
  error?: string;
}

// ============================================================================
// SKILLS & CAREER ANALYSIS
// ============================================================================

/**
 * Skills gap analysis - identify what skills to learn for a job
 */
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
// COVER LETTER & DOCUMENTS
// ============================================================================

/**
 * Cover letter generation - write tailored cover letters
 */
export interface CoverLetterResponse {
  success: boolean;
  data: {
    coverLetter: string;
    strategy?: string;
    matchingPoints?: string[];
  };
  error?: string;
}

/**
 * Career narrative generation - craft a compelling story
 */
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
// INTERVIEW PREPARATION
// ============================================================================

/**
 * Interview preparation - generate practice questions and tips
 */
export interface InterviewPrepResponse {
  success: boolean;
  data: {
    questions: string[];
    tips: string[];
    commonAnswers: Record<string, string>;
  };
  error?: string;
}

/**
 * Salary negotiation assistance
 */
export interface SalaryNegotiationResponse {
  success: boolean;
  data: {
    targetRange: string;
    strategy: string;
    responses: string[];
  };
  error?: string;
}

/**
 * Networking outreach draft
 */
export interface NetworkingDraftResponse {
  success: boolean;
  data: {
    draft: string;
    strategy?: string;
  };
  error?: string;
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Usage tracking - current usage stats and limits
 */
export interface UsageStats {
  taskName: string;
  usageThisMonth: number;
  tierLimit: number;
  canUseFeature: boolean;
  daysUntilReset: number;
}

// ============================================================================
// HOOK STATE & UTILITIES
// ============================================================================

/**
 * Generic hook error with context
 */
export interface AIError {
  message: string;
  code: 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'PARSE_ERROR' | 'UNKNOWN';
  retryable: boolean;
  details?: unknown;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  timeoutMs: number;
}

/**
 * Base response wrapper from API
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: UsageStats;
}

// ============================================================================
// NEW AI ASSIST RESPONSES
// ============================================================================

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
// STRATEGIC INSIGHTS
// ============================================================================

/**
 * Strategic insights - AI-driven analysis of application patterns
 */
export interface Recommendation {
  id: string
  type: 'skill_gap' | 'targeting' | 'resume' | 'strategy' | 'timing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  linkedSection?: string // e.g., "settings/targeting", "resume/skills"
  linkedSectionLabel?: string // e.g., "Update Targeting Settings"
  confidence: number // 0-100
}

export interface PatternFinding {
  pattern: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  statistic?: string // e.g., "25% interview rate"
}

export interface StrategicInsightsResponse {
  success: boolean
  data: {
    overview: {
      totalApplications: number
      interviewRate: number
      previousInterviewRate?: number
      trend: 'improving' | 'declining' | 'stable'
    }
    patterns: PatternFinding[]
    recommendations: Recommendation[]
    skillGaps: string[]
  }
  error?: string
}

// ============================================================================
// UNION TYPE FOR ALL RESPONSES
// ============================================================================

/**
 * All possible AI task responses
 * 
 * 🎓 PATTERN: This union type helps TypeScript understand which response
 * type goes with which task. When a hook calls execute('task-name'),
 * TypeScript can infer the correct response type.
 */
export type AITaskResponse =
  | ResumeExtractionResponse
  | ResumeAnalysisResponse
  | ResumeOptimizationResponse
  | BulletPointRefinementResponse
  | JobAnalysisResponse
  | JobExtractionResponse
  | JobMatchingResponse
  | JobRankingResponse
  | SkillsGapResponse
  | CoverLetterResponse
  | InterviewPrepResponse
  | GenerateBulletsResponse
  | RewriteTextResponse
  | SuggestSkillsResponse
  | CareerNarrativeResponse
  | SalaryNegotiationResponse
  | NetworkingDraftResponse
  | StrategicInsightsResponse

/**
 * Task name to response type mapping
 * 
 * 🎓 ADVANCED PATTERN: This allows TypeScript to be smart about
 * what type a task returns. We'll use this in hook generics.
 */
export const TASK_RESPONSE_TYPES = {
  'extract-resume': {} as ResumeExtractionResponse,
  'analyze-resume': {} as ResumeAnalysisResponse,
  'optimize-resume': {} as ResumeOptimizationResponse,
  'refine-bullet-points': {} as BulletPointRefinementResponse,
  'analyze-job-description': {} as JobAnalysisResponse,
  'extract-jobs': {} as JobExtractionResponse,
  'match-jobs': {} as JobMatchingResponse,
  'rank-jobs': {} as JobRankingResponse,
  'analyze-skills-gap': {} as SkillsGapResponse,
  'generate-cover-letter': {} as CoverLetterResponse,
  'prepare-interview': {} as InterviewPrepResponse,
  'generate-bullets': {} as GenerateBulletsResponse,
  'rewrite-text': {} as RewriteTextResponse,
  'suggest-skills': {} as SuggestSkillsResponse,
  'generate-career-narrative': {} as CareerNarrativeResponse,
  'salary-negotiation': {} as SalaryNegotiationResponse,
  'networking-draft': {} as NetworkingDraftResponse,
  'generate-strategic-insights': {} as StrategicInsightsResponse,
} as const

/**
 * All valid task names
 */
export type TaskName = keyof typeof TASK_RESPONSE_TYPES;

// ============================================================================
// TIER LIMITS CONFIGURATION
// ============================================================================

/**
 * Usage limits per tier per month
 */
export const TIER_LIMITS = {
  free: {
    'extract-resume': 5,
    'analyze-resume': 5,
    'optimize-resume': 3,
    'refine-bullet-points': 3,
    'analyze-job-description': 5,
    'extract-jobs': 5,
    'match-jobs': 3,
    'rank-jobs': 2,
    'analyze-skills-gap': 3,
    'generate-cover-letter': 2,
    'prepare-interview': 2,
    'generate-bullets': 5,
    'rewrite-text': 5,
    'suggest-skills': 5,
    'generate-career-narrative': 2,
    'salary-negotiation': 2,
    'networking-draft': 3,
  },
  pro: {
    'extract-resume': 50,
    'analyze-resume': 50,
    'optimize-resume': 30,
    'refine-bullet-points': 30,
    'analyze-job-description': 50,
    'extract-jobs': 50,
    'match-jobs': 30,
    'rank-jobs': 20,
    'analyze-skills-gap': 30,
    'generate-cover-letter': 20,
    'prepare-interview': 20,
    'generate-bullets': 50,
    'rewrite-text': 50,
    'suggest-skills': 50,
    'generate-career-narrative': 20,
    'salary-negotiation': 20,
    'networking-draft': 30,
  },
  premium: {
    'extract-resume': Infinity,
    'analyze-resume': Infinity,
    'optimize-resume': Infinity,
    'refine-bullet-points': Infinity,
    'analyze-job-description': Infinity,
    'extract-jobs': Infinity,
    'match-jobs': Infinity,
    'rank-jobs': Infinity,
    'analyze-skills-gap': Infinity,
    'generate-cover-letter': Infinity,
    'prepare-interview': Infinity,
    'generate-bullets': Infinity,
    'rewrite-text': Infinity,
    'suggest-skills': Infinity,
    'generate-career-narrative': Infinity,
    'salary-negotiation': Infinity,
    'networking-draft': Infinity,
  },
} as const;

/**
 * Map user tier to usage limits
 *
 * Note: we support internal tiers like "starter" and "admin" as well,
 * even if they do not have explicit entries in TIER_LIMITS. Missing
 * tiers or tasks are treated as effectively "unlimited" at this layer,
 * and the backend is responsible for any hard enforcement.
 */
export type UserTierForAI = 'starter' | 'free' | 'pro' | 'premium' | 'admin';

/**
 * Get limit for a specific task and tier in a safe way.
 *
 * - If the tier has no entry in TIER_LIMITS, treat as unlimited.
 * - If the tier exists but the specific task is missing, treat as unlimited.
 * - Otherwise return the configured numeric limit.
 */
export function getTaskLimit(tier: UserTierForAI, task: TaskName): number {
  const tierLimits =
    (TIER_LIMITS as Partial<Record<UserTierForAI, Record<TaskName, number>>>)[tier];

  // Unknown / unset tier: no limit enforced at this layer
  if (!tierLimits) {
    return Infinity;
  }

  const limit = tierLimits[task];

  // Missing task config: also treat as unlimited
  if (typeof limit !== 'number') {
    return Infinity;
  }

  return limit;
}
