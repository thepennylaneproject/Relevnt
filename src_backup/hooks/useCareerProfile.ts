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
 * ```tsx
 * const { profile, loading, updateProfile, updateVoice } = useCareerProfile();
 * ```
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface VoiceProfile {
  writing_sample?: string;
  formality_level?: number; // 1-5
  warmth_level?: number; // 1-5
  conciseness_level?: number; // 1-5
  voice_preset?: 'professional' | 'conversational' | 'enthusiastic' | 'technical';
}

export interface JobPreferences {
  desired_titles?: string[];
  preferred_locations?: string[];
  remote_only?: boolean;
  salary_min?: number;
  salary_max?: number;
  job_types?: string[]; // full-time, part-time, contract
  values?: string[]; // work-life balance, growth, impact, etc.
}

export interface BulletPoint {
  id: string;
  content: string;
  category?: string; // e.g., "leadership", "technical", "achievements"
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
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch career profile
      const { data: profileData, error: profileError } = await supabase
        .from('career_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch voice profile
      const { data: voiceData, error: voiceError } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (voiceError && voiceError.code !== 'PGRST116') {
        throw voiceError;
      }

      // Fetch bullet bank
      const { data: bulletData, error: bulletError } = await supabase
        .from('bullet_bank')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bulletError) throw bulletError;

      // Combine into single profile
      const combinedProfile: CareerProfile = {
        id: profileData?.id || '',
        user_id: user.id,
        full_name: profileData?.full_name,
        current_title: profileData?.current_title,
        years_experience: profileData?.years_experience,
        skills: profileData?.skills || [],
        certifications: profileData?.certifications || [],
        job_preferences: profileData?.job_preferences || {},
        voice_profile: voiceData || {},
        bullet_bank: bulletData || [],
        created_at: profileData?.created_at || new Date().toISOString(),
        updated_at: profileData?.updated_at || new Date().toISOString(),
      };

      setProfile(combinedProfile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch career profile';
      setError(message);
      console.error('Error fetching career profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update career profile
  const updateProfile = useCallback(async (updates: Partial<CareerProfile>) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('career_profiles')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Refetch to get updated data
      await fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }, [user, fetchProfile]);

  // Update voice profile
  const updateVoiceProfile = useCallback(async (voiceUpdates: Partial<VoiceProfile>) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('voice_profiles')
        .upsert({
          user_id: user.id,
          ...voiceUpdates,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              voice_profile: { ...prev.voice_profile, ...voiceUpdates },
            }
          : null
      );
    } catch (err) {
      console.error('Error updating voice profile:', err);
      throw err;
    }
  }, [user]);

  // Update job preferences
  const updateJobPreferences = useCallback(async (prefUpdates: Partial<JobPreferences>) => {
    if (!user || !profile) return;

    try {
      const updatedPreferences = { ...profile.job_preferences, ...prefUpdates };

      const { error: updateError } = await supabase
        .from('career_profiles')
        .update({
          job_preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              job_preferences: updatedPreferences,
            }
          : null
      );
    } catch (err) {
      console.error('Error updating job preferences:', err);
      throw err;
    }
  }, [user, profile]);

  // Add bullet point
  const addBulletPoint = useCallback(async (content: string, category?: string, tags?: string[]) => {
    if (!user) return;

    try {
      const { error: insertError } = await supabase
        .from('bullet_bank')
        .insert({
          user_id: user.id,
          content,
          category,
          tags,
        });

      if (insertError) throw insertError;

      // Refetch to get updated list
      await fetchProfile();
    } catch (err) {
      console.error('Error adding bullet point:', err);
      throw err;
    }
  }, [user, fetchProfile]);

  // Remove bullet point
  const removeBulletPoint = useCallback(async (bulletId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('bullet_bank')
        .delete()
        .eq('id', bulletId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              bullet_bank: prev.bullet_bank?.filter((b) => b.id !== bulletId),
            }
          : null
      );
    } catch (err) {
      console.error('Error removing bullet point:', err);
      throw err;
    }
  }, [user]);

  // Update bullet point
  const updateBulletPoint = useCallback(async (bulletId: string, content: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('bullet_bank')
        .update({ content })
        .eq('id', bulletId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              bullet_bank: prev.bullet_bank?.map((b) =>
                b.id === bulletId ? { ...b, content } : b
              ),
            }
          : null
      );
    } catch (err) {
      console.error('Error updating bullet point:', err);
      throw err;
    }
  }, [user]);

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
