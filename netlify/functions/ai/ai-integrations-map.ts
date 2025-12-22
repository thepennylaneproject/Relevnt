/**
 * AI INTEGRATIONS MAP - PRODUCTION VERSION
 * Complete configuration for all AI features with proper exports
 */

export const AI_INTEGRATIONS = {
  'extract-resume': {
    name: 'Resume Extraction',
    description: 'Extract structured data from resume text',
    category: 'parsing',
    providers: {
      starter: 'aimlapi',
      pro: 'aimlapi',
      premium: 'aimlapi',
    },
    fallbackChain: ['aimlapi', 'openai-gpt4o', 'anthropic-sonnet4'],
    estimatedCost: { starter: 0.005, pro: 0.005, premium: 0.005 },
  },
  'job-extraction': {
    name: 'Job Description Extraction',
    description: 'Extract structured data from job descriptions',
    category: 'parsing',
    providers: {
      starter: 'google-gemini',
      pro: 'anthropic-sonnet4',
      premium: 'openai-gpt4o',
    },
    fallbackChain: ['anthropic-sonnet4', 'google-gemini', 'openai-gpt4o'],
    estimatedCost: { starter: 0.01, pro: 0.015, premium: 0.02 },
  },
  'job-ranking': {
    name: 'Job Ranking & Match Scoring',
    description: 'Rank job fit against user profile',
    category: 'ranking',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.015, pro: 0.025, premium: 0.03 },
  },
  'success-probability': {
    name: 'Success Probability',
    description: 'Estimate interview/offer likelihood',
    category: 'estimation',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.01, pro: 0.015, premium: 0.02 },
  },
  'cover-letter-gen': {
    name: 'Cover Letter Generation',
    description: 'Generate personalized cover letters',
    category: 'writing',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.02, pro: 0.03, premium: 0.04 },
  },
  'optimize-resume': {
    name: 'ATS Resume Optimization',
    description: 'Optimize resumes for ATS systems',
    category: 'optimization',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.02, pro: 0.03, premium: 0.04 },
  },
  'qa-helper': {
    name: 'Q&A Helper (STAR Framework)',
    description: 'Generate answers using STAR framework',
    category: 'writing',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.015, pro: 0.025, premium: 0.03 },
  },
  'skill-gap-analysis': {
    name: 'Skill Gap Analysis',
    description: 'Identify skill gaps and learning plan',
    category: 'analysis',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.02, pro: 0.03, premium: 0.04 },
  },
  'interview-questions': {
    name: 'Interview Question Generator',
    description: 'Generate role-specific interview questions',
    category: 'coaching',
    providers: { pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o'],
    estimatedCost: { pro: 0.02, premium: 0.03 },
  },
  'interview-scoring': {
    name: 'Interview Answer Scoring',
    description: 'Score and provide feedback on answers',
    category: 'coaching',
    providers: { pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o'],
    estimatedCost: { pro: 0.015, premium: 0.025 },
  },
  'job-matching': {
    name: 'Job Matching Algorithm',
    description: 'Find best matching opportunities',
    category: 'discovery',
    providers: { pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o'],
    estimatedCost: { pro: 0.03, premium: 0.04 },
  },
  'posting-finder': {
    name: 'Official Posting Finder',
    description: 'Locate official job posting',
    category: 'discovery',
    providers: { pro: 'brave', premium: 'tavily' },
    fallbackChain: ['brave', 'tavily'],
    estimatedCost: { pro: 0.005, premium: 0.01 },
  },
  'analyze-resume': {
    name: 'Resume Analysis',
    description: 'Comprehensive resume scoring',
    category: 'analysis',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.02, pro: 0.03, premium: 0.04 },
  },
  'resume-rewrite': {
    name: 'Resume Rewriting',
    description: 'Rewrite resume sections',
    category: 'writing',
    providers: { pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o'],
    estimatedCost: { pro: 0.03, premium: 0.04 },
  },
  'generate-bullets': {
    name: 'Generate Bullets',
    description: 'Generate bullet points from job title/company',
    category: 'writing',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.01, pro: 0.015, premium: 0.02 },
  },
  'rewrite-text': {
    name: 'Rewrite Text',
    description: 'Rewrite text to be stronger/concise',
    category: 'writing',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.01, pro: 0.015, premium: 0.02 },
  },
  'suggest-skills': {
    name: 'Suggest Skills',
    description: 'Suggest skills based on experience',
    category: 'analysis',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.01, pro: 0.015, premium: 0.02 },
  },
  'generate-career-narrative': {
    name: 'Career Narrative Generation',
    description: 'Craft a compelling career narrative',
    category: 'writing',
    providers: { starter: 'google-gemini', pro: 'anthropic-sonnet4', premium: 'openai-gpt4o' },
    fallbackChain: ['anthropic-sonnet4', 'openai-gpt4o', 'google-gemini'],
    estimatedCost: { starter: 0.02, pro: 0.03, premium: 0.04 },
  },
};

export const TIER_LIMITS = {
  starter: {
    allowedTasks: ['extract-resume', 'job-extraction', 'job-ranking', 'cover-letter-gen', 'qa-helper', 'analyze-resume', 'generate-bullets', 'rewrite-text', 'suggest-skills', 'generate-career-narrative'],
    monthlyLimit: 50,
    maxTokens: 1000,
  },
  pro: {
    allowedTasks: ['extract-resume', 'job-extraction', 'job-ranking', 'cover-letter-gen', 'optimize-resume', 'qa-helper', 'skill-gap-analysis', 'job-matching', 'interview-questions', 'analyze-resume', 'generate-bullets', 'rewrite-text', 'suggest-skills', 'generate-career-narrative'],
    monthlyLimit: 500,
    maxTokens: 4000,
  },
  premium: {
    allowedTasks: ['extract-resume', 'job-extraction', 'job-ranking', 'cover-letter-gen', 'optimize-resume', 'qa-helper', 'skill-gap-analysis', 'interview-questions', 'interview-scoring', 'job-matching', 'posting-finder', 'success-probability', 'analyze-resume', 'generate-bullets', 'rewrite-text', 'suggest-skills', 'generate-career-narrative'],
    monthlyLimit: 5000,
    maxTokens: 16000,
  },
};

export const PROVIDERS = {
  'aimlapi': { name: 'AI/ML API', tier: 'economy', costPerMToken: 0.07 },
  'deepseek': { name: 'DeepSeek', tier: 'economy', costPerMToken: 0.14 },
  'google-gemini': { name: 'Google Gemini', tier: 'mid', costPerMToken: 0.1 },
  'anthropic-sonnet4': { name: 'Claude Sonnet 4', tier: 'premium', costPerMToken: 3.0 },
  'openai-gpt4o': { name: 'GPT-4o', tier: 'premium', costPerMToken: 5.0 },
  'brave': { name: 'Brave Search', tier: 'economy', costPerMToken: 0.01 },
  'tavily': { name: 'Tavily Search', tier: 'economy', costPerMToken: 0.01 },
  'local': { name: 'Local', tier: 'free', costPerMToken: 0 },
};

export function getTask(taskKey: string): typeof AI_INTEGRATIONS[keyof typeof AI_INTEGRATIONS] | null {
  return AI_INTEGRATIONS[taskKey as keyof typeof AI_INTEGRATIONS] || null;
}

export function canAccessTask(tier: string, taskKey: string): boolean {
  return TIER_LIMITS[tier as keyof typeof TIER_LIMITS]?.allowedTasks.includes(taskKey) || false;
}