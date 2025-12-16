/**
 * ============================================================================
 * INTERVIEW PREP TASK
 * ============================================================================
 * Generates interview preparation materials
 * ============================================================================
 */

import { routeLegacyTask } from '../legacyTaskRouter';

/**
 * Coach user on interview responses
 */
export async function coachForInterview(
  questionAsked: string,
  userResponse: string
): Promise<string> {
  const result = await routeLegacyTask('interview-coach', {
    questionAsked,
    userResponse,
  });

  if (!result.ok) {
    throw new Error(result.error_message || 'Failed to coach interview response');
  }

  return String(result.output ?? '');
}

/**
 * Rate mock interview response
 */
export async function rateMockInterviewResponse(
  response: string,
  jobDescription: string
): Promise<{ score: number; feedback: string }> {
  const result = await routeLegacyTask('interview-score', {
    response,
    jobDescription,
  });

  if (!result.ok || !result.output) {
    throw new Error(result.error_message || 'Failed to rate interview response');
  }

  const payload = (result.output as any).data || result.output;
  const score = Number(payload.score ?? 5);
  const feedback = payload.feedback || result.output;

  return {
    score: Math.min(10, Math.max(1, score || 5)),
    feedback: String(feedback || ''),
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
  const result = await routeLegacyTask('prepare-interview', { company, role });

  if (!result.ok || !result.output) {
    throw new Error(result.error_message || 'Failed to generate interview prep');
  }

  const payload = (result.output as any).data || result.output;

  return {
    questions: payload.questions || [],
    tips: payload.tips || [],
    focusAreas: payload.focusAreas || [],
  };
}
