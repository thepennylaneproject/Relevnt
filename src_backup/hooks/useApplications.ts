/**
 * ============================================================================
 * USE APPLICATIONS HOOK
 * ============================================================================
 *
 * Manages job applications with status tracking and updates.
 *
 * Features:
 * - Fetch all applications for user
 * - Filter by status (applied, in-progress, rejected, offer)
 * - Update application status
 * - Add notes to applications
 * - Track application timeline
 *
 * Usage:
 * ```tsx
 * const { applications, loading, updateStatus, addNote } = useApplications();
 * ```
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type ApplicationStatus = 'applied' | 'in-progress' | 'rejected' | 'offer' | 'accepted' | 'withdrawn';

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_date: string;
  last_update: string;
  notes?: string;

  // Job details (joined)
  job?: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
  };

  // Application materials
  resume_id?: string;
  cover_letter?: string;

  // Auto-apply metadata
  auto_applied?: boolean;

  created_at: string;
  updated_at: string;
}

export interface UseApplicationsOptions {
  status?: ApplicationStatus;
  limit?: number;
  offset?: number;
}

export interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>;
  addNote: (applicationId: string, note: string) => Promise<void>;
  createApplication: (jobId: string, data: Partial<Application>) => Promise<void>;
  deleteApplication: (applicationId: string) => Promise<void>;
  statusCounts: Record<ApplicationStatus, number>;
  totalCount: number;
}

export function useApplications(options: UseApplicationsOptions = {}): UseApplicationsReturn {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<ApplicationStatus, number>>({
    applied: 0,
    'in-progress': 0,
    rejected: 0,
    offer: 0,
    accepted: 0,
    withdrawn: 0,
  });
  const [totalCount, setTotalCount] = useState(0);

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('applications')
        .select('*, jobs!inner(id, title, company, location, salary_min, salary_max)', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply status filter
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Order by most recent
      query = query.order('last_update', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform data
      const transformedApplications: Application[] = (data || []).map((app: any) => ({
        id: app.id,
        user_id: app.user_id,
        job_id: app.job_id,
        status: app.status,
        applied_date: app.applied_date,
        last_update: app.last_update,
        notes: app.notes,
        job: app.jobs,
        resume_id: app.resume_id,
        cover_letter: app.cover_letter,
        auto_applied: app.auto_applied,
        created_at: app.created_at,
        updated_at: app.updated_at,
      }));

      setApplications(transformedApplications);
      setTotalCount(count || 0);

      // Calculate status counts
      const counts: Record<ApplicationStatus, number> = {
        applied: 0,
        'in-progress': 0,
        rejected: 0,
        offer: 0,
        accepted: 0,
        withdrawn: 0,
      };

      transformedApplications.forEach((app) => {
        counts[app.status] = (counts[app.status] || 0) + 1;
      });

      setStatusCounts(counts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, options]);

  // Fetch applications on mount and when options change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Update application status
  const updateStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status,
          last_update: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status, last_update: new Date().toISOString() }
            : app
        )
      );

      // Recalculate status counts
      await fetchApplications();
    } catch (err) {
      console.error('Error updating application status:', err);
      throw err;
    }
  }, [user, fetchApplications]);

  // Add note to application
  const addNote = useCallback(async (applicationId: string, note: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          notes: note,
          last_update: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, notes: note, last_update: new Date().toISOString() }
            : app
        )
      );
    } catch (err) {
      console.error('Error adding note:', err);
      throw err;
    }
  }, [user]);

  // Create new application
  const createApplication = useCallback(async (jobId: string, data: Partial<Application>) => {
    if (!user) return;

    try {
      const { error: createError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          status: data.status || 'applied',
          applied_date: new Date().toISOString(),
          last_update: new Date().toISOString(),
          notes: data.notes,
          resume_id: data.resume_id,
          cover_letter: data.cover_letter,
          auto_applied: data.auto_applied || false,
        });

      if (createError) throw createError;

      // Refetch to get updated list
      await fetchApplications();
    } catch (err) {
      console.error('Error creating application:', err);
      throw err;
    }
  }, [user, fetchApplications]);

  // Delete application
  const deleteApplication = useCallback(async (applicationId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      await fetchApplications();
    } catch (err) {
      console.error('Error deleting application:', err);
      throw err;
    }
  }, [user, fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    updateStatus,
    addNote,
    createApplication,
    deleteApplication,
    statusCounts,
    totalCount,
  };
}
