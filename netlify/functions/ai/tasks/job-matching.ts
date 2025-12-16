/**
 * JOB MATCHING TASKS
 * High-level job matching and ranking functions
 */

import { runAI } from '../run';

export async function matchJob(resume: any, job: any, userId: string, tier: string) {
  return await runAI({
    task: 'job_match_explanation' as any,
    input: { resume, job },
    userId,
    tier: tier as any,
  });
}

export async function rankJobs(resume: any, jobs: any[], userId: string, tier: string) {
  return await runAI({
    task: 'job_match_explanation' as any,
    input: { resume, jobs },
    userId,
    tier: tier as any,
  });
}

export async function explainMatch(resume: any, job: any, userId: string, tier: string) {
  return await runAI({
    task: 'job_match_explanation' as any,
    input: { resume, job },
    userId,
    tier: tier as any,
  });
}
