/**
 * ============================================================================
 * AUTHENTICATION UTILITY FOR READY
 * ============================================================================
 * Functions to verify user identity and extract user information from JWT tokens.
 * ============================================================================
 */

import { HandlerEvent } from '@netlify/functions';
import { createAdminClient, createAuthenticatedClient } from './supabase';

/**
 * Extract the access token from the Authorization header
 */
export function extractToken(event: HandlerEvent): string | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token || null;
}

/**
 * Get the authenticated user from the request
 */
export async function getAuthenticatedUser(event: HandlerEvent) {
  try {
    const token = extractToken(event);

    if (!token) {
      return null;
    }

    const supabase = createAuthenticatedClient(token);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No user found');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth(event: HandlerEvent) {
  const user = await getAuthenticatedUser(event);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Get user's profile from the database
 */
export async function getUserProfile(userId: string) {
  const supabase = createAdminClient();
  
  const response = await supabase.from('profiles').select().eq('user_id', userId).single();
  const profile = (response as any)?.data;
  const error = (response as any)?.error;
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return profile;
}

/**
 * Check if user has a specific tier
 */
export async function checkTierAccess(
  userId: string, 
  requiredTier: 'free' | 'pro' | 'premium' | 'coach'
): Promise<boolean> {
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return false;
  }
  
  const tierHierarchy = { free: 1, pro: 2, premium: 3, coach: 4 };
  const userTierLevel = tierHierarchy[profile.tier as keyof typeof tierHierarchy] || 0;
  const requiredTierLevel = tierHierarchy[requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}

/**
 * Feature flags based on user tier for Ready
 */
export async function getUserFeatures(userId: string) {
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return null;
  }
  
  const features = {
    free: {
      maxPracticeSessions: 5,
      maxAssessments: 2,
      aiFeatures: ['basic_assessment'],
      interviewPrep: true,
      skillGapAnalysis: false,
      unlimitedPractice: false
    },
    pro: {
      maxPracticeSessions: 50,
      maxAssessments: 20,
      aiFeatures: ['basic_assessment', 'skill_gap', 'interview_coaching'],
      interviewPrep: true,
      skillGapAnalysis: true,
      unlimitedPractice: false
    },
    premium: {
      maxPracticeSessions: -1, // Unlimited
      maxAssessments: -1,
      aiFeatures: ['basic_assessment', 'skill_gap', 'interview_coaching', 'portfolio_analysis', 'salary_negotiation'],
      interviewPrep: true,
      skillGapAnalysis: true,
      unlimitedPractice: true
    },
    coach: {
      maxPracticeSessions: -1,
      maxAssessments: -1,
      aiFeatures: ['all'],
      interviewPrep: true,
      skillGapAnalysis: true,
      unlimitedPractice: true
    }
  };
  
  return features[profile.tier as keyof typeof features] || features.free;
}
