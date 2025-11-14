/**
 * JOB MATCHING TASKS
 * High-level job matching and ranking functions
 */

import { routeAIRequest } from '../ai-router';

export async function matchJob(resume: any, job: any, userId: string, tier: string) {
  return await routeAIRequest({
    task: 'job_match_score',
    input: { resume, job },
    userId,
    tier: tier as any,
  });
}

export async function rankJobs(resume: any, jobs: any[], userId: string, tier: string) {
  return await routeAIRequest({
    task: 'job_ranking',
    input: { resume, jobs },
    userId,
    tier: tier as any,
  });
}

export async function explainMatch(resume: any, job: any, userId: string, tier: string) {
  return await routeAIRequest({
    task: 'match_explanation',
    input: { resume, job },
    userId,
    tier: tier as any,
  });
}
