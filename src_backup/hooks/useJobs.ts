/**
 * ============================================================================
 * USE JOBS HOOK
 * ============================================================================
 *
 * Manages job listings from Supabase with filtering, scoring, and matching.
 *
 * Features:
 * - Fetch all jobs for user
 * - Filter by status, match score, salary, location
 * - Real-time subscription to job updates
 * - Bookmark/save jobs
 *
 * Usage:
 * ```tsx
 * const { jobs, loading, error, refetch, saveJob } = useJobs();
 * ```
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  skills?: string[];
  seniority_level?: string;
  job_type?: string; // full-time, part-time, contract
  remote_ok?: boolean;
  apply_url?: string;
  posted_date?: string;
  source?: string;

  // Enriched data
  match_score?: number;
  missing_skills?: string[];

  // User interaction
  is_saved?: boolean;
  saved_at?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface UseJobsOptions {
  // Filters
  minMatchScore?: number;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  remote?: boolean;
  jobType?: string;
  savedOnly?: boolean;

  // Pagination
  limit?: number;
  offset?: number;
}

export interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveJob: (jobId: string) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  totalCount: number;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchJobs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('jobs')
        .select('*, match_scores!left(score, missing_skills), saved_jobs!left(saved_at)', { count: 'exact' });

      // Apply filters
      if (options.minMatchScore !== undefined) {
        query = query.gte('match_scores.score', options.minMatchScore);
      }

      if (options.minSalary !== undefined) {
        query = query.gte('salary_min', options.minSalary);
      }

      if (options.maxSalary !== undefined) {
        query = query.lte('salary_max', options.maxSalary);
      }

      if (options.location) {
        query = query.ilike('location', `%${options.location}%`);
      }

      if (options.remote !== undefined) {
        query = query.eq('remote_ok', options.remote);
      }

      if (options.jobType) {
        query = query.eq('job_type', options.jobType);
      }

      if (options.savedOnly) {
        query = query.not('saved_jobs', 'is', null);
      }

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Order by match score (if available) or posted date
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform data
      const transformedJobs: Job[] = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        description: job.description,
        skills: job.skills,
        seniority_level: job.seniority_level,
        job_type: job.job_type,
        remote_ok: job.remote_ok,
        apply_url: job.apply_url,
        posted_date: job.posted_date,
        source: job.source,
        match_score: job.match_scores?.[0]?.score,
        missing_skills: job.match_scores?.[0]?.missing_skills,
        is_saved: !!job.saved_jobs?.[0],
        saved_at: job.saved_jobs?.[0]?.saved_at,
        created_at: job.created_at,
        updated_at: job.updated_at,
      }));

      setJobs(transformedJobs);
      setTotalCount(count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(message);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [user, options]);

  // Fetch jobs on mount and when options change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Save a job
  const saveJob = useCallback(async (jobId: string) => {
    if (!user) return;

    try {
      const { error: saveError } = await supabase
        .from('saved_jobs')
        .upsert({
          user_id: user.id,
          job_id: jobId,
          saved_at: new Date().toISOString(),
        });

      if (saveError) throw saveError;

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, is_saved: true, saved_at: new Date().toISOString() }
            : job
        )
      );
    } catch (err) {
      console.error('Error saving job:', err);
      throw err;
    }
  }, [user]);

  // Unsave a job
  const unsaveJob = useCallback(async (jobId: string) => {
    if (!user) return;

    try {
      const { error: unsaveError } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);

      if (unsaveError) throw unsaveError;

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, is_saved: false, saved_at: undefined }
            : job
        )
      );
    } catch (err) {
      console.error('Error unsaving job:', err);
      throw err;
    }
  }, [user]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    saveJob,
    unsaveJob,
    totalCount,
  };
}
