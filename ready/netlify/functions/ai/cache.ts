import crypto from 'crypto'
import { createAdminClient } from '../utils/supabase'

interface CacheEntry {
  cache_key: string
  value: unknown
  expires_at: number
  task_name: string
  tier: string
  quality: string
}

const memoryCache = new Map<string, CacheEntry>()

export function stableStringify(value: unknown): string {
  const seen = new WeakSet()
  const stringify = (val: any): any => {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return null
      seen.add(val)
      if (Array.isArray(val)) return val.map(stringify)
      return Object.keys(val)
        .sort()
        .reduce<Record<string, any>>((acc, key) => {
          acc[key] = stringify(val[key])
          return acc
        }, {})
    }
    return val
  }
  return JSON.stringify(stringify(value))
}

export function buildCacheKey(task: string, input: unknown, tier: string, quality: string, schemaVersion?: string) {
  const normalized = stableStringify({ task, input, tier, quality, schemaVersion })
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

export async function getCache(cacheKey: string): Promise<{ hit: boolean; value?: unknown }> {
  const now = Date.now()
  const cached = memoryCache.get(cacheKey)
  if (cached && cached.expires_at > now) {
    return { hit: true, value: cached.value }
  }
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ai_cache')
      .select('payload, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (!error && data && data.expires_at && new Date(data.expires_at).getTime() > now) {
      return { hit: true, value: data.payload }
    }
  } catch {
    // fall back silently
  }

  return { hit: false }
}

export async function setCache(
  cacheKey: string,
  value: unknown,
  task: string,
  tier: string,
  quality: string,
  ttlSeconds?: number
): Promise<void> {
  if (!ttlSeconds) return
  const expires_at = Date.now() + ttlSeconds * 1000
  const entry: CacheEntry = { cache_key: cacheKey, value, expires_at, task_name: task, tier, quality }
  memoryCache.set(cacheKey, entry)

  try {
    const supabase = createAdminClient()
    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      task_name: task,
      user_tier: tier,
      quality,
      expires_at: new Date(expires_at).toISOString(),
      payload: value,
    })
  } catch {
    // ignore persistence failures in favor of returning result
  }
}

export interface BatchItem<T = unknown> {
  id: string
  input: T
}

const batchQueues: Record<string, BatchItem[]> = {}

export function queueBatch(task: string, items: BatchItem[]) {
  if (!batchQueues[task]) batchQueues[task] = []
  batchQueues[task].push(...items)
}

export function flushBatch(task: string): BatchItem[] {
  const queued = batchQueues[task] || []
  batchQueues[task] = []
  return queued
}

export const __testing = {
  memoryCache,
}
