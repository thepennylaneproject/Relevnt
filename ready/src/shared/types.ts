/**
 * Ready Shared Types
 * Practice and interview-focused types
 */

export interface PracticeQuestion {
  id: string
  text: string
  type: 'behavioral' | 'technical' | 'situational'
  sample_answer?: string
  talking_points?: string[]
}

export interface PracticePrepRow {
  id: string
  user_id: string
  position: string
  company?: string
  focus_area?: string
  questions: PracticeQuestion[]
  ai_feedback?: any
  created_at: string
  updated_at: string
}

export interface PracticeSession {
  id: string
  user_id: string
  practice_prep_id?: string
  status: 'active' | 'completed' | 'cancelled'
  questions: PracticeQuestion[]
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
