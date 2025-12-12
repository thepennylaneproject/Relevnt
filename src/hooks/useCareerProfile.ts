/**
 * ============================================================================
 * USE CAREER PROFILE HOOK
 * ============================================================================
 *
 * Manages user's career profile including preferences, voice profile,
 * job preferences, and bullet bank.
 *
 * Features:
 * - Fetch and update career profile
 * - Manage voice profile settings
 * - Update job preferences (location, salary, values)
 * - Manage bullet bank (resume bullet points)
 *
 * Usage:
 *   const {
 *     profile,
 *     loading,
 *     error,
 *     updateProfile,
 *     updateVoiceProfile,
 *     updateJobPreferences,
 *     addBulletPoint,
 *   } = useCareerProfile();
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface VoiceProfile {
  writing_sample?: string;
  formality_level?: number;      // 1-5
  warmth_level?: number;         // 1-5
  conciseness_level?: number;    // 1-5
  voice_preset?: 'professional' | 'conversational' | 'enthusiastic' | 'technical';
}

export interface JobPreferences {
  desired_titles?: string[];
  preferred_locations?: string[];
  remote_only?: boolean;
  salary_min?: number;
  salary_max?: number;
  job_types?: string[];          // full-time, part-time, contract
  values?: string[];             // work-life balance, growth, impact, etc.
}

export interface BulletPoint {
  id: string;
  content: string;
  category?: string;             // e.g. "leadership", "technical", "achievements"
  tags?: string[];
  created_at: string;
}

export interface CareerProfile {
  id: string;
  user_id: string;

  // Basic info
  full_name?: string;
  current_title?: string;
  years_experience?: number;

  // Skills
  skills?: string[];
  certifications?: string[];

  // Preferences
  job_preferences?: JobPreferences;

  // Voice
  voice_profile?: VoiceProfile;

  // Bullet bank
  bullet_bank?: BulletPoint[];

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UseCareerProfileReturn {
  profile: CareerProfile | null;
  loading: boolean;
  error: string | null;

  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<CareerProfile>) => Promise<void>;
  updateVoiceProfile: (voiceUpdates: Partial<VoiceProfile>) => Promise<void>;
  updateJobPreferences: (prefUpdates: Partial<JobPreferences>) => Promise<void>;
  addBulletPoint: (content: string, category?: string, tags?: string[]) => Promise<void>;
  removeBulletPoint: (bulletId: string) => Promise<void>;
  updateBulletPoint: (bulletId: string, content: string) => Promise<void>;
}

export function useCareerProfile(): UseCareerProfileReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch profile, voice, and bullet bank in parallel
   */
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        { data: profileData, error: profileError },
        { data: voiceData, error: voiceError },
        { data: bulletData, error: bulletError },
        { data: jobPrefsData },
      ] = await Promise.all([
        supabase
          .from('career_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('voice_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('bullet_bank')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('job_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (profileError) throw profileError;
      if (voiceError) throw voiceError;
      if (profileError) throw profileError;
      if (voiceError) throw voiceError;
      if (bulletError) throw bulletError;
      // jobPrefsError might be null if not found (maybeSingle), which is fine


      // career_profiles table has a 'profile' column which is JSON
      const profileJson = (profileData?.profile as any) || {}

      const combinedProfile: CareerProfile = {
        id: profileData?.id || '',
        user_id: userId,
        full_name: profileJson.full_name,
        current_title: profileJson.current_title,
        years_experience: profileJson.years_experience,
        skills: profileJson.skills || [],
        certifications: profileJson.certifications || [],
        job_preferences: (jobPrefsData as unknown as JobPreferences) || {},
        voice_profile: (voiceData as VoiceProfile) || {},
        bullet_bank: (bulletData as BulletPoint[]) || [],
        created_at: profileData?.created_at || new Date().toISOString(),
        updated_at: profileData?.updated_at || new Date().toISOString(),
      };

      setProfile(combinedProfile);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch career profile';
      setError(message);
      console.error('Error fetching career profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Update career profile core fields
   * This focuses on the fields that actually live on career_profiles.
   */
  const updateProfile = useCallback(
    async (updates: Partial<CareerProfile>) => {
      if (!userId) return;

      try {
        const { error: updateError } = await supabase
          .from('career_profiles')
          .upsert({
            user_id: userId,
            profile: {
              full_name: updates.full_name,
              current_title: updates.current_title,
              years_experience: updates.years_experience,
              skills: updates.skills,
              certifications: updates.certifications,
            },
            updated_at: new Date().toISOString(),
          });

        if (updateError) throw updateError;

        // Refetch to stay in sync with DB
        await fetchProfile();
      } catch (err) {
        console.error('Error updating profile:', err);
        throw err;
      }
    },
    [userId, fetchProfile]
  );

  /**
   * Update voice profile row
   */
  const updateVoiceProfile = useCallback(
    async (voiceUpdates: Partial<VoiceProfile>) => {
      if (!userId) return;

      try {
        const { error: updateError } = await supabase
          .from('voice_profiles')
          .upsert({
            user_id: userId,
            ...voiceUpdates,
            updated_at: new Date().toISOString(),
          });

        if (updateError) throw updateError;

        // Local optimistic update
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              voice_profile: {
                ...(prev.voice_profile || {}),
                ...voiceUpdates,
              },
            }
            : prev
        );
      } catch (err) {
        console.error('Error updating voice profile:', err);
        throw err;
      }
    },
    [userId]
  );

  /**
   * Update job preferences JSON on career_profiles
   */
  const updateJobPreferences = useCallback(
    async (prefUpdates: Partial<JobPreferences>) => {
      if (!userId || !profile) return;

      try {
        const updatedPreferences: JobPreferences = {
          ...(profile.job_preferences || {}),
          ...prefUpdates,
        };

        const { error: updateError } = await supabase
          .from('job_preferences')
          .upsert({
            user_id: userId,
            ...updatedPreferences,
            updated_at: new Date().toISOString(),
          });

        if (updateError) throw updateError;

        // Local optimistic update
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              job_preferences: updatedPreferences,
            }
            : prev
        );
      } catch (err) {
        console.error('Error updating job preferences:', err);
        throw err;
      }
    },
    [userId, profile]
  );

  /**
   * Add bullet point to bullet_bank
   */
  const addBulletPoint = useCallback(
    async (content: string, category?: string, tags?: string[]) => {
      if (!userId) return;

      try {
        const { data, error: insertError } = await supabase
          .from('bullet_bank')
          .insert({
            user_id: userId,
            content,
            category,
            tags,
          })
          .select('*')
          .single();

        if (insertError) throw insertError;

        // Optimistic local update
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              bullet_bank: [
                data as BulletPoint,
                ...(prev.bullet_bank || []),
              ],
            }
            : prev
        );
      } catch (err) {
        console.error('Error adding bullet point:', err);
        throw err;
      }
    },
    [userId]
  );

  /**
   * Remove bullet point
   */
  const removeBulletPoint = useCallback(
    async (bulletId: string) => {
      if (!userId) return;

      try {
        const { error: deleteError } = await supabase
          .from('bullet_bank')
          .delete()
          .eq('id', bulletId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        setProfile((prev) =>
          prev
            ? {
              ...prev,
              bullet_bank: prev.bullet_bank?.filter((b) => b.id !== bulletId),
            }
            : prev
        );
      } catch (err) {
        console.error('Error removing bullet point:', err);
        throw err;
      }
    },
    [userId]
  );

  /**
   * Update a single bullet point content
   */
  const updateBulletPoint = useCallback(
    async (bulletId: string, content: string) => {
      if (!userId) return;

      try {
        const { error: updateError } = await supabase
          .from('bullet_bank')
          .update({ content })
          .eq('id', bulletId)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        setProfile((prev) =>
          prev
            ? {
              ...prev,
              bullet_bank: prev.bullet_bank?.map((b) =>
                b.id === bulletId ? { ...b, content } : b
              ),
            }
            : prev
        );
      } catch (err) {
        console.error('Error updating bullet point:', err);
        throw err;
      }
    },
    [userId]
  );

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    updateVoiceProfile,
    updateJobPreferences,
    addBulletPoint,
    removeBulletPoint,
    updateBulletPoint,
  };
}