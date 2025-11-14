import React from 'react';
import { FeatureName } from '../../contexts/theme.types';
import './UpgradePrompt.css';

interface UpgradePromptProps {
  feature: FeatureName | 'job_analyses';
  tier: 'starter' | 'pro' | 'premium';
}

const FEATURE_NAMES: Record<FeatureName | 'job_analyses', string> = {
  'resume-optimization': 'Resume Optimization',
  'cover-letter-generation': 'Cover Letter Generation',
  'interview-preparation': 'Interview Preparation',
  'job-matching': 'Job Matching',
  'skill-gap-analysis': 'Skill Gap Analysis',
  'job_analyses': 'Job Analysis',
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, tier }) => {
  // FIX: Handle feature name safely
  const featureName = FEATURE_NAMES[feature] || 'This Feature';

  const getTierText = (userTier: string) => {
    if (userTier === 'starter') return 'Pro';
    if (userTier === 'pro') return 'Premium';
    return 'Upgrade';
  };

  return (
    <div className="upgrade-prompt">
      <h3 className="upgrade-prompt__title">
        Unlock {featureName}
      </h3>
      <p className="upgrade-prompt__description">
        This feature requires a {getTierText(tier)} subscription
      </p>
      <button className="upgrade-prompt__button">
        Upgrade to {getTierText(tier)}
      </button>
    </div>
  );
};