/**
 * Companies Registry Types and Utilities
 * Centralized platform configuration replacing JSON env vars
 */

export type FundingStage = 'pre-seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'series_d+' | 'public' | 'acquired' | 'unknown';
export type PriorityTier = 'high' | 'standard' | 'low';
export type DiscoveryMethod = 'yc' | 'crunchbase' | 'manual' | 'careers_page' | 'user_submit';

export interface Company {
  id: string;
  name: string;
  domain?: string;

  // Platform integrations
  lever_slug?: string;
  greenhouse_board_token?: string;

  // Metadata
  founding_year?: number;
  funding_stage?: FundingStage;
  employee_count?: number;
  industry?: string;

  // Sync state
  last_synced_at?: string;
  last_synced_platforms?: string[]; // ['lever', 'greenhouse']
  sync_frequency_hours?: number;

  // Scoring
  job_creation_velocity?: number; // jobs/week
  growth_score?: number; // 0-100
  priority_tier?: PriorityTier;

  // Discovery
  discovered_via?: DiscoveryMethod;
  discovered_at?: string;
  verified_at?: string;
  is_active?: boolean;

  // Computed (from view)
  priority_score?: number;
}

export interface CompanyBatch {
  companies: Company[];
  total: number;
  cursor?: string;
}

/**
 * Calculate growth score based on funding stage and employee count
 */
export function calculateGrowthScore(
  fundingStage?: FundingStage,
  employeeCount?: number
): number {
  let score = 0;

  // Funding stage score (0-40 points)
  switch (fundingStage) {
    case 'series_d+':
      score += 40;
      break;
    case 'series_c':
      score += 35;
      break;
    case 'series_b':
      score += 30;
      break;
    case 'series_a':
      score += 25;
      break;
    case 'seed':
      score += 15;
      break;
    case 'pre-seed':
      score += 10;
      break;
    case 'public':
      score += 45;
      break;
    case 'acquired':
      score += 5;
      break;
    default:
      score += 0;
  }

  // Employee count bonus (0-30 points)
  if (employeeCount) {
    if (employeeCount >= 1000) score += 30;
    else if (employeeCount >= 500) score += 25;
    else if (employeeCount >= 200) score += 20;
    else if (employeeCount >= 100) score += 15;
    else if (employeeCount >= 50) score += 10;
    else if (employeeCount >= 20) score += 5;
  }

  // Recency bonus if recently updated (0-30 points) - handled separately
  // This is done by query logic based on last_synced_at

  return Math.min(score, 100);
}

/**
 * Calculate recency penalty score based on last sync time
 * Returns percentage of sync_frequency_hours that have passed (0-1 = 0-100%)
 */
export function calculateRecencyPenalty(
  lastSyncedAt: string | null | undefined,
  syncFrequencyHours: number = 24
): number {
  if (!lastSyncedAt) return 1.0; // Never synced = max penalty

  const lastSync = new Date(lastSyncedAt).getTime();
  const now = Date.now();
  const hoursSinceSync = (now - lastSync) / (1000 * 60 * 60);

  // Scale: 1.0 at 0 hours, up to 4.0 at 4x the frequency
  return Math.min(hoursSinceSync / syncFrequencyHours, 4.0);
}

/**
 * Calculate priority score for company sorting
 * Higher score = higher priority to fetch
 */
export function calculatePriorityScore(company: Company): number {
  const recencyScore = calculateRecencyPenalty(company.last_synced_at, company.sync_frequency_hours) * 0.4;
  const growthScore = (company.growth_score || 0) * 0.35;
  const velocityScore = (company.job_creation_velocity || 0) * 0.25;

  return recencyScore + growthScore + velocityScore;
}

/**
 * Group companies by platform for efficient batch fetching
 */
export function groupCompaniesByPlatform(
  companies: Company[]
): { lever: Company[]; greenhouse: Company[] } {
  return {
    lever: companies.filter((c) => c.lever_slug),
    greenhouse: companies.filter((c) => c.greenhouse_board_token),
  };
}

/**
 * Filter companies that need syncing based on frequency
 */
export function filterCompaniesDueForSync(companies: Company[]): Company[] {
  const now = Date.now();

  return companies.filter((company) => {
    if (!company.is_active) return false;

    const lastSync = company.last_synced_at
      ? new Date(company.last_synced_at).getTime()
      : 0;
    const syncFrequencyMs = (company.sync_frequency_hours || 24) * 60 * 60 * 1000;
    const timeSinceSync = now - lastSync;

    return timeSinceSync >= syncFrequencyMs;
  });
}

/**
 * Get suggested sync frequency based on funding stage
 */
export function getSuggestedSyncFrequency(fundingStage?: FundingStage): number {
  switch (fundingStage) {
    case 'series_d+':
    case 'public':
      return 6; // Every 6 hours
    case 'series_c':
    case 'series_b':
      return 12; // Every 12 hours
    case 'series_a':
      return 24; // Daily
    case 'seed':
    case 'pre-seed':
      return 48; // Every 2 days
    default:
      return 24; // Default to daily
  }
}

/**
 * Validate company has required fields for ingestion
 */
export function isCompanyIngestible(company: Company): boolean {
  if (!company.is_active) return false;
  if (!company.lever_slug && !company.greenhouse_board_token) return false;
  return true;
}

/**
 * Convert fallback JSON config to Company format (for migration)
 */
export function migrateFromJsonConfig(
  type: 'lever' | 'greenhouse',
  item: any
): Company {
  if (type === 'lever') {
    return {
      id: `lever-${item.companyName?.toLowerCase().replace(/\s+/g, '-')}`,
      name: item.companyName || 'Unknown',
      domain: item.domain,
      lever_slug: item.leverSlug || item.leverApiUrl?.split('/').pop(),
      priority_tier: 'standard',
      sync_frequency_hours: 24,
      is_active: true,
      discovered_via: 'manual',
    };
  } else if (type === 'greenhouse') {
    return {
      id: `greenhouse-${item.companyName?.toLowerCase().replace(/\s+/g, '-')}`,
      name: item.companyName || 'Unknown',
      domain: item.careersUrl ? new URL(item.careersUrl).hostname : undefined,
      greenhouse_board_token: item.boardToken,
      priority_tier: 'standard',
      sync_frequency_hours: 24,
      is_active: true,
      discovered_via: 'manual',
    };
  }

  throw new Error(`Unknown company type: ${type}`);
}
