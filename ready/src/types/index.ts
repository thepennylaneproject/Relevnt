
/**
 * RELEVNT -> READY TYPE DEFINITIONS
 * 
 * Core types for the Ready project, aligning with the Supabase schema.
 */

export interface InterviewQuestion {
  id: string
  text: string
  type: 'behavioral' | 'technical' | 'situational'
  sample_answer?: string
  talking_points?: string[]
}

export interface InterviewPrepRow {
  id: string
  user_id: string
  position: string
  company: string | null
  questions: InterviewQuestion[]
  ai_feedback?: any
  created_at: string
  updated_at: string
}

export interface InterviewPracticeSession {
  id: string
  user_id: string
  interview_prep_id?: string
  status: 'active' | 'completed' | 'cancelled'
  questions: InterviewQuestion[]
  practice_data: {
    question: string
    response: string
    feedback: any
    score: number
    timestamp: string
  }[]
  overall_feedback?: any
  created_at: string
  updated_at: string
}

export interface LinkedInAnalysis {
  headline_score: number
  summary_score: number
  experience_score: number
  overall_score: number
  suggestions: {
    section: string
    improvement: string
    reason: string
  }[]
  optimized_headline?: string
  optimized_summary?: string
}

export interface LinkedInProfileRow {
  id: string
  user_id: string
  linkedin_url: string
  profile_data: any
  analysis_results: LinkedInAnalysis | null
  is_public: boolean
  share_token: string
  created_at: string
  updated_at: string
}

export interface PortfolioAnalysis {
  visual_score: number
  usability_score: number
  content_score: number
  overall_score: number
  suggestions: {
    category: string
    improvement: string
    impact: 'high' | 'medium' | 'low'
  }[]
  perceived_seniority: string
  suggested_tagline?: string
}

export interface PortfolioAnalysisRow {
  id: string
  user_id: string
  portfolio_url: string
  analysis_results: PortfolioAnalysis | null
  is_public: boolean
  share_token: string
  created_at: string
  updated_at: string
}

export interface SkillGap {
  skill: string
  importance: 'high' | 'medium' | 'low'
  description?: string
  mitigation_strategy?: string
}

export interface SkillGapAnalysis {
  id: string
  user_id: string
  target_role: string | null
  current_skills: string[] | null
  gaps: SkillGap[]
  strengths: string[] | null
  action_plan: string | null
  status: 'open' | 'in_progress' | 'addressed'
  created_at: string
  updated_at: string
}

export interface LearningResource {
  id: string
  user_id: string
  skill_gap_id: string | null
  skill: string
  resource_url: string | null
  resource_name: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  created_at: string
}

export interface CareerNarrative {
  id: string
  user_id: string
  origin_story: string | null
  pivot_explanation: string | null
  value_proposition: string | null
  future_vision: string | null
  voice_settings: any
  created_at: string
  updated_at: string
}

export interface NegotiationSession {
  id: string
  user_id: string
  position: string
  company: string | null
  offer_details: any
  target_range: {
    min: number
    max: number
    currency: string
  } | null
  strategy: string | null
  scripts: string[] | null
  created_at: string
  updated_at: string
}

export interface ReadinessSnapshot {
  id: string
  user_id: string
  overall_score: number
  practice_score: number
  assessment_score: number
  skills_score: number
  narrative_score: number
  snapshot_date: string
  created_at: string
}

export interface ReadyProfile {
  id: string
  display_name: string | null
  headline: string | null
  goal: string | null
  focus_areas: string[] | null
  readiness_score: number
  last_practice_date: string | null
  assessments_completed: number
  created_at: string
  updated_at: string
}
