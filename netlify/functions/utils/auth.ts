/**
 * ============================================================================
 * AUTHENTICATION UTILITY
 * ============================================================================
 * ðŸŽ“ LEARNING NOTE: These functions help verify user identity and extract
 * user information from JWT tokens. This is how we know WHO is making each
 * API request.
 * ============================================================================
 */

import { HandlerEvent } from '@netlify/functions';
import { createAdminClient, createAuthenticatedClient } from './supabase';

/**
 * Extract the access token from the Authorization header
 * Expected format: "Bearer YOUR_TOKEN_HERE"
 * 
 * @param event - The Netlify function event
 * @returns The access token or null if not found
 */
export function extractToken(event: HandlerEvent): string | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Remove "Bearer " prefix
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token || null;
}

/**
 * Get the authenticated user from the request
 * 
 * ðŸŽ“ LEARNING NOTE: This function verifies the JWT token and returns the user.
 * JWT tokens contain encoded user information that can't be forged without
 * the secret key (which only Supabase has).
 * 
 * @param event - The Netlify function event
 * @returns The authenticated user or null
 */
export async function getAuthenticatedUser(event: HandlerEvent) {
  try {
    // Extract token from Authorization header
    const token = extractToken(event);

    if (!token) {
      return null;
    }

    // Create a Supabase client with this token
    const supabase = createAuthenticatedClient(token);

    // ✅ CORRECT: getUser() only returns data, throws on error
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
 * Use this at the start of protected endpoints
 * 
 * @param event - The Netlify function event
 * @returns The authenticated user
 * @throws Error if not authenticated
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
 * 
 * @param userId - The user's ID
 * @returns The user's profile or null
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
 * Check if user has a specific tier (starter, pro, premium)
 * 
 * @param userId - The user's ID
 * @param requiredTier - The required tier level
 * @returns True if user has access, false otherwise
 */
export async function checkTierAccess(
  userId: string, 
  requiredTier: 'starter' | 'pro' | 'premium'
): Promise<boolean> {
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return false;
  }
  
  // Tier hierarchy: starter < pro < premium
  const tierHierarchy = { starter: 1, pro: 2, premium: 3 };
  const userTierLevel = tierHierarchy[profile.tier as keyof typeof tierHierarchy] || 0;
  const requiredTierLevel = tierHierarchy[requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}

/**
 * Feature flags based on user tier
 * 
 * ðŸŽ“ LEARNING NOTE: Different tiers have different feature access.
 * This function returns what features the user can use.
 */
export async function getUserFeatures(userId: string) {
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return null;
  }
  
  // Define features per tier
  const features = {
    starter: {
      maxResumes: 2,
      maxJobsSaved: 50,
      maxApplications: 10,
      aiFeatures: ['basic_resume_review'],
      atsScoring: false,
      advancedSearch: false,
      interviewPrep: false
    },
    pro: {
      maxResumes: 10,
      maxJobsSaved: 200,
      maxApplications: 50,
      aiFeatures: ['basic_resume_review', 'ats_optimization', 'cover_letter_generation'],
      atsScoring: true,
      advancedSearch: true,
      interviewPrep: true
    },
    premium: {
      maxResumes: -1, // Unlimited
      maxJobsSaved: -1, // Unlimited
      maxApplications: -1, // Unlimited
      aiFeatures: ['basic_resume_review', 'ats_optimization', 'cover_letter_generation', 'interview_prep', 'job_matching', 'skill_analysis'],
      atsScoring: true,
      advancedSearch: true,
      interviewPrep: true
    }
  };
  
  return features[profile.tier as keyof typeof features] || features.starter;
}

/**
 * Verify that user can perform an action based on their tier
 * 
 * @param userId - The user's ID
 * @param action - The action to check (e.g., 'create_resume')
 * @returns Error message if not allowed, null if allowed
 */
export async function verifyTierLimit(
  userId: string,
  action: 'create_resume' | 'save_job' | 'create_application' | 'use_ai_feature'
): Promise<string | null> {
  const supabase = createAdminClient();
  const features = await getUserFeatures(userId);
  
  if (!features) {
    return 'User not found';
  }
  
  // Check limits based on action
  switch (action) {
    case 'create_resume': {
      if (features.maxResumes === -1) return null; // Unlimited
      
      const countResponse = await supabase.from('resumes').select('*', { count: 'exact', head: true });
      const count = (countResponse as any)?.count || 0;
      
      if (count && count >= features.maxResumes) {
        return `You've reached your resume limit (${features.maxResumes}). Upgrade to create more!`;
      }
      return null;
    }
    
    case 'save_job': {
      if (features.maxJobsSaved === -1) return null; // Unlimited
      
      const countResponse = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const count = (countResponse as any)?.count || 0;
      
      if (count && count >= features.maxJobsSaved) {
        return `You've reached your saved jobs limit (${features.maxJobsSaved}). Upgrade to save more!`;
      }
      return null;
    }
    
    case 'create_application': {
      if (features.maxApplications === -1) return null; // Unlimited
      
      const countResponse = await supabase.from('applications').select('*', { count: 'exact', head: true });
      const count = (countResponse as any)?.count || 0;
      
      if (count && count >= features.maxApplications) {
        return `You've reached your applications limit (${features.maxApplications}). Upgrade to track more!`;
      }
      return null;
    }
    
    default:
      return null;
  }
}
