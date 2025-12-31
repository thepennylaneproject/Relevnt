/**
 * AUTH CONTEXT - Ready App
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, AuthChangeEvent, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { ReadyProfile } from '../types';

export interface AuthContextType {
  user: User | null;
  profile: ReadyProfile | null;
  session: Session | null;
  loading: boolean;
  profileLoaded: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ReadyProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    setProfileLoaded(false);
    try {
      const { data, error } = await supabase
        .from('ready_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data as ReadyProfile ?? null);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoaded(true);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Check for existing session with a timeout to prevent hanging on invalid URLs
    const checkSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        setSession(session);
        setUser(session?.user as User ?? null);
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        const newUser = session?.user as User ?? null;
        setUser(newUser);
        if (newUser) {
          fetchProfile(newUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      setUser(data.user as User ?? null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });
      if (err) throw err;
      setUser(data.user as User ?? null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error: err } = await supabase.auth.signOut();
      if (err) throw err;
      setUser(null);
      setSession(null);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    profileLoaded,
    error,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
