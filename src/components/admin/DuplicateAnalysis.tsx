import React, { useEffect, useState } from 'react'
import { AlertCircle, TrendingDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface DuplicateRate {
  source_slug: string
  total_jobs: number
  unique_jobs: number
  duplicate_count: number
  duplicate_rate_percent: number
}

export function DuplicateAnalysis() {
  const [duplicates, setDuplicates] = useState<DuplicateRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeWindow, setTimeWindow] = useState('7d')

  useEffect(() => {
    fetchDuplicateAnalysis()
  }, [timeWindow])

  async function fetchDuplicateAnalysis() {
    try {
      setLoading(true)

      const daysBack = timeWindow === '7d' ? 7 : timeWindow === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      // Query: Get total jobs and count unique dedup_keys per source
      const { data, error: err } = await supabase
        .from('jobs')
        .select('source, id, external_url')
        .gte('created_at', startDate.toISOString())

      if (err) throw err

      // Analyze duplicates by source
      const sourceMap = new Map<string, Set<string>>();
      const sourceTotal = new Map<string, number>();

      (data || []).forEach((job: any) => {
        const source = job.source || 'unknown'
        const url = job.external_url

        if (!sourceMap.has(source)) {
          sourceMap.set(source, new Set())
        }
        if (!sourceTotal.has(source)) {
          sourceTotal.set(source, 0)
        }

        sourceTotal.set(source, (sourceTotal.get(source) || 0) + 1)
        if (url) {
          sourceMap.get(source)?.add(url)
        }
      })

      const analysis: DuplicateRate[] = Array.from(sourceMap.entries()).map(([source, uniqueUrls]) => {
        const totalJobs = sourceTotal.get(source) || 0
        const uniqueJobs = uniqueUrls.size
        const duplicateCount = totalJobs - uniqueJobs
        const duplicateRate = totalJobs > 0 ? (duplicateCount / totalJobs) * 100 : 0

        return {
          source_slug: source,
          total_jobs: totalJobs,
          unique_jobs: uniqueJobs,
          duplicate_count: duplicateCount,
          duplicate_rate_percent: duplicateRate,
        }
      })

      // Sort by duplicate rate descending
      analysis.sort((a, b) => b.duplicate_rate_percent - a.duplicate_rate_percent)

      setDuplicates(analysis)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch duplicate analysis:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500 text-center py-4">Analyzing duplicates...</div>
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">Error: {error}</div>
  }

  const totalDuplicateRate =
    duplicates.length > 0
      ? (duplicates.reduce((sum, d) => sum + d.duplicate_rate_percent, 0) / duplicates.length)
      : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-orange-600" />
          Deduplication Analysis
        </h3>
        <div className="flex gap-1 text-sm">
          <button
            onClick={() => setTimeWindow('7d')}
            className={`px-3 py-1 rounded ${timeWindow === '7d' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeWindow('30d')}
            className={`px-3 py-1 rounded ${timeWindow === '30d' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            30d
          </button>
          <button
            onClick={() => setTimeWindow('90d')}
            className={`px-3 py-1 rounded ${timeWindow === '90d' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            90d
          </button>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No data available</div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-600">Avg Duplicate Rate</div>
              <div className={`text-lg font-semibold ${totalDuplicateRate > 20 ? 'text-orange-700' : 'text-green-700'}`}>
                {totalDuplicateRate.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Sources Analyzed</div>
              <div className="text-lg font-semibold text-gray-700">{duplicates.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Jobs</div>
              <div className="text-lg font-semibold text-gray-700">
                {duplicates.reduce((sum, d) => sum + d.total_jobs, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Per-Source Breakdown */}
          <div className="space-y-2">
            {duplicates.map(item => {
              const isDuplicate = item.duplicate_rate_percent > 15
              return (
                <div key={item.source_slug} className={`p-3 rounded border ${
                  isDuplicate ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {item.source_slug.replace(/_/g, ' ')}
                      </span>
                      {isDuplicate && (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${isDuplicate ? 'text-orange-700' : 'text-green-700'}`}>
                      {item.duplicate_rate_percent.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded h-2 mb-2">
                    <div
                      className={isDuplicate ? 'bg-orange-500' : 'bg-green-500'}
                      style={{ width: `${item.duplicate_rate_percent}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-500">Total: </span>
                      <span className="font-semibold text-gray-900">{item.total_jobs.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Unique: </span>
                      <span className="font-semibold text-green-700">{item.unique_jobs.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duplicates: </span>
                      <span className="font-semibold text-orange-700">{item.duplicate_count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interpretation */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            <p className="font-medium mb-1">💡 What does this mean?</p>
            <p>
              A duplicate rate below 10% is healthy. Higher rates indicate sources returning many repeat jobs, which
              may mean they're outdated or the deduplication logic needs tuning.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
