/**
 * ATS Detection Cache
 *
 * In-memory cache for ATS detection results
 * Reduces redundant HTTP requests when processing jobs from same companies
 * with TTL support for within-session caching
 */

import type { DetectedATS } from './atsDetector'

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttlMs: number
}

export class ATSCache {
  private cache: Map<string, CacheEntry<DetectedATS | null>> = new Map()
  private defaultTTLMs: number = 3600000 // 1 hour default TTL

  /**
   * Generate cache key from company name and domain
   */
  private getKey(company: string | null, domain?: string): string {
    const parts = [company || '', domain || ''].filter(Boolean)
    return parts.join('::').toLowerCase()
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<DetectedATS | null>): boolean {
    return Date.now() - entry.timestamp < entry.ttlMs
  }

  /**
   * Get cached ATS detection result
   */
  get(company: string | null, domain?: string): DetectedATS | null | undefined {
    const key = this.getKey(company, domain)
    const entry = this.cache.get(key)

    if (!entry) return undefined

    if (!this.isValid(entry)) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Set cached ATS detection result
   */
  set(company: string | null, domain: string | undefined, result: DetectedATS | null, ttlMs?: number): void {
    const key = this.getKey(company, domain)
    this.cache.set(key, {
      value: result,
      timestamp: Date.now(),
      ttlMs: ttlMs || this.defaultTTLMs,
    })
  }

  /**
   * Check if result is cached and valid
   */
  has(company: string | null, domain?: string): boolean {
    const key = this.getKey(company, domain)
    const entry = this.cache.get(key)
    return entry ? this.isValid(entry) : false
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  prune(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttlMs) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this._hits,
      misses: this._misses,
    }
  }

  // Track statistics
  private _hits = 0
  private _misses = 0

  /**
   * Record a cache hit
   */
  recordHit(): void {
    this._hits++
  }

  /**
   * Record a cache miss
   */
  recordMiss(): void {
    this._misses++
  }
}

// Global cache instance for the duration of the function execution
let globalCache: ATSCache | null = null

/**
 * Get or create global ATS cache
 */
export function getATSCache(): ATSCache {
  if (!globalCache) {
    globalCache = new ATSCache()
  }
  return globalCache
}

/**
 * Reset global cache (useful for testing)
 */
export function resetATSCache(): void {
  globalCache = null
}
