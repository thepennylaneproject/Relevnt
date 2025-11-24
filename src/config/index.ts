/**
 * ============================================================================
 * CONFIG BARREL EXPORTS
 * ============================================================================
 * 🎯 PURPOSE: Single import point for all configuration
 * 
 * Usage: import { copy, assets, TIERS, hasFeatureAccess } from '@/config'
 * 
 * This prevents scattered imports throughout the codebase and makes it
 * easy to see what configuration is available.
 * ============================================================================
 */

// Re-export all configuration
export { copy, getCopy } from './i18n.config';
export type { CopyKey, CopyPath } from './i18n.config';

export { assets, getAsset, getAllAssets, getAssetVariants } from '../themes/assets';
export type { AssetLibrary, AssetType, ModeAsset } from '../themes/assets';

export {
  TIERS,
  FEATURE_ACCESS,
  TIER_HIERARCHY,
  hasFeatureAccess,
  getRequiredTier,
  getFeaturesByTier,
  getLockedFeatures,
  getUpgradeGains,
  getNextTier,
  getTierDisplayName,
  canUpgradeToTier,
} from './tiers';

export type {
  TierLevel,
  FeatureName,
  TierConfig,
  FeatureAccess,
} from './tiers';
