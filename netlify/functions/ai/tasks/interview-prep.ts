/**
 * ============================================================================
 * INTERVIEW PREP TASK
 * ============================================================================
 * Generates interview preparation materials
 * ============================================================================
 */

import { callAnthropic } from '../providers/anthropic';

/**
 * Coach user on interview responses
 */
export async function coachForInterview(
  questionAsked: string,
  userResponse: string
): Promise<string> {
  const systemPrompt = `You are an expert interview coach. Provide constructive feedback on the candidate's response to this interview question. Focus on clarity, relevance, and impact.`;

  const result = await callAnthropic('claude-sonnet-4-20250514', [
    { role: 'user', content: `Question: "${questionAsked}"\n\nCandidate's response: "${userResponse}"\n\nProvide constructive feedback.` }
  ], {
    systemPrompt,
    maxTokens: 1000,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to coach interview response');
  }

  return result.content;
}

/**
 * Rate mock interview response
 */
export async function rateMockInterviewResponse(
  response: string,
  jobDescription: string
): Promise<{ score: number; feedback: string }> {
  const systemPrompt = `You are an expert interview coach. Rate this interview response on a scale of 1-10. Consider: clarity, relevance to the role, professionalism, and impact. Be fair but honest.`;

  const result = await callAnthropic('claude-sonnet-4-20250514', [
    {
      role: 'user',
      content: `Job Description:\n${jobDescription}\n\nCandidate's response:\n${response}\n\nRate this response 1-10 with feedback.`
    }
  ], {
    systemPrompt,
    maxTokens: 500,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to rate interview response');
  }

  const text = result.content;

  // Simple parsing - extract first number found
  const scoreMatch = text.match(/(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5;

  return {
    score: Math.min(10, Math.max(1, score)),
    feedback: text,
  };
}

/**
 * Generate interview prep questions for a role
 */
export async function generateInterviewPrep(
  company: string,
  role: string
): Promise<{
  questions: string[];
  tips: string[];
  focusAreas: string[];
}> {
  const systemPrompt = `You are an expert career coach specializing in interview preparation. Generate thoughtful interview prep materials.`;

  const result = await callAnthropic('claude-sonnet-4-20250514', [
    {
      role: 'user',
      content: `Generate interview prep for a ${role} position at ${company}. Provide:
1. 5 common interview questions for this role
2. 3-5 tips specific to this company/role
3. 3-5 key focus areas to prepare

Format your response as JSON with keys: questions (array), tips (array), focusAreas (array)`,
    }
  ], {
    systemPrompt,
    maxTokens: 1500,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to generate interview prep');
  }

  try {
    // Try to parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fallback to default structure
  }

  return {
    questions: [
      'Tell me about yourself',
      'Why are you interested in this role?',
      'What are your greatest strengths?',
      'How do you handle challenges?',
      'Where do you see yourself in 5 years?',
    ],
    tips: [
      'Research the company thoroughly before the interview',
      'Prepare specific examples using the STAR method',
      'Practice your responses but keep them conversational',
    ],
    focusAreas: [
      'Understanding the company mission and values',
      'Connecting your experience to their needs',
      'Asking thoughtful questions about the role',
    ],
  };
}