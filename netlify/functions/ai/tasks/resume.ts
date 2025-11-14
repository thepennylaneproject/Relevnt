/**
 * RESUME TASKS
 * High-level resume processing functions
 */

import { routeAIRequest } from '../ai-router';

export async function parseResume(file: any, userId: string, tier: string) {
  return await routeAIRequest({
    task: 'resume_parse',
    input: { content: file },
    userId,
    tier: tier as any,
  });
}

export async function optimizeResume(resumeContent: any, userId: string, tier: string) {
  return await routeAIRequest({
    task: 'resume_optimize',
    input: { resume: resumeContent },
    userId,
    tier: tier as any,
  });
}

export async function scoreATS(resume: any, jobDescription: string, userId: string, tier: string) {
  return await routeAIRequest({
    task: 'ats_score',
    input: { resume, job_description: jobDescription },
    userId,
    tier: tier as any,
  });
}

export async function generateCoverLetter(resume: any, job: any, userId: string, tier: string) {
  return await routeAIRequest({
    task: 'cover_letter_generate',
    input: { resume, job },
    userId,
    tier: tier as any,
  });
}
