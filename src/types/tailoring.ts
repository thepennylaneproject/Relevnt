// src/types/tailoring.ts
// Type definitions for resume tailoring feature

export interface TailoringSuggestion {
  id: string
  bulletId: string  // ID of resume bullet to enhance
  currentText: string
  suggestedText: string
  reasoning: string
  relevantKeyword: string
  confidence: number  // 0-1
}

export interface TailoringContext {
  jobId: string
  jobTitle: string
  company: string
  keyRequirements: string[]
  missingKeywords: string[]
  suggestions: TailoringSuggestion[]
}
