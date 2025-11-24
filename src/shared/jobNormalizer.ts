// src/shared/jobNormalizer.ts
import type { NormalizedJob } from './types'

export type RawJobFromSource = Record<string, unknown>

export type JobSourceDescriptor = {
    sourceSlug: string
    map: (raw: RawJobFromSource) => NormalizedJob | null
}

export function normalizeJobs(
    source: JobSourceDescriptor,
    rawJobs: RawJobFromSource[]
): NormalizedJob[] {
    return rawJobs
        .map((raw) => {
            try {
                return source.map(raw)
            } catch (e) {
                console.warn(`normalizeJobs error for ${source.sourceSlug}`, e, raw)
                return null
            }
        })
        .filter((job): job is NormalizedJob => !!job)
}