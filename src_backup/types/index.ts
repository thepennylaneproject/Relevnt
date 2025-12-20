/**
 * APPLICATION TYPE DEFINITIONS
 * 
 * 🎓 LEARNING NOTE: We extend Supabase's User type with our custom fields
 * that come from the profiles table (tier, full_name, etc.)
 */

import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Extended User - Combines Supabase auth with profile data
 */
export interface User extends SupabaseUser {
  // 🎓 Custom fields from profiles table
  tier?: 'starter' | 'pro' | 'premium';
  full_name?: string;
  avatar_url?: string;
}

export type { SupabaseUser };
