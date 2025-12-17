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
    // KEEP, RESTRICT - Volume engine, needs strict freshness controls
    // =========================================================================
    jooble: {
        slug: 'jooble',
        mode: 'fresh-only',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 2,
        resetPaginationEachRun: true,
        trustLevel: 'low',
        trackFreshnessRatio: true,
        notes: 'Jooble is a volume engine, not a freshness oracle. Treated incorrectly, it will poison relevance.',
    },

    // =========================================================================
    // KEEP, CAP - Over-paginating archives, needs depth limits
    // =========================================================================
    reed_uk: {
        slug: 'reed_uk',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 21,
        maxPagesPerRun: 5,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: false,
        notes: 'Reed is excavating history. Cap pagination to prevent archive diving.',
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
        maxPagesPerRun: 2,
        resetPaginationEachRun: false,
        trustLevel: 'high',
        trackFreshnessRatio: false,
        notes: 'This is a signal source, not a firehose.',
    },

    // =========================================================================
    // KEEP, LOW PRIORITY - Extremely low yield, high-quality niche input
    // =========================================================================
    himalayas: {
        slug: 'himalayas',
        mode: 'shallow-curated',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 2,
        resetPaginationEachRun: false,
        cooldownMinutes: 360, // 6 hours between runs
        trustLevel: 'high',
        trackFreshnessRatio: false,
        notes: 'One good job is still one good job. Just not hourly.',
    },

    // =========================================================================
    // KEEP, CONTROL - Bursty and inconsistent, needs cooldown
    // =========================================================================
    arbeitnow: {
        slug: 'arbeitnow',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 3,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Bursts are fine. Chaos is not.',
    },

    // =========================================================================
    // FIX OR DISABLE - Returning zero, needs investigation
    // =========================================================================
    remoteok: {
        slug: 'remoteok',
        mode: 'fresh-only',
        enabled: false, // DISABLED pending investigation
        maxAgeDays: 30,
        maxPagesPerRun: 3,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: false,
        notes: 'Zero jobs is not neutral. It is wasted compute. Verify endpoint and response schema.',
    },

    // =========================================================================
    // FIX OR DISABLE - Returning zero, needs credential check
    // =========================================================================
    adzuna_us: {
        slug: 'adzuna_us',
        mode: 'wide-capped',
        enabled: false, // DISABLED pending investigation
        maxAgeDays: 30,
        maxPagesPerRun: 1,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: false,
        notes: 'Confirm location and category params. Validate API quota and credentials.',
    },

    // =========================================================================
    // REMOVE FOR NOW - Dead source, adds noise
    // =========================================================================
    jobicy: {
        slug: 'jobicy',
        mode: 'fresh-only',
        enabled: false, // DISABLED - leave stub for future revisit
        maxAgeDays: 30,
        maxPagesPerRun: 2,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: false,
        notes: 'A dead source adds noise to your system thinking.',
    },

    // =========================================================================
    // KEEP - US government jobs, stable source
    // =========================================================================
    usajobs: {
        slug: 'usajobs',
        mode: 'wide-capped',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 3,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: false,
        notes: 'US federal jobs. Stable and reliable.',
    },

    // =========================================================================
    // KEEP - Developer-focused, good quality
    // =========================================================================
    findwork: {
        slug: 'findwork',
        mode: 'shallow-curated',
        enabled: true,
        maxAgeDays: 30,
        maxPagesPerRun: 3,
        resetPaginationEachRun: false,
        trustLevel: 'medium',
        trackFreshnessRatio: false,
        notes: 'Developer-focused aggregator with decent quality.',
    },

    // =========================================================================
    // CareerOneStop - US government-backed job search aggregator
    // =========================================================================
    careeronestop: {
        slug: 'careeronestop',
        mode: 'wide-capped',
        enabled: true, // Controlled by ENABLE_SOURCE_CAREERONESTOP env var in ingest
        maxAgeDays: 30,
        maxPagesPerRun: 3, // Overridden by CAREERONESTOP_MAX_PAGES_PER_RUN env var
        resetPaginationEachRun: true,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'US government-backed job aggregator. Stable and reliable with nationwide coverage.',
    },

    // =========================================================================
    // TheirStack - Tech job aggregator with technographic data
    // =========================================================================
    theirstack: {
        slug: 'theirstack',
        mode: 'fresh-only',
        enabled: true, // Controlled by ENABLE_SOURCE_THEIRSTACK env var in ingest
        maxAgeDays: 30,
        maxPagesPerRun: 1, // Single request, uses limit param
        resetPaginationEachRun: true,
        trustLevel: 'medium',
        trackFreshnessRatio: true,
        notes: 'Tech job aggregator with technographic data. Uses POST body for search params.',
    },

    // =========================================================================
    // Lever - Premium job board with per-company configuration
    // =========================================================================
    lever: {
        slug: 'lever',
        mode: 'shallow-curated',
        enabled: false, // Controlled by ENABLE_SOURCE_LEVER env var in ingest
        maxAgeDays: 30,
        maxPagesPerRun: 1, // Lever uses company-based fetching, not pagination
        resetPaginationEachRun: true,
        trustLevel: 'high',
        trackFreshnessRatio: false,
        notes: 'Premium job board. Companies configured via LEVER_SOURCES_JSON env var.',
    },

    // =========================================================================
    // RSS/Atom Feeds - Generic RSS job feed support
    // =========================================================================
    rss: {
        slug: 'rss',
        mode: 'wide-capped',
        enabled: false, // Controlled by ENABLE_SOURCE_RSS env var in ingest
        maxAgeDays: 30,
        maxPagesPerRun: 1, // RSS fetching is per-feed, not paginated
        resetPaginationEachRun: true,
        trustLevel: 'medium', // Varies by feed, can be overridden per-feed
        trackFreshnessRatio: true,
        notes: 'RSS/Atom feed support. Feeds configured via RSS_FEEDS_JSON env var. Per-feed trust levels configurable.',
    },
};

/**
 * Get configuration for a source, with defaults for unknown sources
 */
export function getSourceConfig(slug: string): SourceConfig {
    const config = SOURCE_CONFIGS[slug];
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
    return Object.values(SOURCE_CONFIGS)
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
    const config = SOURCE_CONFIGS[slug];
    if (!config?.cooldownMinutes || !lastRunAt) {
        return false;
    }

    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    const timeSinceLastRun = Date.now() - lastRunAt.getTime();
    return timeSinceLastRun < cooldownMs;
}
