/**
 * FEATURE GATE COMPONENT
 * 
 * Controls access to features based on user tier and feature name
 * Shows upgrade prompts for features user doesn't have access to
 */

import React, { ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type TierLevel = 'starter' | 'pro' | 'premium';

export type FeatureName =
  | 'job-search'
  | 'resume-builder'
  | 'resume-extract'      // ← ADD THIS
  | 'resume-analyze'      // ← ADD THIS
  | 'resume-optimize'
  | 'cover-letter'
  | 'interview-prep'
  | 'analytics'
  | 'ai-resume-review'
  | 'batch-applications';

interface FeatureGateProps {
  children: ReactNode;
  feature: FeatureName;
  requiredTier: TierLevel;
  userTier: TierLevel;
  onUpgradeClick?: () => void;
}

// ============================================================================
// FEATURE DEFINITIONS
// ============================================================================

const FEATURE_INFO: Record<FeatureName, { name: string; description: string }> = {
  'resume-extract': {
    name: 'Resume Extract',
    description: 'Extract data from resume PDFs',
  },
  'resume-analyze': {
    name: 'Resume Analyze',
    description: 'Analyze resume for ATS compatibility',
  },
  'resume-optimize': {
    name: 'Resume Optimize',
    description: 'Get optimization suggestions',
  },
  'job-search': {
    name: 'Job Search',
    description: 'Search and filter job listings',
  },
  'resume-builder': {
    name: 'Resume Builder',
    description: 'Create and manage professional resumes',
  },
  'cover-letter': {
    name: 'Cover Letter Generator',
    description: 'Generate personalized cover letters with AI',
  },
  'interview-prep': {
    name: 'Interview Preparation',
    description: 'Practice interviews with AI feedback',
  },
  'analytics': {
    name: 'Application Analytics',
    description: 'Track and analyze your applications',
  },
  'ai-resume-review': {
    name: 'AI Resume Review',
    description: 'Get AI-powered feedback on your resume',
  },
  'batch-applications': {
    name: 'Batch Applications',
    description: 'Apply to multiple jobs at once',
  },
};

// ============================================================================
// TIER HIERARCHY
// ============================================================================

const TIER_HIERARCHY: Record<TierLevel, number> = {
  starter: 0,
  pro: 1,
  premium: 2,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFeatureDisplayName(feature: FeatureName): string {
  return FEATURE_INFO[feature]?.name || feature;
}

export function getTierDisplayName(tier: TierLevel): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeatureGate({
  children,
  feature,
  requiredTier,
  userTier,
  onUpgradeClick,
}: FeatureGateProps) {
  const userTierLevel = TIER_HIERARCHY[userTier];
  const requiredTierLevel = TIER_HIERARCHY[requiredTier];
  const hasAccess = userTierLevel >= requiredTierLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  return (
    <div style={styles.gateContainer}>
      <div style={styles.lockedContent}>
        <div style={styles.lockIcon}>🔒</div>
        <h3 style={styles.featureName}>
          {getFeatureDisplayName(feature)}
        </h3>
        <p style={styles.description}>
          {FEATURE_INFO[feature]?.description}
        </p>
        <p style={styles.requiredTier}>
          Available on {getTierDisplayName(requiredTier)} plan and above
        </p>
        <button
          style={styles.upgradeButton}
          onClick={onUpgradeClick}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  gateContainer: {
    width: '100%',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #efefef 100%)',
    borderRadius: '8px',
    border: '2px solid #ddd',
  },
  lockedContent: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  lockIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  featureName: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  requiredTier: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  upgradeButton: {
    padding: '10px 24px',
    background: '#4E808D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background 0.2s ease',
  },
};