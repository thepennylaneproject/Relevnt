/**
 * Ready AI Service Types
 * Interview preparation and career coaching focused
 */

// ============================================================================
// GENERIC RESPONSE WRAPPER
// ============================================================================

export interface AIResponseData {
  success: boolean;
  error?: string;
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  timestamp?: string;
}

// ============================================================================
// INTERVIEW PREPARATION
// ============================================================================

export interface InterviewPrepData {
  questions: string[];
  tips: string[];
  focusAreas: string[];
}

export interface InterviewPrepResponse extends AIResponseData {
  data?: InterviewPrepData;
}

export interface InterviewEvaluateData {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewEvaluateResponse extends AIResponseData {
  data?: InterviewEvaluateData;
}

// ============================================================================
// SKILL & CAREER ANALYSIS
// ============================================================================

export interface SkillGapData {
  currentSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface SkillGapResponse extends AIResponseData {
  data?: SkillGapData;
}

export interface CareerNarrativeData {
  origin: string;
  pivot: string;
  value: string;
  future: string;
}

export interface CareerNarrativeResponse extends AIResponseData {
  data?: CareerNarrativeData;
}

// ============================================================================
// NEGOTIATION & COACHING
// ============================================================================

export interface SalaryNegotiationData {
  targetRange: string;
  strategy: string;
  responses: string[];
}

export interface SalaryNegotiationResponse extends AIResponseData {
  data?: SalaryNegotiationData;
}

export interface RejectionCoachingData {
  analysis: string;
  missingSkills: string[];
  nextSteps: string[];
}

export interface RejectionCoachingResponse extends AIResponseData {
  data?: RejectionCoachingData;
}

// ============================================================================
// PROFILE ANALYSIS
// ============================================================================

export interface LinkedInAnalyzeData {
  score: number;
  strengths: string[];
  improvements: string[];
  keywordSuggestions: string[];
}

export interface LinkedInAnalyzeResponse extends AIResponseData {
  data?: LinkedInAnalyzeData;
}

export interface PortfolioAnalyzeData {
  impression: string;
  projectFeedback: Array<{
    project: string;
    strengths: string[];
    improvements: string[];
  }>;
  tips: string[];
}

export interface PortfolioAnalyzeResponse extends AIResponseData {
  data?: PortfolioAnalyzeData;
}

// ============================================================================
// HOOK STATE & CONFIG TYPES
// ============================================================================

export interface AIHookState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AIHookConfig {
  taskName?: string;
  options?: Record<string, unknown>;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export const AI_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
