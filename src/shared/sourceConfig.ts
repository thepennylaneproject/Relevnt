// src/shared/sourceConfig.ts
// Centralized configuration for job source guardrails and triage

/**
 * Source modes define the ingestion behavior and trust level
 */
export type SourceMode =
    | 'fresh-only'      // High freshness bar, low tolerance for stale
    | 'shallow-curated' // Less volume, higher trust
    | 'wide-capped';    // Volume acceptable but bounded

/**
 * Trust level classification for sources
 */
export type TrustLevel = 'high' | 'medium' | 'low';

/**
 * Configuration for a single job source
 */
export interface SourceConfig {
    slug: string;
    mode: SourceMode;
    enabled: boolean;

    // Freshness guardrails
    maxAgeDays: number;           // Hard cutoff for job age (default 30)

    // Pagination guardrails
    maxPagesPerRun: number;       // Maximum pages to fetch per run
    resetPaginationEachRun: boolean; // Start from page 1 each run

    // Rate controls
    cooldownMinutes?: number;     // Minimum time between runs (optional)

    // Trust classification
    trustLevel: TrustLevel;

    // Tracking flags
    trackFreshnessRatio: boolean; // Log % truly new vs resurfaced

    // Notes for operators
    notes?: string;
}

/**
 * Global guardrail defaults
 */
export const GUARDRAIL_DEFAULTS = {
    MAX_AGE_DAYS: 30,
    MAX_PAGES_PER_RUN: 3,
    RESET_PAGINATION: false,
    TRACK_FRESHNESS: false,
} as const;

/**
 * Per-source configurations based on triage decisions
 */
export const SOURCE_CONFIGS: Record<string, SourceConfig> = {
    // =========================================================================
    // HIGH VOLUME - Jooble is a global aggregator with millions of jobs
    // =========================================================================
    jooble: {
        slug: 'jooble',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 20, // Increased from 10 - Jooble has virtually unlimited inventory
        resetPaginationEachRun: false, // Resume for broader coverage across runs
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Jooble is a volume engine with global coverage. High pagination depth for maximum job capture.',
    },

    // =========================================================================
    // HIGH VOLUME - Reed UK is a major UK job board with deep archives
    // =========================================================================
    reed_uk: {
        slug: 'reed_uk',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 25, // Increased from 15 - Reed has massive UK/EU inventory
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Reed UK is a major job board. Very deep pagination with resume for maximum coverage.',
    },

    // =========================================================================
    // KEEP, MONITOR - Declining but valid, high-trust curated source
    // =========================================================================
    remotive: {
        slug: 'remotive',
        mode: 'shallow-curated',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 3,
        resetPaginationEachRun: false,
        trustLevel: 'high',
        trackFreshnessRatio: false,
        notes: 'Remotive is curated. Small does not mean broken.',
    },

    // =========================================================================
    // KEEP, RECLASSIFY - Stable but limited, treat as editorial signal source
    // =========================================================================
    themuse: {
        slug: 'themuse',
        mode: 'shallow-curated',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 5, // Increased from 2 for better coverage
        resetPaginationEachRun: false,
        trustLevel: 'high',
        trackFreshnessRatio: false,
        notes: 'This is a high-quality editorial source. Moderate pagination for signal quality.',
    },

    // =========================================================================
    // HIGH QUALITY - Himalayas is a curated remote job board
    // =========================================================================
    himalayas: {
        slug: 'himalayas',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 5, // Increased from 2 for better coverage
        resetPaginationEachRun: false,
        // Removed cooldown - run with full frequency
        trustLevel: 'high',
        trackFreshnessRatio: true,
        notes: 'Himalayas is a high-quality remote jobs board. No cooldown for maximum coverage.',
    },

    // =========================================================================
    // HIGH VOLUME - Arbeitnow covers Europe + remote globally
    // =========================================================================
    arbeitnow: {
        slug: 'arbeitnow',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 10, // Increased from 3 for broader European coverage
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Arbeitnow is a major European + remote job board. High volume potential.',
    },

    // =========================================================================
    // HIGH VOLUME - RemoteOK is a popular remote job board with free API
    // =========================================================================
    remoteok: {
        slug: 'remoteok',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 20, // ⬆ Increased from 10 to 20 - huge capacity headroom (100k+/day)
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'RemoteOK free API with no auth. Popular remote-focused job board. Maximizing pagination depth.',
    },

    // =========================================================================
    // HIGH VOLUME - Adzuna is a major job aggregator with millions of listings
    // =========================================================================
    adzuna_us: {
        slug: 'adzuna_us',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 5, // Increased from 1 - Adzuna has huge inventory
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Adzuna is a major aggregator. API quota allows for higher volume.',
    },

    // =========================================================================
    // REMOVE FOR NOW - Dead source, adds noise
    // =========================================================================
    jobicy: {
        slug: 'jobicy',
        mode: 'wide-capped',
        enabled: true, // ✅ RE-ENABLED - monitor for health
        maxAgeDays: 30,
        maxPagesPerRun: 10, // ⬆ Increased from 2 to 10 for better coverage
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Jobicy remote jobs. Re-enabled with expanded pagination. Monitor health closely.',
    },

    // =========================================================================
    // DISABLED - USAJobs returns 401 Unauthorized (invalid credentials)
    // =========================================================================
    usajobs: {
        slug: 'usajobs',
        mode: 'wide-capped',
        enabled: false, // DISABLED - consistently returns 401 Unauthorized
        maxAgeDays: 30,
        maxPagesPerRun: 20,
        resetPaginationEachRun: false,
        trustLevel: 'high',
        trackFreshnessRatio: true,
        notes: 'USAJobs disabled - returns 401 Unauthorized on every run. Credentials invalid or API endpoint changed.',
    },

    // =========================================================================
    // HIGH VOLUME - FindWork is developer-focused with good inventory
    // =========================================================================
    findwork: {
        slug: 'findwork',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 10, // Increased from 3 for deeper coverage
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'FindWork is a developer-focused aggregator with good volume.',
    },

    // =========================================================================
    // DISABLED - CareerOneStop returns 401 Unauthorized on every run
    // =========================================================================
    careeronestop: {
        slug: 'careeronestop',
        mode: 'wide-capped',
        enabled: false, // DISABLED - 401 Unauthorized
        maxAgeDays: 30,
        maxPagesPerRun: 15,
        resetPaginationEachRun: false,
        trustLevel: 'high',
        trackFreshnessRatio: true,
        notes: 'CareerOneStop disabled - returns 401 Unauthorized. API key likely expired or invalid.',
    },

    // =========================================================================
    // DISABLED - TheirStack returns 402 Payment Required (subscription expired)
    // =========================================================================
    theirstack: {
        slug: 'theirstack',
        mode: 'wide-capped',
        enabled: false, // DISABLED - consistently returns 402 Payment Required
        maxAgeDays: 30,
        maxPagesPerRun: 5,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'TheirStack disabled - returns 402 Payment Required. Subscription not active.',
    },

    // =========================================================================
    // Greenhouse - Company Career Boards (meta-source)
    // =========================================================================
    // This is a meta-source that iterates through multiple configured Greenhouse boards.
    // Each board is a separate company's ATS hosted on Greenhouse.
    // Configuration via GREENHOUSE_BOARDS_JSON env var.
    greenhouse: {
        slug: 'greenhouse',
        mode: 'shallow-curated',
        enabled: true, // Controlled by ENABLE_SOURCE_GREENHOUSE env var in ingest
        maxAgeDays: 30,
        maxPagesPerRun: 1, // Greenhouse doesn't paginate; we fetch all jobs in one request
        resetPaginationEachRun: false, // No pagination needed
        trustLevel: 'high', // Company-hosted = high quality signal
        trackFreshnessRatio: false,
        notes: 'Greenhouse company career boards. Each configured board is a separate company ATS instance. High trust due to direct company hosting.',
    },

    // =========================================================================
    // Lever - Premium job board with per-company configuration
    // =========================================================================
    lever: {
        slug: 'lever',
        mode: 'shallow-curated',
        enabled: true, // ENABLED after verification
        maxAgeDays: 30,
        maxPagesPerRun: 1, // Lever uses company-based fetching, not pagination
        resetPaginationEachRun: true,
        trustLevel: 'high',
        trackFreshnessRatio: false,
        notes: 'Premium job board. Companies configured via LEVER_SOURCES_JSON env var. 30-day freshness matches standard ingestion cutoff.',
    },

    // =========================================================================
    // DISABLED - Fantastic Jobs endpoint returns 404 (service no longer available)
    // =========================================================================
    fantastic: {
        slug: 'fantastic',
        mode: 'wide-capped',
        enabled: false, // DISABLED - 404 Not Found
        maxAgeDays: 14,
        maxPagesPerRun: 15,
        resetPaginationEachRun: true,
        trustLevel: 'low',
        trackFreshnessRatio: false,
        notes: 'Fantastic Jobs disabled - endpoint returns 404. Service may be down or API changed.',
    },

    // =========================================================================
    // DISABLED - JobDataFeeds returns 403 Forbidden (subscription required)
    // =========================================================================
    jobdatafeeds: {
        slug: 'jobdatafeeds',
        mode: 'wide-capped',
        enabled: false, // DISABLED - consistently returns 403 Forbidden
        maxAgeDays: 30,
        maxPagesPerRun: 10,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'JobDataFeeds disabled - returns 403 Forbidden. Subscription or API access not active.',
    },

    // =========================================================================
    // DISABLED - CareerJet returns 403 Forbidden (IP blocked, requires registration)
    // =========================================================================
    careerjet: {
        slug: 'careerjet',
        mode: 'wide-capped',
        enabled: false, // DISABLED - consistently returns 403 Forbidden (IP blocked)
        maxAgeDays: 30,
        maxPagesPerRun: 10,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'CareerJet disabled - returns 403 Forbidden. IP not whitelisted or API key invalid.',
    },

    // =========================================================================
    // HIGH VOLUME - WhatJobs has diverse job postings globally
    // =========================================================================
    whatjobs: {
        slug: 'whatjobs',
        mode: 'wide-capped',
        enabled: false, // DISABLED - waiting for API key
        maxAgeDays: 30,
        maxPagesPerRun: 10, // Increased from 3 for better coverage
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'WhatJobs API has diverse job postings globally. Disabled pending API key acquisition.',
    },

    // =========================================================================
    // JobSpy - Multi-board web scraper (Indeed, LinkedIn, Glassdoor, ZipRecruiter)
    // =========================================================================
    jobspy: {
        slug: 'jobspy',
        mode: 'wide-capped',
        enabled: true, // ENABLED - ts-jobspy installed
        maxAgeDays: 7, // Jobs from last 7 days only (web scraping focus on fresh)
        maxPagesPerRun: 1, // Background function handles all pages internally
        resetPaginationEachRun: true,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'JobSpy multi-board scraper (Indeed, LinkedIn, Glassdoor, ZipRecruiter). Runs every 6 hours as background function. Filters to 7-day-old jobs only.',
    },

    // =========================================================================
    // RSS/Atom Feeds - Generic RSS job feed support
    // =========================================================================
    rss: {
        slug: 'rss',
        mode: 'wide-capped',
        enabled: true, // ENABLED - Feeds configured in rss_feeds.json
        maxAgeDays: 30,
        maxPagesPerRun: 1, // RSS fetching is per-feed, not paginated
        resetPaginationEachRun: true,
        trustLevel: 'medium', // Varies by feed, can be overridden per-feed
        trackFreshnessRatio: true,
        notes: 'RSS/Atom feed support. Feeds configured in src/data/jobSources/rss_feeds.json. Per-feed trust levels configurable.',
    },
};

/**
 * In-memory cache for source configurations
 */
let configCache: Record<string, SourceConfig> | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Initialize config from DB if needed
 */
export async function syncSourceConfigs(supabase: any) {
  // Check cache validity
  if (configCache && Date.now() - lastCacheUpdate < CACHE_TTL_MS) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('aggregator_sources')
      .select('*');

    if (error) {
      console.warn('JobSourceConfig: Failed to load from DB, using defaults', error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    // Initialize cache with hardcoded defaults to ensure we have baseline
    configCache = { ...SOURCE_CONFIGS };

    // Overlay DB values
    data.forEach((row: any) => {
      const existing = configCache![row.slug] || {
        slug: row.slug,
        mode: 'wide-capped',
        trustLevel: 'low',
        maxAgeDays: GUARDRAIL_DEFAULTS.MAX_AGE_DAYS,
        maxPagesPerRun: GUARDRAIL_DEFAULTS.MAX_PAGES_PER_RUN,
        resetPaginationEachRun: GUARDRAIL_DEFAULTS.RESET_PAGINATION,
        trackFreshnessRatio: GUARDRAIL_DEFAULTS.TRACK_FRESHNESS,
        enabled: true,
        notes: ''
      };

      configCache![row.slug] = {
        ...existing,
        enabled: row.is_active ?? existing.enabled,
        notes: `Loaded from DB. ${existing.notes || ''}`
      };
      
      // Update rate limits if present in DB (custom logic if needed)
      // row.rate_limit_per_hour
    });

    lastCacheUpdate = Date.now();
    console.log(`JobSourceConfig: Loaded ${data.length} configs from DB`);
  } catch (err) {
    console.warn('JobSourceConfig: Unexpected error loading from DB', err);
  }
}

/**
 * Get configuration for a source, with defaults for unknown sources
 */
export function getSourceConfig(slug: string): SourceConfig {
    // specific checking for cache
    const configs = configCache || SOURCE_CONFIGS;
    const config = configs[slug];
    if (config) {
        return config;
    }

    // Return a default config for unknown sources (conservative)
    return {
        slug,
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: GUARDRAIL_DEFAULTS.MAX_AGE_DAYS,
        maxPagesPerRun: GUARDRAIL_DEFAULTS.MAX_PAGES_PER_RUN,
        resetPaginationEachRun: GUARDRAIL_DEFAULTS.RESET_PAGINATION,
        trustLevel: 'low',
        trackFreshnessRatio: GUARDRAIL_DEFAULTS.TRACK_FRESHNESS,
        notes: 'Unknown source - using conservative defaults',
    };
}

/**
 * Get all enabled sources
 */
export function getEnabledSourceSlugs(): string[] {
    const configs = configCache || SOURCE_CONFIGS;
    return Object.values(configs)
        .filter((config) => config.enabled)
        .map((config) => config.slug);
}

/**
 * Check if a source should skip due to cooldown
 */
export function shouldSkipDueToCooldown(
    slug: string,
    lastRunAt: Date | null
): boolean {
    const configs = configCache || SOURCE_CONFIGS;
    const config = configs[slug];
    if (!config?.cooldownMinutes || !lastRunAt) {
        return false;
    }

    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    const timeSinceLastRun = Date.now() - lastRunAt.getTime();
    return timeSinceLastRun < cooldownMs;
}
