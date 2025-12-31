/**
 * ONBOARDING GATE - Ready App
 * Protects routes by ensuring the user has completed onboarding (set their goal).
 */
import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingGateProps {
  children: ReactNode;
}

export const OnboardingGate = ({ children }: OnboardingGateProps) => {
  const { user, profile, loading, profileLoaded } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only act if not loading and we have a user
    if (!loading && user && profileLoaded) {
      // If user has no profile or no goal set, redirect to onboarding
      const isOnboardingComplete = profile && profile.goal;
      
      if (!isOnboardingComplete) {
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding');
        }
      } else if (location.pathname === '/onboarding') {
        // If they already completed it but are on the onboarding page, send home
        navigate('/');
      }
    }
  }, [user, profile, loading, profileLoaded, navigate, location.pathname]);

  // Show nothing or a loader while checking
  if (loading || (user && !profileLoaded)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-text-secondary text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of content if we're about to redirect
  if (user && (!profile || !profile.goal) && location.pathname !== '/onboarding') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-text-secondary">Redirecting to onboarding...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OnboardingGate;
