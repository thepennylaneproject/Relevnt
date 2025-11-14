/**
 * ============================================================================
 * TIER SYSTEM CONFIGURATION
 * ============================================================================
 * 🎯 PURPOSE: Define tier structure and feature access control
 * 
 * Tier Hierarchy:
 *   - Starter (Free) : Basic job search + resume upload
 *   - Pro ($19/mo): Resume optimization + cover letters + interview prep
 *   - Premium ($49/mo): Everything + analytics + AI coaching
 * 
 * Access Model:
 *   - Starter users cannot access Pro/Premium features
 *   - Unlock Pro: Payment OR .EDU email verification
 *   - Unlock Premium: Payment only
 * 
 * 🎓 LEARNING NOTE: This is a "freemium" model designed to let free users
 * get value (job search + basic resume tools) while creating clear upgrade
 * paths to premium features. The .EDU hack is a student acquisition strategy.
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TierLevel = 'starter' | 'pro' | 'premium';

export type FeatureName =
  | 'job-search'
  | 'resume-upload'
  | 'resume-extract'
  | 'resume-analyze'
  | 'resume-optimize'
  | 'cover-letter-generate'
  | 'interview-prep'
  | 'analytics-dashboard'
  | 'skill-gap-analysis'
  | 'ai-coaching';

export interface TierConfig {
  name: string;
  price: number | null;
  billingCycle: 'monthly' | 'free';
  features: FeatureName[];
  limits: {
    analysesPerMonth: number;
    resumes: number;
    coverLetters: number;
    interviewSessions: number;
  };
  description: string;
}

export interface FeatureAccess {
  feature: FeatureName;
  requiredTier: TierLevel;
  description: string;
}

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

/**
 * 🎯 TIER HIERARCHY & FEATURE ACCESS
 * 
 * This object defines what each tier includes. Features cascade:
 * - If it's in Starter, it's also in Pro and Premium
 * - If it's in Pro, it's also in Premium
 * - Premium has everything
 */
export const TIERS: Record<TierLevel, TierConfig> = {
  starter: {
    name: 'Starter',
    price: null, // Free
    billingCycle: 'free',
    features: [
      'job-search',        // Can search jobs
      'resume-upload',     // Can upload resume
      'resume-extract',    // Can extract resume data (1x/month free)
    ],
    limits: {
      analysesPerMonth: 1,      // 1 free analysis
      resumes: 1,               // 1 resume only
      coverLetters: 0,          // No cover letters
      interviewSessions: 0,     // No interview prep
    },
    description: 'Perfect for exploring. 1 monthly analysis.',
  },

  pro: {
    name: 'Professional',
    price: 1999, // $19.99/month in cents
    billingCycle: 'monthly',
    features: [
      'job-search',
      'resume-upload',
      'resume-extract',
      'resume-analyze',         // ✨ NEW: Deep analysis
      'resume-optimize',        // ✨ NEW: ATS suggestions
      'cover-letter-generate',  // ✨ NEW: AI letters
      'interview-prep',         // ✨ NEW: Practice questions
      'skill-gap-analysis',     // ✨ NEW: Skills comparison
    ],
    limits: {
      analysesPerMonth: 50,     // 50 analyses
      resumes: 5,               // 5 resumes
      coverLetters: 10,         // 10 letters/month
      interviewSessions: 20,    // 20 practice sessions/month
    },
    description: 'Deep clarity for active job seekers. 50 monthly analyses.',
  },

  premium: {
    name: 'Premium',
    price: 4999, // $49.99/month in cents
    billingCycle: 'monthly',
    features: [
      'job-search',
      'resume-upload',
      'resume-extract',
      'resume-analyze',
      'resume-optimize',
      'cover-letter-generate',
      'interview-prep',
      'skill-gap-analysis',
      'analytics-dashboard', // ✨ NEW: Application tracking
      'ai-coaching',         // ✨ NEW: Personal coaching
    ],
    limits: {
      analysesPerMonth: 999,    // Unlimited (999 is practical limit)
      resumes: 20,              // 20 resumes
      coverLetters: 999,        // Unlimited cover letters
      interviewSessions: 999,   // Unlimited interview prep
    },
    description: 'Unlimited insights. Advanced coaching and analytics.',
  },
};

// ============================================================================
// FEATURE ACCESS MAP
// ============================================================================

/**
 * 🎯 QUICK REFERENCE: Which tier is required for each feature
 * 
 * Use this to quickly check access:
 *   const requiredTier = FEATURE_ACCESS['resume-optimize'].requiredTier
 *   const hasAccess = userTier >= TIER_HIERARCHY[requiredTier]
 */
export const FEATURE_ACCESS: Record<FeatureName, FeatureAccess> = {
  'job-search': {
    feature: 'job-search',
    requiredTier: 'starter',
    description: 'Search and filter job listings',
  },
  'resume-upload': {
    feature: 'resume-upload',
    requiredTier: 'starter',
    description: 'Upload and manage resume files',
  },
  'resume-extract': {
    feature: 'resume-extract',
    requiredTier: 'starter',
    description: 'Extract structured data from resume (1x/month free)',
  },
  'resume-analyze': {
    feature: 'resume-analyze',
    requiredTier: 'pro',
    description: 'Get deep ATS analysis and scoring',
  },
  'resume-optimize': {
    feature: 'resume-optimize',
    requiredTier: 'pro',
    description: 'Get AI-powered optimization suggestions',
  },
  'cover-letter-generate': {
    feature: 'cover-letter-generate',
    requiredTier: 'pro',
    description: 'Generate personalized cover letters with AI',
  },
  'interview-prep': {
    feature: 'interview-prep',
    requiredTier: 'pro',
    description: 'Practice with AI-generated interview questions',
  },
  'skill-gap-analysis': {
    feature: 'skill-gap-analysis',
    requiredTier: 'pro',
    description: 'Compare your skills vs job requirements',
  },
  'analytics-dashboard': {
    feature: 'analytics-dashboard',
    requiredTier: 'premium',
    description: 'Track applications and job search metrics',
  },
  'ai-coaching': {
    feature: 'ai-coaching',
    requiredTier: 'premium',
    description: 'Get personalized AI coaching and guidance',
  },
};

// ============================================================================
// TIER HIERARCHY (for numeric comparison)
// ============================================================================

/**
 * 🎯 TIER LEVELS: Used for permission checking
 * 
 * Example:
 *   const userLevel = TIER_HIERARCHY[userTier]      // 0
 *   const requiredLevel = TIER_HIERARCHY['pro']     // 1
 *   const hasAccess = userLevel >= requiredLevel    // false
 * 
 * 🎓 LEARNING NOTE: Using numeric levels makes it easy to check
 * if a user's tier is "high enough" for a feature without complex
 * string comparisons. Higher number = higher tier = more features.
 */
export const TIER_HIERARCHY: Record<TierLevel, number> = {
  starter: 0,   // Free - baseline
  pro: 1,       // $19/mo - mid tier
  premium: 2,   // $49/mo - top tier
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has access to a feature
 * 
 * @example
 * hasFeatureAccess('resume-optimize', 'starter')  // false
 * hasFeatureAccess('resume-optimize', 'pro')      // true
 * hasFeatureAccess('resume-optimize', 'premium')  // true
 */
export function hasFeatureAccess(
  feature: FeatureName,
  userTier: TierLevel
): boolean {
  const featureRequirement = FEATURE_ACCESS[feature];
  if (!featureRequirement) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }

  const userLevel = TIER_HIERARCHY[userTier];
  const requiredLevel = TIER_HIERARCHY[featureRequirement.requiredTier];

  return userLevel >= requiredLevel;
}

/**
 * Get the minimum tier required for a feature
 * 
 * @example
 * getRequiredTier('resume-optimize')  // 'pro'
 * getRequiredTier('job-search')       // 'starter'
 */
export function getRequiredTier(feature: FeatureName): TierLevel {
  return FEATURE_ACCESS[feature]?.requiredTier || 'starter';
}

/**
 * Get all features available in a tier
 * 
 * @example
 * getFeaturesByTier('pro')  // ['job-search', 'resume-upload', 'resume-extract', ...]
 */
export function getFeaturesByTier(tier: TierLevel): FeatureName[] {
  return TIERS[tier].features;
}

/**
 * Get all features the user doesn't have access to
 * Useful for showing what's locked
 * 
 * @example
 * getLockedFeatures('starter')  // ['resume-analyze', 'resume-optimize', ...]
 */
export function getLockedFeatures(userTier: TierLevel): FeatureName[] {
  const allFeatures = Object.keys(FEATURE_ACCESS) as FeatureName[];
  return allFeatures.filter(feature => !hasFeatureAccess(feature, userTier));
}

/**
 * Get features unlocked by upgrading to a tier
 * Useful for showing upgrade benefits
 * 
 * @example
 * getUpgradeGains('starter', 'pro')  // ['resume-analyze', 'resume-optimize', ...]
 */
export function getUpgradeGains(
  fromTier: TierLevel,
  toTier: TierLevel
): FeatureName[] {
  const currentFeatures = new Set(getFeaturesByTier(fromTier));
  const targetFeatures = new Set(getFeaturesByTier(toTier));

  return Array.from(targetFeatures).filter(f => !currentFeatures.has(f));
}

/**
 * Get next tier to upgrade to
 * 
 * @example
 * getNextTier('starter')  // 'pro'
 * getNextTier('pro')      // 'premium'
 * getNextTier('premium')  // undefined (already at top)
 */
export function getNextTier(currentTier: TierLevel): TierLevel | undefined {
  const tierLevels: TierLevel[] = ['starter', 'pro', 'premium'];
  const currentIndex = tierLevels.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex === tierLevels.length - 1) {
    return undefined;
  }

  return tierLevels[currentIndex + 1];
}

/**
 * Get tier display name with price
 * 
 * @example
 * getTierDisplayName('pro')  // "Professional - $19/month"
 */
export function getTierDisplayName(tier: TierLevel): string {
  const config = TIERS[tier];
  if (config.price === null) {
    return `${config.name} - Free`;
  }

  const priceInDollars = (config.price / 100).toFixed(2);
  return `${config.name} - $${priceInDollars}/month`;
}

/**
 * 🎓 LEARNING NOTE: Check if user can upgrade
 * 
 * Upgrade paths:
 * 1. Payment (credit card) - anyone can do this
 * 2. .EDU email verification - free for students
 * 
 * This function would be used in the upgrade flow
 */
export function canUpgradeToTier(
  currentTier: TierLevel,
  targetTier: TierLevel,
): boolean {
  // Premium always requires payment
  if (targetTier === 'premium') {
    return true; // User must pay
  }

  // Pro can be unlocked via payment OR .EDU email
  if (targetTier === 'pro' && currentTier === 'starter') {
    return true; // Either payment OR .EDU works
  }

  // Downgrade not allowed
  if (TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[targetTier]) {
    return false;
  }

  return true;
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * 📋 QUICK REFERENCE FOR PAGE IMPORTS
 * 
 * import {
 *   TIERS,                    // Tier definitions with features + limits
 *   FEATURE_ACCESS,           // Feature → required tier mapping
 *   hasFeatureAccess,         // Check if user can access feature
 *   getRequiredTier,          // Get minimum tier for feature
 *   getTierDisplayName,       // Format tier name with price
 *   getUpgradeGains,          // Show what user gets by upgrading
 *   TIER_HIERARCHY,           // Numeric tier levels
 * } from '@/config/tiers'
 * 
 * 
 * 💡 USAGE PATTERNS
 * 
 * Pattern 1: Check Access in Component
 * ──────────────────────────────────────
 * const canAnalyze = hasFeatureAccess('resume-analyze', userTier)
 * if (!canAnalyze) {
 *   return <UpgradePrompt tier={getRequiredTier('resume-analyze')} />
 * }
 * 
 * 
 * Pattern 2: Show Upgrade Benefits
 * ─────────────────────────────────
 * const gains = getUpgradeGains(userTier, 'pro')
 * <div>
 *   <p>Upgrade to Pro and get:</p>
 *   <ul>
 *     {gains.map(f => <li>{FEATURE_ACCESS[f].description}</li>)}
 *   </ul>
 * </div>
 * 
 * 
 * Pattern 3: Gate a Feature in Pages
 * ───────────────────────────────────
 * <FeatureGate
 *   feature="resume-analyze"
 *   requiredTier={getRequiredTier('resume-analyze')}
 *   userTier={user.tier}
 * >
 *   <ResumeAnalyzer />
 * </FeatureGate>
 */
