/**
 * ANALYTICS EVENT TRACKING SERVICE
 * 
 * Centralized event tracking for all product and marketing events.
 * Events are logged to Supabase analytics table and forwarded to monitoring tools.
 * 
 * Tracks:
 * - User events (signup, login, logout)
 * - Product events (analyses, feature usage, tier changes)
 * - Marketing events (upgrade clicks, promo application)
 * - Error events (for debugging)
 * 
 * Usage:
 * trackEvent('upgrade_clicked', { currentTier: 'starter', targetTier: 'pro' })
 */

import { useAuth } from '../contexts/AuthContext';

export type EventName =
  // User events
  | 'signup_started'
  | 'signup_completed'
  | 'login'
  | 'logout'
  | 'password_reset'
  
  // Onboarding events
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'first_resume_upload'
  | 'first_analysis'
  
  // Product events
  | 'analysis_run'
  | 'analysis_limit_reached'
  | 'resume_optimized'
  | 'interview_prep_started'
  | 'skill_gap_viewed'
  | 'job_searched'
  | 'job_saved'
  | 'job_applied'
  | 'application_tracked'
  
  // Marketing & upgrade events
  | 'upgrade_prompt_viewed'
  | 'upgrade_clicked'
  | 'tier_upgraded'
  | 'tier_downgraded'
  | 'subscription_started'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'promo_applied'
  | 'promo_expired'
  | 'reactivation_triggered'
  
  // Error events
  | 'error_occurred'
  | 'api_call_failed';

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

interface AnalyticsEvent {
  id?: string;
  user_id?: string;
  event_name: EventName;
  properties?: EventProperties;
  timestamp: string;
  session_id?: string;
  source: 'web' | 'api' | 'admin';
}

class AnalyticsService {
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isReady: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize session (on app load)
   */
  private initializeSession(): void {
    try {
      // Try to load session from localStorage
      const savedSession = localStorage.getItem('analytics_session');
      if (savedSession) {
        this.sessionId = savedSession;
      } else {
        localStorage.setItem('analytics_session', this.sessionId);
      }
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
      this.isReady = true; // Continue anyway
    }
  }

  /**
   * Main track event function
   */
  async trackEvent(
    eventName: EventName,
    properties?: EventProperties,
    userId?: string
  ): Promise<void> {
    if (!this.isReady) return;

    const event: AnalyticsEvent = {
      event_name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      source: 'web',
      user_id: userId,
    };

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', eventName, properties);
      }

      // Send to backend analytics endpoint
      await fetch('/.netlify/functions/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      // Forward to external services if configured
      this.forwardToExternalServices(event);
    } catch (error) {
      console.error('Failed to track event:', error);
      // Queue for retry on next opportunity
      this.eventQueue.push(event);
    }
  }

  /**
   * Forward events to external analytics services
   * (Segment, Mixpanel, etc.)
   */
  private forwardToExternalServices(event: AnalyticsEvent): void {
    // Segment integration (if installed)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event.event_name, event.properties || {});
    }

    // Google Analytics 4 (if installed)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event_name, {
        session_id: event.session_id,
        ...event.properties,
      });
    }
  }

  /**
   * Retry queued events
   */
  async retryQueuedEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const queue = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of queue) {
      try {
        await fetch('/.netlify/functions/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch (error) {
        // Re-queue if failed
        this.eventQueue.push(event);
      }
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

/**
 * Main export - track an event
 */
export async function trackEvent(
  eventName: EventName,
  properties?: EventProperties,
  userId?: string
): Promise<void> {
  return analyticsService.trackEvent(eventName, properties, userId);
}

/**
 * Hook for tracking events with auth context
 */
export function useAnalytics() {
  const { user } = useAuth();

  return {
    trackEvent: (eventName: EventName, properties?: EventProperties) => {
      return trackEvent(eventName, properties, user?.id);
    },
    trackError: (error: Error, context?: string) => {
      return trackEvent('error_occurred', {
        error_message: error.message,
        error_stack: error.stack,
        context,
      });
    },
  };
}

/**
 * Conversion funnel tracking helpers
 */
export const conversionFunnelEvents = {
  // Starter → Pro
  starterAnalysisLimitReached: (analysisCount: number) =>
    trackEvent('analysis_limit_reached', { analysis_count: analysisCount }),
  
  starterUpgradePromptViewed: () =>
    trackEvent('upgrade_prompt_viewed', { from_tier: 'starter', to_tier: 'pro' }),
  
  starterUpgradeClicked: () =>
    trackEvent('upgrade_clicked', { from_tier: 'starter', to_tier: 'pro' }),
  
  starterUpgraded: () =>
    trackEvent('tier_upgraded', { from_tier: 'starter', to_tier: 'pro' }),

  // Pro → Premium
  proUpgradePromptViewed: () =>
    trackEvent('upgrade_prompt_viewed', { from_tier: 'pro', to_tier: 'premium' }),
  
  proUpgradeClicked: () =>
    trackEvent('upgrade_clicked', { from_tier: 'pro', to_tier: 'premium' }),
  
  proUpgraded: () =>
    trackEvent('tier_upgraded', { from_tier: 'pro', to_tier: 'premium' }),

  // Promo events
  eduPromoApplied: (duration_days: number) =>
    trackEvent('promo_applied', { promo_type: 'edu', duration_days }),
  
  eduPromoExpired: () =>
    trackEvent('promo_expired', { promo_type: 'edu' }),
  
  reactivationTriggered: (days_since_churn: number) =>
    trackEvent('reactivation_triggered', { days_since_churn }),
};

/**
 * Product event tracking helpers
 */
export const productEvents = {
  resumeAnalyzed: (duration_ms: number, modelUsed: string) =>
    trackEvent('analysis_run', { feature: 'resume_analysis', duration_ms, model: modelUsed }),
  
  jobMatched: (matchScore: number, sourceId: string) =>
    trackEvent('job_searched', { match_score: matchScore, source: sourceId }),
  
  interviewPrepStarted: (jobTitle: string) =>
    trackEvent('interview_prep_started', { job_title: jobTitle }),
  
  skillGapViewed: (skillsMissing: number) =>
    trackEvent('skill_gap_viewed', { skills_missing: skillsMissing }),
  
  applicationTracked: (sourceId: string, matchScore: number) =>
    trackEvent('application_tracked', { source: sourceId, match_score: matchScore }),
};

// Retry queued events when app regains connection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    analyticsService.retryQueuedEvents();
  });
}

export default analyticsService;
