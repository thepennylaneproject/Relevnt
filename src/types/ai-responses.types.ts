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

/**
 * Resume extraction - parse resume text into structured data
 */
export interface ResumeExtractionResponse {
  success: boolean;
  data: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      school: string;
      degree: string;
      field: string;
      year: string;
    }>;
  };
  error?: string;
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
  | InterviewPrepResponse;

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
} as const;

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
  },
} as const;

/**
 * Map user tier to usage limits
 */
export type UserTierForAI = 'free' | 'pro' | 'premium';

/**
 * Get limit for a specific task and tier
 */
export function getTaskLimit(tier: UserTierForAI, task: TaskName): number {
  return TIER_LIMITS[tier][task] ?? 0;
}
