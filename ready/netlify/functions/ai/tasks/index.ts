/**
 * Ready AI Tasks Index
 * 
 * Exports only Ready-relevant tasks for interview preparation and readiness
 */

// Interview & Practice
export { 
  coachForInterview, 
  rateMockInterviewResponse, 
  generateInterviewPrep 
} from './interview-prep'

// Assessment
export { analyzeSkillGaps, type SkillGapResponse } from './skill-gap'
export { analyzeResume, type ResumeAnalysisResponse } from './analyze-resume'
export { estimateProbability, type ProbabilityResponse } from './probability-estimate'

// Narrative & Positioning
export { generateNarrative, type NarrativeRequest, type NarrativeResponse } from './narrative-gen'
export { adviseSalaryNegotiation, type SalaryNegotiationResponse } from './salary-negotiation'
