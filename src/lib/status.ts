// src/lib/status.ts
export const JOB_STATUSES = ['saved', 'interested', 'applied', 'archived'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const APPLICATION_STATUSES = [
  'applied',
  'in-progress',
  'rejected',
  'offer',
  'accepted',
  'withdrawn',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]