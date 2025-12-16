import { runAI } from '../run';

export async function parseResume(file: any, userId: string, tier: string) {
  return await runAI({
    task: 'resume_extract_structured' as any,
    input: { content: file },
    userId,
    tier: tier as any,
  });
}

export async function optimizeResume(resumeContent: any, userId: string, tier: string) {
  return await runAI({
    task: 'resume_ats_analysis' as any,
    input: { resume: resumeContent },
    userId,
    tier: tier as any,
  });
}

export async function scoreATS(resume: any, jobDescription: string, userId: string, tier: string) {
  return await runAI({
    task: 'job_match_explanation' as any,
    input: { resume, job_description: jobDescription },
    userId,
    tier: tier as any,
  });
}

export async function generateCoverLetter(resume: any, job: any, userId: string, tier: string) {
  return await runAI({
    task: 'cover_letter_generate' as any,
    input: { resume, job },
    userId,
    tier: tier as any,
  });
}
